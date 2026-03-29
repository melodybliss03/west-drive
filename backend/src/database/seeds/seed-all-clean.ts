import { config } from 'dotenv';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import dataSource from '../data-source';
import { User, UserStatus } from '../../users/entities/user.entity';
import {
  Vehicle,
  VehicleOperationalStatus,
} from '../../vehicles/entities/vehicle.entity';
import { Permission } from '../../iam/entities/permission.entity';
import { Role } from '../../iam/entities/role.entity';
import { RolePermission } from '../../iam/entities/role-permission.entity';
import { UserRole } from '../../iam/entities/user-role.entity';
import { SYSTEM_PERMISSIONS } from '../../iam/enums/system-permissions';

config({ path: '.env.local' });
config();

type SeedRole = {
  name: string;
  description: string;
  isSystem: boolean;
  permissionCodes: string[];
};

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  password: string;
  roleNames: string[];
};

type SeedVehicle = Omit<Partial<Vehicle>, 'images'> & {
  images: Array<{
    url: string;
    publicId: string | null;
    sortOrder: number;
  }>;
};

const PERMISSION_LABELS: Record<string, string> = {
  'users.read': 'Voir les utilisateurs',
  'users.write': 'Modifier les utilisateurs',
  'users.delete': 'Supprimer les utilisateurs',
  'users.status.write': 'Changer le statut des utilisateurs',
  'roles.read': 'Voir les rôles',
  'roles.write': 'Gérer les rôles',
  'roles.assign': 'Assigner les rôles',
  'vehicles.read': 'Voir les véhicules',
  'vehicles.write': 'Modifier les véhicules',
  'vehicles.delete': 'Supprimer les véhicules',
  'reservations.read': 'Voir les réservations',
  'reservations.manage': 'Gérer les réservations',
  'quotes.read': 'Voir les devis',
  'quotes.manage': 'Gérer les devis',
  'fleet.read': 'Voir la flotte',
  'fleet.manage': 'Gérer la flotte',
  'avis.read': 'Voir les avis',
  'avis.write': 'Gérer les avis',
  'admin.kpi.read': 'Voir le tableau de bord',
};

async function seedPermissions(permissionRepository: Repository<Permission>) {
  for (const code of SYSTEM_PERMISSIONS) {
    const existing = await permissionRepository.findOne({ where: { code } });
    if (!existing) {
      await permissionRepository.save(
        permissionRepository.create({
          code,
          label: PERMISSION_LABELS[code] ?? code,
        }),
      );
      console.log(`Permission seeded: ${code}`);
    }
  }
}

async function ensureRole(
  roleRepository: Repository<Role>,
  rolePermissionRepository: Repository<RolePermission>,
  permissionRepository: Repository<Permission>,
  roleSeed: SeedRole,
): Promise<Role> {
  let role = await roleRepository.findOne({ where: { name: roleSeed.name } });

  if (!role) {
    role = await roleRepository.save(
      roleRepository.create({
        name: roleSeed.name,
        description: roleSeed.description,
        isSystem: roleSeed.isSystem,
      }),
    );
    console.log(`Role seeded: ${roleSeed.name}`);
  }

  const permissions = await permissionRepository.find({
    where: roleSeed.permissionCodes.map((code) => ({ code })),
  });

  const existingRolePermissions = await rolePermissionRepository.find({
    where: { roleId: role.id },
    relations: { permission: true },
  });

  const existingCodes = new Set(
    existingRolePermissions.map(
      (rolePermission) => rolePermission.permission.code,
    ),
  );

  for (const permission of permissions) {
    if (existingCodes.has(permission.code)) {
      continue;
    }

    await rolePermissionRepository.save(
      rolePermissionRepository.create({
        roleId: role.id,
        permissionId: permission.id,
      }),
    );
  }

  return role;
}

async function ensureUser(
  userRepository: Repository<User>,
  userRoleRepository: Repository<UserRole>,
  roleRepository: Repository<Role>,
  userSeed: SeedUser,
): Promise<void> {
  let user = await userRepository.findOne({ where: { email: userSeed.email } });

  if (!user) {
    user = await userRepository.save(
      userRepository.create({
        email: userSeed.email,
        passwordHash: await argon2.hash(userSeed.password),
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        phone: userSeed.phone,
        role: userSeed.role,
        status: UserStatus.ACTIF,
      }),
    );
    console.log(`User seeded: ${userSeed.email}`);
  }

  for (const roleName of userSeed.roleNames) {
    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      continue;
    }

    const existingUserRole = await userRoleRepository.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
      },
    });

    if (!existingUserRole) {
      await userRoleRepository.save(
        userRoleRepository.create({
          userId: user.id,
          roleId: role.id,
        }),
      );
    }
  }
}

async function seedVehicles(vehicleRepository: Repository<Vehicle>) {
  const vehicles: SeedVehicle[] = [
    {
      name: 'Peugeot 108',
      brand: 'Peugeot',
      model: '108',
      year: 2021,
      category: 'MICRO',
      transmission: 'MANUELLE',
      energy: 'ESSENCE',
      isHybride: false,
      seats: 4,
      includedKmPerDay: 150,
      mileage: 18500,
      pricePerDay: '35.00',
      pricePerHour: '6.00',
      depositAmount: '300.00',
      plateNumber: 'AB-123-CD',
      description: 'Petite citadine idéale pour les déplacements urbains.',
      isActive: true,
      rating: '4.5',
      reviewCount: 23,
      operationalStatus: VehicleOperationalStatus.DISPONIBLE,
      availableCities: ['Paris', 'Nanterre'],
      streetAddress: '12 Rue de Rivoli',
      city: 'Paris',
      latitude: '48.8566140',
      longitude: '2.3522219',
      images: [
        { url: 'https://images.unsplash.com/photo-1542362567-b07e54358753', publicId: null, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1541443131876-35fea82f71fe', publicId: null, sortOrder: 1 },
      ],
    },
    {
      name: 'Fiat 500',
      brand: 'Fiat',
      model: '500',
      year: 2022,
      category: 'MICRO',
      transmission: 'AUTOMATIQUE',
      energy: 'ESSENCE',
      isHybride: true,
      seats: 4,
      includedKmPerDay: 150,
      mileage: 12300,
      pricePerDay: '40.00',
      pricePerHour: '7.00',
      depositAmount: '300.00',
      plateNumber: 'GH-456-IJ',
      description: 'Citadine au style unique, version micro-hybride.',
      isActive: true,
      rating: '4.7',
      reviewCount: 18,
      operationalStatus: VehicleOperationalStatus.DISPONIBLE,
      availableCities: ['Paris'],
      streetAddress: '20 Rue de la Paix',
      city: 'Paris',
      latitude: '48.8698000',
      longitude: '2.3316000',
      images: [
        { url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d', publicId: null, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1506073881649-4e23be3e9ed0', publicId: null, sortOrder: 1 },
      ],
    },
    {
      name: 'Citroen C1',
      brand: 'Citroen',
      model: 'C1',
      year: 2021,
      category: 'MICRO',
      transmission: 'MANUELLE',
      energy: 'ESSENCE',
      isHybride: false,
      seats: 4,
      includedKmPerDay: 150,
      mileage: 21000,
      pricePerDay: '32.00',
      pricePerHour: '5.50',
      depositAmount: '250.00',
      plateNumber: 'KL-789-MN',
      description: 'Petite voiture économique, facile à garer en ville.',
      isActive: true,
      rating: '4.3',
      reviewCount: 14,
      operationalStatus: VehicleOperationalStatus.DISPONIBLE,
      availableCities: ['Paris'],
      streetAddress: '5 Avenue de la Grande Armee',
      city: 'Paris',
      latitude: '48.8738000',
      longitude: '2.2950000',
      images: [
        { url: 'https://images.unsplash.com/photo-1493238792000-8113da705763', publicId: null, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa', publicId: null, sortOrder: 1 },
      ],
    },
    {
      name: 'Renault Clio',
      brand: 'Renault',
      model: 'Clio',
      year: 2023,
      category: 'COMPACTE',
      transmission: 'MANUELLE',
      energy: 'DIESEL',
      isHybride: false,
      seats: 5,
      includedKmPerDay: 200,
      mileage: 8700,
      pricePerDay: '45.00',
      pricePerHour: '8.00',
      depositAmount: '350.00',
      plateNumber: 'OP-321-QR',
      description: 'Compacte polyvalente, confortable pour les longs trajets.',
      isActive: true,
      rating: '4.6',
      reviewCount: 9,
      operationalStatus: VehicleOperationalStatus.DISPONIBLE,
      availableCities: ['Paris', 'Lyon'],
      streetAddress: '8 Rue du Faubourg Saint-Antoine',
      city: 'Paris',
      latitude: '48.8533000',
      longitude: '2.3711000',
      images: [
        { url: 'https://images.unsplash.com/photo-1471966038827-32b87a2c87de', publicId: null, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd', publicId: null, sortOrder: 1 },
      ],
    },
    {
      name: 'BMW Serie 3',
      brand: 'BMW',
      model: 'Serie 3',
      year: 2022,
      category: 'BERLINE',
      transmission: 'AUTOMATIQUE',
      energy: 'ESSENCE',
      isHybride: false,
      seats: 5,
      includedKmPerDay: 250,
      mileage: 32000,
      pricePerDay: '80.00',
      pricePerHour: '14.00',
      depositAmount: '800.00',
      plateNumber: 'ST-654-UV',
      description: 'Berline premium alliant confort et performance.',
      maintenanceRequired: { mileage: 50000 },
      isActive: true,
      rating: '4.8',
      reviewCount: 32,
      operationalStatus: VehicleOperationalStatus.DISPONIBLE,
      availableCities: ['Paris'],
      streetAddress: '42 Avenue des Champs-Elysees',
      city: 'Paris',
      latitude: '48.8698000',
      longitude: '2.3080000',
      images: [
        { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e', publicId: null, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1617531653332-bd46c16f4d68', publicId: null, sortOrder: 1 },
        { url: 'https://images.unsplash.com/photo-1476445704028-a36e5c024b3b', publicId: null, sortOrder: 2 },
      ],
    },
  ];

  for (const vehicleSeed of vehicles) {
    const existing = await vehicleRepository.findOne({
      where: {
        name: vehicleSeed.name,
        year: vehicleSeed.year,
      },
      relations: { images: true },
    });

    if (existing) {
      continue;
    }

    await vehicleRepository.save(
      vehicleRepository.create({
        ...vehicleSeed,
        images: vehicleSeed.images.map((image) => ({
          ...image,
        })),
      }),
    );
    console.log(`Vehicle seeded: ${vehicleSeed.name}`);
  }
}

async function seedAll() {
  await dataSource.initialize();

  try {
    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const userRepository = dataSource.getRepository(User);
    const userRoleRepository = dataSource.getRepository(UserRole);
    const vehicleRepository = dataSource.getRepository(Vehicle);

    await seedPermissions(permissionRepository);

    const roleSeeds: SeedRole[] = [
      {
        name: 'ADMIN',
        description: 'System administrator',
        isSystem: true,
        permissionCodes: [...SYSTEM_PERMISSIONS],
      },
      {
        name: 'FLEET_MANAGER',
        description: 'Gestion operationnelle de la flotte',
        isSystem: false,
        permissionCodes: [
          'fleet.read',
          'fleet.manage',
          'vehicles.read',
          'vehicles.write',
        ],
      },
      {
        name: 'CUSTOMER_SUPPORT',
        description: 'Support client et suivi reservations',
        isSystem: false,
        permissionCodes: [
          'users.read',
          'reservations.read',
          'reservations.manage',
        ],
      },
      {
        name: 'SALES_AGENT',
        description: 'Suivi commercial des reservations',
        isSystem: false,
        permissionCodes: [
          'reservations.read',
          'reservations.manage',
          'vehicles.read',
        ],
      },
    ];

    for (const roleSeed of roleSeeds) {
      await ensureRole(
        roleRepository,
        rolePermissionRepository,
        permissionRepository,
        roleSeed,
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@westdrive.fr';
    const adminPassword =
      process.env.ADMIN_PASSWORD ?? 'ChangeMeStrongPassword';

    const usersToSeed: SeedUser[] = [
      {
        email: adminEmail,
        firstName: process.env.ADMIN_FIRST_NAME ?? 'WestDrive',
        lastName: process.env.ADMIN_LAST_NAME ?? 'Admin',
        phone: process.env.ADMIN_PHONE ?? '+33000000000',
        role: 'ADMIN',
        password: adminPassword,
        roleNames: ['ADMIN'],
      },
      {
        email: 'fleet.manager@westdrive.fr',
        firstName: 'Maya',
        lastName: 'Benali',
        phone: '+33611112222',
        role: 'FLEET_MANAGER',
        password: 'FleetManager123!',
        roleNames: ['FLEET_MANAGER'],
      },
      {
        email: 'support.agent@westdrive.fr',
        firstName: 'Hugo',
        lastName: 'Martin',
        phone: '+33622223333',
        role: 'CUSTOMER_SUPPORT',
        password: 'SupportAgent123!',
        roleNames: ['CUSTOMER_SUPPORT'],
      },
      {
        email: 'sales.agent@westdrive.fr',
        firstName: 'Ines',
        lastName: 'Diallo',
        phone: '+33633334444',
        role: 'SALES_AGENT',
        password: 'SalesAgent123!',
        roleNames: ['SALES_AGENT'],
      },
    ];

    for (const userSeed of usersToSeed) {
      await ensureUser(
        userRepository,
        userRoleRepository,
        roleRepository,
        userSeed,
      );
    }

    await seedVehicles(vehicleRepository);

    console.log('Seed all completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

seedAll().catch((error: unknown) => {
  console.error('Seed all failed:', error);
  process.exit(1);
});

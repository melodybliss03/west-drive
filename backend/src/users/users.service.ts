import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async createUser(payload: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    companyProfile?: {
      companyName: string;
      siret: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    } | null;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...payload,
      email: payload.email.trim().toLowerCase(),
      status: UserStatus.ACTIF,
      companyProfile: payload.companyProfile ?? null,
    });
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { userRoles: true, companyProfile: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: {
        companyProfile: true,
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });
  }

  async listUsers(page = 1, limit = 20): Promise<PaginatedResponse<User & { accountType: string; reservationsCount: number }>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: { userRoles: { role: true }, companyProfile: true },
      skip: pagination.skip,
      take: pagination.limit,
    });

    // Batch-fetch reservation counts to avoid N+1
    const userIds = items.map((u) => u.id);
    const countRows: Array<{ userId: string; cnt: string }> =
      userIds.length > 0
        ? await this.reservationRepository
            .createQueryBuilder('r')
            .select('r.userId', 'userId')
            .addSelect('COUNT(*)', 'cnt')
            .where('r.userId IN (:...userIds)', { userIds })
            .groupBy('r.userId')
            .getRawMany()
        : [];

    const countMap = new Map(
      countRows.map((row) => [row.userId, parseInt(row.cnt, 10)]),
    );

    const enriched = items.map((u) =>
      Object.assign(u, {
        accountType: u.companyProfile ? 'ENTREPRISE' : 'PARTICULIER',
        reservationsCount: countMap.get(u.id) ?? 0,
      }),
    );

    return buildPaginatedResponse(
      enriched,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Password hash is generated server-side to avoid storing plain secrets.
    const passwordHash = await argon2.hash(dto.password);

    const user = this.userRepository.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      status: dto.status ?? UserStatus.ACTIF,
    });

    return this.userRepository.save(user);
  }

  async getById(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getById(userId);

    // Only update fields present in payload to keep PATCH semantics predictable.
    if (dto.email !== undefined) {
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.status !== undefined) {
      user.status = dto.status;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await argon2.hash(dto.password);
    }

    return this.userRepository.save(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<User> {
    const user = await this.getById(userId);

    if (dto.email !== undefined) {
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    return this.userRepository.save(user);
  }

  async remove(userId: string): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete({ id: userId });
    return { message: 'User deleted successfully' };
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    return this.userRepository.save(user);
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.userRepository.update({ id: userId }, { passwordHash });
  }

  async createGuestAccount(payload: {
    email: string;
    requesterName: string;
    phone: string;
  }): Promise<User> {
    const existing = await this.findByEmail(payload.email);
    if (existing) {
      return existing;
    }

    const trimmedName = payload.requesterName.trim();
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'WestDrive';

    // A random temporary password hash allows account creation before setup.
    const temporaryPasswordHash = await argon2.hash(`guest-${randomUUID()}`);

    const guest = this.userRepository.create({
      email: payload.email.trim().toLowerCase(),
      passwordHash: temporaryPasswordHash,
      firstName,
      lastName,
      phone: payload.phone,
      role: 'CUSTOMER',
      status: UserStatus.ACTIF,
      companyProfile: null,
    });

    return this.userRepository.save(guest);
  }
}

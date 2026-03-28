import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Vehicle,
  VehicleOperationalStatus,
} from '../vehicles/entities/vehicle.entity';
import { CreateFleetIncidentDto } from './dto/create-fleet-incident.dto';
import { CreateVehicleScheduleSlotDto } from './dto/create-vehicle-schedule-slot.dto';
import { UpdateFleetIncidentDto } from './dto/update-fleet-incident.dto';
import { UpdateFleetVehicleMileageDto } from './dto/update-fleet-vehicle-mileage.dto';
import { UpdateFleetVehicleStatusDto } from './dto/update-fleet-vehicle-status.dto';
import { UpdateVehicleScheduleSlotDto } from './dto/update-vehicle-schedule-slot.dto';
import {
  FleetIncident,
  FleetIncidentSeverity,
  FleetIncidentStatus,
} from './entities/fleet-incident.entity';
import { VehicleScheduleSlot } from './entities/vehicle-schedule-slot.entity';

type MaintenanceSummary = {
  requiredMileage: number | null;
  requiredDays: number | null;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  lastMaintenanceMileage: number | null;
  nextMaintenanceMileage: number | null;
  remainingKm: number | null;
  remainingDays: number | null;
  isDueSoon: boolean;
  isOverdue: boolean;
};

type FleetVehicleView = Vehicle & {
  maintenanceSummary: MaintenanceSummary | null;
};

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(FleetIncident)
    private readonly incidentRepository: Repository<FleetIncident>,
    @InjectRepository(VehicleScheduleSlot)
    private readonly slotRepository: Repository<VehicleScheduleSlot>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOverview() {
    const [bonEtat, entretienRequis, enPanne, totalIncidentsOuverts] =
      await Promise.all([
        this.vehicleRepository.count({
          where: { operationalStatus: VehicleOperationalStatus.DISPONIBLE },
        }),
        this.vehicleRepository.count({
          where: { operationalStatus: VehicleOperationalStatus.MAINTENANCE },
        }),
        this.vehicleRepository.count({
          where: { operationalStatus: VehicleOperationalStatus.INDISPONIBLE },
        }),
        this.incidentRepository.count({
          where: [
            { status: FleetIncidentStatus.OUVERT },
            { status: FleetIncidentStatus.EN_COURS },
          ],
        }),
      ]);

    return {
      bonEtat,
      entretienRequis,
      enPanne,
      totalIncidentsOuverts,
    };
  }

  async listFleetVehicles(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FleetVehicleView>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.vehicleRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: { images: true },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const now = new Date();
    const enrichedItems = items.map((vehicle) => {
      const maintenanceSummary = this.computeMaintenanceSummary(vehicle, now);
      return {
        ...vehicle,
        maintenanceSummary,
      } as FleetVehicleView;
    });

    await Promise.all(
      enrichedItems.map((vehicle) =>
        this.notifyMaintenanceApproaching(vehicle).catch(() => undefined),
      ),
    );

    return buildPaginatedResponse(
      enrichedItems,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async updateVehicleStatus(
    vehicleId: string,
    dto: UpdateFleetVehicleStatusDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findVehicleOrFail(vehicleId);

    vehicle.operationalStatus = dto.operationalStatus;
    return this.vehicleRepository.save(vehicle);
  }

  async updateVehicleMileage(
    vehicleId: string,
    dto: UpdateFleetVehicleMileageDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findVehicleOrFail(vehicleId);

    vehicle.mileage = dto.mileage;

    if (dto.maintenanceRequired !== undefined) {
      vehicle.maintenanceRequired = this.normalizeMaintenanceRequired(
        dto.maintenanceRequired,
      );
    }

    const maintenanceSummary = this.computeMaintenanceSummary(vehicle, new Date());
    if (maintenanceSummary?.isOverdue) {
      vehicle.operationalStatus = VehicleOperationalStatus.MAINTENANCE;
    }

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    await this.notifyMaintenanceApproaching({
      ...savedVehicle,
      maintenanceSummary,
    } as FleetVehicleView).catch(() => undefined);

    return savedVehicle;
  }

  async createIncident(dto: CreateFleetIncidentDto): Promise<FleetIncident> {
    const vehicle = await this.findVehicleOrFail(dto.vehicleId);

    const incident = this.incidentRepository.create({
      vehicleId: dto.vehicleId,
      incidentType: dto.incidentType,
      severity: dto.severity,
      status: dto.status ?? FleetIncidentStatus.OUVERT,
      description: dto.description,
      openedAt: dto.openedAt ?? new Date(),
      resolvedAt: dto.resolvedAt ?? null,
    });

    const savedIncident = await this.incidentRepository.save(incident);

    // Critical incidents immediately block vehicle assignment to avoid unsafe bookings.
    if (savedIncident.severity === FleetIncidentSeverity.CRITIQUE) {
      vehicle.operationalStatus = VehicleOperationalStatus.INDISPONIBLE;
      await this.vehicleRepository.save(vehicle);
    }

    return this.getIncidentById(savedIncident.id);
  }

  async listIncidents(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FleetIncident>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.incidentRepository.findAndCount({
      order: { openedAt: 'DESC' },
      relations: { vehicle: true },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(
      items,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async getIncidentById(incidentId: string): Promise<FleetIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: { vehicle: true },
    });

    if (!incident) {
      throw new NotFoundException('Fleet incident not found');
    }

    return incident;
  }

  async updateIncident(
    incidentId: string,
    dto: UpdateFleetIncidentDto,
  ): Promise<FleetIncident> {
    const incident = await this.getIncidentById(incidentId);

    if (dto.vehicleId !== undefined) {
      await this.findVehicleOrFail(dto.vehicleId);
      incident.vehicleId = dto.vehicleId;
    }
    // The frontend relies on explicit status transitions to track lifecycle clearly.
    if (dto.incidentType !== undefined) {
      incident.incidentType = dto.incidentType;
    }
    if (dto.severity !== undefined) {
      incident.severity = dto.severity;
    }
    if (dto.status !== undefined) {
      incident.status = dto.status;
    }
    if (dto.description !== undefined) {
      incident.description = dto.description;
    }
    if (dto.openedAt !== undefined) {
      incident.openedAt = dto.openedAt;
    }
    if (dto.resolvedAt !== undefined) {
      incident.resolvedAt = dto.resolvedAt;
    }

    const savedIncident = await this.incidentRepository.save(incident);

    // Preserve hard safety rule: any critical unresolved incident keeps vehicle unavailable.
    if (
      savedIncident.severity === FleetIncidentSeverity.CRITIQUE &&
      savedIncident.status !== FleetIncidentStatus.RESOLU
    ) {
      const vehicle = await this.findVehicleOrFail(savedIncident.vehicleId);
      vehicle.operationalStatus = VehicleOperationalStatus.INDISPONIBLE;
      await this.vehicleRepository.save(vehicle);
    }

    return this.getIncidentById(savedIncident.id);
  }

  async removeIncident(incidentId: string): Promise<{ message: string }> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Fleet incident not found');
    }

    await this.incidentRepository.delete({ id: incidentId });
    return { message: 'Fleet incident deleted successfully' };
  }

  async createScheduleSlot(
    dto: CreateVehicleScheduleSlotDto,
  ): Promise<VehicleScheduleSlot> {
    await this.findVehicleOrFail(dto.vehicleId);

    this.ensureValidSlotRange(dto.startAt, dto.endAt);

    const slot = this.slotRepository.create({
      vehicleId: dto.vehicleId,
      startAt: dto.startAt,
      endAt: dto.endAt,
      slotType: dto.slotType,
    });

    return this.slotRepository.save(slot);
  }

  async listScheduleSlots(
    vehicleId?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<VehicleScheduleSlot>> {
    const pagination = resolvePagination(page, limit);
    const [items, totalItems] = await this.slotRepository.findAndCount({
      where: vehicleId ? { vehicleId } : {},
      order: { startAt: 'ASC' },
      relations: { vehicle: true },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(
      items,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async getScheduleSlotById(slotId: string): Promise<VehicleScheduleSlot> {
    const slot = await this.slotRepository.findOne({
      where: { id: slotId },
      relations: { vehicle: true },
    });

    if (!slot) {
      throw new NotFoundException('Vehicle schedule slot not found');
    }

    return slot;
  }

  async updateScheduleSlot(
    slotId: string,
    dto: UpdateVehicleScheduleSlotDto,
  ): Promise<VehicleScheduleSlot> {
    const slot = await this.getScheduleSlotById(slotId);

    if (dto.vehicleId !== undefined) {
      await this.findVehicleOrFail(dto.vehicleId);
      slot.vehicleId = dto.vehicleId;
    }
    if (dto.startAt !== undefined) {
      slot.startAt = dto.startAt;
    }
    if (dto.endAt !== undefined) {
      slot.endAt = dto.endAt;
    }
    if (dto.slotType !== undefined) {
      slot.slotType = dto.slotType;
    }

    this.ensureValidSlotRange(slot.startAt, slot.endAt);

    await this.slotRepository.save(slot);
    return this.getScheduleSlotById(slot.id);
  }

  async removeScheduleSlot(slotId: string): Promise<{ message: string }> {
    const slot = await this.slotRepository.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException('Vehicle schedule slot not found');
    }

    await this.slotRepository.delete({ id: slotId });
    return { message: 'Vehicle schedule slot deleted successfully' };
  }

  private async findVehicleOrFail(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  private ensureValidSlotRange(startAt: Date, endAt: Date): void {
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }
  }

  private normalizeMaintenanceRequired(
    maintenanceRequired:
      | {
          mileage?: number;
          days?: number;
        }
      | null
      | undefined,
  ): { mileage?: number; days?: number } | null {
    if (!maintenanceRequired) {
      return null;
    }

    const mileage = maintenanceRequired.mileage;
    const days = maintenanceRequired.days;

    if (mileage === undefined && days === undefined) {
      return null;
    }

    return {
      mileage,
      days,
    };
  }

  private computeMaintenanceSummary(
    vehicle: Vehicle,
    referenceDate: Date,
  ): MaintenanceSummary | null {
    const maintenanceRequired = vehicle.maintenanceRequired ?? null;
    if (!maintenanceRequired) {
      return null;
    }

    const requiredMileage =
      typeof maintenanceRequired.mileage === 'number' &&
      maintenanceRequired.mileage > 0
        ? maintenanceRequired.mileage
        : null;
    const requiredDays =
      typeof maintenanceRequired.days === 'number' && maintenanceRequired.days > 0
        ? maintenanceRequired.days
        : null;

    if (!requiredMileage && !requiredDays) {
      return null;
    }

    const now = referenceDate;
    const dayMs = 24 * 60 * 60 * 1000;
    const mileage = Math.max(vehicle.mileage ?? 0, 0);

    let lastByDays: Date | null = null;
    let nextByDays: Date | null = null;
    if (requiredDays) {
      const anchor = vehicle.createdAt ?? now;
      const elapsedDays = Math.max(
        0,
        Math.floor((now.getTime() - anchor.getTime()) / dayMs),
      );
      const cycles = Math.floor(elapsedDays / requiredDays);
      lastByDays = new Date(anchor.getTime() + cycles * requiredDays * dayMs);
      nextByDays = new Date(
        anchor.getTime() + (cycles + 1) * requiredDays * dayMs,
      );
    }

    let lastByMileage: Date | null = null;
    let nextByMileage: Date | null = null;
    let lastMaintenanceMileage: number | null = null;
    let nextMaintenanceMileage: number | null = null;
    let remainingKm: number | null = null;

    if (requiredMileage) {
      const completedCycles = Math.floor(mileage / requiredMileage);
      lastMaintenanceMileage = completedCycles * requiredMileage;
      nextMaintenanceMileage = (completedCycles + 1) * requiredMileage;
      remainingKm = Math.max(nextMaintenanceMileage - mileage, 0);

      const averageKmPerDay = requiredDays
        ? Math.max(requiredMileage / requiredDays, 10)
        : Math.max(requiredMileage / 30, 10);

      const consumedKmSinceLast = Math.max(mileage - lastMaintenanceMileage, 0);
      const daysSinceLast = consumedKmSinceLast / averageKmPerDay;
      const daysUntilNext = remainingKm / averageKmPerDay;

      lastByMileage = new Date(now.getTime() - daysSinceLast * dayMs);
      nextByMileage = new Date(now.getTime() + daysUntilNext * dayMs);
    }

    const lastCandidates = [lastByDays, lastByMileage].filter(
      (value): value is Date => value instanceof Date,
    );
    const nextCandidates = [nextByDays, nextByMileage].filter(
      (value): value is Date => value instanceof Date,
    );

    const lastMaintenanceAt =
      lastCandidates.length > 0
        ? new Date(
            Math.max(...lastCandidates.map((value) => value.getTime())),
          )
        : null;
    const nextMaintenanceAt =
      nextCandidates.length > 0
        ? new Date(
            Math.min(...nextCandidates.map((value) => value.getTime())),
          )
        : null;

    const remainingDays = nextMaintenanceAt
      ? Math.ceil((nextMaintenanceAt.getTime() - now.getTime()) / dayMs)
      : null;

    const isOverdue =
      (remainingDays !== null && remainingDays <= 0) ||
      (remainingKm !== null && remainingKm <= 0);
    const isDueSoon =
      !isOverdue &&
      ((remainingDays !== null && remainingDays <= 7) ||
        (remainingKm !== null && remainingKm <= 100));

    return {
      requiredMileage,
      requiredDays,
      lastMaintenanceAt: lastMaintenanceAt?.toISOString() ?? null,
      nextMaintenanceAt: nextMaintenanceAt?.toISOString() ?? null,
      lastMaintenanceMileage,
      nextMaintenanceMileage,
      remainingKm,
      remainingDays,
      isDueSoon,
      isOverdue,
    };
  }

  private async notifyMaintenanceApproaching(
    vehicle: FleetVehicleView,
  ): Promise<void> {
    const summary = vehicle.maintenanceSummary;
    if (!summary || (!summary.isDueSoon && !summary.isOverdue)) {
      return;
    }

    const urgency = summary.isOverdue ? 'overdue' : 'upcoming';
    const nextDate = summary.nextMaintenanceAt
      ? summary.nextMaintenanceAt.slice(0, 10)
      : 'no-date';
    const nextMileage =
      summary.nextMaintenanceMileage !== null
        ? summary.nextMaintenanceMileage.toString()
        : 'no-mileage';

    const dedupeKey = `fleet-maintenance:${vehicle.id}:${urgency}:${nextDate}:${nextMileage}`;

    const nextDateLabel = summary.nextMaintenanceAt
      ? new Date(summary.nextMaintenanceAt).toLocaleDateString('fr-FR')
      : 'date non disponible';

    const remainingBits: string[] = [];
    if (summary.remainingDays !== null) {
      remainingBits.push(`${summary.remainingDays} jour(s)`);
    }
    if (summary.remainingKm !== null) {
      remainingBits.push(`${summary.remainingKm} km`);
    }

    const remainingLabel =
      remainingBits.length > 0 ? remainingBits.join(' / ') : 'echeance immediate';

    await this.notificationsService.createForAdminWithDedupe(
      {
        type: 'flotte',
        title: summary.isOverdue
          ? 'Entretien en retard'
          : 'Entretien approche',
        message: `${vehicle.name} (${vehicle.plateNumber ?? 'sans plaque'}) - prochain entretien: ${nextDateLabel} (${remainingLabel}).`,
        metadata: {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          plateNumber: vehicle.plateNumber,
          maintenanceSummary: summary,
        },
      },
      {
        dedupeKey,
        windowHours: 24,
      },
    );
  }
}

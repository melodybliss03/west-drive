import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review, ReviewStatus } from './entities/review.entity';

type PendingReviewReservation = {
  reservationId: string;
  publicReference: string;
  endAt: Date;
  vehicleId: string;
  vehicleName: string;
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listPublished(
    page = 1,
    limit = 20,
    vehicleId?: string,
  ): Promise<PaginatedResponse<Review>> {
    const pagination = resolvePagination(page, limit);
    const where: Record<string, unknown> = {
      status: ReviewStatus.PUBLISHED,
    };

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const [items, totalItems] = await this.reviewRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
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

  async findMyPendingReservations(
    userId: string,
    requesterEmail: string | undefined,
  ): Promise<PendingReviewReservation[]> {
    const normalizedUserId =
      typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : null;
    const normalizedEmail =
      typeof requesterEmail === 'string' && requesterEmail.trim().length > 0
        ? requesterEmail.trim().toLowerCase()
        : null;

    if (!normalizedUserId && !normalizedEmail) {
      return [];
    }

    const query = this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vehicle', 'vehicle')
      .leftJoin('reviews', 'review', 'review.reservation_id = r.id')
      .where('r.archivedAt IS NULL')
      .andWhere('r.status = :status', { status: ReservationStatus.CLOTUREE })
      .andWhere('r.vehicleId IS NOT NULL')
      .andWhere('review.id IS NULL')
      .orderBy('r.endAt', 'DESC');

    if (normalizedUserId && normalizedEmail) {
      query.andWhere('(r.userId = :userId OR LOWER(r.requesterEmail) = :email)', {
        userId: normalizedUserId,
        email: normalizedEmail,
      });
    } else if (normalizedUserId) {
      query.andWhere('r.userId = :userId', { userId: normalizedUserId });
    } else {
      query.andWhere('LOWER(r.requesterEmail) = :email', { email: normalizedEmail });
    }

    const reservations = await query.getMany();
    return reservations
      .filter((reservation) => reservation.vehicleId && reservation.vehicle)
      .map((reservation) => ({
        reservationId: reservation.id,
        publicReference: reservation.publicReference,
        endAt: reservation.endAt,
        vehicleId: reservation.vehicleId as string,
        vehicleName: reservation.vehicle?.name ?? reservation.requestedVehicleType,
      }));
  }

  async createByCustomer(
    userId: string,
    requesterEmail: string | undefined,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('content cannot be empty');
    }

    const existing = await this.reviewRepository.findOne({
      where: { reservationId: dto.reservationId },
    });
    if (existing) {
      throw new ConflictException('A review already exists for this reservation');
    }

    const reservation = await this.findClosedOwnedReservation(
      dto.reservationId,
      userId,
      requesterEmail,
    );

    if (!reservation.vehicleId) {
      throw new BadRequestException(
        'Cannot submit review for reservation without assigned vehicle',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const fallbackName = reservation.requesterName || 'Client WestDrive';
    const authorName = user
      ? `${user.firstName} ${user.lastName}`.trim() || fallbackName
      : fallbackName;

    const review = this.reviewRepository.create({
      userId: user?.id ?? reservation.userId ?? null,
      reservationId: reservation.id,
      vehicleId: reservation.vehicleId,
      authorName,
      title: dto.title?.trim() || null,
      rating: dto.rating,
      content,
      imageUrl: null,
      status: ReviewStatus.PUBLISHED,
    });

    const saved = await this.reviewRepository.save(review);
    await this.refreshVehicleRatingAggregates(reservation.vehicleId);
    return saved;
  }

  private async findClosedOwnedReservation(
    reservationId: string,
    userId: string,
    requesterEmail: string | undefined,
  ): Promise<Reservation> {
    const normalizedUserId =
      typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : null;
    const normalizedEmail =
      typeof requesterEmail === 'string' && requesterEmail.trim().length > 0
        ? requesterEmail.trim().toLowerCase()
        : null;

    if (!normalizedUserId && !normalizedEmail) {
      throw new NotFoundException('Reservation not found');
    }

    const query = this.reservationRepository
      .createQueryBuilder('r')
      .where('r.id = :reservationId', { reservationId })
      .andWhere('r.archivedAt IS NULL')
      .andWhere('r.status = :status', { status: ReservationStatus.CLOTUREE });

    if (normalizedUserId && normalizedEmail) {
      query.andWhere('(r.userId = :userId OR LOWER(r.requesterEmail) = :email)', {
        userId: normalizedUserId,
        email: normalizedEmail,
      });
    } else if (normalizedUserId) {
      query.andWhere('r.userId = :userId', { userId: normalizedUserId });
    } else {
      query.andWhere('LOWER(r.requesterEmail) = :email', { email: normalizedEmail });
    }

    const reservation = await query.getOne();
    if (!reservation) {
      throw new NotFoundException('Reservation not found or not eligible for review');
    }

    return reservation;
  }

  private async refreshVehicleRatingAggregates(vehicleId: string): Promise<void> {
    const aggregates = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .getRawOne<{ avgRating: string | null; reviewCount: string | null }>();

    const avgRating = Number(aggregates?.avgRating ?? 0);
    const reviewCount = Number(aggregates?.reviewCount ?? 0);

    await this.vehicleRepository.update(
      { id: vehicleId },
      {
        rating: avgRating.toFixed(2),
        reviewCount,
      },
    );
  }
}

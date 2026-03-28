import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { ReservationEvent } from './entities/reservation-event.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleScheduleSlot } from '../fleet/entities/vehicle-schedule-slot.entity';
import { ReservationsService } from './reservations.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../shared/mail/mail.service';
import { PaymentsService } from '../shared/payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const reservationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const reservationEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const vehicleRepository = {
    findOne: jest.fn(),
  };

  const slotRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  const usersService = {
    findByEmail: jest.fn(),
    createGuestAccount: jest.fn(),
  };

  const authService = {
    createAccountActivationUrl: jest.fn(),
  };

  const mailService = {
    sendReservationAcknowledgement: jest.fn(),
    sendReservationAdminNotification: jest.fn(),
    sendGuestAccountSetupEmail: jest.fn(),
    sendReservationPaymentLinkEmail: jest.fn(),
    sendReservationStatusUpdate: jest.fn(),
    sendReservationEventNotification: jest.fn(),
  };

  const notificationsService = {
    createForAdmin: jest.fn(),
    createForUser: jest.fn(),
  };

  const paymentsService = {
    createCheckoutSession: jest.fn(),
    retrieveCheckoutSession: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'ADMIN_EMAIL') return 'admin@westdrive.fr';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    reservationRepository.createQueryBuilder.mockReturnValue({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: reservationRepository,
        },
        {
          provide: getRepositoryToken(ReservationEvent),
          useValue: reservationEventRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehicleRepository,
        },
        {
          provide: getRepositoryToken(VehicleScheduleSlot),
          useValue: slotRepository,
        },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
        { provide: MailService, useValue: mailService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('archives reservation on remove', async () => {
    const reservation = {
      id: 'res-1',
      archivedAt: null,
      status: ReservationStatus.EN_ATTENTE_PAIEMENT,
    } as Reservation;

    reservationRepository.findOne.mockResolvedValue(reservation);
    reservationRepository.save.mockResolvedValue({ ...reservation, archivedAt: new Date() });
    reservationEventRepository.create.mockReturnValue({
      id: 'event-1',
      reservationId: 'res-1',
      type: 'reservation_archived',
    });
    reservationEventRepository.save.mockResolvedValue({ id: 'event-1' });

    const result = await service.remove('res-1');

    expect(reservationRepository.save).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Reservation archived successfully' });
  });

  it('creates in-app admin and customer notifications on reservation create', async () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const createDto = {
      requesterType: 'PARTICULIER',
      requesterName: 'Sophie Martin',
      requesterEmail: 'sophie@westdrive.fr',
      requesterPhone: '+33612345678',
      startAt: new Date('2026-04-01T09:00:00.000Z'),
      endAt: new Date('2026-04-02T09:00:00.000Z'),
      pickupCity: 'Paris',
      requestedVehicleType: 'SUV',
      amountTtc: 100,
      depositAmount: 200,
    } as any;

    usersService.findByEmail.mockResolvedValue({ id: 'user-1' });
    reservationRepository.create.mockImplementation((payload) => ({
      id: 'res-1',
      ...payload,
      createdAt: now,
    }));
    reservationRepository.save.mockImplementation(async (payload) => payload);
    reservationEventRepository.create.mockImplementation((payload) => ({ id: 'evt-1', ...payload }));
    reservationEventRepository.save.mockResolvedValue({ id: 'evt-1' });
    reservationRepository.findOne.mockResolvedValue({
      id: 'res-1',
      userId: 'user-1',
      requesterName: 'Sophie Martin',
      requesterEmail: 'sophie@westdrive.fr',
      requesterPhone: '+33612345678',
      publicReference: 'RES-20260325-ABCD',
      status: ReservationStatus.EN_ATTENTE_PAIEMENT,
      amountTtc: '100.00',
      depositAmount: '200.00',
      startAt: createDto.startAt,
      endAt: createDto.endAt,
      pickupCity: createDto.pickupCity,
      requestedVehicleType: createDto.requestedVehicleType,
      companyName: null,
      companySiret: null,
      vehicleId: null,
      vehicle: null,
      user: null,
      events: [],
      archivedAt: null,
    });

    await service.create(createDto);

    expect(reservationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ReservationStatus.EN_ATTENTE_PAIEMENT,
      }),
    );

    expect(notificationsService.createForAdmin).toHaveBeenCalled();
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-1',
      }),
    );
  });
});

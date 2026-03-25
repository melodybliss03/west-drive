import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController', () => {
  let controller: ReservationsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    createStripePreauth: jest.fn(),
    createEvent: jest.fn(),
    findEvents: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    jest.clearAllMocks();
  });

  it('creates a reservation', async () => {
    const dto = {
      requesterType: 'PARTICULIER',
      requesterName: 'John Doe',
      requesterEmail: 'john@doe.com',
      requesterPhone: '+33600000000',
      startAt: new Date('2026-06-01T10:00:00Z'),
      endAt: new Date('2026-06-02T10:00:00Z'),
      pickupCity: 'Paris',
      requestedVehicleType: 'SUV',
    };
    mockService.create.mockResolvedValue({ id: 'r-1' });

    await expect(controller.create(dto)).resolves.toEqual({ id: 'r-1' });
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('updates status', async () => {
    mockService.updateStatus.mockResolvedValue({
      id: 'r-1',
      status: 'EN_ANALYSE',
    });

    await expect(
      controller.updateStatus('r-1', { status: 'EN_ANALYSE' as never }),
    ).resolves.toEqual({ id: 'r-1', status: 'EN_ANALYSE' });
    expect(mockService.updateStatus).toHaveBeenCalledWith('r-1', {
      status: 'EN_ANALYSE',
    });
  });

  it('lists timeline events', async () => {
    mockService.findEvents.mockResolvedValue([{ id: 'e-1' }]);

    await expect(controller.findEvents('r-1')).resolves.toEqual([
      { id: 'e-1' },
    ]);
    expect(mockService.findEvents).toHaveBeenCalledWith('r-1', 1, 20);
  });

  it('lists reservations with pagination and optional user filter', async () => {
    mockService.findAll.mockResolvedValue({ items: [], meta: { page: 2, limit: 10 } });

    await expect(controller.findAll(2, 10, 'user-1')).resolves.toEqual({
      items: [],
      meta: { page: 2, limit: 10 },
    });

    expect(mockService.findAll).toHaveBeenCalledWith(2, 10, 'user-1');
  });

  it('creates stripe preauthorization', async () => {
    mockService.createStripePreauth.mockResolvedValue({
      id: 'r-1',
      status: 'CONFIRMEE',
    });

    await expect(
      controller.createStripePreauth('r-1', { amount: 1200 }),
    ).resolves.toEqual({
      id: 'r-1',
      status: 'CONFIRMEE',
    });

    expect(mockService.createStripePreauth).toHaveBeenCalledWith('r-1', {
      amount: 1200,
    });
  });

  it('archives reservation on delete endpoint', async () => {
    mockService.remove.mockResolvedValue({
      message: 'Reservation archived successfully',
    });

    await expect(controller.remove('r-1')).resolves.toEqual({
      message: 'Reservation archived successfully',
    });

    expect(mockService.remove).toHaveBeenCalledWith('r-1');
  });
});

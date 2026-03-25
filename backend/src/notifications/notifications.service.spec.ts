import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('creates admin notification with ADMIN recipient role', async () => {
    const created = {
      id: 'notif-1',
      type: 'reservation',
      title: 'Nouvelle demande',
      message: 'message',
      recipientRole: 'ADMIN',
      recipientUserId: null,
      isRead: false,
      metadata: {},
      readAt: null,
    } as Notification;

    mockRepository.create.mockReturnValue(created);
    mockRepository.save.mockResolvedValue(created);

    const result = await service.createForAdmin({
      type: 'reservation',
      title: 'Nouvelle demande',
      message: 'message',
    });

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientRole: 'ADMIN',
        recipientUserId: null,
        isRead: false,
      }),
    );
    expect(result).toEqual(created);
  });
});

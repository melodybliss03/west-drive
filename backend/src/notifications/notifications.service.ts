import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  resolvePagination,
  type PaginatedResponse,
} from '../shared/pagination/pagination.util';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createForAdmin(payload: {
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...payload,
      recipientUserId: null,
      recipientRole: 'ADMIN',
      isRead: false,
      readAt: null,
      metadata: payload.metadata ?? {},
    });

    return this.notificationRepository.save(notification);
  }

  async createForAdminWithDedupe(
    payload: {
      type: string;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
    },
    options: { dedupeKey: string; windowHours?: number },
  ): Promise<Notification> {
    const windowHours = options.windowHours ?? 24;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const existing = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.recipient_role = :recipientRole', { recipientRole: 'ADMIN' })
      .andWhere('n.type = :type', { type: payload.type })
      .andWhere("n.metadata ->> 'dedupeKey' = :dedupeKey", {
        dedupeKey: options.dedupeKey,
      })
      .andWhere('n.created_at >= :since', { since })
      .orderBy('n.created_at', 'DESC')
      .getOne();

    if (existing) {
      return existing;
    }

    return this.createForAdmin({
      ...payload,
      metadata: {
        ...(payload.metadata ?? {}),
        dedupeKey: options.dedupeKey,
      },
    });
  }

  async createForUser(payload: {
    type: string;
    title: string;
    message: string;
    recipientUserId: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      recipientUserId: payload.recipientUserId,
      recipientRole: null,
      isRead: false,
      readAt: null,
      metadata: payload.metadata ?? {},
    });

    return this.notificationRepository.save(notification);
  }

  async listForUser(
    userId: string,
    roles: string[],
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Notification>> {
    const pagination = resolvePagination(page, limit);
    const roleSet = new Set((roles ?? []).map((role) => role.toUpperCase()));

    const query = this.notificationRepository
      .createQueryBuilder('n')
      .orderBy('n.created_at', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    query.where(
      new Brackets((qb) => {
        qb.where('n.recipient_user_id = :userId', { userId });

        if (roleSet.size > 0) {
          qb.orWhere('n.recipient_role IN (:...roles)', {
            roles: Array.from(roleSet),
          });
        }
      }),
    );

    const [items, totalItems] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      pagination.page,
      pagination.limit,
      totalItems,
    );
  }

  async markAsReadForUser(
    notificationId: string,
    userId: string,
    roles: string[],
  ): Promise<Notification> {
    const roleSet = new Set((roles ?? []).map((role) => role.toUpperCase()));

    const notification = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.id = :notificationId', { notificationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('n.recipient_user_id = :userId', { userId });

          if (roleSet.size > 0) {
            qb.orWhere('n.recipient_role IN (:...roles)', {
              roles: Array.from(roleSet),
            });
          }
        }),
      )
      .getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsReadForUser(userId: string, roles: string[]): Promise<void> {
    const roleSet = new Set((roles ?? []).map((role) => role.toUpperCase()));

    const query = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('is_read = false')
      .andWhere(
        new Brackets((qb) => {
          qb.where('recipient_user_id = :userId', { userId });

          if (roleSet.size > 0) {
            qb.orWhere('recipient_role IN (:...roles)', {
              roles: Array.from(roleSet),
            });
          }
        }),
      );

    await query.execute();
  }
}

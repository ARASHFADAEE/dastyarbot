import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async notifyAdmins(input: {
    title: string;
    body: string;
    type: string;
    payload?: unknown;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'agent'] } },
      select: { id: true },
    });
    const payload = input.payload ? JSON.stringify(input.payload) : undefined;
    if (!admins.length) {
      return this.prisma.notification.create({
        data: {
          title: input.title,
          body: input.body,
          type: input.type,
          payload,
        },
      });
    }
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: input.title,
        body: input.body,
        type: input.type,
        payload,
      })),
    });
    return { count: admins.length };
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}

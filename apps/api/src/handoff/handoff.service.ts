import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { NotificationsService } from '../notifications/notifications.service';

export type HandoffStatus = 'open' | 'assigned' | 'resolved' | 'cancelled';

/** Lazy type to avoid circular Nest module imports with ChannelsModule. */
type TelegramAlerter = {
  sendHandoffAlert: (conversationId: string, title?: string) => Promise<void>;
};

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
    private readonly notifications: NotificationsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  list(status?: HandoffStatus) {
    return this.prisma.handoffTicket.findMany({
      where: status ? { status } : undefined,
      include: {
        conversation: { include: { customer: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async request(conversationId: string, reason?: string) {
    const ticket = await this.prisma.handoffTicket.create({
      data: { conversationId, reason, status: 'open' },
    });
    await this.conversations.setStatus(conversationId, 'handoff', { aiEnabled: false });
    await this.notifications.notifyAdmins({
      title: 'درخواست انتقال به انسان',
      body: reason || 'مشتری درخواست صحبت با کارشناس دارد',
      type: 'handoff',
      payload: { conversationId, ticketId: ticket.id },
    });

    await this.alertTelegram(conversationId, reason);
    return ticket;
  }

  async cancelOpenManual(conversationId: string) {
    await this.prisma.handoffTicket.updateMany({
      where: {
        conversationId,
        status: { in: ['open', 'assigned'] },
        reason: { startsWith: 'manual:' },
      },
      data: { status: 'cancelled' },
    });
  }

  async assign(id: string, userId: string) {
    return this.prisma.handoffTicket.update({
      where: { id },
      data: { status: 'assigned', assignedToId: userId },
    });
  }

  async resolve(id: string) {
    const ticket = await this.prisma.handoffTicket.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
    await this.conversations.setStatus(ticket.conversationId, 'closed', {
      aiEnabled: false,
      resolvedByAi: false,
    });
    return ticket;
  }

  private async alertTelegram(conversationId: string, reason?: string) {
    try {
      // Resolve at call-time so HandoffModule need not import ChannelsModule (breaks circular deps).
      const { TelegramService } = await import('../channels/telegram.service');
      const telegram = this.moduleRef.get(TelegramService, { strict: false }) as
        | TelegramAlerter
        | undefined;
      if (!telegram?.sendHandoffAlert) return;

      const title = reason?.startsWith('manual:')
        ? '✅ کنترل دستی توسط شما'
        : '🔔 انتقال گفتگو — لطفاً تماس بگیرید';
      await telegram.sendHandoffAlert(conversationId, title);
    } catch (err) {
      this.logger.warn(`Telegram handoff alert skipped: ${(err as Error).message}`);
    }
  }
}

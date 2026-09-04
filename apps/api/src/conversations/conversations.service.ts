import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export type Channel = 'telegram' | 'web' | 'admin';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'agent';
export type ConversationStatus = 'active' | 'handoff' | 'closed';

type TelegramDeliverer = {
  deliverToCustomer: (
    conversationId: string,
    text: string,
  ) => Promise<{ delivered: boolean; channel?: string; error?: string }>;
};

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  list(status?: ConversationStatus) {
    return this.prisma.conversation.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: { include: { channels: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        handoffs: { where: { status: { in: ['open', 'assigned'] } }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }

  async get(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { include: { channels: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        handoffs: true,
        leads: true,
        callbacks: true,
      },
    });
    if (!conversation) throw new NotFoundException('مکالمه یافت نشد');
    return conversation;
  }

  async findOrCreateActive(customerId: string, channel: Channel) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        channel,
        status: { in: ['active', 'handoff'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { customerId, channel, status: 'active', aiEnabled: true },
    });
  }

  async addMessage(input: {
    conversationId: string;
    role: MessageRole;
    content: string;
    channel: Channel;
    mediaUrl?: string;
    mediaType?: string;
    toolName?: string;
    toolPayload?: unknown;
    tokensIn?: number;
    tokensOut?: number;
    costUsd?: number;
    avalaiRequestId?: string;
    responseTimeMs?: number;
    agentId?: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        channel: input.channel,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        toolName: input.toolName,
        toolPayload: input.toolPayload ? JSON.stringify(input.toolPayload) : undefined,
        tokensIn: input.tokensIn,
        tokensOut: input.tokensOut,
        costUsd: input.costUsd,
        avalaiRequestId: input.avalaiRequestId,
        responseTimeMs: input.responseTimeMs,
        agentId: input.agentId,
      },
    });
    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });
    return message;
  }

  async setStatus(
    id: string,
    status: ConversationStatus,
    extras?: { aiEnabled?: boolean; resolvedByAi?: boolean; converted?: boolean },
  ) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        status,
        aiEnabled: extras?.aiEnabled,
        resolvedByAi: extras?.resolvedByAi,
        converted: extras?.converted,
        closedAt: status === 'closed' ? new Date() : undefined,
      },
    });
  }

  async agentReply(conversationId: string, agentId: string, content: string) {
    const conversation = await this.get(conversationId);
    const message = await this.addMessage({
      conversationId,
      role: 'agent',
      content,
      channel: 'admin',
      agentId,
    });

    // Pause AI so the bot does not also answer while you chat from the panel
    await this.pauseAiForAgent(conversationId, conversation.aiEnabled, conversation.status);

    const delivery = await this.deliverOutbound(conversationId, content, conversation.channel);
    return { message, delivery };
  }

  private async pauseAiForAgent(
    conversationId: string,
    aiEnabled: boolean,
    status: string,
  ) {
    if (aiEnabled || status !== 'handoff') {
      await this.setStatus(conversationId, 'handoff', { aiEnabled: false });
    }
    const openManual = await this.prisma.handoffTicket.findFirst({
      where: {
        conversationId,
        status: { in: ['open', 'assigned'] },
        reason: { startsWith: 'manual:' },
      },
    });
    if (!openManual) {
      await this.prisma.handoffTicket.create({
        data: {
          conversationId,
          reason: 'manual:admin-panel',
          status: 'open',
        },
      });
    }
  }

  private async deliverOutbound(
    conversationId: string,
    content: string,
    _channel: string,
  ): Promise<{ delivered: boolean; channel?: string; error?: string }> {
    try {
      const conversation = await this.get(conversationId);
      const hasTelegram = conversation.customer.channels.some((c) => c.channel === 'telegram');
      if (hasTelegram) {
        const { TelegramService } = await import('../channels/telegram.service');
        const telegram = this.moduleRef.get(TelegramService, { strict: false }) as
          | TelegramDeliverer
          | undefined;
        if (!telegram?.deliverToCustomer) {
          return { delivered: false, error: 'سرویس تلگرام در دسترس نیست' };
        }
        return telegram.deliverToCustomer(conversationId, content);
      }
      if (conversation.channel === 'web') {
        return { delivered: true, channel: 'web' };
      }
      return { delivered: false, error: 'کانال خروجی برای این مکالمه پیدا نشد' };
    } catch (err) {
      this.logger.warn(`Outbound delivery failed: ${(err as Error).message}`);
      return { delivered: false, error: (err as Error).message };
    }
  }

  async cancelManualHandoffs(conversationId: string) {
    await this.prisma.handoffTicket.updateMany({
      where: {
        conversationId,
        status: { in: ['open', 'assigned'] },
        reason: { startsWith: 'manual:' },
      },
      data: { status: 'cancelled' },
    });
  }

  async hasAssignedHandoff(conversationId: string): Promise<boolean> {
    const ticket = await this.prisma.handoffTicket.findFirst({
      where: {
        conversationId,
        status: 'assigned',
      },
    });
    return Boolean(ticket);
  }

  /** True when the latest open handoff was started manually by the freelancer. */
  async isManualHandoff(conversationId: string): Promise<boolean> {
    const ticket = await this.prisma.handoffTicket.findFirst({
      where: {
        conversationId,
        status: { in: ['open', 'assigned'] },
        reason: { startsWith: 'manual:' },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Boolean(ticket);
  }

  async findActiveByTelegramExternalId(externalId: string) {
    const channel = await this.prisma.customerChannel.findUnique({
      where: {
        channel_externalId: { channel: 'telegram', externalId },
      },
    });
    if (!channel) return null;
    return this.prisma.conversation.findFirst({
      where: {
        customerId: channel.customerId,
        channel: 'telegram',
        status: { in: ['active', 'handoff'] },
      },
      include: {
        customer: true,
        messages: {
          where: { role: { in: ['user', 'assistant', 'agent'] } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getHandoffAlertPayload(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: { include: { channels: true } },
        messages: {
          where: { role: { in: ['user', 'assistant', 'agent'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        leads: { orderBy: { updatedAt: 'desc' }, take: 1 },
        callbacks: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return conversation;
  }
}

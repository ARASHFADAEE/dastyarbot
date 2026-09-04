import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebChatService {
  constructor(private readonly prisma: PrismaService) {}

  async historyBySession(sessionId: string) {
    const channel = await this.prisma.customerChannel.findUnique({
      where: {
        channel_externalId: { channel: 'web', externalId: sessionId },
      },
    });
    if (!channel) return { messages: [] as const };

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        customerId: channel.customerId,
        channel: 'web',
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          where: { role: { in: ['user', 'assistant', 'agent'] } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conversation) return { messages: [] as const };

    return {
      conversationId: conversation.id,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CallbackStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

@Injectable()
export class CallbacksService {
  constructor(private readonly prisma: PrismaService) {}

  list(status?: CallbackStatus) {
    return this.prisma.callbackRequest.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, conversation: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  create(input: {
    customerId: string;
    conversationId?: string;
    phone: string;
    preferredTime?: string;
    notes?: string;
  }) {
    return this.prisma.callbackRequest.create({
      data: {
        customerId: input.customerId,
        conversationId: input.conversationId,
        phone: input.phone,
        preferredTime: input.preferredTime,
        notes: input.notes,
      },
    });
  }

  updateStatus(id: string, status: CallbackStatus) {
    return this.prisma.callbackRequest.update({ where: { id }, data: { status } });
  }
}

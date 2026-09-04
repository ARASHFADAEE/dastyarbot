import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        channels: true,
        conversations: { include: { messages: true } },
        leads: true,
        callbacks: true,
      },
    });
    if (!customer) throw new NotFoundException('مشتری یافت نشد');
    return customer;
  }

  async deleteCustomer(customerId: string) {
    await this.exportCustomer(customerId);
    await this.prisma.customer.delete({ where: { id: customerId } });
    return { ok: true };
  }

  async deleteConversation(conversationId: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException('مکالمه یافت نشد');
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { ok: true };
  }
}

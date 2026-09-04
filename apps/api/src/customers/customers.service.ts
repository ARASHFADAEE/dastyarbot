import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Channel = 'telegram' | 'web' | 'admin';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      include: {
        channels: true,
        leads: { orderBy: { updatedAt: 'desc' }, take: 3 },
        _count: { select: { conversations: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async get(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        channels: true,
        conversations: { orderBy: { lastMessageAt: 'desc' }, take: 20 },
        leads: true,
        callbacks: true,
      },
    });
    if (!customer) throw new NotFoundException('مشتری یافت نشد');
    return customer;
  }

  async findOrCreateByChannel(
    channel: Channel,
    externalId: string,
    data?: { name?: string; phone?: string },
  ) {
    const existing = await this.prisma.customerChannel.findUnique({
      where: { channel_externalId: { channel, externalId } },
      include: { customer: true },
    });
    if (existing) {
      if (data?.name || data?.phone) {
        return this.prisma.customer.update({
          where: { id: existing.customerId },
          data: {
            name: data.name || undefined,
            phone: data.phone || undefined,
          },
        });
      }
      return existing.customer;
    }

    return this.prisma.customer.create({
      data: {
        name: data?.name,
        phone: data?.phone,
        channels: {
          create: { channel, externalId },
        },
      },
    });
  }

  async update(id: string, data: { name?: string; phone?: string; email?: string; notes?: string }) {
    await this.get(id);
    return this.prisma.customer.update({ where: { id }, data });
  }
}

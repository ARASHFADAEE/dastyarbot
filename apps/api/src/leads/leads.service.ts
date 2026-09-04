import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'hot' | 'won' | 'lost';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  list(status?: LeadStatus) {
    return this.prisma.lead.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, conversation: true },
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    });
  }

  async createOrUpdate(input: {
    customerId: string;
    conversationId?: string;
    intent?: string;
    summary?: string;
    productInterest?: string;
    score?: number;
    status?: LeadStatus;
  }) {
    const existing = await this.prisma.lead.findFirst({
      where: {
        customerId: input.customerId,
        status: { in: ['new', 'contacted', 'qualified', 'hot'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const score = Math.max(0, Math.min(100, input.score ?? existing?.score ?? 40));
    const status =
      input.status ||
      (score >= 80 ? 'hot' : score >= 60 ? 'qualified' : (existing?.status as LeadStatus) || 'new');

    if (existing) {
      return this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          conversationId: input.conversationId || existing.conversationId,
          intent: input.intent || existing.intent,
          summary: input.summary || existing.summary,
          productInterest: input.productInterest || existing.productInterest,
          score,
          status,
        },
      });
    }

    return this.prisma.lead.create({
      data: {
        customerId: input.customerId,
        conversationId: input.conversationId,
        intent: input.intent,
        summary: input.summary,
        productInterest: input.productInterest,
        score,
        status,
      },
    });
  }

  scoreFromSignals(signals: {
    purchaseIntent?: boolean;
    askedPrice?: boolean;
    askedDiscount?: boolean;
    comparedProducts?: boolean;
    requestedCallback?: boolean;
    sharedPhone?: boolean;
  }) {
    let score = 20;
    if (signals.askedPrice) score += 15;
    if (signals.comparedProducts) score += 10;
    if (signals.askedDiscount) score += 10;
    if (signals.purchaseIntent) score += 25;
    if (signals.requestedCallback) score += 20;
    if (signals.sharedPhone) score += 15;
    return Math.min(100, score);
  }

  updateStatus(id: string, status: LeadStatus) {
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }
}

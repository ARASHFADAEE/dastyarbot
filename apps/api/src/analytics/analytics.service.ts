import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AnalyticsSummary } from '@bot/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<
    AnalyticsSummary & {
      series: { date: string; conversations: number; leads: number; costUsd: number }[];
    }
  > {
    const [
      conversations,
      customers,
      leads,
      hotLeads,
      callbackRequests,
      handoffs,
      closed,
      converted,
      usage,
      messages,
      resolvedByAi,
      avgLengthAgg,
    ] = await Promise.all([
      this.prisma.conversation.count(),
      this.prisma.customer.count(),
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: 'hot' } }),
      this.prisma.callbackRequest.count(),
      this.prisma.handoffTicket.count(),
      this.prisma.conversation.count({ where: { status: 'closed' } }),
      this.prisma.conversation.count({ where: { converted: true } }),
      this.prisma.aiUsageLog.aggregate({ _sum: { costUsd: true } }),
      this.prisma.message.findMany({
        where: { role: 'assistant', responseTimeMs: { not: null } },
        select: { responseTimeMs: true },
        take: 1000,
      }),
      this.prisma.conversation.count({ where: { resolvedByAi: true } }),
      this.prisma.conversation.aggregate({ _avg: { messageCount: true } }),
    ]);

    const avgResponse =
      messages.length > 0
        ? messages.reduce((s, m) => s + (m.responseTimeMs || 0), 0) / messages.length
        : 0;

    const series: { date: string; conversations: number; leads: number; costUsd: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const [cCount, lCount, costAgg] = await Promise.all([
        this.prisma.conversation.count({
          where: { startedAt: { gte: day, lt: next } },
        }),
        this.prisma.lead.count({
          where: { createdAt: { gte: day, lt: next } },
        }),
        this.prisma.aiUsageLog.aggregate({
          where: { createdAt: { gte: day, lt: next } },
          _sum: { costUsd: true },
        }),
      ]);
      series.push({
        date,
        conversations: cCount,
        leads: lCount,
        costUsd: costAgg._sum.costUsd || 0,
      });
    }

    return {
      conversations,
      customers,
      leads,
      hotLeads,
      callbackRequests,
      aiResolutionRate: closed ? resolvedByAi / closed : 0,
      humanHandoffRate: conversations ? handoffs / conversations : 0,
      conversionRate: conversations ? converted / conversations : 0,
      averageResponseTimeMs: avgResponse,
      averageConversationLength: avgLengthAgg._avg.messageCount || 0,
      aiCostUsd: usage._sum.costUsd || 0,
      series,
    };
  }
}

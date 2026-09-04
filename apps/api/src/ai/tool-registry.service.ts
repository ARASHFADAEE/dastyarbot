import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ProductsService } from '../products/products.service';
import { LeadsService } from '../leads/leads.service';
import { CallbacksService } from '../callbacks/callbacks.service';
import { HandoffService } from '../handoff/handoff.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';

export type ToolContext = {
  customerId: string;
  conversationId: string;
};

type TelegramNotifier = {
  notifyAdmin: (text: string) => Promise<void>;
};

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly lastSummaryAt = new Map<string, number>();

  constructor(
    private readonly products: ProductsService,
    private readonly leads: LeadsService,
    private readonly callbacks: CallbacksService,
    private readonly handoff: HandoffService,
    private readonly knowledge: KnowledgeService,
    private readonly notifications: NotificationsService,
    private readonly customers: CustomersService,
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    this.logger.debug(`Tool ${name} ${JSON.stringify(args)}`);

    const normalized =
      name === 'search_products'
        ? 'search_services'
        : name === 'get_product_price'
          ? 'get_service_price'
          : name === 'compare_products'
            ? 'compare_services'
            : name;

    switch (normalized) {
      case 'search_services': {
        const query = String(args.query || '');
        const limit = Number(args.limit || 5);
        const items = await this.products.search(query, limit);
        return {
          found: items.length,
          hint: 'Reply like a real Telegram chat: 2-4 short lines, light emoji, one question. No long bullet lists.',
          services: items.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            description: p.description,
            startingPrice: p.prices[0] ? Number(p.prices[0].amount) : null,
            startingPriceLabel: p.prices[0]
              ? `از ${new Intl.NumberFormat('fa-IR').format(Number(p.prices[0].amount))} تومن شروع می‌شه`
              : null,
            currency: 'تومان',
          })),
        };
      }
      case 'get_service_price': {
        const key = String(args.serviceIdOrSku || args.productIdOrSku || '');
        const result = await this.products.getPrice(key);
        if (!result) return { found: false, message: 'خدمت در کاتالوگ یافت نشد' };
        const amount = result.price ? Number(result.price.amount) : null;
        return {
          found: true,
          service: result.product,
          price: result.price,
          startingPriceLabel:
            amount != null
              ? `از ${new Intl.NumberFormat('fa-IR').format(amount)} تومن شروع می‌شه`
              : null,
          note: 'جواب کوتاه و خودمونی با ایموجی؛ بعدش send_chat_summary بزن.',
        };
      }
      case 'compare_services': {
        const ids =
          (args.serviceIdsOrSkus as string[]) ||
          (args.productIdsOrSkus as string[]) ||
          [];
        const compared = [];
        for (const id of ids) {
          const result = await this.products.getPrice(id);
          compared.push(result || { found: false, serviceIdOrSku: id });
        }
        return { compared };
      }
      case 'create_lead': {
        const lead = await this.leads.createOrUpdate({
          customerId: ctx.customerId,
          conversationId: ctx.conversationId,
          intent: String(args.intent || ''),
          summary: String(args.summary || ''),
          productInterest: args.productInterest ? String(args.productInterest) : undefined,
          score: args.score != null ? Number(args.score) : undefined,
        });
        await this.notifications.notifyAdmins({
          title: 'لید جدید/به‌روز شد',
          body: `${lead.intent || 'intent'} — امتیاز ${lead.score}`,
          type: 'lead',
          payload: { leadId: lead.id, conversationId: ctx.conversationId },
        });
        await this.pushChatSummary(ctx, {
          need: String(args.intent || args.productInterest || 'لید جدید'),
          serviceSku: args.productInterest ? String(args.productInterest) : undefined,
          readiness: Number(lead.score) >= 70 ? 'interested' : 'just_asking',
          readinessLabel: Number(lead.score) >= 70 ? 'علاقه‌مند' : 'در حال پرس‌وجو',
          summary: String(args.summary || ''),
        });
        return { ok: true, lead };
      }
      case 'score_lead': {
        const score = this.leads.scoreFromSignals({
          purchaseIntent: Boolean(args.purchaseIntent),
          askedPrice: Boolean(args.askedPrice),
          askedDiscount: Boolean(args.askedDiscount),
          comparedProducts: Boolean(args.comparedProducts),
          requestedCallback: Boolean(args.requestedCallback),
          sharedPhone: Boolean(args.sharedPhone),
        });
        const lead = await this.leads.createOrUpdate({
          customerId: ctx.customerId,
          conversationId: ctx.conversationId,
          score,
          intent: 'scored',
          summary: 'امتیازدهی خودکار بر اساس سیگنال‌های مکالمه',
        });
        return { score, leadId: lead.id, status: lead.status };
      }
      case 'request_callback': {
        const phone = String(args.phone || '');
        await this.customers.update(ctx.customerId, { phone });
        const cb = await this.callbacks.create({
          customerId: ctx.customerId,
          conversationId: ctx.conversationId,
          phone,
          preferredTime: args.preferredTime ? String(args.preferredTime) : undefined,
          notes: args.notes ? String(args.notes) : undefined,
        });
        await this.leads.createOrUpdate({
          customerId: ctx.customerId,
          conversationId: ctx.conversationId,
          intent: 'callback',
          summary: 'درخواست تماس',
          score: 75,
        });
        await this.notifications.notifyAdmins({
          title: 'درخواست تماس',
          body: `شماره: ${phone}`,
          type: 'callback',
          payload: { callbackId: cb.id, conversationId: ctx.conversationId },
        });
        await this.pushChatSummary(ctx, {
          need: 'درخواست تماس تلفنی',
          readiness: 'ready',
          readinessLabel: 'آماده تماس',
          summary: String(args.notes || 'مشتری خواست تماس بگیرید'),
          budgetHint: phone ? `📞 ${phone}` : undefined,
        });
        return { ok: true, callback: cb };
      }
      case 'request_human_handoff': {
        const ticket = await this.handoff.request(
          ctx.conversationId,
          args.reason ? String(args.reason) : undefined,
        );
        return { ok: true, ticket };
      }
      case 'send_chat_summary': {
        await this.pushChatSummary(ctx, {
          need: String(args.need || ''),
          serviceSku: args.serviceSku ? String(args.serviceSku) : undefined,
          readiness: String(args.readiness || 'just_asking'),
          readinessLabel: String(args.readinessLabel || 'نامشخص'),
          summary: String(args.summary || ''),
          budgetHint: args.budgetHint ? String(args.budgetHint) : undefined,
        });
        return { ok: true };
      }
      case 'search_knowledge': {
        const hits = await this.knowledge.search(String(args.query || ''));
        return { hits };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async pushChatSummary(
    ctx: ToolContext,
    data: {
      need: string;
      serviceSku?: string;
      readiness: string;
      readinessLabel: string;
      summary: string;
      budgetHint?: string;
    },
  ) {
    const now = Date.now();
    const prev = this.lastSummaryAt.get(ctx.conversationId) || 0;
    if (now - prev < 90_000) {
      return;
    }
    this.lastSummaryAt.set(ctx.conversationId, now);

    const customer = await this.prisma.customer.findUnique({
      where: { id: ctx.customerId },
      include: { channels: true },
    });
    const tg = customer?.channels.find((c) => c.channel === 'telegram');
    const readinessEmoji =
      data.readiness === 'ready'
        ? '🟢'
        : data.readiness === 'interested'
          ? '🟡'
          : data.readiness === 'not_ready'
            ? '🔴'
            : '⚪';

    const text = [
      '📋 جمع‌بندی گفتگو',
      '',
      `👤 ${customer?.name || 'بدون نام'}`,
      customer?.phone ? `📞 ${customer.phone}` : '',
      tg ? `🆔 تلگرام: ${tg.externalId}` : '',
      '',
      `🎯 نیاز: ${data.need}`,
      data.serviceSku ? `📦 خدمت: ${data.serviceSku}` : '',
      `${readinessEmoji} آمادگی پروژه: ${data.readinessLabel}`,
      data.budgetHint ? `💰 ${data.budgetHint}` : '',
      '',
      'خلاصه:',
      data.summary || '—',
    ]
      .filter(Boolean)
      .join('\n');

    await this.notifications.notifyAdmins({
      title: 'جمع‌بندی گفتگو',
      body: `${data.need} — ${data.readinessLabel}`,
      type: 'chat_summary',
      payload: { conversationId: ctx.conversationId, ...data },
    });

    try {
      const { TelegramService } = await import('../channels/telegram.service');
      const telegram = this.moduleRef.get(TelegramService, { strict: false }) as
        | TelegramNotifier
        | undefined;
      if (telegram?.notifyAdmin) {
        await telegram.notifyAdmin(text);
      }
    } catch (err) {
      this.logger.warn(`Admin summary telegram skip: ${(err as Error).message}`);
    }
  }
}

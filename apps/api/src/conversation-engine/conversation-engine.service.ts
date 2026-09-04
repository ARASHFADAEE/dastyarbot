import { Injectable, Logger } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ConversationsService, Channel } from '../conversations/conversations.service';
import { AvalAiService } from '../ai/avalai.service';
import { ToolRegistryService } from '../ai/tool-registry.service';
import { IntentEngineService } from './intent-engine.service';

export type InboundMessage = {
  channel: Channel;
  externalUserId: string;
  text?: string;
  audioBuffer?: Buffer;
  audioFilename?: string;
  audioMimeType?: string;
  customerName?: string;
  customerPhone?: string;
};

@Injectable()
export class ConversationEngineService {
  private readonly logger = new Logger(ConversationEngineService.name);

  constructor(
    private readonly customers: CustomersService,
    private readonly conversations: ConversationsService,
    private readonly avalai: AvalAiService,
    private readonly tools: ToolRegistryService,
    private readonly intent: IntentEngineService,
  ) {}

  async handleInbound(input: InboundMessage) {
    const started = Date.now();
    const customer = await this.customers.findOrCreateByChannel(
      input.channel,
      input.externalUserId,
      { name: input.customerName, phone: input.customerPhone },
    );
    const conversation = await this.conversations.findOrCreateActive(customer.id, input.channel);

    let userText = (input.text || '').trim();
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (!userText && input.audioBuffer) {
      try {
        userText = await this.avalai.transcribe(
          input.audioBuffer,
          input.audioFilename || 'voice.ogg',
          input.audioMimeType || 'audio/ogg',
        );
        this.logger.log(`STT result: ${userText.slice(0, 120)}`);
        mediaType = input.audioMimeType || 'audio/ogg';
        if (userText) {
          userText = `[پیام صوتی]\n${userText}`;
        }
      } catch (err) {
        this.logger.warn(`STT failed: ${(err as Error).message}`);
        userText = '';
        await this.conversations.addMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: 'متأسفانه نتوانستم پیام صوتی را پردازش کنم. لطفاً متنی پیام دهید.',
          channel: input.channel,
        });
        return {
          conversationId: conversation.id,
          customerId: customer.id,
          reply: 'متأسفانه نتوانستم پیام صوتی را پردازش کنم. لطفاً متنی پیام دهید.',
          handoff: false,
        };
      }
    }

    if (!userText) {
      return {
        conversationId: conversation.id,
        customerId: customer.id,
        reply: 'پیامی دریافت نشد.',
        handoff: false,
      };
    }

    await this.conversations.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: userText,
      channel: input.channel,
      mediaUrl,
      mediaType,
    });

    if (!conversation.aiEnabled || conversation.status === 'handoff') {
      const manual = await this.conversations.isManualHandoff(conversation.id);
      if (manual) {
        // Freelancer is handling this chat — stay silent in customer thread.
        return {
          conversationId: conversation.id,
          customerId: customer.id,
          reply: '',
          handoff: true,
          silent: true,
          paused: true,
        };
      }
      const assigned = await this.conversations.hasAssignedHandoff(conversation.id);
      if (!assigned) {
        await this.conversations.setStatus(conversation.id, 'active', { aiEnabled: true });
        conversation.aiEnabled = true;
        conversation.status = 'active';
        this.logger.log(`Soft-resumed AI for conversation ${conversation.id}`);
      } else {
        return {
          conversationId: conversation.id,
          customerId: customer.id,
          reply: '',
          handoff: true,
          silent: true,
        };
      }
    }

    const signals = this.intent.detect(userText);
    const history = await this.conversations.get(conversation.id);
    const messages = history.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'agent')
      .slice(-20)
      .map((m) => ({
        role: (m.role === 'agent' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }));

    let ai = await this.avalai.respond({
      messages,
      conversationId: conversation.id,
    });

    let handoffTriggered = false;
    let maxToolRounds = 3;
    const toolSnapshots: unknown[] = [];

    while (ai.toolCalls.length && maxToolRounds > 0) {
      maxToolRounds -= 1;
      const outputs: Array<{ callId: string; name: string; output: string }> = [];
      for (const call of ai.toolCalls) {
        if (call.name === 'request_human_handoff') handoffTriggered = true;
        const result = await this.tools.execute(call.name, call.arguments, {
          customerId: customer.id,
          conversationId: conversation.id,
        });
        toolSnapshots.push({ name: call.name, result });
        await this.conversations.addMessage({
          conversationId: conversation.id,
          role: 'tool',
          content: JSON.stringify(result),
          channel: input.channel,
          toolName: call.name,
          toolPayload: { args: call.arguments, result },
        });
        outputs.push({
          callId: call.callId,
          name: call.name,
          output: JSON.stringify(result),
        });
      }

      if (handoffTriggered) {
        ai = {
          ...ai,
          text:
            this.isWeakReply(ai.text)
              ? 'حتماً؛ گفتگو رو به آرش منتقل کردم. به‌زودی مستقیم جوابتون رو می‌ده.'
              : ai.text,
          toolCalls: [],
        };
        break;
      }

      ai = await this.avalai.respondWithToolOutputs({
        messages,
        conversationId: conversation.id,
        toolOutputs: outputs,
        priorRaw: ai.raw,
      });
    }

    if (signals.purchaseIntent || signals.askedPrice || signals.askedDiscount) {
      await this.tools.execute(
        'score_lead',
        {
          purchaseIntent: signals.purchaseIntent,
          askedPrice: signals.askedPrice,
          askedDiscount: signals.askedDiscount,
          comparedProducts: signals.comparedProducts,
          requestedCallback: signals.requestedCallback,
          sharedPhone: Boolean(input.customerPhone || customer.phone),
        },
        { customerId: customer.id, conversationId: conversation.id },
      );
    }

    // Always push a brief to admin when price/project intent is clear (even if AI forgot the tool)
    if (signals.askedPrice || signals.purchaseIntent) {
      const skuHint = this.guessSkuFromTools(toolSnapshots);
      await this.tools.execute(
        'send_chat_summary',
        {
          need: userText.slice(0, 160),
          serviceSku: skuHint || '',
          readiness: signals.purchaseIntent ? 'interested' : 'just_asking',
          readinessLabel: signals.purchaseIntent ? 'علاقه‌مند به پروژه' : 'در حال پرس‌وجوی قیمت',
          summary: `پیام مشتری: ${userText.slice(0, 280)}`,
          budgetHint: skuHint ? `برآورد اولیه برای ${skuHint}` : '',
        },
        { customerId: customer.id, conversationId: conversation.id },
      );
    }

    let reply = ai.text;
    const skipReply = this.isNoReply(reply);

    if (skipReply) {
      await this.conversations.addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: '[NO_REPLY]',
        channel: input.channel,
        tokensIn: ai.tokensIn,
        tokensOut: ai.tokensOut,
        avalaiRequestId: ai.avalaiRequestId,
        responseTimeMs: Date.now() - started,
      });
      return {
        conversationId: conversation.id,
        customerId: customer.id,
        reply: '',
        handoff: handoffTriggered,
        avalaiRequestId: ai.avalaiRequestId,
        silent: true,
      };
    }

    if (this.isWeakReply(reply)) {
      reply = this.synthesizeFromTools(toolSnapshots, userText) ||
        (handoffTriggered
          ? 'حتماً؛ گفتگو رو به آرش منتقل کردم. به‌زودی جواب می‌ده.'
          : 'متوجه شدم. برای برآورد دقیق‌تر بگید دقیقاً چه خدمتی مدنظرتونه؟');
    }

    await this.conversations.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: reply,
      channel: input.channel,
      tokensIn: ai.tokensIn,
      tokensOut: ai.tokensOut,
      avalaiRequestId: ai.avalaiRequestId,
      responseTimeMs: Date.now() - started,
    });

    return {
      conversationId: conversation.id,
      customerId: customer.id,
      reply,
      handoff: handoffTriggered,
      avalaiRequestId: ai.avalaiRequestId,
      silent: false,
    };
  }

  private isNoReply(text?: string): boolean {
    const t = (text || '').trim();
    if (!t) return false;
    return (
      /^\[?\s*NO_REPLY\s*\]?$/i.test(t) ||
      /^NO_REPLY$/i.test(t) ||
      t === '__NO_REPLY__'
    );
  }

  private isWeakReply(text?: string): boolean {
    const t = (text || '').trim();
    if (!t) return true;
    if (this.isNoReply(t)) return false;
    if (t === 'انجام شد' || t === 'انجام شد.') return true;
    if (t.length < 8) return true;
    return false;
  }

  /** Build a readable Telegram reply from tool JSON when the model returns empty text. */
  private synthesizeFromTools(snapshots: unknown[], userText: string): string | null {
    for (const snap of snapshots) {
      const s = snap as {
        name?: string;
        result?: {
          found?: boolean | number;
          startingPriceLabel?: string;
          service?: { name?: string };
          services?: Array<{ name?: string; startingPriceLabel?: string }>;
          price?: { amount?: number };
        };
      };
      if (s.name === 'get_service_price' && s.result?.found && s.result.service) {
        const amount = s.result.price?.amount;
        const label =
          s.result.startingPriceLabel ||
          (amount != null
            ? `از ${new Intl.NumberFormat('fa-IR').format(Number(amount))} تومن شروع می‌شه`
            : 'قیمت پایه تو کاتالوگه');
        const name = s.result.service.name || 'این کار';
        return `${name} ${label} ✨\n\nبستگی به جزئیات پروژه داره.\nتقریباً چه امکاناتی مدنظرتونه؟`;
      }
      if (s.name === 'search_services' && Array.isArray(s.result?.services) && s.result!.services!.length) {
        const top = s.result!.services![0];
        return `${top.name}${top.startingPriceLabel ? ` — ${top.startingPriceLabel}` : ''} 👍\n\nهمین مدنظرتونه؟`;
      }
    }
    void userText;
    return null;
  }

  private guessSkuFromTools(snapshots: unknown[]): string | null {
    for (const snap of snapshots) {
      const s = snap as {
        name?: string;
        result?: {
          service?: { sku?: string };
          services?: Array<{ sku?: string }>;
        };
      };
      if (s.result?.service?.sku) return s.result.service.sku;
      if (s.result?.services?.[0]?.sku) return s.result.services[0].sku;
    }
    return null;
  }
}
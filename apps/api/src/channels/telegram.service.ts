import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { ConversationEngineService } from '../conversation-engine/conversation-engine.service';
import { ConversationsService } from '../conversations/conversations.service';
import { HandoffService } from '../handoff/handoff.service';
import { PrismaService } from '../prisma/prisma.service';
import { formatTelegramHtml } from '../ai/telegram-format';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Update } from 'telegraf/typings/core/types/typegram';

type BusinessConnection = {
  id: string;
  userId: number;
  userChatId?: number;
  isEnabled: boolean;
};

type IncomingPayload = {
  chatId: number;
  fromId: number;
  fromName?: string;
  text?: string;
  voiceFileId?: string;
  businessConnectionId?: string;
};

const TAKE_CODES = /^(?:\/من|#من|!من|\/take|#take|!take)$/i;
const AI_CODES = /^(?:\/ربات|#ربات|!ربات|\/ai|#ai|!ai)$/i;
const HELP_CODES = /^(?:\/کدها|#کدها|\/codes|#codes)$/i;

/**
 * Handles direct bot chats + Telegram Business secretary mode,
 * admin shortcodes (#من / #ربات), and admin Telegram alerts.
 */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private readonly businessByChat = new Map<number, string>();
  private readonly connectionsPath = join(process.cwd(), 'data', 'telegram-business.json');

  constructor(
    private readonly config: ConfigService,
    private readonly engine: ConversationEngineService,
    private readonly conversations: ConversationsService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => HandoffService))
    private readonly handoff: HandoffService,
  ) {}

  private get isWebhookMode(): boolean {
    return (
      Boolean(process.env.VERCEL) ||
      (this.config.get<string>('TELEGRAM_MODE') || '').toLowerCase() === 'webhook'
    );
  }

  /** Public entry for Vercel / webhook controller. */
  async handleUpdate(update: unknown) {
    if (!this.bot) {
      this.logger.warn('Telegram bot not ready — dropping update');
      return;
    }
    await this.bot.handleUpdate(update as Update);
  }

  async onModuleInit() {
    const token = (this.config.get<string>('TELEGRAM_BOT_TOKEN') || '').trim();
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram disabled');
      return;
    }

    await this.loadBusinessMap();
    this.logger.log(
      `Starting Telegram bot (${this.isWebhookMode ? 'webhook' : 'long polling'} + Business Mode)...`,
    );
    this.bot = new Telegraf(token);

    this.bot.start(async (ctx) => {
      if ((ctx.update as { business_message?: unknown }).business_message) return;
      const fromId = ctx.from?.id;
      if (fromId && this.isAdmin(fromId)) {
        await ctx.reply(this.adminHelpText());
        return;
      }
      await ctx.reply(
        [
          'سلام 👋',
          'منشی پروژه‌های وردپرس، لاراول و اتوماسیون هستم.',
          '',
          'می‌تونید بپرسید:',
          '• هزینه طراحی سایت',
          '• فروشگاه ووکامرس',
          '• پروژه لاراول / ربات',
          '',
          'همین حالا بگید روی چه کاری تمرکز دارید؟',
        ].join('\n'),
      );
    });

    this.bot.on('text', async (ctx) => {
      try {
        if (this.isBusinessUpdate(ctx)) return;
        const payload = this.fromPrivateMessage(ctx);
        if (!payload) return;
        if (await this.tryAdminShortcode(payload)) return;
        await this.handleInbound(payload);
      } catch (err) {
        this.logger.error(`text handler failed: ${(err as Error).message}`);
      }
    });
    this.bot.on('voice', async (ctx) => {
      try {
        if (this.isBusinessUpdate(ctx)) return;
        await this.handleInbound(this.fromPrivateVoice(ctx));
      } catch (err) {
        this.logger.error(`voice handler failed: ${(err as Error).message}`);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.bot.on('business_connection' as any, async (ctx: Context) => {
      const bc = (ctx.update as {
        business_connection?: BusinessConnection & {
          user: { id: number };
          user_chat_id?: number;
          is_enabled: boolean;
        };
      }).business_connection;
      if (!bc?.id) return;
      this.logger.log(
        `Business connection ${bc.is_enabled ? 'enabled' : 'disabled'}: ${bc.id} (user ${bc.user?.id})`,
      );
      if (bc.is_enabled) {
        if (bc.user_chat_id) this.businessByChat.set(bc.user_chat_id, bc.id);
        this.businessByChat.set(bc.user.id, bc.id);
      } else {
        for (const [chatId, connId] of this.businessByChat.entries()) {
          if (connId === bc.id) this.businessByChat.delete(chatId);
        }
      }
      void this.saveBusinessMap();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.bot.on('business_message' as any, async (ctx: Context) => {
      try {
        const msg = (ctx.update as {
          business_message?: {
            business_connection_id?: string;
            chat: { id: number };
            from?: { id: number; first_name?: string; last_name?: string };
            text?: string;
            caption?: string;
            voice?: { file_id: string };
            audio?: { file_id: string };
            video_note?: { file_id: string };
          };
        }).business_message;
        if (!msg) return;

        const connectionId = msg.business_connection_id;
        if (connectionId) {
          this.businessByChat.set(msg.chat.id, connectionId);
          void this.saveBusinessMap();
        }

        const voiceFileId =
          msg.voice?.file_id || msg.audio?.file_id || msg.video_note?.file_id;

        const payload: IncomingPayload = {
          chatId: msg.chat.id,
          fromId: msg.from?.id || msg.chat.id,
          fromName: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || undefined,
          text: msg.text || msg.caption,
          voiceFileId,
          businessConnectionId: connectionId || this.businessByChat.get(msg.chat.id),
        };

        this.logger.log(
          `Business message from ${payload.fromId} text=${Boolean(payload.text)} voice=${Boolean(voiceFileId)}`,
        );

        if (await this.tryAdminShortcode(payload)) return;
        await this.handleInbound(payload);
      } catch (err) {
        this.logger.error(`business_message handler failed: ${(err as Error).stack || (err as Error).message}`);
      }
    });

    try {
      const me = await this.bot.telegram.getMe();
      this.logger.log(`Telegram identity ok: @${me.username}`);

      const allowedUpdates = [
        'message',
        'edited_message',
        'callback_query',
        'business_connection',
        'business_message',
        'edited_business_message',
      ] as const;

      if (this.isWebhookMode) {
        const base =
          (this.config.get<string>('API_PUBLIC_URL') || '').replace(/\/$/, '') ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
        if (!base) {
          this.logger.error('API_PUBLIC_URL / VERCEL_URL missing — cannot set webhook');
          return;
        }
        const webhookUrl = `${base}/api/telegram/webhook`;
        const secret = (this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') || '').trim();
        await this.bot.telegram.setWebhook(webhookUrl, {
          secret_token: secret || undefined,
          allowed_updates: [...allowedUpdates] as never,
          drop_pending_updates: true,
        });
        this.logger.log(`Telegram webhook set: ${webhookUrl}`);
        return;
      }

      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch(() => undefined);
      void this.bot
        .launch(
          {
            dropPendingUpdates: true,
            allowedUpdates: [...allowedUpdates] as never,
          },
          () => {
            this.logger.log(
              'Telegram polling started (direct bot + Business secretary mode)',
            );
          },
        )
        .catch((err: Error) => {
          this.logger.error(`Telegram polling error: ${err.message}`);
        });
      this.logger.log('Telegram launch requested');
    } catch (err) {
      this.logger.error(`Telegram launch failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.bot && !this.isWebhookMode) this.bot.stop('shutdown');
  }

  /**
   * Admin shortcodes inside a customer chat (Business) or while targeting that chat:
   * #من /من  → you take over (AI off)
   * #ربات /ربات → AI resumes
   */
  private async tryAdminShortcode(input: IncomingPayload): Promise<boolean> {
    const text = (input.text || '').trim();
    if (!text || !this.isAdmin(input.fromId)) return false;

    if (HELP_CODES.test(text)) {
      await this.notifyAdmin(this.adminHelpText());
      return true;
    }

    // In Business private chats, chatId is the customer's Telegram user id.
    const customerTelegramId = String(input.chatId);
    const conversation =
      await this.conversations.findActiveByTelegramExternalId(customerTelegramId);

    if (TAKE_CODES.test(text)) {
      if (!conversation) {
        await this.notifyAdmin('⚠️ گفتگوی فعالی برای این چت پیدا نشد.');
        return true;
      }
      await this.handoff.request(conversation.id, 'manual:takeover');
      await this.notifyAdmin(
        [
          '✅ کنترل دستی فعال شد (AI خاموش)',
          `مشتری: ${conversation.customer.name || 'بدون نام'}`,
          `تلگرام ID: ${customerTelegramId}`,
          conversation.customer.phone ? `📞 ${conversation.customer.phone}` : '',
          '',
          'حالا خودت در همان چت جواب بده.',
          'برای روشن کردن دوباره ربات بفرست: #ربات',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      // Do not echo shortcode ack into customer chat.
      return true;
    }

    if (AI_CODES.test(text)) {
      if (!conversation) {
        await this.notifyAdmin('⚠️ گفتگوی فعالی برای این چت پیدا نشد.');
        return true;
      }
      await this.conversations.setStatus(conversation.id, 'active', { aiEnabled: true });
      // Close open manual tickets
      await this.handoff.cancelOpenManual(conversation.id);
      await this.notifyAdmin(
        [
          '🤖 ربات دوباره فعال شد',
          `مشتری: ${conversation.customer.name || 'بدون نام'}`,
          `تلگرام ID: ${customerTelegramId}`,
        ].join('\n'),
      );
      return true;
    }

    return false;
  }

  private async handleInbound(input: IncomingPayload | null) {
    if (!input || !this.bot) return;

    let text = input.text?.trim();
    let audioBuffer: Buffer | undefined;

    // Owner messages that aren't shortcodes should not be processed by AI
    if (this.isAdmin(input.fromId) && text && !TAKE_CODES.test(text) && !AI_CODES.test(text)) {
      return;
    }

    if (!text && input.voiceFileId) {
      try {
        const link = await this.bot.telegram.getFileLink(input.voiceFileId);
        const res = await fetch(link.href);
        audioBuffer = Buffer.from(await res.arrayBuffer());
      } catch (err) {
        this.logger.warn(`Voice download failed: ${(err as Error).message}`);
        await this.sendReply(
          input.chatId,
          'متأسفانه پیام صوتی دریافت نشد. لطفاً متنی بفرستید.',
          input.businessConnectionId,
        );
        return;
      }
    }

    if (!text && !audioBuffer) return;

    if (!input.businessConnectionId) {
      try {
        await this.bot.telegram.sendChatAction(input.chatId, 'typing');
      } catch {
        // ignore
      }
    }

    const result = await this.engine.handleInbound({
      channel: 'telegram',
      externalUserId: String(input.fromId),
      text,
      audioBuffer,
      audioFilename: 'voice.ogg',
      audioMimeType: 'audio/ogg',
      customerName: input.fromName,
    });

    // Customer wrote while you manually control the chat → alert admin, no AI reply
    if (result.paused || result.silent) {
      if (result.paused && text) {
        await this.notifyAdmin(
          [
            '📩 پیام جدید مشتری (شما کنترل دستی دارید)',
            `از: ${input.fromName || input.fromId}`,
            `ID: ${input.fromId}`,
            '',
            text.slice(0, 500),
            '',
            'برای برگرداندن ربات در همان چت بفرستید: #ربات',
          ].join('\n'),
        );
      }
      return;
    }

    // HandoffService already pushes Telegram admin alert when the ticket is created.

    if (result.reply) {
      await this.sendReply(input.chatId, result.reply, input.businessConnectionId);
    }
  }

  /**
   * Deliver an agent reply from the admin panel to the Telegram customer.
   * Uses Business connection when available so the message appears from your profile.
   */
  async deliverToCustomer(
    conversationId: string,
    text: string,
  ): Promise<{ delivered: boolean; channel?: string; error?: string }> {
    if (!this.bot) {
      return { delivered: false, error: 'بات تلگرام فعال نیست' };
    }
    const conversation = await this.conversations.get(conversationId);
    const tg = conversation.customer.channels.find((c) => c.channel === 'telegram');
    if (!tg?.externalId) {
      return { delivered: false, error: 'این مکالمه کانال تلگرام ندارد' };
    }

    const chatId = Number(tg.externalId);
    if (!Number.isFinite(chatId)) {
      return { delivered: false, error: 'آیدی تلگرام نامعتبر است' };
    }

    const businessConnectionId = this.businessByChat.get(chatId);
    const ok = await this.sendReply(chatId, text, businessConnectionId);
    if (!ok) {
      return {
        delivered: false,
        channel: 'telegram',
        error: businessConnectionId
          ? 'ارسال با Business connection ناموفق بود'
          : 'ارسال تلگرام ناموفق بود (اگر چت Business است، یک پیام از مشتری بگیرید تا اتصال ثبت شود)',
      };
    }
    this.logger.log(
      `Admin reply delivered to ${chatId}${businessConnectionId ? ' (business)' : ''}`,
    );
    return { delivered: true, channel: 'telegram' };
  }

  /** Public: used by HandoffService when AI/tool requests human. */
  async sendHandoffAlert(conversationId: string, title = '🔔 انتقال گفتگو') {
    const data = await this.conversations.getHandoffAlertPayload(conversationId);
    if (!data) {
      await this.notifyAdmin(`${title}\nconversation: ${conversationId}`);
      return;
    }

    const tg = data.customer.channels.find((c) => c.channel === 'telegram');
    const lastMsgs = [...data.messages].reverse().map((m) => {
      const who = m.role === 'user' ? 'مشتری' : m.role === 'agent' ? 'شما' : 'ربات';
      return `• ${who}: ${m.content.slice(0, 120)}`;
    });

    const phone =
      data.customer.phone ||
      data.callbacks[0]?.phone ||
      'ثبت نشده';

    await this.notifyAdmin(
      [
        title,
        '',
        `👤 ${data.customer.name || 'بدون نام'}`,
        `📞 ${phone}`,
        tg ? `🆔 تلگرام: ${tg.externalId}` : '',
        data.leads[0] ? `🔥 لید: ${data.leads[0].status} (${data.leads[0].score})` : '',
        '',
        'آخرین پیام‌ها:',
        ...(lastMsgs.length ? lastMsgs : ['—']),
        '',
        '👉 لطفاً تماس بگیرید / در همان چت جواب دهید',
        'شورت‌کدها: #من = خودم | #ربات = خودکار',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  private async sendReply(
    chatId: number,
    text: string,
    businessConnectionId?: string,
  ): Promise<boolean> {
    if (!this.bot || !text) return false;
    const html = formatTelegramHtml(text);
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (businessConnectionId) {
      payload.business_connection_id = businessConnectionId;
    }
    try {
      await this.bot.telegram.callApi('sendMessage', payload as never);
      return true;
    } catch (err) {
      this.logger.warn(`HTML send failed, retrying plain: ${(err as Error).message}`);
      try {
        const plain: Record<string, unknown> = { chat_id: chatId, text };
        if (businessConnectionId) plain.business_connection_id = businessConnectionId;
        await this.bot.telegram.callApi('sendMessage', plain as never);
        return true;
      } catch (err2) {
        this.logger.error(`sendMessage failed: ${(err2 as Error).message}`);
        return false;
      }
    }
  }

  async notifyAdmin(text: string) {
    const chatId = this.config.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    if (!this.bot || !chatId) {
      this.logger.warn('TELEGRAM_ADMIN_CHAT_ID missing — admin alert skipped');
      return;
    }
    try {
      await this.bot.telegram.sendMessage(chatId, text);
    } catch (err) {
      this.logger.error(`notifyAdmin failed: ${(err as Error).message}`);
    }
  }

  private isAdmin(userId: number): boolean {
    const admin = (this.config.get<string>('TELEGRAM_ADMIN_CHAT_ID') || '').trim();
    return Boolean(admin) && String(userId) === admin;
  }

  private adminHelpText(): string {
    return [
      '🛠 پنل شورت‌کد منشی',
      '',
      'داخل چت مشتری این‌ها را بفرستید:',
      '#من   → کنترل دستی (ربات خاموش)',
      '#ربات → ربات دوباره جواب دهد',
      '#کدها → همین راهنما',
      '',
      'معادل‌ها: /من /ربات | !من !ربات | /take /ai',
      '',
      'هر handoff خودکار هم همینجا به شما خبر می‌دهد تا تماس بگیرید.',
    ].join('\n');
  }

  private isBusinessUpdate(ctx: Context): boolean {
    return Boolean((ctx.update as { business_message?: unknown }).business_message);
  }

  private fromPrivateMessage(ctx: Context): IncomingPayload | null {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const from = ctx.from;
    const chat = ctx.chat;
    if (!from || !chat || !text) return null;
    return {
      chatId: chat.id,
      fromId: from.id,
      fromName: [from.first_name, from.last_name].filter(Boolean).join(' ') || undefined,
      text,
    };
  }

  private fromPrivateVoice(ctx: Context): IncomingPayload | null {
    const from = ctx.from;
    const chat = ctx.chat;
    if (!from || !chat || !ctx.message || !('voice' in ctx.message)) return null;
    return {
      chatId: chat.id,
      fromId: from.id,
      fromName: [from.first_name, from.last_name].filter(Boolean).join(' ') || undefined,
      voiceFileId: ctx.message.voice.file_id,
    };
  }

  private async loadBusinessMap() {
    try {
      const row = await this.prisma.setting.findUnique({
        where: { key: 'telegram_business_map' },
      });
      if (row?.value) {
        const raw = JSON.parse(row.value) as Record<string, string>;
        for (const [chatId, connId] of Object.entries(raw)) {
          this.businessByChat.set(Number(chatId), connId);
        }
        this.logger.log(`Loaded ${this.businessByChat.size} business chat mappings (db)`);
        return;
      }
    } catch (err) {
      this.logger.warn(`DB business map load failed: ${(err as Error).message}`);
    }

    try {
      if (!existsSync(this.connectionsPath)) return;
      const raw = JSON.parse(readFileSync(this.connectionsPath, 'utf8')) as Record<string, string>;
      for (const [chatId, connId] of Object.entries(raw)) {
        this.businessByChat.set(Number(chatId), connId);
      }
      this.logger.log(`Loaded ${this.businessByChat.size} business chat mappings (file)`);
    } catch {
      // ignore
    }
  }

  private async saveBusinessMap() {
    const obj: Record<string, string> = {};
    for (const [chatId, connId] of this.businessByChat.entries()) {
      obj[String(chatId)] = connId;
    }
    const value = JSON.stringify(obj);

    try {
      await this.prisma.setting.upsert({
        where: { key: 'telegram_business_map' },
        create: { key: 'telegram_business_map', value },
        update: { value },
      });
    } catch (err) {
      this.logger.warn(`DB business map save failed: ${(err as Error).message}`);
    }

    if (process.env.VERCEL) return;

    try {
      mkdirSync(join(process.cwd(), 'data'), { recursive: true });
      writeFileSync(this.connectionsPath, JSON.stringify(obj, null, 2));
    } catch (err) {
      this.logger.warn(`Could not persist business map file: ${(err as Error).message}`);
    }
  }
}

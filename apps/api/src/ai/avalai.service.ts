import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { TOOL_DEFINITIONS } from './tools.definitions';
import { FREELANCER_SYSTEM_PROMPT, TELEGRAM_REPLY_STYLE } from './telegram-style';

export type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export type ToolCallResult = {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AvalAiResponse = {
  text: string;
  toolCalls: ToolCallResult[];
  avalaiRequestId?: string;
  tokensIn?: number;
  tokensOut?: number;
  raw?: unknown;
};

@Injectable()
export class AvalAiService {
  private readonly logger = new Logger(AvalAiService.name);
  private readonly client: OpenAI;
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly sttModel: string;
  private readonly ttsModel: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('AVALAI_API_KEY') || '';
    const baseURL = this.config.get<string>('AVALAI_BASE_URL') || 'https://api.avalai.ir/v1';
    this.client = new OpenAI({
      apiKey: apiKey || 'missing-key',
      baseURL,
      timeout: 120_000,
      maxRetries: 2,
    });
    this.chatModel = this.config.get<string>('AVALAI_CHAT_MODEL') || 'gpt-5.4-mini';
    this.embeddingModel = this.config.get<string>('AVALAI_EMBEDDING_MODEL') || 'text-embedding-3-small';
    this.sttModel = this.config.get<string>('AVALAI_STT_MODEL') || 'whisper-1';
    this.ttsModel = this.config.get<string>('AVALAI_TTS_MODEL') || 'tts-1';
  }

  isConfigured() {
    const key = this.config.get<string>('AVALAI_API_KEY');
    return Boolean(key && !key.includes('YOUR_API_KEY'));
  }

  async getSystemInstructions(): Promise<string> {
    const setting = await this.prisma.setting.findUnique({ where: { key: 'system_prompt' } });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as { text?: string };
        if (parsed.text) {
          return `${parsed.text.trim()}\n\n${TELEGRAM_REPLY_STYLE}`;
        }
      } catch {
        return `${setting.value}\n\n${TELEGRAM_REPLY_STYLE}`;
      }
    }
    return FREELANCER_SYSTEM_PROMPT;
  }

  async respond(input: {
    messages: ChatTurn[];
    conversationId?: string;
    previousResponseId?: string;
  }): Promise<AvalAiResponse> {
    if (!this.isConfigured()) {
      return {
        text: 'سرویس هوش مصنوعی پیکربندی نشده است. لطفاً AVALAI_API_KEY را تنظیم کنید یا با پشتیبانی صحبت کنید.',
        toolCalls: [],
      };
    }

    const instructions = await this.getSystemInstructions();
    const history = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        type: 'message' as const,
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

    try {
      const response = await this.client.responses.create({
        model: this.chatModel,
        instructions,
        input: history as OpenAI.Responses.ResponseInput,
        tools: TOOL_DEFINITIONS as unknown as OpenAI.Responses.Tool[],
        store: false,
      });

      const avalaiRequestId =
        (response as unknown as { _request_id?: string })._request_id ||
        undefined;

      const toolCalls: ToolCallResult[] = [];
      let text = this.extractOutputText(response);

      for (const item of response.output || []) {
        if (item.type === 'function_call') {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(item.arguments || '{}') as Record<string, unknown>;
          } catch {
            args = {};
          }
          toolCalls.push({
            callId: item.call_id,
            name: item.name,
            arguments: args,
          });
        }
      }

      const usage = response.usage;
      const tokensIn = usage?.input_tokens;
      const tokensOut = usage?.output_tokens;

      if (input.conversationId) {
        await this.prisma.aiUsageLog.create({
          data: {
            conversationId: input.conversationId,
            model: this.chatModel,
            operation: 'responses',
            tokensIn: tokensIn || 0,
            tokensOut: tokensOut || 0,
            costUsd: 0,
            avalaiRequestId,
          },
        });
      }

      return { text, toolCalls, avalaiRequestId, tokensIn, tokensOut, raw: response };
    } catch (err) {
      this.logger.error(`AvalAI responses failed: ${(err as Error).message}`);
      return {
        text: 'متأسفانه ارتباط با سرویس هوش مصنوعی برقرار نشد. می‌توانم شما را به کارشناس انسانی وصل کنم.',
        toolCalls: [
          {
            callId: 'local-fallback',
            name: 'request_human_handoff',
            arguments: { reason: 'AI API unavailable' },
          },
        ],
      };
    }
  }

  async respondWithToolOutputs(input: {
    messages: ChatTurn[];
    conversationId?: string;
    toolOutputs: Array<{ callId: string; name: string; output: string }>;
    priorRaw?: unknown;
  }): Promise<AvalAiResponse> {
    if (!this.isConfigured()) {
      return { text: 'سرویس هوش مصنوعی در دسترس نیست.', toolCalls: [] };
    }

    const instructions = await this.getSystemInstructions();
    const history: OpenAI.Responses.ResponseInputItem[] = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        type: 'message' as const,
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

    const prior = input.priorRaw as { output?: Array<{ type: string; call_id?: string; name?: string; arguments?: string }> } | undefined;
    if (prior?.output) {
      for (const item of prior.output) {
        if (item.type === 'function_call' && item.call_id && item.name) {
          history.push({
            type: 'function_call',
            call_id: item.call_id,
            name: item.name,
            arguments: item.arguments || '{}',
          } as OpenAI.Responses.ResponseInputItem);
        }
      }
    }

    for (const t of input.toolOutputs) {
      history.push({
        type: 'function_call_output',
        call_id: t.callId,
        output: t.output,
      } as OpenAI.Responses.ResponseInputItem);
    }

    try {
      const response = await this.client.responses.create({
        model: this.chatModel,
        instructions,
        input: history,
        tools: TOOL_DEFINITIONS as unknown as OpenAI.Responses.Tool[],
        store: false,
      });

      const toolCalls: ToolCallResult[] = [];
      for (const item of response.output || []) {
        if (item.type === 'function_call') {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(item.arguments || '{}') as Record<string, unknown>;
          } catch {
            args = {};
          }
          toolCalls.push({ callId: item.call_id, name: item.name, arguments: args });
        }
      }

      const text = this.extractOutputText(response) || '';
      return {
        text,
        toolCalls,
        avalaiRequestId: (response as unknown as { _request_id?: string })._request_id,
        tokensIn: response.usage?.input_tokens,
        tokensOut: response.usage?.output_tokens,
        raw: response,
      };
    } catch (err) {
      this.logger.error(`AvalAI tool follow-up failed: ${(err as Error).message}`);
      return {
        text: '',
        toolCalls: [],
      };
    }
  }

  /** Prefer output_text; otherwise gather message content parts. */
  private extractOutputText(response: {
    output_text?: string;
    output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  }): string {
    if (response.output_text?.trim()) return response.output_text.trim();
    const parts: string[] = [];
    for (const item of response.output || []) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === 'output_text' && c.text) parts.push(c.text);
          if ((c as { type?: string }).type === 'text' && c.text) parts.push(c.text);
        }
      }
    }
    return parts.join('\n').trim();
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text.slice(0, 8000),
    });
    return res.data[0]?.embedding || [];
  }

  async transcribe(buffer: Buffer, filename = 'audio.ogg', mimeType = 'audio/ogg'): Promise<string> {
    const file = await OpenAI.toFile(buffer, filename, { type: mimeType });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: this.sttModel,
      language: 'fa',
    });
    return res.text;
  }

  async speech(text: string): Promise<Buffer> {
    const res = await this.client.audio.speech.create({
      model: this.ttsModel,
      voice: 'alloy',
      input: text.slice(0, 4000),
      response_format: 'mp3',
    });
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }
}

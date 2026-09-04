import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { ConversationEngineService } from '../conversation-engine/conversation-engine.service';
import { AvalAiService } from '../ai/avalai.service';
import { WebChatService } from './web-chat.service';

class WebChatDto {
  @IsString()
  @MinLength(8)
  sessionId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  audioBase64?: string;

  @IsOptional()
  @IsString()
  audioMimeType?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsBoolean()
  wantAudio?: boolean;
}

@Controller('channels/web')
export class WebChatController {
  constructor(
    private readonly engine: ConversationEngineService,
    private readonly avalai: AvalAiService,
    private readonly webChat: WebChatService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('message')
  async message(@Body() dto: WebChatDto) {
    const audioBuffer = dto.audioBase64
      ? Buffer.from(dto.audioBase64, 'base64')
      : undefined;
    const result = await this.engine.handleInbound({
      channel: 'web',
      externalUserId: dto.sessionId,
      text: dto.content,
      audioBuffer,
      audioMimeType: dto.audioMimeType || 'audio/webm',
      audioFilename: 'voice.webm',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
    });

    let audioBase64: string | undefined;
    if (dto.wantAudio && result.reply && this.avalai.isConfigured()) {
      try {
        const buf = await this.avalai.speech(result.reply);
        audioBase64 = buf.toString('base64');
      } catch {
        // ignore TTS errors
      }
    }

    return { ...result, audioBase64 };
  }

  @Public()
  @Get('history')
  history(@Query('sessionId') sessionId: string) {
    if (!sessionId) return { messages: [] };
    return this.webChat.historyBySession(sessionId);
  }
}

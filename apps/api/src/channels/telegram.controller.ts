import {
  Controller,
  Post,
  Req,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Req() req: { body: unknown },
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ) {
    const expected = (this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') || '').trim();
    if (expected && secretHeader !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    try {
      await this.telegram.handleUpdate(req.body);
    } catch (err) {
      this.logger.error(`webhook handle failed: ${(err as Error).message}`);
    }
    return { ok: true };
  }
}

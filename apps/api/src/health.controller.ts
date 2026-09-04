import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { ok: true, service: 'avalai-sales-crm-bot', ts: new Date().toISOString() };
  }
}

import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { CallbacksService, CallbackStatus } from './callbacks.service';
import { IsIn } from 'class-validator';

class UpdateCallbackDto {
  @IsIn(['pending', 'contacted', 'completed', 'cancelled'])
  status!: CallbackStatus;
}

@Controller('callbacks')
export class CallbacksController {
  constructor(private readonly callbacks: CallbacksService) {}

  @Get()
  list(@Query('status') status?: CallbackStatus) {
    return this.callbacks.list(status);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCallbackDto) {
    return this.callbacks.updateStatus(id, dto.status);
  }
}

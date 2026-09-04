import { Module } from '@nestjs/common';
import { CallbacksService } from './callbacks.service';
import { CallbacksController } from './callbacks.controller';

@Module({
  providers: [CallbacksService],
  controllers: [CallbacksController],
  exports: [CallbacksService],
})
export class CallbacksModule {}

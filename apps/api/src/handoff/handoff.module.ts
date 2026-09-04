import { Module } from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { HandoffController } from './handoff.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConversationsModule, NotificationsModule],
  providers: [HandoffService],
  controllers: [HandoffController],
  exports: [HandoffService],
})
export class HandoffModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { WebChatController } from './web-chat.controller';
import { ConversationEngineModule } from '../conversation-engine/conversation-engine.module';
import { AiModule } from '../ai/ai.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebChatService } from './web-chat.service';
import { HandoffModule } from '../handoff/handoff.module';

@Module({
  imports: [
    ConversationEngineModule,
    AiModule,
    ConversationsModule,
    PrismaModule,
    forwardRef(() => HandoffModule),
  ],
  controllers: [WebChatController],
  providers: [TelegramService, WebChatService],
  exports: [TelegramService],
})
export class ChannelsModule {
  constructor(private readonly telegram: TelegramService) {
    // Force TelegramService instantiation
    void this.telegram;
  }
}

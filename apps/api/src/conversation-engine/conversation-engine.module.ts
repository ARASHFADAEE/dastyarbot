import { Module } from '@nestjs/common';
import { ConversationEngineService } from './conversation-engine.service';
import { IntentEngineService } from './intent-engine.service';
import { CustomersModule } from '../customers/customers.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CustomersModule, ConversationsModule, AiModule],
  providers: [ConversationEngineService, IntentEngineService],
  exports: [ConversationEngineService, IntentEngineService],
})
export class ConversationEngineModule {}

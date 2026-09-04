import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ProductsModule } from './products/products.module';
import { LeadsModule } from './leads/leads.module';
import { CallbacksModule } from './callbacks/callbacks.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { HandoffModule } from './handoff/handoff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChannelsModule } from './channels/channels.module';
import { AiModule } from './ai/ai.module';
import { ConversationEngineModule } from './conversation-engine/conversation-engine.module';
import { SettingsModule } from './settings/settings.module';
import { PrivacyModule } from './privacy/privacy.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CustomersModule,
    ConversationsModule,
    ProductsModule,
    LeadsModule,
    CallbacksModule,
    KnowledgeModule,
    HandoffModule,
    NotificationsModule,
    AnalyticsModule,
    ChannelsModule,
    AiModule,
    ConversationEngineModule,
    SettingsModule,
    PrivacyModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

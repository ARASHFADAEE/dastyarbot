import { Module, forwardRef } from '@nestjs/common';
import { AvalAiService } from './avalai.service';
import { ToolRegistryService } from './tool-registry.service';
import { ProductsModule } from '../products/products.module';
import { LeadsModule } from '../leads/leads.module';
import { CallbacksModule } from '../callbacks/callbacks.module';
import { HandoffModule } from '../handoff/handoff.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    LeadsModule,
    CallbacksModule,
    forwardRef(() => HandoffModule),
    forwardRef(() => KnowledgeModule),
    NotificationsModule,
    CustomersModule,
  ],
  providers: [AvalAiService, ToolRegistryService],
  exports: [AvalAiService, ToolRegistryService],
})
export class AiModule {}

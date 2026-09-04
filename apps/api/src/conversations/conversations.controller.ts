import { Controller, Get, Param, Post, Body, Query, Req } from '@nestjs/common';
import { ConversationsService, ConversationStatus } from './conversations.service';
import { IsString, MinLength } from 'class-validator';

class AgentReplyDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@Query('status') status?: ConversationStatus) {
    return this.conversations.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.conversations.get(id);
  }

  @Post(':id/reply')
  reply(
    @Param('id') id: string,
    @Body() dto: AgentReplyDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.conversations.agentReply(id, req.user.id, dto.content);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.conversations.setStatus(id, 'closed', { aiEnabled: false });
  }

  @Post(':id/resume-ai')
  async resumeAi(@Param('id') id: string) {
    await this.conversations.cancelManualHandoffs(id);
    return this.conversations.setStatus(id, 'active', { aiEnabled: true });
  }
}

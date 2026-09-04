import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { HandoffService, HandoffStatus } from './handoff.service';

@Controller('handoffs')
export class HandoffController {
  constructor(private readonly handoff: HandoffService) {}

  @Get()
  list(@Query('status') status?: HandoffStatus) {
    return this.handoff.list(status);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.handoff.assign(id, req.user.id);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.handoff.resolve(id);
  }
}

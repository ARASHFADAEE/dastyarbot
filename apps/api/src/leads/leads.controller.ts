import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { LeadsService, LeadStatus } from './leads.service';
import { IsIn } from 'class-validator';

class UpdateLeadStatusDto {
  @IsIn(['new', 'contacted', 'qualified', 'hot', 'won', 'lost'])
  status!: LeadStatus;
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query('status') status?: LeadStatus) {
    return this.leads.list(status);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leads.updateStatus(id, dto.status);
  }
}

import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { Roles } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('privacy')
@UseGuards(RolesGuard)
@Roles('admin')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get('customers/:id/export')
  exportCustomer(@Param('id') id: string) {
    return this.privacy.exportCustomer(id);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.privacy.deleteCustomer(id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string) {
    return this.privacy.deleteConversation(id);
  }
}

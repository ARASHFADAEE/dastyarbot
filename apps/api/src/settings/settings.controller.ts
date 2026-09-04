import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { IsObject, IsString } from 'class-validator';
import { Roles } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';

class SetSettingDto {
  @IsString()
  key!: string;

  @IsObject()
  value!: Record<string, unknown>;
}

@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @Put()
  @Roles('admin')
  set(@Body() dto: SetSettingDto) {
    return this.settings.set(dto.key, dto.value);
  }
}

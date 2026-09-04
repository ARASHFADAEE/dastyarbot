import { Controller, Get, Post, Body } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Roles } from '../auth/public.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';

class IngestDto {
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(10) content!: string;
  @IsOptional() @IsString() source?: string;
}

@Controller('knowledge')
@UseGuards(RolesGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list() {
    return this.knowledge.list();
  }

  @Post()
  @Roles('admin')
  ingest(@Body() dto: IngestDto) {
    return this.knowledge.ingest(dto.title, dto.content, dto.source);
  }
}

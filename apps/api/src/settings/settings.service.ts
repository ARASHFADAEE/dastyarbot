import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(
      rows.map((r) => {
        try {
          return [r.key, JSON.parse(r.value)];
        } catch {
          return [r.key, r.value];
        }
      }),
    );
  }

  async set(key: string, value: unknown) {
    return this.prisma.setting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    });
  }
}

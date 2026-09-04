import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SERVICE_ALIASES: Record<string, string[]> = {
  'WP-WOO': ['ووکامرس', 'woocommerce', 'فروشگاه', 'فروشگاهی', 'شاپ', 'shop', 'store'],
  'WP-SITE': ['وردپرس', 'wordpress', 'سایت شرکتی', 'طراحی سایت', 'وبسایت'],
  'WP-FIX': ['رفع باگ', 'پشتیبانی وردپرس', 'آپدیت وردپرس'],
  'LAR-API': ['api', 'لاراول', 'laravel', 'بک‌اند', 'بک اند'],
  'LAR-FULL': ['فول استک', 'فول‌استک', 'وب اپ', 'پنل لاراول'],
  'AUTO-TG': ['ربات تلگرام', 'بات تلگرام', 'telegram bot'],
  'AUTO-FLOW': ['اتوماسیون', 'n8n', 'webhook', 'crm'],
  'CONSULT': ['مشاوره', 'برآورد', 'جلسه'],
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : { isActive: true },
      include: {
        prices: { orderBy: { validFrom: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });
  }

  async get(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { prices: { orderBy: { validFrom: 'desc' } } },
    });
    if (!product) throw new NotFoundException('خدمت یافت نشد');
    return product;
  }

  /**
   * Tokenize query and match any token / alias against catalog (SQLite-friendly).
   */
  async search(query: string, limit = 8) {
    const tokens = this.tokenize(query);
    const all = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { prices: { orderBy: { validFrom: 'desc' }, take: 1 } },
    });

    const scored = all
      .map((p) => {
        const hay = `${p.sku} ${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += 2;
        }
        const aliases = SERVICE_ALIASES[p.sku] || [];
        for (const a of aliases) {
          if (tokens.some((t) => a.includes(t) || t.includes(a)) || query.includes(a)) {
            score += 3;
          }
        }
        // Strong boost for shop intent → WP-WOO
        if (
          p.sku === 'WP-WOO' &&
          /(فروشگاه|فروشگاهی|ووکامرس|woocommerce|shop|store)/i.test(query)
        ) {
          score += 10;
        }
        if (
          p.sku === 'WP-SITE' &&
          /(سایت|وردپرس|wordpress)/i.test(query) &&
          !/(فروشگاه|ووکامرس|woocommerce)/i.test(query)
        ) {
          score += 5;
        }
        return { product: p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.product);

    if (scored.length) return scored;

    // Fallback: original contains search on full query / tokens
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: tokens.flatMap((t) => [
          { name: { contains: t } },
          { description: { contains: t } },
          { sku: { contains: t } },
          { category: { contains: t } },
        ]),
      },
      include: { prices: { orderBy: { validFrom: 'desc' }, take: 1 } },
      take: limit,
    });
  }

  async getPrice(productIdOrSku: string) {
    let product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: productIdOrSku }, { sku: productIdOrSku }],
        isActive: true,
      },
      include: { prices: { orderBy: { validFrom: 'desc' }, take: 1 } },
    });

    // Fuzzy: AI often invents slugs like "wordpress-shop"
    if (!product) {
      const matches = await this.search(productIdOrSku.replace(/[-_]/g, ' '), 1);
      product = matches[0] || null;
    }

    if (!product) return null;
    const price = product.prices[0];
    if (!price) return { product, price: null };
    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description,
      },
      price: {
        amount: Number(price.amount),
        currency: price.currency,
        label: price.label,
      },
    };
  }

  create(data: {
    sku: string;
    name: string;
    description?: string;
    category?: string;
    price: number;
    currency?: string;
  }) {
    return this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        category: data.category,
        prices: {
          create: {
            amount: data.price,
            currency: data.currency || 'IRR',
          },
        },
      },
      include: { prices: { orderBy: { validFrom: 'desc' }, take: 1 } },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      currency?: string;
    },
  ) {
    await this.get(id);

    if (data.price !== undefined) {
      await this.prisma.productPrice.create({
        data: {
          productId: id,
          amount: data.price,
          currency: data.currency || 'IRR',
          label: 'base',
        },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
      },
      include: { prices: { orderBy: { validFrom: 'desc' }, take: 1 } },
    });
  }

  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s,،/|._-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
  }
}

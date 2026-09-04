import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { FREELANCER_SYSTEM_PROMPT } from '../src/ai/telegram-style';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name: 'Admin', role: 'admin' },
    update: {},
  });

  // Remove demo retail products if present
  await prisma.productPrice.deleteMany({
    where: { product: { sku: { in: ['LAP-001', 'PHN-001', 'AUD-001', 'TAB-001'] } } },
  });
  await prisma.product.deleteMany({
    where: { sku: { in: ['LAP-001', 'PHN-001', 'AUD-001', 'TAB-001'] } },
  });

  const services = [
    {
      sku: 'WP-SITE',
      name: 'طراحی و پیاده‌سازی سایت وردپرس',
      description:
        'راه‌اندازی سایت شرکتی/فروشگاهی با وردپرس، قالب استاندارد یا اختصاصی سبک، فرم تماس، سئوی پایه و آموزش پنل.',
      category: 'وردپرس',
      price: 25000000,
    },
    {
      sku: 'WP-WOO',
      name: 'فروشگاه ووکامرس',
      description:
        'راه‌اندازی فروشگاه ووکامرس، درگاه پرداخت، حمل‌ونقل، مدیریت موجودی و بهینه‌سازی موبایل.',
      category: 'وردپرس',
      price: 45000000,
    },
    {
      sku: 'WP-FIX',
      name: 'رفع باگ و پشتیبانی وردپرس',
      description: 'عیب‌یابی، به‌روزرسانی امن، رفع خطای پلاگین/قالب و پشتیبانی ماهانه.',
      category: 'وردپرس',
      price: 3500000,
    },
    {
      sku: 'LAR-API',
      name: 'توسعه API و بک‌اند لاراول',
      description:
        'طراحی و پیاده‌سازی API امن با لاراول، احراز هویت، ماژول‌بندی و مستندسازی.',
      category: 'لاراول',
      price: 60000000,
    },
    {
      sku: 'LAR-FULL',
      name: 'وب‌اپلیکیشن فول‌استک لاراول',
      description:
        'پنل ادمین + بخش کاربری با لاراول (Blade/Livewire/Inertia)، نقش‌ها، گزارش‌ها و استقرار.',
      category: 'لاراول',
      price: 90000000,
    },
    {
      sku: 'AUTO-TG',
      name: 'ربات و اتوماسیون تلگرام',
      description:
        'ربات تلگرام برای پشتیبانی، نوتیفیکیشن، ثبت لید و اتصال به سیستم‌های داخلی.',
      category: 'اتوماسیون',
      price: 20000000,
    },
    {
      sku: 'AUTO-FLOW',
      name: 'اتوماسیون کسب‌وکار (n8n/Webhook/CRM)',
      description:
        'اتصال فرم‌ها، CRM، پیامک، تلگرام و ابزارهای آنلاین برای کاهش کار دستی.',
      category: 'اتوماسیون',
      price: 18000000,
    },
    {
      sku: 'CONSULT',
      name: 'مشاوره فنی و معماری',
      description: 'جلسه مشاوره برای انتخاب استک، برآورد زمان/هزینه و نقشه راه پروژه.',
      category: 'مشاوره',
      price: 2500000,
    },
  ];

  for (const s of services) {
    const existing = await prisma.product.findUnique({ where: { sku: s.sku } });
    if (existing) {
      await prisma.product.update({
        where: { sku: s.sku },
        data: {
          name: s.name,
          description: s.description,
          category: s.category,
          isActive: true,
        },
      });
      await prisma.productPrice.create({
        data: {
          productId: existing.id,
          amount: s.price,
          currency: 'IRR',
          label: 'شروع از',
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: s.sku,
          name: s.name,
          description: s.description,
          category: s.category,
          prices: {
            create: { amount: s.price, currency: 'IRR', label: 'شروع از' },
          },
        },
      });
    }
  }

  const promptText = FREELANCER_SYSTEM_PROMPT;

  await prisma.setting.upsert({
    where: { key: 'system_prompt' },
    create: {
      key: 'system_prompt',
      value: JSON.stringify({ text: promptText }),
    },
    update: {
      value: JSON.stringify({ text: promptText }),
    },
  });

  await prisma.knowledgeDocument.deleteMany({
    where: { title: { in: ['سوالات متداول فروشگاه', 'فرآیند همکاری فریلنسر'] } },
  });

  await prisma.knowledgeDocument.create({
    data: {
      title: 'فرآیند همکاری فریلنسر',
      source: 'seed',
      content: [
        'حوزه تخصص: وردپرس، لاراول، اتوماسیون و ربات تلگرام.',
        'قیمت‌های کاتالوگ «شروع از» هستند و بسته به پیچیدگی پروژه تغییر می‌کنند.',
        'شروع کار معمولاً با پیش‌پرداخت ۳۰ تا ۵۰ درصد است.',
        'زمان تقریبی: سایت وردپرس ساده ۷ تا ۱۴ روز؛ پروژه لاراول متوسط ۳ تا ۶ هفته.',
        'برای برآورد دقیق نیاز به توضیح هدف، امکانات، ددلاین و نمونه مشابه است.',
        'پشتیبانی رفع باگ بعد از تحویل تا ۷ روز رایگان است.',
        'ساعت پاسخگویی: ۹ تا ۱۹ روزهای کاری؛ خارج از ساعت پیام ثبت و بعداً پیگیری می‌شود.',
        'برای صحبت مستقیم با فریلنسر بگویید «با خودت صحبت کنم» یا درخواست تماس ثبت کنید.',
      ].join('\n'),
      chunks: {
        create: [
          {
            chunkIndex: 0,
            content:
              'حوزه تخصص: وردپرس، لاراول، اتوماسیون. قیمت‌ها شروع از هستند. پیش‌پرداخت ۳۰ تا ۵۰ درصد.',
          },
          {
            chunkIndex: 1,
            content:
              'زمان تقریبی وردپرس ۷ تا ۱۴ روز، لاراول ۳ تا ۶ هفته. پشتیبانی رفع باگ ۷ روز. پاسخگویی ۹ تا ۱۹.',
          },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Freelance services seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

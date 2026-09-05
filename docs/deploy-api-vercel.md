# دیپلوی Nest API روی Vercel

پنل ادمین (`apps/admin`) و API (`apps/api`) را **دو پروژه جدا** روی Vercel بسازید.

| پروژه | Root Directory | دامنه نمونه |
|--------|----------------|-------------|
| پنل | `apps/admin` | `https://dastyarbot.vercel.app` |
| API / بات | `apps/api` | مثلاً `https://dastyar-api.vercel.app` |

---

## ۱) پروژه جدید Vercel برای API

1. New Project → همان ریپو `ARASHFADAEE/dastyarbot`
2. **Root Directory:** `apps/api`
3. Framework: Other
4. Build/Install از `apps/api/vercel.json` خوانده می‌شود

---

## ۲) Env روی پروژه API (Vercel)

همهٔ این‌ها را ست کنید (مقادیر واقعی از `.env` لوکال):

```env
DATABASE_URL=postgresql://...@db.prisma.io:5432/postgres?sslmode=require
AVALAI_API_KEY=aa-...
AVALAI_BASE_URL=https://api.avalai.ir/v1
AVALAI_CHAT_MODEL=gpt-5.4-mini
AVALAI_EMBEDDING_MODEL=text-embedding-3-small
JWT_SECRET=...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=یک-رشته-تصادفی-بلند
TELEGRAM_ADMIN_CHAT_ID=8485103970
TELEGRAM_MODE=webhook
CORS_ORIGINS=https://dastyarbot.vercel.app,http://localhost:3000
ADMIN_URL=https://dastyarbot.vercel.app
API_PUBLIC_URL=https://YOUR-API-PROJECT.vercel.app
NODE_ENV=production
```

`API_PUBLIC_URL` باید دقیقاً دامنهٔ **همین پروژه API** باشد (نه پنل).

---

## ۳) Env روی پروژه پنل (Vercel)

فقط:

```env
NEXT_PUBLIC_API_URL=https://YOUR-API-PROJECT.vercel.app
```

بعد Redeploy پنل.

---

## ۴) تست

```bash
curl https://YOUR-API-PROJECT.vercel.app/api/health
```

باید `{"ok":true,...}` برگردد.

لاگین پنل → `admin@example.com` / `ChangeMe123!`

پیام به بات تلگرام (webhook خودکار ست می‌شود وقتی API بالا بیاید).

Webhook endpoint:

`POST https://YOUR-API-PROJECT.vercel.app/api/telegram/webhook`

---

## محدودیت‌ها (مهم)

- روی Vercel **polling** کار نمی‌کند → فقط **webhook**
- Cold start ممکن است اولین پیام را کند کند
- `maxDuration` روی پلن Hobby محدود است؛ پاسخ AvalAI طولانی ممکن است تایم‌اوت شود
- برای ترافیک جدی، VPS/Railway پایدارتر است

جزئیات Env کلی: [env.md](./env.md)

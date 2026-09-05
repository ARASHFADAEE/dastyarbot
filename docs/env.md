# راهنمای Env — Fadaee Desk / dastyarbot

دو پروژهٔ جدا روی Vercel (یا API روی سرور دیگر):

| کجا | چه چیزی | Root Directory |
|-----|---------|----------------|
| پنل | Next.js | `apps/admin` → مثلاً `dastyarbot.vercel.app` |
| API / بات | NestJS serverless | `apps/api` → مثلاً `dastyar-api.vercel.app` |

راهنمای دیپلوی Nest روی Vercel: [deploy-api-vercel.md](./deploy-api-vercel.md)

---

## A) Env پروژه پنل (Vercel — apps/admin)

فقط این:

```env
NEXT_PUBLIC_API_URL=https://YOUR-API-PROJECT.vercel.app
```

نه آدرس خود پنل.

---

## B) Env پروژه API (Vercel — apps/api)

```env
DATABASE_URL="postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"
AVALAI_API_KEY="aa-YOUR_KEY"
AVALAI_BASE_URL="https://api.avalai.ir/v1"
AVALAI_CHAT_MODEL="gpt-5.4-mini"
AVALAI_EMBEDDING_MODEL="text-embedding-3-small"
JWT_SECRET="long-random"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_WEBHOOK_SECRET="long-random-secret"
TELEGRAM_ADMIN_CHAT_ID="8485103970"
TELEGRAM_MODE=webhook
CORS_ORIGINS="https://dastyarbot.vercel.app,http://localhost:3000"
ADMIN_URL="https://dastyarbot.vercel.app"
API_PUBLIC_URL="https://YOUR-API-PROJECT.vercel.app"
NODE_ENV=production
```

### مقادیر ثابت پروژه شما

| کلید | مقدار |
|------|--------|
| پنل | `https://dastyarbot.vercel.app` |
| `TELEGRAM_ADMIN_CHAT_ID` | `8485103970` |
| لاگین | `admin@example.com` / `ChangeMe123!` |

`YOUR-API-PROJECT.vercel.app` را با دامنه واقعی پروژه Nest عوض کنید.

---

## لوکال

```env
TELEGRAM_MODE=
API_PUBLIC_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
CORS_ORIGINS=https://dastyarbot.vercel.app,http://localhost:3000
```

(`TELEGRAM_MODE` خالی = polling)

---

## امنیت

سکرت‌ها را در گیت نگذارید؛ اگر در چت لو رفتند Rotate کنید.

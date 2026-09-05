# راهنمای Env — Fadaee Desk / dastyarbot

دو بخش جدا دارید. قاطی‌شان نکنید.

| کجا | چه چیزی اجرا می‌شود | دیتا |
|-----|---------------------|------|
| **Vercel** `https://dastyarbot.vercel.app` | فقط پنل Next.js | هیچ — فقط UI |
| **هاست API** (Railway / Render / VPS / لوکال+تونل) | NestJS + بات تلگرام | Postgres |

---

## اشتباهی که کردید (درستش کنید)

این‌ها را روی Vercel **حذف یا عوض** کنید:

| متغیر | مقدار فعلی شما (اشتباه) | چرا اشتباه است |
|--------|-------------------------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://dastyarbot.vercel.app` | پنل را به خودش وصل کرده؛ لاگین API نیست |
| `API_PUBLIC_URL` | `https://dastyarbot.vercel.app` | مال API است نه پنل |
| `PORT` / `TELEGRAM_*` / `AVALAI_*` / `DATABASE_URL` روی Vercel | — | روی پنل Next.js استفاده نمی‌شوند |

---

## A) فقط این را در Vercel بگذارید

Project → Settings → Environment Variables  
(Production + Preview)

```env
NEXT_PUBLIC_API_URL=https://YOUR-PUBLIC-API-HOST
```

مثال وقتی API روی Railway است:

```env
NEXT_PUBLIC_API_URL=https://dastyar-api.up.railway.app
```

مثال وقتی لوکال + Cloudflare Tunnel / ngrok:

```env
NEXT_PUBLIC_API_URL=https://xxxx.trycloudflare.com
```

بعد از تغییر: **Redeploy** الزامی است.

پنل لاگین: `https://dastyarbot.vercel.app/login`  
یوزر پیش‌فرض seed:

```text
ایمیل: admin@example.com
رمز:   ChangeMe123!
```

---

## B) این‌ها را روی هاست API بگذارید (نه Vercel)

همین مقادیر را در `.env` سرور API / `apps/api/.env` بگذارید.

```env
# —— Database (Prisma Postgres) ——
# همان connection string داشبورد Prisma را اینجا بگذارید
DATABASE_URL="postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"

# —— AvalAI ——
AVALAI_API_KEY="aa-YOUR_KEY"
AVALAI_BASE_URL="https://api.avalai.ir/v1"
AVALAI_CHAT_MODEL="gpt-5.4-mini"
AVALAI_EMBEDDING_MODEL="text-embedding-3-small"
AVALAI_STT_MODEL="whisper-1"
AVALAI_TTS_MODEL="tts-1"

# —— Auth ——
JWT_SECRET="یک-رشته-بلند-تصادفی"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"

# —— Telegram ——
TELEGRAM_BOT_TOKEN="توکن-از-BotFather"
TELEGRAM_WEBHOOK_SECRET=""
TELEGRAM_ADMIN_CHAT_ID="8485103970"

# —— App (مقادیر پروژه شما) ——
PORT=3001
NODE_ENV=production
CORS_ORIGINS="https://dastyarbot.vercel.app,http://localhost:3000"
ADMIN_URL="https://dastyarbot.vercel.app"
API_PUBLIC_URL="https://YOUR-PUBLIC-API-HOST"
NEXT_PUBLIC_API_URL="https://YOUR-PUBLIC-API-HOST"
```

### مقادیر ثابت همین پروژه (از داده شما)

| کلید | مقدار |
|------|--------|
| پنل | `https://dastyarbot.vercel.app` |
| لاگین پنل | `https://dastyarbot.vercel.app/login` |
| `TELEGRAM_ADMIN_CHAT_ID` | `8485103970` |
| `CORS_ORIGINS` | شامل `https://dastyarbot.vercel.app` |
| `ADMIN_URL` | `https://dastyarbot.vercel.app` |
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | `ChangeMe123!` (تا وقتی عوض نکرده باشید) |

`YOUR-PUBLIC-API-HOST` را با آدرس واقعی API عوض کنید — **هرگز** همان آدرس Vercel پنل نباشد.

---

## چک‌لیست بعد از ست کردن

1. API روشن است: `https://YOUR-PUBLIC-API-HOST/api/health` → `{"ok":true,...}`
2. Vercel: فقط `NEXT_PUBLIC_API_URL` = همان آدرس API → Redeploy
3. لاگین پنل با `admin@example.com` / `ChangeMe123!`
4. پیام تست به بات تلگرام

---

## امنیت

کلید AvalAI و پسورد دیتابیس را در چت/گیت نگذارید.  
اگر لو رفته، در داشبورد مربوطه **Rotate** کنید و فقط در Env هاست API بگذارید.

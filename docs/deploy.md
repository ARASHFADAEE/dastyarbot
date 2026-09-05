# Deployment

## Vercel (فقط پنل ادمین — Next.js)

API/Nest و بات تلگرام روی Vercel اجرا نمی‌شوند. فقط `apps/admin` را دیپلوی کنید.

### تنظیمات پیشنهادی در Vercel

1. **Framework Preset:** Next.js  
2. **Root Directory:** `apps/admin`  
3. اگر Root Directory خالی باشد (ریشه ریپو)، از `vercel.json` ریشه استفاده می‌شود و `build:vercel` فقط shared + admin را می‌سازد (API را بیلد نمی‌کند).

Build مورد استفاده:

```bash
npm run build:vercel
```

یعنی:

```bash
npm run build -w @bot/shared && npm run build -w @bot/admin
```

### Env در Vercel

```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST
```

دیتابیس روی Vercel ست نمی‌شود — پنل به DB وصل نیست.  
`DATABASE_URL` را روی **هاست API** بگذارید (نه فقط Vercel).  
جزئیات: [env-vercel.md](./env-vercel.md)

---

## Database

Production: **PostgreSQL** (مثلاً Prisma Postgres).

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
```

سپس روی API:

```bash
cd apps/api && npx prisma db push && npm run prisma:seed
```

Local بدون Postgres هنوز می‌تواند موقتاً SQLite باشد، ولی schema فعلی روی `postgresql` است.

## Environment

Copy `.env.example` to `.env` on the API host and set:

- `DATABASE_URL`
- `REDIS_URL` (reserved for future queue workers)
- `AVALAI_API_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `TELEGRAM_BOT_TOKEN` (optional)
- `CORS_ORIGINS` / `NEXT_PUBLIC_API_URL`

Never commit real secrets.

## Steps (VPS / full stack)

1. `docker compose up -d`
2. `npm ci`
3. `npm run build -w @bot/shared`
4. `npm run db:generate && cd apps/api && npx prisma migrate deploy && npm run prisma:seed`
5. Build apps: `npm run build -w @bot/api && npm run build -w @bot/admin && npm run build -w @bot/widget`
6. Run API with process manager (`node apps/api/dist/main.js`)
7. Run admin (`next start -p 3000`) behind HTTPS reverse proxy — یا از Vercel برای admin استفاده کنید
8. Point Telegram webhook or keep long-polling if single instance

## Production notes

- Put Nginx/Caddy in front with TLS (برای API)
- Restrict admin to VPN or IP allowlist if possible
- Rotate JWT secret and admin password
- Enable backups for PostgreSQL
- Monitor AvalAI spend via usage logs / transaction lookup API
- Scale API horizontally only if Telegram uses webhooks (not multi-instance polling)

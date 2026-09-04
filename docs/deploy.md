# Deployment

## Database

Local default uses **SQLite** (`file:./dev.db`) so the stack runs without Docker.

For production Postgres (recommended), set:

```
DATABASE_URL="postgresql://bot:bot@localhost:5432/bot?schema=public"
```

and run `docker compose up -d` when Docker is available, then switch Prisma provider back to `postgresql` if you need pgvector.

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

## Steps

1. `docker compose up -d`
2. `npm ci`
3. `npm run build -w @bot/shared`
4. `npm run db:generate && cd apps/api && npx prisma migrate deploy && npm run prisma:seed`
5. Build apps: `npm run build -w @bot/api && npm run build -w @bot/admin && npm run build -w @bot/widget`
6. Run API with process manager (`node apps/api/dist/main.js`)
7. Run admin (`next start -p 3000`) behind HTTPS reverse proxy
8. Point Telegram webhook or keep long-polling if single instance

## Production notes

- Put Nginx/Caddy in front with TLS
- Restrict admin to VPN or IP allowlist if possible
- Rotate JWT secret and admin password
- Enable backups for PostgreSQL
- Monitor AvalAI spend via usage logs / transaction lookup API
- Scale API horizontally only if Telegram uses webhooks (not multi-instance polling)

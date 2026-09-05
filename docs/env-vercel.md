# Env vars to paste in Vercel / API host
# NEVER commit real passwords. Rotate if they were pasted in chat.

# ─────────────────────────────────────────────
# A) Vercel (apps/admin — Next.js panel ONLY)
# ─────────────────────────────────────────────
# Panel does NOT talk to Postgres directly.
# It only calls your Nest API.

NEXT_PUBLIC_API_URL=https://YOUR-API-HOST

# Optional (if you later proxy API somehow — not used by current admin):
# DATABASE_URL is NOT required on Vercel for the admin UI.


# ─────────────────────────────────────────────
# B) API host (NestJS — where bot + CRM data live)
# Put these on Railway / Render / VPS / wherever API runs
# ─────────────────────────────────────────────

DATABASE_URL=postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require

# If your Prisma dashboard gives these names, copy the SAME connection
# string into DATABASE_URL (our app only reads DATABASE_URL):
#   POSTGRES_URL
#   PRISMA_DATABASE_URL

AVALAI_API_KEY=
AVALAI_BASE_URL=https://api.avalai.ir/v1
AVALAI_CHAT_MODEL=gpt-5.4-mini
AVALAI_EMBEDDING_MODEL=text-embedding-3-small
JWT_SECRET=
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
PORT=3001
CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app,http://localhost:3000
ADMIN_URL=https://YOUR-VERCEL-APP.vercel.app
API_PUBLIC_URL=https://YOUR-API-HOST
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST

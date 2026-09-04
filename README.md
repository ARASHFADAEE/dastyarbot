# AvalAI Sales + Support + CRM Assistant

Production-oriented monorepo for an AI sales desk with AvalAI, NestJS API, Next.js CRM admin, Telegram, and embeddable web chat.

## Stack

- **API:** NestJS + Prisma + PostgreSQL (pgvector) + JWT + Throttling
- **AI:** AvalAI OpenAI-compatible SDK (`/v1/responses`, tools, embeddings, STT/TTS)
- **Admin:** Next.js App Router (RTL Persian CRM)
- **Channels:** Telegram (Telegraf polling) + Web Chat Widget

## Quick start

```bash
cp .env.example .env
cp .env.example apps/api/.env
# set AVALAI_API_KEY and optionally TELEGRAM_BOT_TOKEN

npm install
npm run build -w @bot/shared
npm run db:generate
cd apps/api && npx prisma db push && npm run prisma:seed && cd ../..
npm run build -w @bot/widget

# terminals
npm run dev:api
npm run dev:admin
```

> Default DB is SQLite (`apps/api/prisma/dev.db`). Optional Postgres/Redis via `docker compose up -d` when Docker is installed.

- API: http://localhost:3001/api/health
- Admin: http://localhost:3000 (default `admin@example.com` / `ChangeMe123!`)
- Widget: serve `apps/widget/dist/chat-widget.js`

### Embed widget

```html
<script
  src="http://localhost:3001/widget/chat-widget.js"
  data-api="http://localhost:3001"
  data-title="پشتیبانی فروش"
  defer
></script>
```

> Copy/serve the widget file from your CDN or static host. The API does not host it by default unless you add a static route.

## Architecture

See `docs/api.md` and `docs/deploy.md`.

Flow: Channel Adapter → Conversation Engine → Intent + Tools + RAG → AvalAI → CRM / Handoff / Notifications.

## Tests

```bash
npm test
```

Covers intent detection, lead scoring, and product-not-found tool behavior.

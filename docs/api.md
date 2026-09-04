# API Overview

Base URL: `http://localhost:3001/api`

Auth: `Authorization: Bearer <jwt>` except public routes.

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user }` |
| POST | `/channels/web/message` | Web chat inbound |
| GET | `/channels/web/history?sessionId=` | Web chat history |

## Admin / Agent

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | Current user |
| GET | `/analytics/summary` | CRM analytics + series |
| GET/PATCH | `/customers`, `/customers/:id` | Customer CRM |
| GET/POST | `/conversations`, `/conversations/:id/reply` | Live inbox |
| GET/PATCH | `/leads`, `/leads/:id/status` | Lead pipeline |
| GET/PATCH | `/callbacks`, `/callbacks/:id/status` | Callback queue |
| GET/POST | `/products` | Catalog + prices |
| GET/POST | `/knowledge` | RAG documents |
| GET/POST | `/handoffs/:id/assign\|resolve` | Human handoff |
| GET/PATCH | `/notifications` | In-app alerts |
| GET/PUT | `/settings` | Bot prompt & config |
| GET/DELETE | `/privacy/customers/:id` | Export/delete customer |
| DELETE | `/privacy/conversations/:id` | Delete conversation |

## AvalAI integration

- Base: `https://api.avalai.ir/v1`
- Chat: `responses.create` with function tools
- Embeddings: `/embeddings`
- Voice: `/audio/transcriptions`, `/audio/speech`
- Persist `avalai-request-id` on messages / usage logs when available

## Tools exposed to the model

`search_products`, `get_product_price`, `compare_products`, `create_lead`, `score_lead`, `request_callback`, `request_human_handoff`, `search_knowledge`

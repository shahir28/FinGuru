# SmartFinance AI

## Overview

AI-heavy personal finance dashboard built to showcase full-stack engineering and AI integration skills for Intuit recruiter demos.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Recharts, Framer Motion, Tailwind CSS
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (no API key required)

## Architecture

```text
artifacts/
├── api-server/         # Express API server with AI routes
│   └── src/routes/
│       ├── accounts.ts         # Account management
│       ├── transactions.ts     # Transaction CRUD + bulk AI categorization
│       ├── budgets.ts          # Budget management
│       ├── insights.ts         # AI-powered spending trends, anomaly detection, tax summary
│       └── openai/index.ts     # AI advisor chat (SSE streaming)
└── smartfinance/       # React frontend
    └── src/pages/
        ├── dashboard.tsx       # Overview with charts
        ├── transactions.tsx    # Paginated transaction list
        ├── budgets.tsx         # Budget tracking
        ├── tax-center.tsx      # Tax summary
        ├── insights.tsx        # AI analytics & spending trends
        └── ai-advisor.tsx      # Chat with AI financial advisor
lib/
├── api-spec/openapi.yaml      # OpenAPI spec (source of truth)
├── api-client-react/          # Generated React Query hooks
├── api-zod/                   # Generated Zod schemas
├── db/src/schema/             # Drizzle schemas
│   ├── accounts.ts
│   ├── transactions.ts
│   ├── budgets.ts
│   ├── conversations.ts
│   └── messages.ts
└── integrations-openai-ai-server/  # OpenAI client wrapper
```

## AI Features

1. **AI Insights Card** - Dashboard shows AI-generated financial insights using GPT-5.2 (cached, non-blocking)
2. **Bulk AI Categorization** - Categorizes up to 50 uncategorized transactions at once via GPT-5.2
3. **Anomaly Detection** - AI scans recent transactions for unusual spending, duplicates, suspicious patterns (cached 10 min)
4. **AI Financial Analysis** - Ask any financial question and get structured recommendations + financial health score
5. **AI Advisor Chat** - Full streaming chat interface with your personal AI financial advisor (SSE streaming)
6. **Tax Summary** - Rule-based deductible expense identification

## Scale & Tech Highlights

- **PostgreSQL** with Drizzle ORM and type-safe queries
- **Pagination** on transaction list (page/limit with total count)
- **In-memory caching** for AI endpoints to avoid repeated expensive calls
- **Non-blocking AI calls** — summary endpoint fires AI generation in background, returns fast
- **SSE Streaming** for real-time AI chat responses
- **OpenAPI-first** contract → codegen → typed hooks (Orval)
- **262+ seeded transactions** across 12 months of realistic data

## Database

- `accounts` — linked bank/investment accounts
- `transactions` — income/expenses with category, merchant, dates
- `budgets` — monthly category budgets with alert thresholds
- `conversations` + `messages` — AI advisor chat history

## Development Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from spec
- `pnpm --filter @workspace/db run push` — sync schema to database
- `pnpm --filter @workspace/scripts run seed` — seed with demo data

# FinGuru — AI-Powered Personal Finance Dashboard

> A full-stack financial management platform built to showcase production-grade engineering: AI-heavy features, event-driven architecture, a financial rules engine, real-time streaming, and scalable data pipelines.

---

## Live Demo

**[smartfinance.replit.app](https://smartfinance.replit.app)** · User: Alex Smith (Pre-seeded with 12 months of realistic data)

---


---

## Screenshots

| Dashboard | Transactions | AI Advisor |
|-----------|-------------|------------|
| Balance cards, spending trends chart, category donut, AI insight | Paginated list, smart search, bulk AI categorization | Streaming GPT-5.2 chat with financial context |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + Vite** | SPA with fast HMR and optimized production builds |
| **TypeScript** | End-to-end type safety from OpenAPI spec to UI |
| **Tailwind CSS** | Utility-first styling with custom design system |
| **Recharts** | Spending trends (BarChart), category breakdown (PieChart), savings analysis |
| **Framer Motion** | Page transitions and staggered card animations |
| **TanStack React Query** | Server state, caching, background refetching |
| **Wouter** | Lightweight client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 24 + Express 5** | API server with async/await throughout |
| **TypeScript** | Type-safe route handlers and middleware |
| **PostgreSQL** | Primary data store for all financial entities |
| **Drizzle ORM** | Type-safe SQL query builder with schema-as-code |
| **OpenAI GPT-5.2** | AI advisor chat, transaction categorization, anomaly detection |
| **Server-Sent Events (SSE)** | Real-time streaming for AI chat responses |

### Architecture & Tooling
| Technology | Purpose |
|---|---|
| **pnpm Workspaces** | Monorepo with shared libs, zero dependency duplication |
| **OpenAPI 3.1 + Orval** | Contract-first API: spec → auto-generated React Query hooks + Zod schemas |
| **Drizzle Kit** | Database schema migrations (push-based for dev, migration files for prod) |
| **esbuild** | Sub-second production bundling of the Express server |
| **Zod** | Runtime validation on all API inputs and outputs |

---

## Architecture

```
smartfinance-ai/
├── artifacts/
│   ├── api-server/              # Express 5 REST API
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── job-scheduler.ts    # Background job queue (cron-like)
│   │       │   ├── event-bus.ts        # In-process pub/sub for SSE
│   │       │   └── rules-engine.ts     # Financial rules evaluator
│   │       └── routes/
│   │           ├── accounts.ts         # Account CRUD
│   │           ├── transactions.ts     # Transaction CRUD + bulk AI categorization
│   │           ├── budgets.ts          # Budget management with spending calc
│   │           ├── insights.ts         # AI analytics, anomaly detection, tax summary
│   │           ├── savings-goals.ts    # Goals with AI projections
│   │           └── openai/             # SSE-streaming AI advisor chat
│   └── smartfinance/            # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── dashboard.tsx       # Overview with live metrics
│           │   ├── transactions.tsx    # Paginated list + search + filters
│           │   ├── budgets.tsx         # Budget rings with alert thresholds
│           │   ├── insights.tsx        # AI-driven analytics + anomaly alerts
│           │   ├── tax-center.tsx      # Tax deductible expense categorization
│           │   └── ai-advisor.tsx      # Streaming GPT chat interface
│           ├── components/
│           │   ├── layout.tsx          # Sidebar navigation + header
│           │   └── formatters.tsx      # Currency, date, percentage formatters
│           └── hooks/
│               └── use-chat-stream.ts  # SSE stream consumer for AI chat
└── lib/
    ├── api-spec/
    │   └── openapi.yaml         # Single source of truth for all API contracts
    ├── api-client-react/        # Auto-generated React Query hooks (via Orval)
    ├── api-zod/                 # Auto-generated Zod schemas (via Orval)
    ├── db/
    │   └── src/schema/
    │       ├── accounts.ts
    │       ├── transactions.ts
    │       ├── budgets.ts
    │       ├── savings-goals.ts
    │       ├── financial-rules.ts
    │       ├── conversations.ts
    │       └── messages.ts
    └── integrations-openai-ai-server/  # OpenAI SDK wrapper with retry/rate limiting
```

---

## Key Engineering Decisions

### 1. Contract-First API Design
The entire API surface is defined in a single `openapi.yaml` before any code is written. Running `pnpm codegen` generates:
- **Type-safe React Query hooks** for every endpoint (`useListTransactions`, `useGetFinancialSummary`, etc.)
- **Zod validation schemas** used server-side for input/output validation

This means the frontend and backend can never drift apart — if an endpoint changes, TypeScript catches it at compile time.

### 2. Non-Blocking AI Calls with In-Memory Caching
AI endpoints (summary insight, anomaly detection) are expensive. The naive approach blocks the HTTP response waiting for GPT. Instead:

```typescript
// Return immediately with rule-based fallback
let aiInsight = computeRuleBasedInsight(savingsRate, totalBalance);

// Fire AI call asynchronously — result caches for next request
if (!isCacheFresh) openai.chat.completions.create({ ... })
  .then(c => { aiInsightCache = c.choices[0].message.content; })
  .catch(() => {});

res.json({ aiInsight, ... }); // Returns in <50ms
```

Subsequent requests get the real AI-generated insight with zero latency.

### 3. Financial Rules Engine
A configurable rules engine evaluates conditions against incoming transactions and fires automated actions (alerts, categorization overrides, notifications):

```typescript
// Rules are stored in the DB and evaluated on every transaction write
const rule = {
  ruleType: "large_transaction",
  conditions: { amountThreshold: 500, categories: ["Shopping"] },
  actions: { notify: true, flagForReview: true }
};
```

### 4. Background Job Scheduler
An in-process job queue runs periodic financial tasks without an external queue (Redis/SQS):
- **Every 5 min**: AI bulk categorization of uncategorized transactions  
- **Every hour**: Budget alert evaluation against spending  
- **Daily**: Balance reconciliation across accounts

### 5. Real-Time Event Streaming (SSE)
The AI advisor uses Server-Sent Events to stream GPT tokens to the browser as they arrive — no polling, no WebSocket overhead:

```typescript
// Server: stream tokens as they generate
for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
}

// Client: consume the stream with ReadableStream API
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setMessages(prev => appendToLastMessage(prev, decode(value)));
}
```

### 6. Paginated, Filtered Transaction API
The transaction list endpoint supports server-side pagination, multi-field filtering, and ordered results — designed for scale:

```
GET /api/transactions?page=2&limit=20&category=Food+%26+Dining&type=expense&startDate=2026-01-01
```

Returns `{ data, total, page, limit, totalPages }` — the frontend never loads more data than it displays.

---

## AI Feature Breakdown

| Feature | Model | Pattern |
|---|---|---|
| **AI Advisor Chat** | GPT-5.2 | SSE streaming, full conversation history, financial context injection |
| **Bulk Categorization** | GPT-5.2 | Batch processing up to 50 transactions, JSON response parsing, DB update |
| **Anomaly Detection** | GPT-5.2 | Sends recent transactions as structured JSON, receives severity-tagged anomalies |
| **Financial Analysis** | GPT-5.2 | User question + live financial data → structured `{ analysis, recommendations[], score }` |
| **Summary Insight** | GPT-5.2 | Async background generation, cached with 5-min TTL, rule-based fallback |
| **Savings Projection** | GPT-5.2 | Goal + monthly savings rate → projected completion date + strategy |

---

## Database Schema

```sql
accounts          -- Checking, savings, credit, investment, loan accounts
transactions      -- Income/expense/transfer with category, merchant, date, AI flag
budgets           -- Monthly category budgets with alert thresholds
savings_goals     -- Named goals with target amount, progress, AI projection
financial_rules   -- Configurable trigger rules with conditions + actions (JSONB)
conversations     -- AI advisor chat sessions
messages          -- Chat history (user + assistant roles)
```

---

## Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL database (or use the Replit built-in)

### Installation

```bash
git clone https://github.com/shahir28/FinGuru.git
cd FinGuru
pnpm install
```

### Environment Variables

```bash
DATABASE_URL=postgresql://...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...   # Replit AI Integrations URL
AI_INTEGRATIONS_OPENAI_API_KEY=...            # Replit AI Integrations key
PORT=8080                                      # API server port
```

### Database Setup

```bash
# Push schema to database
pnpm --filter @workspace/db run push

# Seed with 12 months of realistic demo data
pnpm --filter @workspace/scripts run seed
```

### Development

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/smartfinance run dev
```

### Regenerate API Client (after spec changes)

```bash
# Edit lib/api-spec/openapi.yaml, then:
pnpm --filter @workspace/api-spec run codegen
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/accounts` | List all accounts |
| `GET` | `/api/transactions` | Paginated transactions with filters |
| `POST` | `/api/transactions/bulk-categorize` | AI-powered bulk categorization |
| `GET` | `/api/budgets` | Budgets with live spending totals |
| `GET` | `/api/insights/spending-trends` | Monthly income vs expense trends |
| `GET` | `/api/insights/category-breakdown` | Spending by category with percentages |
| `GET` | `/api/insights/summary` | Financial summary with AI insight |
| `POST` | `/api/insights/ai-analysis` | Ask a financial question, get AI analysis |
| `GET` | `/api/insights/anomalies` | AI-detected spending anomalies |
| `GET` | `/api/insights/tax-summary` | Deductible expense summary by year |
| `GET` | `/api/goals` | Savings goals with AI projections |
| `POST` | `/api/openai/conversations` | Start an AI advisor session |
| `POST` | `/api/openai/conversations/:id/messages` | Send message (SSE streaming response) |

---

## Project Structure Philosophy

This project follows a **monorepo with shared library pattern** — the same approach used at scale in large engineering orgs:

- `lib/` packages are **published libraries** (composite TypeScript, emit declarations)
- `artifacts/` packages are **leaf applications** (no composite, checked with `tsc --noEmit`)
- Shared dependencies are pinned in the **pnpm catalog** to prevent version drift
- The OpenAPI spec in `lib/api-spec/` is the **contract boundary** — nothing crosses it without codegen

---

## Author

**Shahir** — [github.com/shahir28](https://github.com/shahir28)

Built as a technical portfolio project targeting Intuit engineering roles.

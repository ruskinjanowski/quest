# Quest

Other planners ask "what will you do today?" Quest asks **"which quests will you
advance today?"** — tasks link to high-level quests, time is tracked, and the
payoff is seeing quest-hours vs. admin-hours.

Prototype: Next.js on Vercel, Neon Postgres. See [PRODUCT_PLAN.md](PRODUCT_PLAN.md)
for scope and priorities, and [docs/tech/](docs/tech/) for how the code is put
together.

## Getting started

```bash
npm install
```

Copy the environment template and fill in a Neon connection string and an auth
secret:

```bash
cp .env.example .env.local
```

Create the schema, then seed the demo account with four weeks of history:

```bash
npm run db:migrate && npm run db:seed
```

```bash
npm run dev
```

Sign in with the demo credentials printed by the seed script (they are also
shown on the sign-in screen while `DEMO_USER_EMAIL` is set).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply migrations to Neon |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Create/reset the demo account's data |

## Stack

TypeScript · Next.js 16 (App Router, React Compiler) · React 19 · Neon Postgres ·
Drizzle ORM · Better Auth · Tailwind v4 · shadcn/ui (Radix) · Recharts · Vercel.

## Screens

- **Today** — plan and work the day. "Plan my day" pulls from the backlog and
  yesterday's leftovers, assigns quests and estimates, and shows the projected
  quest/admin split before you commit; the day summary tracks plan vs. reality
  and warns when the list doesn't fit. Timers live on the task rows, grouped
  under quest-coloured headers, with a read-only timeline of the day beside them.
- **Quests** — list and detail, with status chips, weekly targets and the
  social/milestone stubs.
- **Insights** — the payoff: quest vs. admin split, per-quest breakdown, four-week
  trend, timeframe selector.
- **Settings** — account, privacy stubs, reset demo data.

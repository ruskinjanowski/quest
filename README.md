# Quest

Other planners ask "what will you do today?" Quest asks **"which quests will you
advance today?"** — every task carries a quest, every task carries a planned
and an actual duration, and the payoff is seeing quest-hours vs. admin-hours.

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

- **Home** — the payoff, on arrival: quest vs. admin split for the last seven
  days, a four-week trend, what today holds, which quests the week is
  neglecting, and every active quest as a way in.
- **Today** — the planner. Days as columns, tasks as cards you drag between
  them, each column totalling its estimates. Start times are projected from the
  column's order, so reordering moves the day. One line under the first column
  gives the quest/admin split of the plan; the rail draws it on a clock.
- **Quests** — list and detail, with status chips, weekly targets and the
  social/milestone stubs.
- **Backlog** — capture and triage, in six time-horizon buckets from "this week
  or two" out to "Never", or regrouped by quest.
- **Settings** — account, calendar and task-planner integration stubs, privacy
  stubs, reset demo data.

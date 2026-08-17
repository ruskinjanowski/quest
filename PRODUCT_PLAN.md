# Quest — Prototype Product Plan (Working Draft)

> **Status: living document, not a spec.** Everything here is a suggestion with a priority
> attached, so we can decide what we want, in what order, and how it fits together — while
> staying free to change our minds. Nothing below is fixed. When we cut or add a feature,
> the "Layout sensitivity" notes say whether that decision ripples into the UI or not.

**Context.** Prototype web app, deployed on Vercel, demoed via Loom (due Sun Aug 23).
The real product would be local-first desktop + mobile; the prototype deliberately isn't —
that reasoning lives in the project plan, not here. The prototype's job is to make the core
idea legible: *tasks link to high-level quests, time is tracked, and the payoff is seeing
quest-hours vs. admin-hours.*

**One-line identity.** Other planners ask "what will you do today?" Quest asks
"**which quests will you advance today?**" Every screen should serve that question.

**Source material.** Niklas's Loom says Quest is "a mix of Sunsama.com and Focus.so."
Sunsama contributes the daily-planning mechanics (morning ritual, estimates, timeboxing
onto a calendar, workload warnings, shutdown ritual, weekly review). Focus.so — his own
Notion-based system, seen in screenshots — contributes the goal system: **Jahresziele
(yearly goals) → Meilensteine (milestones) → Projekte → Wochenziele (weekly goals) →
Weekly Review**, with status chips (On Track / At Risk / Off Track / Achieved), progress
bars, a Daily Dashboard ("Tag starten" start-my-day action, top weekly priority, active
projects with next actions), a habit tracker, an inbox/quick-capture, and a journal.
Quest's "quests" are roughly Focus.so's goals/milestones made first-class in an app.
His existing audience already knows this vocabulary — echoing it (status labels, weekly
review, start-day ritual) is cheap familiarity for the open beta.

---

## 1. Feature list with priorities

Priorities:
- **P0 — core demo.** Without it the idea doesn't come across. Build first.
- **P1 — makes it feel like a product.** Build if time allows, in listed order.
- **P2 — visual stubs.** Hardcoded/fake, exists to show product thinking in the Loom.
- **P3 — mention only.** Belongs in the 3-month project plan, not the prototype.

### P0 — Core demo loop

| # | Feature | Notes |
|---|---------|-------|
| 0.1 | **Quests** — create/edit, name, color (icon optional), lifecycle state | The unit everything hangs off. Keep the model tiny — but include a lifecycle field (**active / completed / archived**) from day one: it costs one column now, and Insights filtering (0.5, 1.5) depends on it. Note this is distinct from the *health* chip (1.3b, On Track / At Risk…): lifecycle says whether a quest counts, health says how it's going. |
| 0.2 | **Tasks linked to quests** + an implicit **Admin** bucket | Every task is either on a quest or it's admin. This binary is the product's core metric, so linking must be frictionless (e.g. quest picker right in the task row). |
| 0.3 | **Today view** — plan and work today's task list | The home screen. Ordered task list for today, quest color visible on every task. |
| 0.4 | **Task timer** — start/stop per task, one running at a time | Clockify-lite. Manual duration entry as fallback so demo data is easy to stage. |
| 0.5 | **Insights: quest-hours vs. admin-hours** — weekly split, per-quest breakdown | **The payoff screen. This is the product.** Open the Loom on it. Everything else is scaffolding for this. |

### P1 — Feels like a product (in rough build order)

| # | Feature | Notes |
|---|---------|-------|
| 1.1 | **Live header counter** — running quest vs. admin hours for today | Cheap once timers exist; makes the metric ambient instead of buried in a report. |
| 1.2 | **"Plan my day" ritual** — modal/flow: pick tasks, assign quest, estimate duration, see projected split *before* the day starts | The signature move of *both* source products (Sunsama's daily planning, Focus.so's "Tag starten" button). Strong Loom moment. Skippable without breaking anything — Today view works standalone. |
| 1.3 | **Quest detail page** — tasks, hours this week, simple history, optional target hrs/week | Gives quests a "home" and hosts the social stub (2.1). |
| 1.3b | **Quest status chips** — On Track / At Risk / Off Track / Achieved, manually set, + a simple progress bar | Lifted straight from Focus.so; his audience knows these labels. Very cheap (one enum + colored chip) and makes quest list/detail feel alive. |
| 1.4 | **Day calendar column** — timebox: drag tasks onto a day timeline | This is the one P1 that changes the layout fundamentally (see §3). Fake fixed events (meetings) look identical to synced ones on a Loom. |
| 1.5 | **Trend over weeks** on Insights | Needs seeded demo data; a 4-week trend line sells "did my time match my ambitions" far better than one week. |
| 1.6 | **Timeframe selector on Insights** — this week / this month / all time | Cheap if the queries aggregate by date range from the start (build 0.5 that way). Defaults to active quests; per-quest hours re-aggregate to the selected window. |
| 1.7 | **Quest lifecycle UI** — mark a quest completed/archived; Quests page splits into Active / Completed sections | Completing a quest should feel like a payoff moment (it's the whole point). Insights shows active quests by default with completed ones accessible via the timeframe/filter. |
| 1.8 | **Share of time context** — quest hours as a % of a reference denominator (e.g. "10h on quests = 6% of your 168h week", or % of a self-set weekly time budget) | Turns the raw split into a confronting number — very on-brand for the product's "look at the number" pitch. Denominator choice is Open Question 6; ship with one simple default. |
| 1.9 | **Auth** — sign up / sign in with email + password | In scope now (cheap with AI-assisted wiring). Keep it boring: Auth.js or Clerk, see §5. A seeded demo account must survive so the Loom and reset flow still work. Time-box it — if it fights back, drop to the single-user fallback and move on; no other feature depends on it. |

### P2 — Stubs (hardcoded, visual only)

| # | Feature | Notes |
|---|---------|-------|
| 2.1 | **Social discovery** — a panel on quest detail ("412 people share this quest", "people on this quest also pursue…") opening onto a browsable `/discover`: quest buckets → the people in one → a profile with their hours, their rhythm and their links | Passive inspiration, not competition — ordered by recent activity, never by hours. Hardcoded (`features/discover/data.ts`). Home carries one line under Active quests and nothing more: the split stays the point of that page. |
| 2.2 | **Privacy controls stub** in Settings — per-quest visibility (private / anonymous / public), social links per platform | Doesn't need to function. Shows the model: *private by default, sharing is an explicit act, per-quest and per-platform.* Say that line in the Loom. |
| 2.3 | **Canonical quest autocomplete hint** — typing a quest name suggests an existing canonical quest with a member count | Only if trivially cheap (static list). Demonstrates the embedding/canonicalisation idea from the plan in one interaction. |
| 2.4 | **Milestones on quest detail** — a static list of milestones with status chips under a quest | Mirrors Focus.so's Jahresziel → Meilensteine structure without committing the data model to a hierarchy. Display-only is enough for the Loom. |
| 2.5 | **"Weekly Review" framing on Insights** — a button/label that presents Insights as the weekly review ritual | Insights *is* the weekly review payoff; naming it in Focus.so's vocabulary costs a header and buys recognition. |

### P3 — Mention in the project plan, don't build

Calendar sync (Google/Outlook, bi-directional) · task import integrations (Todoist, Jira, Slack…) · shutdown ritual (weekly review gets a P2 framing stub, 2.5) · OAuth providers & magic-link email (basic auth is now 1.9) · mobile · local-first architecture + sync/conflict resolution · real embeddings/pgvector similarity · accountability pairing & any messaging · AI features · **habit tracker** and **journal/inbox capture** (both core surfaces in Focus.so — name them in the 3-month plan as candidate later phases, since his users will expect them, but they'd dilute the prototype's quest-hours story) · full goal hierarchy (year goals → milestones → projects → weekly goals) and project timeline/Gantt views.

**Priority principles behind the ordering** (so re-prioritising stays easy):
1. The quest/admin split is the product; anything that feeds or displays it outranks anything that doesn't.
2. Single-player must work first; social is a phase-two bet and appears here only as stubs.
3. Prefer faking over building when the Loom can't tell the difference (calendar events, social counts, demo data).

---

## 2. Suggested page set

Five surfaces, matching the category's converged anatomy but re-centred on quests:

| Page | Purpose | Needs |
|------|---------|-------|
| **Today** | Home. Plan and execute today; timers live here. | P0 |
| **Plan my day** (modal/flow over Today) | The morning ritual; projected quest/admin split before you commit. | P1.2 |
| **Quests** (list → detail) | Manage quests; per-quest time; social stub lives on detail. | P0.1 + P1.3 |
| **Insights** | The payoff: weekly split, per-quest breakdown, trend. | P0.5 |
| **Settings** | Privacy tiers + social links, stubbed. | P2.2 |

Navigation: simple left sidebar or top nav — Today · Quests · Insights · Settings. Boring
is fine; the novelty budget goes to the Insights screen and the quest coloring.

---

## 3. Layout options and how features affect them

The main layout question is the **Today view**, and it hinges on one decision: **do we
build the calendar column (1.4) or not?** Decide that before polishing Today; everything
else is additive.

### Option A — List-first Today (no calendar)

```
┌────────┬──────────────────────────────┬─────────────┐
│  nav   │  TODAY  ▏3.5h quest · 1h adm │             │
│        │  ┌────────────────────────┐  │  (optional  │
│ Today  │  │ ▸ task — Quest ● 0:45  │  │   right     │
│ Quests │  │ ▸ task — Admin   0:20  │  │   panel:    │
│ Insights│ │ ▸ task — Quest ● —     │  │   day summary│
│ Settings│ └────────────────────────┘  │   or empty) │
└────────┴──────────────────────────────┴─────────────┘
```

- **Pros:** fastest to build; timer-centric like Clockify; nothing to drag, so less
  interaction polish needed; mobile-ish layout for free.
- **Cons:** doesn't show the timeboxing interaction the category is known for; the day has
  no shape/time axis.
- **Feature sensitivity:** adding the calendar later (1.4) is a real layout change —
  the center column compresses and drag-and-drop enters. Everything else (ritual modal,
  header counter, insights) drops in without touching this layout.

### Option B — Three-column planner (category-standard)

```
┌────────┬───────────┬──────────────┬──────────────┐
│  nav   │ BACKLOG   │ TODAY        │ DAY TIMELINE │
│        │ unplanned │ ordered list │ 09 ▓ meeting │
│        │ tasks,    │ w/ timers &  │ 10 ░ task    │
│        │ by quest  │ quest colors │ 11 ░ task    │
│        │           │              │ 13 ▓ meeting │
└────────┴───────────┴──────────────┴──────────────┘
      drag →              drag →
```

- **Pros:** instantly reads as "a real planner" to anyone who knows Sunsama/Akiflow;
  timeboxing demo is the category's signature move; fixed fake meetings make the
  "plan around your calendar" story visible; the backlog column doubles as Focus.so's
  inbox/quick-capture surface.
- **Cons:** drag-and-drop is the single most time-expensive interaction to get right;
  risks spending the week on scaffolding instead of the differentiator (Insights).
- **Feature sensitivity:** absorbs 1.4 natively. If the backlog feels like too much, it
  collapses to a two-column variant (Today + timeline) without structural change.

### Option C — Quest-first Today (the opinionated one)

```
┌────────┬──────────────────────────────────────────┐
│  nav   │  TODAY          ▏quest 3.5h · admin 1.0h │
│        │  ● Learn Spanish        ▸ task  ▸ task   │
│        │  ● Ship side project    ▸ task           │
│        │  ○ Admin                ▸ task  ▸ task   │
└────────┴──────────────────────────────────────────┘
```

Tasks grouped **under their quests** rather than one flat list — the day is literally
organised by "which quests am I advancing today."

- **Pros:** most differentiated; the product identity is the layout itself; no
  drag-and-drop needed; makes admin work visually feel like the minority bucket it
  should be.
- **Cons:** breaks the familiar planner mental model (ordering tasks across quests is
  awkward); calendar column fits less naturally if added later.
- **Feature sensitivity:** most affected by adding timeboxing (1.4) — grouping by quest
  and ordering by time-of-day fight each other. If we believe in the calendar column,
  don't start here; if we skip the calendar, this is the boldest demo.

### Current lean (freely revisable)

**Start with A, styled so B is reachable.** Build the list-first Today with the center
column at planner width; if time remains after Insights + ritual are good, bolt the
fake day-timeline column on the right (a rendered read-only timeline, no drag, is ~an
evening's work and gives 80% of B's visual credibility). Use C's grouping idea in a
lighter form: sort/group the Today list by quest with quest-colored section headers —
that gets the opinionated feel without fighting the calendar.

Insights layout is independent of this choice and should get disproportionate polish:
one big split (quest vs. admin, this week), per-quest bars beneath it, trend line if
1.5 makes it. It's the screen the Loom opens on.

---

## 4. Suggested flows (thin, revisable)

- **First-run:** empty state prompts "create your first quest" → then "add a task to it."
  Seed demo data behind a flag so the Loom never shows a cold-start screen.
- **Morning:** open Today → (P1.2) "Plan my day" → pick tasks, each gets a quest or Admin,
  estimate durations → see projected split → commit → list is set.
- **During the day:** start/stop timers; header counter moves; add stray tasks inline
  (default: Admin — mildly provocative and honest, revisit if it annoys).
- **Evening/weekly:** open Insights → did my time match my ambitions? (Shutdown ritual is
  P3 — mention, don't build.)
- **Quest curiosity:** Quests → detail → history + social stub ("142 people…") → per-quest
  privacy stub in Settings.

---

## 5. Build readiness (prototype defaults)

Decisions defaulted so building can start; any can be revisited.

**Stack.** TypeScript everywhere. Next.js (App Router) on Vercel; Neon Postgres;
Drizzle ORM (light, SQL-close — Prisma fine too); Tailwind + shadcn/ui for speed;
Recharts (or plain SVG) for the Insights charts. Server actions / route handlers for
mutations — no separate API layer for a prototype.

**Auth: basic email + password, in scope (1.9).** Cheap with AI-assisted wiring, and it
makes the public demo a real multi-user app instead of an open sandbox. Ground rules:
- **Keep it boring.** Two candidate routes — pick whichever wires up fastest on the day:
  **Auth.js v5** (Credentials provider, bcrypt-hashed passwords in the existing `users`
  table — everything stays in Neon, no new vendor) or **Clerk** (prebuilt sign-in UI,
  fastest possible setup, adds a vendor + their user store). Default lean: Auth.js,
  because the users table already exists and owning the data matches the product's
  privacy story.
- **Time-boxed.** The half-hour estimate is right when it goes smoothly; auth is also
  the classic place a day disappears (session edge cases, middleware, redirects). If it
  exceeds ~2 focused hours, fall back to the single-user mode below — nothing else in
  the prototype depends on auth.
- **The demo account survives.** Seed a known account (e.g. demo@quest.app) whose
  credentials can be typed on camera; "Reset demo data" reseeds *that account's* data
  only. Signing up fresh shows the empty-state flow — actually a nice extra Loom beat.
- Deferred to the 3-month plan: email verification, password reset, magic links, OAuth
  (Google/Apple), and the local-first auth/sync story.
- **Fallback if cut:** single hardcoded demo user; schema keeps `user_id` everywhere
  either way, so the two modes are one config apart.

**Deployment note.** A public Vercel URL with a writable DB means anyone with the link
can edit the demo data. Fine for this purpose; add a **"Reset demo data"** action
(button or route) that reseeds — also exactly what's needed between Loom retakes.

**Minimal data model.**
- `users` — id, name, email, password_hash (seeded demo account + real signups)
- `quests` — id, user_id, name, color, lifecycle (`active|completed|archived`),
  health (`on_track|at_risk|off_track`, nullable), target_hours_week (nullable),
  created_at, completed_at
- `tasks` — id, user_id, quest_id (**nullable = Admin**), title, planned_date
  (nullable = backlog), estimate_minutes (nullable), done, sort_order, created_at
- `time_entries` — id, task_id, started_at, ended_at (nullable while running),
  or manual duration_minutes; a task's tracked time = sum of its entries
- Derived, not stored: quest/admin split, per-quest hours, percentages — all date-range
  aggregations over `time_entries` (this is what makes the 1.6 timeframe selector cheap).

**Small defaults** (decided to avoid re-deciding later): week starts Monday; timezone =
browser local; one running timer at a time (starting a second stops the first); tracked
time is editable after the fact (fixing a forgotten timer must be trivial, and it makes
staging demo data easy); a timer left running just keeps running — no midnight logic in
a prototype; seed script = ~4 weeks of history for 3–4 quests plus admin (Open Question
5), written **before** polishing Insights so the charts render real-looking data.

---

## 6. Open questions (deliberately unresolved)

1. **Calendar column: in or out?** The single biggest scope/layout fork (§3). Can be
   decided mid-week once P0 is standing.
2. **Estimates:** does "Plan my day" require duration estimates, or are timers alone
   enough? Estimates power the projected split, but add friction.
3. **Target hours per quest** (e.g. "5h/week on Spanish"): gives Insights a
   goal-vs-actual angle, but adds setup friction. Nice if cheap.
4. **How loud is the social stub?** One line on quest detail vs. a visible "Discover"
   panel. Loud sells the vision; quiet keeps the single-player story clean.
5. **Demo data story:** hand-crafted seed covering ~4 weeks so trends and insights look
   alive on the Loom. Worth doing early — it shapes what the screens need to show.
6. **Percentage denominator (for 1.8):** percent of *tracked* time is easy but
   flattering (only counts hours you logged); percent of a *working-hours budget*
   (e.g. 40h) is fair but needs a setting; percent of the *full 168h week* is honest
   and provocative. Options aren't exclusive — could show tracked-share prominently
   with the 168h framing as a subtitle. Decide when building Insights.
7. **Do completed quests appear in Insights?** Default view = active quests only,
   but "all time" timeframe arguably should include completed quests (that's where
   the satisfaction lives). Maybe: timeframe controls the window, a separate
   include-completed toggle controls the set. Decide when building 1.6/1.7.
8. **Flat quests vs. Focus.so's hierarchy:** Focus.so nests year goals → milestones →
   projects → weekly goals. The prototype's flat quest → task model is deliberately
   simpler (and better for the hours-split story), with milestones shown display-only
   (2.4). Is flat the right call for the real product too, or does the 3-month plan
   commit to the hierarchy? Worth a sentence in the Loom either way — it shows we saw
   the structure and chose, rather than missed it.

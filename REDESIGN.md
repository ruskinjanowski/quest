# Quest — Sunsama-shaped redesign (sketch)

> **Built.** This is now the app, not a proposal. It supersedes the layout
> sections of [PRODUCT_PLAN.md](PRODUCT_PLAN.md) §2–§3; the priority *principle*
> stays: quest-hours vs. everything-else is still the one metric.
>
> Two things landed differently from the sketch below, both noted in place:
> a day column reports the **planned** split rather than the finished one (§3),
> and headline numbers cover a **rolling seven days** rather than a calendar
> week (§4).

## The idea in one line

**Take Sunsama's daily planner exactly as it works, and make every task belong to
a quest — so the planner can tell you, before and after the fact, how much of
your day went to the things you actually care about.**

Sunsama gives us the mechanics people already understand (day columns, estimates,
a planned-time total per day, drag onto a day, a backlog). Quest adds one column
of meaning: the quest chip on every task, and the split that falls out of it.

---

## 1. What goes away

| Removed | Why | Files |
|---|---|---|
| **Timer / time tracking** | Sunsama's model is *estimate → plan → complete*. A running clock is a different product (Clockify) and the least demo-able part — you can't show a week of real timing on a Loom. | `src/features/time-tracking/**`, `time_entries` table + schema, timer bits in Today |
| **"Plan my day" modal** | The day columns *are* the planning ritual. A modal on top of them is a second way to do the same thing. | `src/features/planning/components/plan-my-day-dialog.tsx` |
| **Insights as its own page** | Folded into Home. Five nav items, and the payoff number should meet you on arrival, not be a page you remember to visit. | `src/app/(app)/insights/page.tsx` → Home |

**Consequence — decided:** with timers gone, hours come from the task itself, in
two numbers:

- `estimate_minutes` — **planned**. Set when you schedule the task.
- `actual_minutes` (new, nullable) — **actual**. Typed in when you tick the task
  off; the completion control offers the estimate as a one-click default
  ("2:00 ✓" / "took longer…"), so the honest path is one click and the precise
  path is two.

Reporting rule: **actual where present, else the estimate of a done task.** So
the split is always answerable, and precision is opt-in per task. Planned vs.
actual then has somewhere to live — day headers show `4:20 planned · 3:50 actual`,
and quest pages can show whether a quest consistently overruns.

No new table, and the aggregations just move from `time_entries.duration` to
`COALESCE(actual_minutes, estimate_minutes)` over done tasks.

---

## 2. Navigation

```
Home · Today · Quests · Backlog · Settings
```

Same left sidebar, five items. (Your order had Quests before Today; I'd put
Today second because it's the screen used daily and Home is the "how am I
doing" screen — happy either way.)

---

## 3. Today — the Sunsama screen

The main event. Horizontal day columns, a slim right rail, no timers.

```
┌────────┬──────────────────────────────────────────────────────────┬─────────────┐
│  nav   │ [Today] [Filter]                          [Rail ▸]       │             │
│        │                                                          │  RIGHT RAIL │
│ Home   │  Monday          Tuesday         Wednesday               │  ┌────────┐ │
│ Today ◀│  August 17       August 18       August 19               │  │Timeline│ │
│ Quests │  ▓▓▓▓░░░░░░░░    ░░░░░░░░░░░░    ░░░░░░░░░░░░            │  │Quests  │ │
│ Backlog│  ● 3h20 quest · 1h00 admin                               │  ├────────┤ │
│ Setting│  ┌────────────────┐ ┌──────────┐ ┌──────────┐            │  │ 9  ▓▓▓ │ │
│        │  │ + Add task 4:20│ │ + Add 1:30│ │ + Add  — │           │  │10  ▓▓▓ │ │
│        │  ├────────────────┤ └──────────┘ └──────────┘            │  │11  ░░░ │ │
│        │  │ 9:30      0:20 │                                      │  │12      │ │
│        │  │ Set up Quest   │  ← task card                         │  │13  ▓▓  │ │
│        │  │ ✓ 📝  ● Ship v1│                                      │  │14  ░░░ │ │
│        │  ├────────────────┤                                      │  └────────┘ │
│        │  │ 9:50      2:00 │                                      │             │
│        │  │ Build POC      │                                      │             │
│        │  │ ✓     ● Ship v1│                                      │             │
│        │  ├────────────────┤                                      │             │
│        │  │ ~Daily admin~  │  ← done: struck through, dimmed      │             │
│        │  │ ✓     ○ Admin  │                                      │             │
│        │  └────────────────┘                                      │             │
└────────┴──────────────────────────────────────────────────────────┴─────────────┘
```

**Day column header** (each column):
- Weekday + date, big and light like the screenshot.
- Progress bar = done minutes / planned minutes.
- **Quest addition:** under the *first* column only, a split line —
  `3h45 quest · 0h30 admin · 88% of the plan` with a two-tone bar. This is the
  whole product in one line, on the screen people live in.
  **As built:** the line reports the *planned* split. Reporting finished work
  instead meant one early admin task announced the day was 0% quest before
  lunch — a plan's honest question is what today is *for*. What actually
  happened is the week's question, and Home answers it. A second line appears
  once anything is done: `0:40 of 1:20 banked so far went to quests`.
- "Add task" row with the day's total planned time on the right (`4:20`), exactly
  as Sunsama does.

**Task card:**
```
┌──────────────────────────────────┐
│ 9:30                        0:20 │  projected start · planned
│ Build prototype POC              │  title (inline-editable)
│ ✓  📝                  ● Ship v1 │  done · notes · quest chip
└──────────────────────────────────┘
```
- Projected start time is **computed**, not stored: day starts at 09:00
  (setting, hardcoded for now), each task consumes its estimate in list order.
  That's what fills the timeline rail too. Zero schema cost, and it's the detail
  that makes the screen read as Sunsama.
- Quest chip is the colored dot + name, click to change quest (existing picker).
  No quest = `○ Admin`.
- Row menu: edit, estimate, move to day…, send to backlog, delete.

**Right rail** (collapsible; as built the state is per-visit, not stored):
- **Timeline tab** — read-only hour grid 6:00–22:00 with the projected blocks in
  quest colors. Replaces the fake-calendar column; no sync, no drag, honest.
- **Quests tab** — this week per quest: colored bar, hours planned vs. target,
  count of tasks scheduled. The "weekly objectives" panel from your second
  screenshot, in Quest's language.

**Scheduling / moving work — drag is in scope:**
1. **Drag** — between day columns, from the backlog into a day, and reordering
   within a day. Reorder is what makes the projected start times meaningful, so
   it's part of the same job. Optimistic move on drop, one `moveTask` action
   writing `planned_date` + `sort_order` together.
   **As built:** native HTML5 drag rather than dnd-kit — it's the pattern the
   repo already used, it costs no dependency, and it sidesteps dnd-kit's React
   19 peer-dependency situation.
2. **Day picker** ships alongside it (Today / Tomorrow / date / Backlog in the
   row menu) — it's ~an hour of work, covers touch and keyboard, and means a
   flaky drag on camera is never a dead end.

Cost note: this is the most expensive interaction on the list. If it eats the
week it comes out of Settings-stub and right-rail polish, not out of Home.

### 3b. Task detail — the stripped-down panel

Clicking a card opens a dialog. Sunsama's version carries channel, priority
flag, start date, due date, subtasks, timer, notes, comments and an activity
feed; the POC keeps only what feeds a plan or the metric:

```
┌────────────────────────────────────────────────────┐
│ QUEST                                              │
│ ● Ship v1 ▾                    [Mon 17 Aug ▾] ⋯  ✕ │
│                                                    │
│ ☐  Build prototype POC          ACTUAL   PLANNED   │
│                                   1:45      2:00   │
│                                                    │
│ Notes…                                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

- **`ACTUAL` / `PLANNED`, borrowed verbatim.** Two click-to-edit `h:mm` fields.
  That pair *is* the timer's output in Sunsama, so lifting the display and
  dropping the clock keeps the vocabulary and loses only the stopwatch. Ticking
  the checkbox pre-fills `ACTUAL` with `PLANNED`, editable in place.
- Quest picker where Sunsama has `# channel` — the one substitution that carries
  the whole product idea.
- Date picker sets `planned_date` (or "Backlog").
- `⋯` → duplicate, send to backlog, delete.
- **Cut:** subtasks, due date separate from start date, priority flag, comments,
  attachments, activity feed, expand-to-page, Focus/Pomodoro mode. None of them
  change the quest/admin split.

The timer is a clean later addition, not a hole: a Start button would write into
the same `ACTUAL` field, so nothing about this layout would have to move.

**Left-over work:** unfinished tasks from before today appear as a thin
`3 left over from earlier ▾` strip above the first column, each with a one-click
"pull to today". Keeps Sunsama's "nothing silently rots" behaviour without a
whole second list.

---

## 4. Home — the overview

Read-only, scannable, no interactions except links. This is the Loom's opening
shot and the "how am I doing" answer.

**As built:** the headline covers a **rolling seven days**, not the calendar
week. On a Monday morning a calendar week is one day old and every quest looks
abandoned — which says something about the calendar, not the work. Week-over-week
*series* (the trend chart, a quest's history bars) still break on Monday, where
the boundary is the whole point.

```
┌────────┬──────────────────────────────────────────────────────────┐
│  nav   │  Good morning, Ruskin              Monday, 17 August     │
│        │                                                          │
│        │  ┌── THIS WEEK ──────────────────────────────────────┐   │
│        │  │  12h 40m on quests · 4h 10m admin                  │   │
│        │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░                │   │
│        │  │  75% of your planned time went to quests           │   │
│        │  │  ▁▃▅▂ last 4 weeks                                 │   │
│        │  └───────────────────────────────────────────────────┘   │
│        │                                                          │
│        │  ┌── TODAY ─────────────┐ ┌── NEEDS ATTENTION ───────┐   │
│        │  │ 5 tasks · 4h20       │ │ ● Learn Spanish          │   │
│        │  │ ▓▓▓▓░░░ 1 of 5 done  │ │   nothing planned in 8d  │   │
│        │  │ ● Ship v1     2h20   │ │ ● Fitness                │   │
│        │  │ ● Spanish     1h00   │ │   2h of 5h target        │   │
│        │  │ ○ Admin       1h00   │ └──────────────────────────┘   │
│        │  │ Open today →         │                                │
│        │  └──────────────────────┘                                │
│        │                                                          │
│        │  ACTIVE QUESTS                              Manage →     │
│        │  ┌──────────────────┐ ┌──────────────────┐               │
│        │  │ ● Ship v1        │ │ ● Learn Spanish  │  ← click →    │
│        │  │ On track         │ │ At risk          │    detail     │
│        │  │ 6h20 this week   │ │ 1h00 this week   │               │
│        │  │ ▓▓▓▓▓▓▓░ of 8h   │ │ ▓░░░░░░░ of 5h   │               │
│        │  │ next: Build POC  │ │ next: Lesson 12  │               │
│        │  └──────────────────┘ └──────────────────┘               │
└────────┴──────────────────────────────────────────────────────────┘
```

Everything above already has a query behind it (`getInsights`, `getTodaySplit`,
`listQuestsWithStats`) — it's re-composition, not new work. "Needs attention" is
the one new derivation: active quests with zero planned/done minutes this week,
or under half their target.

---

## 5. Quests

**List** — mostly what exists, tightened:
- `+ New quest` in the header; cards in a 2-up grid; **click anywhere on a card
  goes to detail** (today the click target is smaller than it looks).
- Sections: Active / Completed / Archived (archived collapsed).
- Card: color dot, name, health chip, hours this week + target bar, open task
  count, `⋯` menu → edit / complete / archive / delete.

**Detail** — `/quests/[id]`:
```
● Learn Spanish                        [On track ▾] [Edit] [⋯]
────────────────────────────────────────────────────────────────
┌── THIS WEEK ─────────────────┐  ┌── PEOPLE ─────────────┐
│ 4h 10m                       │  │ ⚠️ STUB               │
│ ▓▓▓▓▓▓░░ of a 6h target      │  │ 142 people share this │
│ ▁▃▅▂  last 4 weeks           │  │ quest                 │
└──────────────────────────────┘  │ Also pursuing:        │
                                  │ · Read 20 books       │
┌── TASKS ─────────────────────┐  │ · Move to Spain       │
│ + Add a task…                │  └───────────────────────┘
│ ☐ Lesson 12       Tue  0:45  │  ┌── MILESTONES ─────────┐
│ ☐ Order textbook  backlog    │  │ ⚠️ STUB               │
│ ☑ Lesson 11       Mon  0:45  │  │ ✓ A1 complete         │
└──────────────────────────────┘  │ ◔ B1 by December      │
                                  └───────────────────────┘
```
Adds a `description` field to quests (one text column) so the detail page has
something to say, plus a "why this quest" line that's good on camera.

---

## 6. Backlog

Capture and triage, in Sunsama's **time-horizon buckets** — the honest question
isn't "which list is this on", it's "when am I realistically doing this, if ever".

```
Backlog                     [Group: Horizon ▾]        [+ Add task]
──────────────────────────────────────────────────────────────────
 Ⓦ  This week or two                                     2 tasks  +
    ☐ Write launch email          ● Ship v1     0:30    [Plan ▾]
    ☐ Order textbook              ● Spanish       —     [Plan ▾]
 Ⓜ  This month                                           1 task   +
    ☐ Renew domain                ○ Admin      0:15     [Plan ▾]
 Ⓠ  This quarter                                         No tasks +
 Ⓨ  This year                                            No tasks +
 Ⓢ  Someday                                              No tasks +
 Ⓝ  Never                                                No tasks +
```

- Six fixed buckets, exactly Sunsama's, each with its own inline `+`. New capture
  lands in "This week or two" unless you say otherwise.
- **`[Group: Horizon ▾]` toggles to `Quest`** — same rows, regrouped under quest
  headers with a per-quest count. That view answers "which quest is starved", so
  it's worth the toggle; horizon is the default because it matches the screenshot
  and drives triage.
- Buckets are **drag targets** both ways: drag a task into `Never` to kill it
  honestly, or drag it out of the backlog onto a day column in Today.
- `[Plan ▾]` = Today / Tomorrow / pick a date; writes `planned_date`, task leaves
  the backlog and appears in that day's column.
- Row: click to open the detail panel (§3b); `⋯` → change quest, change horizon,
  delete.

Costs one nullable `horizon` enum on `tasks`. "Never" is a genuinely good line
to say on camera.

---

## 7. Settings

All integration rows are **visual stubs** — labelled as such, per repo rule 7.

```
Settings

┌── ACCOUNT ────────────────────────────────────────────────┐
│ Ruskin Janowski · ruskin@orionlabs.co.za                   │
│ Week starts Monday · Day starts 09:00 · Time zone (auto)   │
└───────────────────────────────────────────────────────────┘

┌── CALENDARS ───────────────────────── Coming soon ────────┐
│ Two-way sync: your meetings appear in the day, your        │
│ planned tasks appear in your calendar.                     │
│  Google Calendar   [Connect]   ·  Outlook       [Connect]  │
│  Apple Calendar    [Connect]   ·  CalDAV        [Connect]  │
└───────────────────────────────────────────────────────────┘

┌── TASK PLANNERS ───────────────────── Coming soon ────────┐
│ Pull work in from where your team already tracks it, then  │
│ attach it to a quest.                                      │
│  Jira  ·  ClickUp  ·  Linear  ·  Asana  ·  Todoist  ·      │
│  Notion  ·  Trello  ·  GitHub Issues        [Connect]      │
└───────────────────────────────────────────────────────────┘

┌── PRIVACY (per quest) ──────────────── Coming soon ───────┐
│ ● Ship v1        Private ▾                                 │
│ ● Learn Spanish  Anonymous ▾                               │
│ Private by default. Sharing is an explicit act, per quest. │
└───────────────────────────────────────────────────────────┘

┌── DEMO DATA ──────────────────────────────────────────────┐
│ [Reset demo data]                                          │
└───────────────────────────────────────────────────────────┘
```
Each `[Connect]` opens a small dialog: what the integration would do, one line on
how it maps to quests ("imported issues land in the backlog, unassigned to a
quest — attaching them is the point"), and a disabled button. Better on a Loom
than a dead button, and it shows the thinking without faking a login.

---

## 8. Data model changes

| Change | Cost |
|---|---|
| Drop `time_entries` table + `src/features/time-tracking/**` | one migration, deletes ~10 files |
| `tasks.actual_minutes integer` (nullable) | one column |
| `tasks.horizon` enum (`week`/`month`/`quarter`/`year`/`someday`/`never`, nullable) | one column + enum |
| `quests.description text` (nullable) | one column |
| Aggregations move from `time_entries.duration` → `COALESCE(actual_minutes, estimate_minutes)` over done tasks | rewrite of `insights/queries.ts`, `quests/queries.ts` stats |
| Re-seed demo data: ~4 weeks of tasks with estimates, actuals and done flags across 4 quests + admin | rewrite `features/demo/data.ts` |
| No change | `tasks.planned_date` (null = backlog) stays the scheduling mechanism; `quest_id IS NULL` stays Admin; `sort_order` carries drag ordering |

Nothing else in the schema moves.

---

## 9. Build order

1. **Strip & re-base** — remove time tracking, plan-my-day and the Insights
   page; add `actual_minutes` + `quests.description`; move aggregations onto
   `COALESCE(actual, estimate)`; re-seed four weeks. *(Everything still compiles
   and Today still lists tasks.)*
2. **Today** — day columns, task cards with projected start times, split header,
   completion-with-actual control, day picker.
3. **Drag** — dnd-kit across day columns, backlog → day, reorder within a day.
4. **Home** — week split, planned-vs-actual, today card, needs-attention, quest grid.
5. **Quests** — clickable cards, detail page polish, description field.
6. **Backlog** — grouped view, schedule control, drag source.
7. **Settings** — integration stubs.
8. *(Stretch)* right rail: projected timeline + quests-this-week tab.

Steps 1–7 are the demo. Step 3 is the risk; if it overruns, the day picker from
step 2 already covers the scheduling story and step 8 is what gets dropped.

---

## 10. Decisions

| Question | Decided |
|---|---|
| Time source | **`PLANNED` + optional manual `ACTUAL`**, Sunsama's own labels, minus the stopwatch. Report `COALESCE(actual, estimate)` over done tasks. A timer can be added later without moving any of this. |
| Drag and drop | **Build it properly** — day↔day, backlog→day, backlog horizon buckets, reorder. Day picker ships alongside as the fallback path. |
| Insights | **Folded into Home.** Five nav items. |
| Task detail | **Stripped panel** (§3b): quest, date, planned/actual, notes. No subtasks, comments, activity feed, priority, due date or Focus mode. |
| Backlog | **Sunsama's six time-horizon buckets**, with a group-by-quest toggle. |

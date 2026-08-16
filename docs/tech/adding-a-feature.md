# Adding a feature

The repo is laid out so that most of PRODUCT_PLAN's P1 list is additive. This is
the path a new feature takes.

## 1. Does it need a column?

Add a module under `src/db/schema/`, re-export it from `schema/index.ts`, then:

```bash
npm run db:generate
```

Review the generated SQL before running `npm run db:migrate` — Drizzle is good
but a migration is the one thing that isn't cheap to undo.

## 2. Where the logic goes

Inside `src/features/<feature>/`:

| File | Contains | Imports allowed |
|---|---|---|
| `domain.ts` | Pure functions: maths, rules, formatting of *meaning* | nothing from db/React/Next |
| `queries.ts` | Reads. Returns rows, marked `"server-only"` | db, other features' queries |
| `validation.ts` | zod schemas, shared by forms and actions | zod only |
| `actions.ts` | Writes, marked `"use server"` | db, validation, session, revalidate |
| `components/` | Feature UI | anything |

If two features need the same helper, it moves to `src/lib`.

## 3. Writing an action

Every action follows the same four steps:

```ts
export async function doThing(input: DoThingInput): Promise<ActionResult<Thing>> {
  const user = await requireUser();                      // 1. session, never an argument
  const parsed = doThingSchema.safeParse(input);         // 2. validate
  if (!parsed.success) return failFromZod(parsed.error);

  const [thing] = await db
    .update(things)
    .set(parsed.data)
    .where(and(eq(things.id, parsed.data.id), eq(things.userId, user.id))) // 3. scope by user
    .returning();

  if (!thing) return fail("That thing no longer exists.");

  revalidateWorkspace();                                 // 4. refresh the surfaces
  return ok(thing);
}
```

Never throw for an expected problem, and never trust an id from the client
without the `userId` in the same `where` clause.

## 4. Wiring it to the UI

Client components call actions through `useAction`:

```tsx
const { run, pending } = useAction(doThing, { successMessage: "Done." });
```

That gives pending state and an error toast for free. Pages stay server
components: read with queries, render, pass the rows down.

## 5. Where the planned features slot in

| PRODUCT_PLAN item | Where it lands |
|---|---|
| 1.2 Plan-my-day ritual | New `features/planning/` — a dialog over Today that batches `updateTask` calls. Nothing else changes. |
| 1.4 Day calendar column | New column in `app/(app)/today/page.tsx` beside `<TaskList />`; needs a start-time on tasks or reads `time_entries` directly. The only layout-breaking item. |
| 1.6 Timeframe selector | Already built — `TimeframeTabs` + `rangeForTimeframe`. |
| 1.8 Share-of-time context | Already built — `timeContext()` in `features/insights/domain.ts`. Change the denominator there, once. |
| 2.3 Canonical quest autocomplete | Static list inside `features/quests/components/quest-dialog.tsx`. |
| P3 real social | Replace `social-discovery-stub.tsx` with a query. Nothing depends on the stub. |

## 6. Before you push

```bash
npm run typecheck && npm run lint && npm run build
```

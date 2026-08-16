"use server";

import { type ActionResult, fail, ok } from "@/lib/action";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/timezone.server";
import { seedDemoData } from "./seed";

/**
 * PRODUCT_PLAN §5: a public Vercel URL with a writable database means anyone
 * with the link can edit the demo data. This is the escape hatch — and exactly
 * what's needed between Loom takes.
 *
 * It only ever reseeds the *calling* user's data, and the whole feature can be
 * switched off with `ALLOW_DEMO_RESET`.
 */
export async function resetDemoData(): Promise<ActionResult<{ entries: number }>> {
  if (process.env.ALLOW_DEMO_RESET !== "true") {
    return fail("Demo reset is disabled on this deployment.");
  }

  const user = await requireUser();
  const timeZone = await getTimeZone();

  const result = await seedDemoData(user.id, { timeZone });

  revalidateWorkspace();
  return ok({ entries: result.entries });
}

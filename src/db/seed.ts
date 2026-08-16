import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { seedDemoData } from "@/features/demo/seed";

/**
 * Seeds the demo account and ~4 weeks of history.
 *
 *   npm run db:seed
 *
 * Idempotent: re-running replaces the demo user's data without touching any
 * other account, which is what "Reset demo data" does from inside the app.
 * The password is hashed with Better Auth's own hasher so the seeded account
 * signs in through the normal flow.
 */

const email = process.env.DEMO_USER_EMAIL ?? "demo@quest.app";
const password = process.env.DEMO_USER_PASSWORD ?? "questdemo123";
const name = process.env.DEMO_USER_NAME ?? "Demo";
const timeZone =
  process.env.SEED_TIME_ZONE ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

async function upsertDemoUser(): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return existing.id;

  const [user] = await db
    .insert(users)
    .values({ email, name, emailVerified: true })
    .returning({ id: users.id });

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await hashPassword(password),
  });

  return user.id;
}

async function main() {
  const userId = await upsertDemoUser();
  const result = await seedDemoData(userId, { timeZone });

  console.log(
    [
      `Seeded ${email} (time zone ${timeZone})`,
      `  ${result.quests} quests`,
      `  ${result.tasks} tasks`,
      `  ${result.entries} time entries`,
      "",
      `Sign in with ${email} / ${password}`,
    ].join("\n"),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Email + password only, on purpose (PRODUCT_PLAN 1.9): everything lives in
 * Neon, no extra vendor, and the users table is ours. Email verification,
 * password reset and OAuth are deferred to the 3-month plan.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: {
      /**
       * Let Postgres generate user ids so `users.id` stays a real uuid that the
       * product tables can reference; Better Auth keeps generating its own ids
       * for sessions, accounts and verifications.
       */
      generateId: (options) =>
        options.model === "user" || options.model === "users"
          ? false
          : crypto.randomUUID(),
    },
  },
  // Must stay last: it lets server actions set the session cookie.
  plugins: [nextCookies()],
});

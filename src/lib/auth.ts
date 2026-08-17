import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Origins Vercel gives us at runtime: the production domain, the branch alias
 * and the immutable per-deployment URL. Preview deployments get a fresh
 * hostname every push, so these can't live in a hand-written env var — and
 * Better Auth rejects any request whose `Origin` header isn't trusted
 * ("Invalid origin", 403), which is every browser sign-in on a URL it doesn't
 * know about.
 */
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
]
  .filter((host): host is string => Boolean(host))
  .map((host) => `https://${host}`);

const configuredURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

/**
 * On Vercel the deployment's own origin is a fact, not a guess, so it wins over
 * the configured URL — a `BETTER_AUTH_URL` left pointing at localhost shouldn't
 * be able to break the deployed app.
 */
const baseURL = vercelOrigins[0] ?? configuredURL;

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
  baseURL,
  trustedOrigins: [
    ...new Set([configuredURL, ...vercelOrigins].filter((url): url is string => Boolean(url))),
  ],
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

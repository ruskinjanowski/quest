import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon over HTTP: one round trip per query, no connection pool to manage,
 * which is what serverless Next.js wants.
 *
 * The connection is created lazily so that importing this module (which the
 * whole app does, transitively) never requires `DATABASE_URL` — `next build`
 * and unit tests can load the code without a database.
 *
 * Note: the HTTP driver has no interactive transactions. Anything that must be
 * atomic belongs in a single statement (see the partial unique index enforcing
 * one running timer per user).
 */

type Database = ReturnType<typeof createDatabase>;

function createDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Neon connection string.",
    );
  }

  return drizzle(neon(url), { schema });
}

let instance: Database | undefined;

export function getDb(): Database {
  instance ??= createDatabase();
  return instance;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const database = getDb();
    const value = Reflect.get(database, property, receiver);
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export { schema };

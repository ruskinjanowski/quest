import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/**
 * The single place the app learns who is logged in.
 *
 * Every query and action takes a `userId` derived from here — nothing reads an
 * id out of a form field or a URL, which is what keeps one user's data out of
 * another's screens.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/** Deduped per request, so a page can call it from several components freely. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const { id, name, email } = session.user;
  return { id, name, email };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

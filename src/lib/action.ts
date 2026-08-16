import type { ZodError } from "zod";

/**
 * One return shape for every server action, so client components can handle
 * failure the same way everywhere instead of each form inventing its own
 * convention. Actions never throw for expected problems — they return `ok:false`.
 */

export type ActionResult<TData = undefined> =
  | { ok: true; data: TData }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult;
export function ok<TData>(data: TData): ActionResult<TData>;
export function ok<TData>(data?: TData): ActionResult<TData | undefined> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function failFromZod(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }

  return fail(error.issues[0]?.message ?? "That input isn't valid.", fieldErrors);
}

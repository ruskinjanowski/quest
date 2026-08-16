"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action";

/**
 * Calls a server action inside a transition and surfaces failures as a toast.
 *
 * Every mutating control in the app goes through this, so pending state and
 * error handling look the same everywhere and no component has to remember to
 * check `result.ok`.
 */
export function useAction<TArgs extends unknown[], TData>(
  action: (...args: TArgs) => Promise<ActionResult<TData>>,
  options: { onSuccess?: (data: TData) => void; successMessage?: string } = {},
) {
  const [pending, startTransition] = useTransition();
  const { onSuccess, successMessage } = options;

  const run = useCallback(
    (...args: TArgs) => {
      startTransition(async () => {
        const result = await action(...args);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        if (successMessage) toast.success(successMessage);
        onSuccess?.(result.data);
      });
    },
    [action, onSuccess, successMessage],
  );

  return { run, pending };
}

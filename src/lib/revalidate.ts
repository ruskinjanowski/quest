import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Every mutation touches the same handful of surfaces (a task's quest changes
 * the board, the backlog, the quest list and the week's split), so actions
 * revalidate the workspace as a unit instead of each guessing which pages care.
 */
export function revalidateWorkspace(): void {
  revalidatePath("/home");
  revalidatePath("/today");
  revalidatePath("/backlog");
  revalidatePath("/quests", "layout");
  revalidatePath("/settings");
}

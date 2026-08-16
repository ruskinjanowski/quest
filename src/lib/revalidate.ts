import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Every mutation touches the same three surfaces (a task's quest changes the
 * Today list, the quest list and the Insights split), so actions revalidate the
 * workspace as a unit instead of each guessing which pages care.
 */
export function revalidateWorkspace(): void {
  revalidatePath("/today");
  revalidatePath("/quests", "layout");
  revalidatePath("/insights");
}

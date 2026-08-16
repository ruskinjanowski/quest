import { cn } from "@/lib/utils";
import { questColorHex } from "@/lib/quest-colors";

/**
 * The quest's colour, wherever a quest is mentioned. A hollow dot means Admin —
 * it has no quest, and the visual language should say so at a glance.
 */
export function QuestDot({
  color,
  className,
}: {
  color: string | null | undefined;
  className?: string;
}) {
  const hex = questColorHex(color);

  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={
        color
          ? { backgroundColor: hex }
          : { boxShadow: `inset 0 0 0 1.5px ${hex}`, backgroundColor: "transparent" }
      }
    />
  );
}

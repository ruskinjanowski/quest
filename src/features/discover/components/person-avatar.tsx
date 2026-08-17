import { formatCount, initialsFor } from "../domain";
import { cn } from "@/lib/utils";

/**
 * Initials in a circle. Deliberately neutral rather than tinted by the bucket's
 * colour: the palette in this app means *quest*, and reusing it for people
 * would say these two things are the same kind of thing.
 */
export function PersonAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-muted text-foreground flex shrink-0 items-center justify-center rounded-full font-medium",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
        className,
      )}
    >
      {initialsFor(name) || "?"}
    </span>
  );
}

/** An overlapping row of faces — the "there are people in here" signal. */
export function AvatarStack({
  names,
  extra,
}: {
  names: readonly string[];
  /** How many more aren't shown. */
  extra: number;
}) {
  return (
    <div className="flex items-center">
      {names.map((name) => (
        <PersonAvatar
          key={name}
          name={name}
          size="sm"
          className="ring-background -ml-1.5 ring-2 first:ml-0"
        />
      ))}
      {extra > 0 && (
        <span className="text-muted-foreground ml-2 text-xs tabular-nums">
          +{formatCount(extra)}
        </span>
      )}
    </div>
  );
}

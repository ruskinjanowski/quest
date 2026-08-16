/**
 * Quest colours are a closed palette, stored by key (`quests.color`) rather
 * than as raw hex. That keeps the database free of presentation detail and
 * lets the palette be restyled — or made theme-aware — in one place.
 *
 * Admin is not a quest and has no row; it gets a deliberately grey, recessive
 * swatch so the eye reads it as the leftover bucket it is.
 */

export type QuestColorKey =
  | "violet"
  | "blue"
  | "teal"
  | "green"
  | "amber"
  | "orange"
  | "rose"
  | "slate";

export type QuestColor = {
  key: QuestColorKey;
  label: string;
  /** Used for dots, bars and chart series alike, so one quest reads the same everywhere. */
  hex: string;
};

export const QUEST_COLORS: readonly QuestColor[] = [
  { key: "violet", label: "Violet", hex: "#7c5cff" },
  { key: "blue", label: "Blue", hex: "#2f7ff0" },
  { key: "teal", label: "Teal", hex: "#12a3a3" },
  { key: "green", label: "Green", hex: "#2fa464" },
  { key: "amber", label: "Amber", hex: "#d99a06" },
  { key: "orange", label: "Orange", hex: "#e2703a" },
  { key: "rose", label: "Rose", hex: "#e0517a" },
  { key: "slate", label: "Slate", hex: "#64748b" },
] as const;

export const DEFAULT_QUEST_COLOR: QuestColorKey = "violet";

/**
 * The Admin bucket's swatch — muted on purpose, and a token rather than a hex
 * so it follows the theme. Quest colours stay literal hex: they are user data,
 * not theme, and must look the same in light and dark.
 */
export const ADMIN_COLOR = "var(--admin)";

const COLOR_BY_KEY = new Map(QUEST_COLORS.map((color) => [color.key, color]));

export function questColorHex(key: string | null | undefined): string {
  if (!key) return ADMIN_COLOR;
  return COLOR_BY_KEY.get(key as QuestColorKey)?.hex ?? ADMIN_COLOR;
}

export function isQuestColorKey(value: string): value is QuestColorKey {
  return COLOR_BY_KEY.has(value as QuestColorKey);
}

/** Picks the next unused colour when creating a quest, so new quests look distinct. */
export function nextQuestColor(usedKeys: readonly string[]): QuestColorKey {
  const unused = QUEST_COLORS.find((color) => !usedKeys.includes(color.key));
  return unused?.key ?? DEFAULT_QUEST_COLOR;
}

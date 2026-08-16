/**
 * Single entry point for the Drizzle schema.
 *
 * `drizzle.config.ts` and `src/db/index.ts` both point here, so adding a table
 * means adding a module next to this file and re-exporting it below.
 */

export * from "./auth";
export * from "./quests";
export * from "./tasks";
export * from "./time-entries";
export * from "./relations";

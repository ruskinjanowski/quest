import { relations } from "drizzle-orm";
import { users } from "./auth";
import { quests } from "./quests";
import { tasks } from "./tasks";
import { timeEntries } from "./time-entries";

export const usersRelations = relations(users, ({ many }) => ({
  quests: many(quests),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  user: one(users, { fields: [quests.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  quest: one(quests, { fields: [tasks.questId], references: [quests.id] }),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
}));

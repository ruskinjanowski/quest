import { relations } from "drizzle-orm";
import { users } from "./auth";
import { quests } from "./quests";
import { tasks } from "./tasks";

export const usersRelations = relations(users, ({ many }) => ({
  quests: many(quests),
  tasks: many(tasks),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  user: one(users, { fields: [quests.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  quest: one(quests, { fields: [tasks.questId], references: [quests.id] }),
}));

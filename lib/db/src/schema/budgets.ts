import { pgTable, text, serial, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  limit: decimal("limit", { precision: 12, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default("80"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;

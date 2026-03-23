import { pgTable, text, serial, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financialRulesTable = pgTable("financial_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull().$type<"budget_alert" | "large_transaction" | "recurring_detected" | "category_spike" | "custom">(),
  conditions: jsonb("conditions").notNull().$type<Record<string, unknown>>(),
  actions: jsonb("actions").notNull().$type<Record<string, unknown>>(),
  isActive: boolean("is_active").notNull().default(true),
  triggerCount: decimal("trigger_count", { precision: 10, scale: 0 }).notNull().default("0"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinancialRuleSchema = createInsertSchema(financialRulesTable).omit({ id: true, createdAt: true, triggerCount: true });
export type InsertFinancialRule = z.infer<typeof insertFinancialRuleSchema>;
export type FinancialRule = typeof financialRulesTable.$inferSelect;

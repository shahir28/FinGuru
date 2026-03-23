import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { budgetsTable, transactionsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/budgets", async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const budgets = await db.select().from(budgetsTable)
      .where(and(eq(budgetsTable.month, month), eq(budgetsTable.year, year)));

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const spending = await db.select({
      category: transactionsTable.category,
      total: sum(transactionsTable.amount),
    }).from(transactionsTable)
      .where(and(
        eq(transactionsTable.type, 'expense'),
        gte(transactionsTable.date, startDate),
        lte(transactionsTable.date, endDate),
      ))
      .groupBy(transactionsTable.category);

    const spendingMap = Object.fromEntries(spending.map(s => [s.category, parseFloat(s.total as unknown as string || "0")]));

    res.json(budgets.map(b => ({
      ...b,
      limit: parseFloat(b.limit as unknown as string),
      alertThreshold: parseFloat(b.alertThreshold as unknown as string || "80"),
      spent: spendingMap[b.category] ?? 0,
      createdAt: b.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list budgets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold } = req.body;
    const [budget] = await db.insert(budgetsTable).values({
      category,
      limit: limit.toString(),
      month,
      year,
      alertThreshold: alertThreshold ? alertThreshold.toString() : "80",
    }).returning();
    res.status(201).json({
      ...budget,
      limit: parseFloat(budget.limit as unknown as string),
      alertThreshold: parseFloat(budget.alertThreshold as unknown as string || "80"),
      spent: 0,
      createdAt: budget.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create budget");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/budgets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, string> = {};
    if (req.body.limit !== undefined) updates.limit = req.body.limit.toString();
    if (req.body.alertThreshold !== undefined) updates.alertThreshold = req.body.alertThreshold.toString();
    const [budget] = await db.update(budgetsTable).set({ ...updates, updatedAt: new Date() }).where(eq(budgetsTable.id, id)).returning();
    if (!budget) return res.status(404).json({ error: "Budget not found" });
    res.json({ ...budget, limit: parseFloat(budget.limit as unknown as string), alertThreshold: parseFloat(budget.alertThreshold as unknown as string || "80"), spent: 0, createdAt: budget.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update budget");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/budgets/:id", async (req, res) => {
  try {
    await db.delete(budgetsTable).where(eq(budgetsTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete budget");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

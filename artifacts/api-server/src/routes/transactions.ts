import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (req.query.category) {
      conditions.push(eq(transactionsTable.category, req.query.category as string));
    }
    if (req.query.accountId) {
      conditions.push(eq(transactionsTable.accountId, parseInt(req.query.accountId as string)));
    }
    if (req.query.type) {
      conditions.push(eq(transactionsTable.type, req.query.type as string));
    }
    if (req.query.startDate) {
      conditions.push(gte(transactionsTable.date, req.query.startDate as string));
    }
    if (req.query.endDate) {
      conditions.push(lte(transactionsTable.date, req.query.endDate as string));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db.select().from(transactionsTable)
        .where(where)
        .orderBy(desc(transactionsTable.date))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(transactionsTable).where(where),
    ]);

    const total = totalResult[0]?.count ?? 0;

    res.json({
      data: data.map(t => ({
        ...t,
        amount: parseFloat(t.amount as unknown as string),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const { accountId, amount, description, category, subcategory, type, date, merchant, isRecurring, notes } = req.body;
    const [transaction] = await db.insert(transactionsTable).values({
      accountId,
      amount: amount.toString(),
      description,
      category,
      subcategory,
      type,
      date,
      merchant,
      isRecurring: isRecurring ?? false,
      aiCategorized: false,
      notes,
    }).returning();
    res.status(201).json({
      ...transaction,
      amount: parseFloat(transaction.amount as unknown as string),
      createdAt: transaction.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ ...transaction, amount: parseFloat(transaction.amount as unknown as string), createdAt: transaction.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body };
    if (updates.amount) updates.amount = updates.amount.toString();
    const [transaction] = await db.update(transactionsTable).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(transactionsTable.id, id)).returning();
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    res.json({ ...transaction, amount: parseFloat(transaction.amount as unknown as string), createdAt: transaction.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/transactions/bulk-categorize", async (req, res) => {
  try {
    const uncategorized = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.aiCategorized, false))
      .limit(50);

    if (uncategorized.length === 0) {
      return res.json({ categorized: 0, failed: 0, results: [] });
    }

    const descriptions = uncategorized.map(t => `ID ${t.id}: "${t.description}" ($${t.amount})`).join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2000,
      messages: [{
        role: "system",
        content: "You are a financial transaction categorizer. Categorize each transaction into one of: Food & Dining, Shopping, Transportation, Entertainment, Health & Fitness, Utilities, Housing, Income, Transfer, Travel, Education, Personal Care, Investments, Subscriptions, Other. Respond with JSON array: [{id, category, confidence}]"
      }, {
        role: "user",
        content: `Categorize these transactions:\n${descriptions}`
      }]
    });

    let results = [];
    try {
      const content = completion.choices[0]?.message?.content ?? "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      results = [];
    }

    let categorized = 0;
    let failed = 0;

    for (const result of results) {
      try {
        await db.update(transactionsTable).set({
          category: result.category,
          aiCategorized: true,
          updatedAt: new Date(),
        }).where(eq(transactionsTable.id, result.id));
        categorized++;
      } catch {
        failed++;
      }
    }

    res.json({ categorized, failed, results });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk categorize");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

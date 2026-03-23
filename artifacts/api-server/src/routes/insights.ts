import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// Simple in-memory cache for AI-heavy endpoints
let aiInsightCache = "";
let aiInsightCacheTime = 0;
let anomaliesCache: unknown[] = [];
let anomaliesCacheTime = 0;
const AI_INSIGHT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ANOMALIES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get("/insights/spending-trends", async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const label = `${year}-${String(month).padStart(2, '0')}`;

      const [incomeRes, expenseRes] = await Promise.all([
        db.select({ total: sum(transactionsTable.amount) })
          .from(transactionsTable)
          .where(and(eq(transactionsTable.type, 'income'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
        db.select({ total: sum(transactionsTable.amount) })
          .from(transactionsTable)
          .where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      ]);

      const income = parseFloat(incomeRes[0]?.total as unknown as string || "0") || 0;
      const expenses = parseFloat(expenseRes[0]?.total as unknown as string || "0") || 0;

      trends.push({ month: label, income, expenses, savings: income - expenses });
    }

    res.json(trends);
  } catch (err) {
    req.log.error({ err }, "Failed to get spending trends");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/insights/category-breakdown", async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const breakdown = await db.select({
      category: transactionsTable.category,
      amount: sum(transactionsTable.amount),
      transactionCount: count(),
    }).from(transactionsTable)
      .where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate)))
      .groupBy(transactionsTable.category);

    const totalExpenses = breakdown.reduce((s, b) => s + parseFloat(b.amount as unknown as string || "0"), 0);

    const colors: Record<string, string> = {
      "Food & Dining": "#FF6384",
      "Shopping": "#36A2EB",
      "Transportation": "#FFCE56",
      "Entertainment": "#4BC0C0",
      "Health & Fitness": "#9966FF",
      "Utilities": "#FF9F40",
      "Housing": "#FF6384",
      "Travel": "#36A2EB",
      "Education": "#FFCE56",
      "Subscriptions": "#4BC0C0",
      "Personal Care": "#9966FF",
      "Other": "#C9CBCF",
    };

    const colorPalette = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#C9CBCF"];

    res.json(breakdown.map((b, i) => ({
      category: b.category,
      amount: parseFloat(b.amount as unknown as string || "0"),
      percentage: totalExpenses > 0 ? Math.round((parseFloat(b.amount as unknown as string || "0") / totalExpenses) * 100) : 0,
      transactionCount: b.transactionCount,
      color: colors[b.category] || colorPalette[i % colorPalette.length],
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get category breakdown");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/insights/summary", async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastYear = lastMonthDate.getFullYear();
    const lastStartDate = `${lastYear}-${String(lastMonth).padStart(2, '0')}-01`;
    const lastEndDate = `${lastYear}-${String(lastMonth).padStart(2, '0')}-31`;

    const [accounts, incomeRes, expensesRes, lastIncomeRes, lastExpensesRes] = await Promise.all([
      db.select().from(accountsTable).where(eq(accountsTable.isActive, true)),
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'income'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'income'), gte(transactionsTable.date, lastStartDate), lte(transactionsTable.date, lastEndDate))),
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, lastStartDate), lte(transactionsTable.date, lastEndDate))),
    ]);

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance as unknown as string || "0"), 0);
    const monthlyIncome = parseFloat(incomeRes[0]?.total as unknown as string || "0") || 0;
    const monthlyExpenses = parseFloat(expensesRes[0]?.total as unknown as string || "0") || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;
    const lastIncome = parseFloat(lastIncomeRes[0]?.total as unknown as string || "0") || 0;
    const lastExpenses = parseFloat(lastExpensesRes[0]?.total as unknown as string || "0") || 0;

    // Use cached AI insight if fresh, otherwise use rule-based fallback
    const isCacheFresh = aiInsightCache && (Date.now() - aiInsightCacheTime) < AI_INSIGHT_CACHE_TTL;
    let aiInsight = isCacheFresh
      ? aiInsightCache
      : savingsRate >= 20
      ? `Excellent! Your ${savingsRate}% savings rate puts you in the top tier of financial health — keep building that $${Math.round(totalBalance / 1000)}k net worth.`
      : savingsRate >= 10
      ? `Good progress! You're saving ${savingsRate}% of your income. Consider reducing your top expense category to push that rate above 20%.`
      : `Focus on increasing your savings rate — you're currently at ${savingsRate}%. Even small reductions in discretionary spending can make a big difference.`;

    // Generate AI insight asynchronously (non-blocking) and cache it for next request
    if (!isCacheFresh) openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 100,
      messages: [{
        role: "system",
        content: "You are a concise financial advisor. Provide one actionable insight in under 20 words."
      }, {
        role: "user",
        content: `Income: $${monthlyIncome.toFixed(0)}, expenses: $${monthlyExpenses.toFixed(0)}, savings rate: ${savingsRate}%, net worth: $${totalBalance.toFixed(0)}.`
      }]
    }).then(c => {
      aiInsightCache = c.choices[0]?.message?.content ?? "";
      aiInsightCacheTime = Date.now();
    }).catch(() => {});

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      netWorth: totalBalance,
      creditScore: 742,
      aiInsight,
      changeFromLastMonth: {
        income: monthlyIncome - lastIncome,
        expenses: monthlyExpenses - lastExpenses,
        savings: monthlySavings - (lastIncome - lastExpenses),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get financial summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/insights/ai-analysis", async (req, res) => {
  try {
    const { question, context } = req.body;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const [incomeRes, expensesRes, categoryBreakdown] = await Promise.all([
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'income'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      db.select({ category: transactionsTable.category, total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))).groupBy(transactionsTable.category),
    ]);

    const income = parseFloat(incomeRes[0]?.total as unknown as string || "0") || 0;
    const expenses = parseFloat(expensesRes[0]?.total as unknown as string || "0") || 0;
    const categories = categoryBreakdown.map(c => `${c.category}: $${parseFloat(c.total as unknown as string || "0").toFixed(2)}`).join(', ');

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 800,
      messages: [{
        role: "system",
        content: `You are a professional financial advisor for SmartFinance AI. Analyze the user's financial data and answer their questions with actionable recommendations.
        
User's current financial data:
- Monthly Income: $${income.toFixed(2)}
- Monthly Expenses: $${expenses.toFixed(2)}
- Savings: $${(income - expenses).toFixed(2)}
- Expense Categories: ${categories}
${context ? `Additional context: ${context}` : ''}

Respond with a JSON object: { "analysis": "detailed analysis", "recommendations": ["rec1", "rec2", "rec3"], "score": 7.5 }`
      }, {
        role: "user",
        content: question
      }]
    });

    let result = { analysis: "", recommendations: [] as string[], score: 7 };
    try {
      const content = completion.choices[0]?.message?.content ?? "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch {
      result.analysis = completion.choices[0]?.message?.content ?? "";
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get AI analysis");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/insights/anomalies", async (req, res) => {
  try {
    // Return cached anomalies if fresh
    if (anomaliesCache.length > 0 && (Date.now() - anomaliesCacheTime) < ANOMALIES_CACHE_TTL) {
      return res.json(anomaliesCache);
    }

    const recentTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.type, 'expense'))
      .orderBy(sql`created_at DESC`)
      .limit(100);

    if (recentTransactions.length === 0) {
      return res.json([]);
    }

    const txData = recentTransactions.slice(0, 15).map(t => ({
      id: t.id,
      description: t.description,
      amount: parseFloat(t.amount as unknown as string || "0"),
      category: t.category,
      date: t.date,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1000,
      messages: [{
        role: "system",
        content: "You are a financial fraud and anomaly detection AI. Analyze transactions and identify unusual spending patterns, potential duplicates, or suspicious activity. Return JSON array of anomalies with fields: {transactionId, description, amount, category, date, severity (low/medium/high), reason}"
      }, {
        role: "user",
        content: `Analyze these transactions for anomalies:\n${JSON.stringify(txData, null, 2)}\n\nReturn only genuine anomalies as JSON array. Empty array if none found.`
      }]
    });

    let anomalies = [];
    try {
      const content = completion.choices[0]?.message?.content ?? "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      anomalies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      anomalies = [];
    }

    // Cache the result
    anomaliesCache = anomalies;
    anomaliesCacheTime = Date.now();

    res.json(anomalies);
  } catch (err) {
    req.log.error({ err }, "Failed to detect anomalies");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/insights/tax-summary", async (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [incomeRes, categoryBreakdown] = await Promise.all([
      db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'income'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))),
      db.select({ category: transactionsTable.category, total: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.type, 'expense'), gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate))).groupBy(transactionsTable.category),
    ]);

    const totalIncome = parseFloat(incomeRes[0]?.total as unknown as string || "0") || 0;

    const deductibleCategories = new Set(["Health & Fitness", "Education", "Investments", "Utilities"]);
    const categories = categoryBreakdown.map(c => ({
      category: c.category,
      amount: parseFloat(c.total as unknown as string || "0"),
      isDeductible: deductibleCategories.has(c.category),
    }));

    const deductibleExpenses = categories.filter(c => c.isDeductible).reduce((s, c) => s + c.amount, 0);
    const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
    const estimatedTax = taxableIncome * 0.22;

    res.json({ year, totalIncome, taxableIncome, deductibleExpenses, estimatedTax, categories });
  } catch (err) {
    req.log.error({ err }, "Failed to get tax summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

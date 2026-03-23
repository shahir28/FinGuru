import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { accountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/accounts", async (req, res) => {
  try {
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.isActive, true));
    res.json(accounts.map(a => ({
      ...a,
      balance: parseFloat(a.balance as unknown as string),
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list accounts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/accounts", async (req, res) => {
  try {
    const { name, type, balance, currency = "USD", institution } = req.body;
    const [account] = await db.insert(accountsTable).values({
      name,
      type,
      balance: balance.toString(),
      currency,
      institution,
    }).returning();
    res.status(201).json({
      ...account,
      balance: parseFloat(account.balance as unknown as string),
      createdAt: account.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create account");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/conversations", async (req, res) => {
  try {
    const convs = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
    res.json(convs.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json({ ...conv, createdAt: conv.createdAt.toISOString(), updatedAt: conv.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
    res.json({
      ...conv,
      messages: msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;

    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    await db.insert(messages).values({ conversationId: id, role: "user", content });

    const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are Alex's personal AI financial advisor on SmartFinance AI. You have deep expertise in personal finance, investing, tax optimization, and budgeting. You provide actionable, personalized advice based on their financial data. Be concise, friendly, and data-driven. Use specific numbers when relevant. Today's date: ${new Date().toLocaleDateString()}.`
        },
        ...history.slice(-20).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
    res.end();
  }
});

export default router;

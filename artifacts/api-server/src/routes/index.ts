import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import insightsRouter from "./insights";
import openaiRouter from "./openai/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(insightsRouter);
router.use("/openai", openaiRouter);

export default router;

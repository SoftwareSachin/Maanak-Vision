import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import batchesRouter from "./batches";
import inspectionsRouter from "./inspections";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(batchesRouter);
router.use(inspectionsRouter);

export default router;

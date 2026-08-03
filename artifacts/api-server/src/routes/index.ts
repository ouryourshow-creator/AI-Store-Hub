import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import adminRouter from "./admin";
import storageRouter from "./storage";
import promoCodesRouter from "./promoCodes";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(promoCodesRouter);
router.use(categoriesRouter);

export default router;

import { Router } from "express";
import { createOrder, getOrders } from "../controllers/orderController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getOrders));
router.post("/", asyncHandler(createOrder));

export default router;

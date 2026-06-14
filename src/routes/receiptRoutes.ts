import { Router } from "express";
import { updateReceipt } from "../controllers/receiptController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.post("/", asyncHandler(updateReceipt));

export default router;

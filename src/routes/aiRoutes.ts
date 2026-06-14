import { Router } from "express";
import { chat } from "../controllers/aiController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.post("/chat", asyncHandler(chat));

export default router;

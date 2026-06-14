import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getAnalytics));

export default router;

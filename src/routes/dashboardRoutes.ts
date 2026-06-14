import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getDashboard));

export default router;

import { Router } from "express";
import {
  createCampaign,
  getCampaigns,
} from "../controllers/campaignController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getCampaigns));
router.post("/", asyncHandler(createCampaign));

export default router;

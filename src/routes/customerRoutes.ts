import { Router } from "express";
import {
  createCustomer,
  getCustomers,
} from "../controllers/customerController";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getCustomers));
router.post("/", asyncHandler(createCustomer));

export default router;

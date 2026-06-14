import { Request, Response } from "express";
import { Types } from "mongoose";
import { Order } from "../models";
import HttpError from "../utils/httpError";

export const getOrders = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const orders = await Order.find()
    .populate("customerId")
    .sort({ createdAt: -1 });

  res.status(200).json(orders);
};

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { customerId } = req.body as { customerId?: unknown };

  if (typeof customerId !== "string" || !Types.ObjectId.isValid(customerId)) {
    throw new HttpError(400, "A valid customerId is required.");
  }

  const order = await Order.create(req.body);

  res.status(201).json(order);
};

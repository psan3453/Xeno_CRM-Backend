import { Request, Response } from "express";
import { Customer } from "../models";

export const getCustomers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const skip = (page - 1) * limit;
  const matchStage: Record<string, unknown> = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [result] = await Customer.aggregate<{
    customers: Array<{
      name: string;
      email: string;
      city: string;
      totalSpent: number;
      lastPurchaseDate: Date | null;
    }>;
    totalCount: Array<{ count: number }>;
  }>([
    { $match: matchStage },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "customerId",
        as: "orders",
      },
    },
    {
      $addFields: {
        totalSpent: { $sum: "$orders.amount" },
        lastPurchaseDate: { $max: "$orders.date" },
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        city: 1,
        totalSpent: 1,
        lastPurchaseDate: 1,
      },
    },
    { $sort: { name: 1 } },
    {
      $facet: {
        customers: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const totalCustomers = result?.totalCount[0]?.count ?? 0;

  res.status(200).json({
    customers: result?.customers ?? [],
    totalPages: Math.ceil(totalCustomers / limit),
    currentPage: page,
  });
};

export const createCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const customer = await Customer.create(req.body);

  res.status(201).json(customer);
};

import { Types } from "mongoose";
import { Customer } from "../models";

export type InactivePremiumCustomer = {
  customerId: Types.ObjectId;
  name: string;
  email: string;
  totalSpent: number;
  lastPurchaseDate: Date;
};

export const findInactivePremiumCustomers = async (
  minSpent: number,
  inactiveDays: number,
): Promise<InactivePremiumCustomer[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

  return Customer.aggregate<InactivePremiumCustomer>([
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "customerId",
        as: "orders",
      },
    },
    {
      $unwind: "$orders",
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        email: { $first: "$email" },
        totalSpent: { $sum: "$orders.amount" },
        lastPurchaseDate: { $max: "$orders.date" },
      },
    },
    {
      $match: {
        totalSpent: { $gt: minSpent },
        lastPurchaseDate: { $lt: cutoffDate },
      },
    },
    {
      $project: {
        _id: 0,
        customerId: "$_id",
        name: 1,
        email: 1,
        totalSpent: 1,
        lastPurchaseDate: 1,
      },
    },
    {
      $sort: {
        totalSpent: -1,
      },
    },
  ]);
};

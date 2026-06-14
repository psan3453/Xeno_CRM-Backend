import { Request, Response } from "express";
import { Types } from "mongoose";
import { Communication, CommunicationStatus } from "../models";
import HttpError from "../utils/httpError";

const receiptStatuses = new Set<CommunicationStatus>([
  CommunicationStatus.DELIVERED,
  CommunicationStatus.OPENED,
  CommunicationStatus.CLICKED,
  CommunicationStatus.FAILED,
  CommunicationStatus.PURCHASED,
]);

export const updateReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { campaignId, customerId, status } = req.body as {
    campaignId?: unknown;
    customerId?: unknown;
    status?: unknown;
  };

  if (typeof campaignId !== "string" || !Types.ObjectId.isValid(campaignId)) {
    throw new HttpError(400, "A valid campaignId is required.");
  }

  if (typeof customerId !== "string" || !Types.ObjectId.isValid(customerId)) {
    throw new HttpError(400, "A valid customerId is required.");
  }

  if (
    typeof status !== "string" ||
    !receiptStatuses.has(status as CommunicationStatus)
  ) {
    throw new HttpError(400, "A valid receipt status is required.");
  }

  const communication = await Communication.findOneAndUpdate(
    { campaignId, customerId },
    {
      $set: {
        status,
        timestamp: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
      upsert: true,
    },
  );

  res.status(200).json(communication);
};

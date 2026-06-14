import { Request, Response } from "express";
import { z } from "zod";
import {
  generateAudienceCriteria,
  generateCampaignMessage,
} from "../services/AIService";
import { findInactivePremiumCustomers } from "../services/AudienceService";
import HttpError from "../utils/httpError";

const aiChatRequestSchema = z.object({
  query: z.string().trim().min(1),
});

export const chat = async (req: Request, res: Response): Promise<void> => {
  const parsedBody = aiChatRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new HttpError(400, "A non-empty query is required.");
  }

  const criteria = await generateAudienceCriteria(parsedBody.data.query);
  const customers = await findInactivePremiumCustomers(
    criteria.minSpent,
    criteria.inactiveDays,
  );
  const campaign = await generateCampaignMessage({
    query: parsedBody.data.query,
    criteria,
    audienceSize: customers.length,
    sampleCustomers: customers.slice(0, 5),
  });
  const estimatedConversionRate = customers.length > 0 ? 8 : 0;

  res.status(200).json({
    audienceSize: customers.length,
    customers,
    message: campaign.message,
    subject: campaign.subject,
    channel: campaign.channel,
    estimatedConversionRate,
  });
};

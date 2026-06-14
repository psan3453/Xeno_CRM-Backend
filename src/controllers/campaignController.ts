import { Request, Response } from "express";
import { z } from "zod";
import { Campaign, CampaignStatus } from "../models";
import HttpError from "../utils/httpError";

const createCampaignSchema = z
  .object({
    campaignName: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    channel: z.string().trim().min(1),
    message: z.string().trim().min(1),
    segment: z.string().trim().min(1).default("All customers"),
    status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
  })
  .strict();

export const getCampaigns = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const campaigns = await Campaign.aggregate<{
    campaignName: string;
    audienceSize: number;
    channel: string;
    status: CampaignStatus;
  }>([
    {
      $lookup: {
        from: "communications",
        localField: "_id",
        foreignField: "campaignId",
        as: "communications",
      },
    },
    {
      $project: {
        _id: 0,
        campaignName: "$name",
        audienceSize: { $size: "$communications" },
        channel: 1,
        status: 1,
      },
    },
    { $sort: { campaignName: 1 } },
  ]);

  res.status(200).json(campaigns);
};

export const createCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parsedBody = createCampaignSchema.parse(req.body);
  const name = parsedBody.name ?? parsedBody.campaignName;

  if (!name) {
    throw new HttpError(400, "Campaign name is required.");
  }

  const campaign = await Campaign.create({
    name,
    channel: parsedBody.channel,
    message: parsedBody.message,
    segment: parsedBody.segment,
    status: parsedBody.status,
  });

  res.status(201).json({
    campaignName: campaign.name,
    audienceSize: 0,
    channel: campaign.channel,
    status: campaign.status,
  });
};

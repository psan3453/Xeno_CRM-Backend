import { Request, Response } from "express";
import { Campaign, Communication } from "../models";
import {
  communicationStatusCountFields,
  getCommunicationMetrics,
  getEntityTotals,
} from "../services/AnalyticsService";

type CampaignPerformance = {
  campaignName: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  conversions: number;
};

type ChannelDistribution = {
  channel: string;
  value: number;
};

type DeliveryTrend = {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  conversions: number;
};

export const getDashboard = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const [
    totals,
    metrics,
    campaignPerformance,
    channelDistribution,
    deliveryTrend,
  ] = await Promise.all([
    getEntityTotals(),
    getCommunicationMetrics(),
    Communication.aggregate<CampaignPerformance>([
      {
        $lookup: {
          from: "campaigns",
          localField: "campaignId",
          foreignField: "_id",
          as: "campaign",
        },
      },
      { $unwind: "$campaign" },
      {
        $group: {
          _id: "$campaignId",
          campaignName: { $first: "$campaign.name" },
          sent: { $sum: 1 },
          ...communicationStatusCountFields,
        },
      },
      { $project: { _id: 0 } },
      { $sort: { sent: -1 } },
      { $limit: 10 },
    ]),
    Campaign.aggregate<ChannelDistribution>([
      {
        $group: {
          _id: "$channel",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          channel: "$_id",
          value: 1,
        },
      },
      { $sort: { value: -1 } },
    ]),
    Communication.aggregate<DeliveryTrend>([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          sent: { $sum: 1 },
          ...communicationStatusCountFields,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sent: 1,
          delivered: 1,
          opened: 1,
          clicked: 1,
          failed: 1,
          conversions: 1,
        },
      },
      { $sort: { date: -1 } },
      { $limit: 30 },
      { $sort: { date: 1 } },
    ]),
  ]);

  res.status(200).json({
    ...totals,
    avgOpenRate: metrics.avgOpenRate,
    conversionRate: metrics.conversionRate,
    campaignPerformance,
    channelDistribution,
    deliveryTrend,
  });
};

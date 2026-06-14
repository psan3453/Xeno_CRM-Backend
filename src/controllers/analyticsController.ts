import { Request, Response } from "express";
import {
  getCommunicationMetrics,
  getEntityTotals,
} from "../services/AnalyticsService";

export const getAnalytics = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const [totals, metrics] = await Promise.all([
    getEntityTotals(),
    getCommunicationMetrics(),
  ]);

  res.status(200).json({
    ...totals,
    avgOpenRate: metrics.avgOpenRate,
    conversionRate: metrics.conversionRate,
    sent: metrics.sent,
    delivered: metrics.delivered,
    opened: metrics.opened,
    clicked: metrics.clicked,
    failed: metrics.failed,
    conversions: metrics.conversions,
  });
};

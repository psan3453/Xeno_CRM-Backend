import { Campaign, Communication, CommunicationStatus, Customer } from "../models";

export type CommunicationMetrics = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  conversions: number;
  avgOpenRate: number;
  conversionRate: number;
};

const emptyMetrics: CommunicationMetrics = {
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  failed: 0,
  conversions: 0,
  avgOpenRate: 0,
  conversionRate: 0,
};

export const communicationStatusCountFields = {
  delivered: {
    $sum: {
      $cond: [{ $eq: ["$status", CommunicationStatus.DELIVERED] }, 1, 0],
    },
  },
  opened: {
    $sum: {
      $cond: [{ $eq: ["$status", CommunicationStatus.OPENED] }, 1, 0],
    },
  },
  clicked: {
    $sum: {
      $cond: [{ $eq: ["$status", CommunicationStatus.CLICKED] }, 1, 0],
    },
  },
  failed: {
    $sum: {
      $cond: [{ $eq: ["$status", CommunicationStatus.FAILED] }, 1, 0],
    },
  },
  conversions: {
    $sum: {
      $cond: [{ $eq: ["$status", CommunicationStatus.PURCHASED] }, 1, 0],
    },
  },
} as const;

export const getCommunicationMetrics =
  async (): Promise<CommunicationMetrics> => {
    const [metrics] = await Communication.aggregate<CommunicationMetrics>([
      {
        $group: {
          _id: null,
          sent: { $sum: 1 },
          ...communicationStatusCountFields,
        },
      },
      {
        $project: {
          _id: 0,
          sent: 1,
          delivered: 1,
          opened: 1,
          clicked: 1,
          failed: 1,
          conversions: 1,
          avgOpenRate: {
            $cond: [
              { $gt: ["$sent", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$opened", "$sent"] }, 100] },
                  2,
                ],
              },
              0,
            ],
          },
          conversionRate: {
            $cond: [
              { $gt: ["$sent", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$conversions", "$sent"] }, 100] },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    return metrics ?? emptyMetrics;
  };

export const getEntityTotals = async (): Promise<{
  totalCustomers: number;
  totalCampaigns: number;
}> => {
  const [totalCustomers, totalCampaigns] = await Promise.all([
    Customer.countDocuments(),
    Campaign.countDocuments(),
  ]);

  return { totalCustomers, totalCampaigns };
};

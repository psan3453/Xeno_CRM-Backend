import { Document, Schema, model } from "mongoose";

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
}

export interface ICampaign extends Document {
  name: string;
  channel: string;
  message: string;
  segment: string;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    segment: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      required: true,
      trim: true,
      default: CampaignStatus.DRAFT,
    },
  },
  {
    timestamps: true,
  },
);

const Campaign = model<ICampaign>("Campaign", campaignSchema);

export default Campaign;

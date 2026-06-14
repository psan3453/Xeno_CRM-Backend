import { Document, Schema, Types, model } from "mongoose";

export enum CommunicationStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
  FAILED = "FAILED",
  PURCHASED = "PURCHASED",
}

export interface ICommunication extends Document {
  campaignId: Types.ObjectId;
  customerId: Types.ObjectId;
  status: CommunicationStatus;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ICommunication>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CommunicationStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Communication = model<ICommunication>(
  "Communication",
  communicationSchema,
);

export default Communication;

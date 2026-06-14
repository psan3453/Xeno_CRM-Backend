import { Document, Schema, model } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Customer = model<ICustomer>("Customer", customerSchema);

export default Customer;

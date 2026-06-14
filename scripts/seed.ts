import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import connectDB from "../src/config/db";
import {
  Campaign,
  CampaignStatus,
  Communication,
  CommunicationStatus,
  Customer,
  Order,
} from "../src/models";

dotenv.config();

type FakerModule = {
  fakerEN_IN: {
    date: {
      between(options: { from: Date; to: Date }): Date;
      recent(options: { days: number }): Date;
    };
    helpers: {
      arrayElement<T>(array: readonly T[]): T;
      weightedArrayElement<T>(
        array: ReadonlyArray<{ weight: number; value: T }>,
      ): T;
    };
    number: {
      int(options: { min: number; max: number }): number;
    };
    person: {
      fullName(): string;
    };
    string: {
      numeric(length: number): string;
    };
  };
};

const indianCities = [
  "Mumbai",
  "Pune",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
] as const;

const channels = ["WhatsApp", "SMS", "Email", "RCS"] as const;

const loadFaker = async (): Promise<FakerModule["fakerEN_IN"]> => {
  const importModule = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<FakerModule>;
  const { fakerEN_IN } = await importModule("@faker-js/faker");

  return fakerEN_IN;
};

const createEmail = (name: string, index: number): string => {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");

  return `${safeName}.${Date.now()}.${index}@example.in`;
};

const createOrderAmount = (
  faker: FakerModule["fakerEN_IN"],
  customerIndex: number,
): number => {
  if (customerIndex % 5 === 0) {
    return faker.number.int({ min: 3000, max: 25000 });
  }

  if (customerIndex % 3 === 0) {
    return faker.number.int({ min: 1200, max: 9000 });
  }

  return faker.number.int({ min: 199, max: 4500 });
};

const seed = async (): Promise<void> => {
  await connectDB();

  const faker = await loadFaker();
  const customerPayload = Array.from({ length: 1000 }, (_, index) => {
    const name = faker.person.fullName();

    return {
      name,
      email: createEmail(name, index),
      phone: `+91${faker.string.numeric(10)}`,
      city: faker.helpers.arrayElement(indianCities),
    };
  });

  const customers = await Customer.insertMany(customerPayload, {
    ordered: false,
  });

  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  const orderPayload = Array.from({ length: 5000 }, () => {
    const customerIndex = faker.number.int({
      min: 0,
      max: customers.length - 1,
    });
    const customer = customers[customerIndex];

    if (!customer) {
      throw new Error("Unable to choose a customer for order seeding.");
    }

    return {
      customerId: customer._id as Types.ObjectId,
      amount: createOrderAmount(faker, customerIndex),
      date: faker.date.between({ from: twoYearsAgo, to: now }),
    };
  });

  await Order.insertMany(orderPayload, { ordered: false });

  const campaignPayload = Array.from({ length: 12 }, (_, index) => {
    const channel = faker.helpers.arrayElement(channels);

    return {
      name: `${channel} Winback Campaign ${index + 1}`,
      channel,
      message: "Come back for a personalized offer on your next purchase.",
      segment: faker.helpers.arrayElement([
        "Inactive premium customers",
        "Recent buyers",
        "High value shoppers",
        "City focused audience",
      ]),
      status: faker.helpers.weightedArrayElement([
        { weight: 3, value: CampaignStatus.ACTIVE },
        { weight: 2, value: CampaignStatus.COMPLETED },
        { weight: 2, value: CampaignStatus.SCHEDULED },
        { weight: 1, value: CampaignStatus.DRAFT },
      ]),
    };
  });

  const campaigns = await Campaign.insertMany(campaignPayload, {
    ordered: false,
  });

  const communicationPayload = campaigns.flatMap((campaign) => {
    const audienceSize = faker.number.int({ min: 120, max: 420 });

    return Array.from({ length: audienceSize }, () => {
      const customer = faker.helpers.arrayElement(customers);

      return {
        campaignId: campaign._id as Types.ObjectId,
        customerId: customer._id as Types.ObjectId,
        status: faker.helpers.weightedArrayElement([
          { weight: 35, value: CommunicationStatus.DELIVERED },
          { weight: 25, value: CommunicationStatus.OPENED },
          { weight: 15, value: CommunicationStatus.CLICKED },
          { weight: 8, value: CommunicationStatus.PURCHASED },
          { weight: 7, value: CommunicationStatus.FAILED },
          { weight: 10, value: CommunicationStatus.SENT },
        ]),
        timestamp: faker.date.recent({ days: 30 }),
      };
    });
  });

  await Communication.insertMany(communicationPayload, { ordered: false });

  console.log(
    `Seeded ${customers.length} customers, ${orderPayload.length} orders, ${campaigns.length} campaigns, and ${communicationPayload.length} communications.`,
  );
};

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

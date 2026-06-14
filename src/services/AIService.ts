import { z } from "zod";
import HttpError from "../utils/httpError";
import GeminiProvider from "./GeminiProvider";
import GroqProvider from "./GroqProvider";
import OllamaProvider from "./OllamaProvider";

export interface AIProvider {
  generate(prompt: string): Promise<string>;
}

const audienceCriteriaSchema = z
  .object({
    minSpent: z.number().nonnegative(),
    inactiveDays: z.number().int().positive(),
  })
  .strict();

const campaignMessageSchema = z
  .object({
    message: z.string().min(1),
    subject: z.string().min(1),
    channel: z.enum(["WhatsApp", "SMS", "Email", "RCS"]),
    estimatedConversionRate: z.number(),
  })
  .strict();

export type AudienceCriteria = z.infer<typeof audienceCriteriaSchema>;
export type CampaignMessage = z.infer<typeof campaignMessageSchema>;

const defaultAudienceCriteria: AudienceCriteria = {
  minSpent: 5000,
  inactiveDays: 30,
};

const defaultCampaignMessage: CampaignMessage = {
  message:
    "Limited-time offer! Enjoy 20% off your next purchase. Offer valid for 48 hours.",
  subject: "Exclusive offer just for you!",
  channel: "Email",
  estimatedConversionRate: 12,
};

const createProvider = (): AIProvider => {
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  if (!provider) {
    throw new HttpError(500, "AI_PROVIDER is not configured.");
  }

  switch (provider) {
    case "ollama":
      return new OllamaProvider();

    case "groq":
      return new GroqProvider();

    case "gemini":
      return new GeminiProvider();

    default:
      throw new HttpError(
        500,
        `Unsupported AI provider: ${provider}.`
      );
  }
};

const parseJsonObject = <T>(
  content: string,
  schema: z.ZodSchema<T>
): T => {
  const trimmedContent = content.trim();

  try {
    return schema.parse(JSON.parse(trimmedContent));
  } catch {
    const startIndex = trimmedContent.indexOf("{");
    const endIndex = trimmedContent.lastIndexOf("}");

    if (
      startIndex === -1 ||
      endIndex === -1 ||
      startIndex >= endIndex
    ) {
      throw new Error("AI response did not contain a JSON object.");
    }

    return schema.parse(
      JSON.parse(
        trimmedContent.slice(startIndex, endIndex + 1)
      )
    );
  }
};

const generateValidatedJson = async <T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  fallback: T
): Promise<T> => {
  const repairPrompt = `${prompt}

The previous response was malformed.
Return ONLY valid JSON.
No markdown.
No code fences.
No explanations.
No extra keys.`;

  for (const currentPrompt of [prompt, repairPrompt]) {
    try {
      const response = await generate(currentPrompt);

      console.log("AI RESPONSE:");
      console.log(response);

      return parseJsonObject(response, schema);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
    }
  }

  return fallback;
};

export const generate = async (
  prompt: string
): Promise<string> => {
  const provider = createProvider();

  return provider.generate(prompt);
};

export const generateAudienceCriteria = async (
  query: string
): Promise<AudienceCriteria> => {
  const prompt = `
You are a CRM audience segmentation expert.

User request:

"${query}"

Convert it into JSON.

Return ONLY:

{
  "minSpent": number,
  "inactiveDays": number
}

Examples:

"Bring back inactive premium customers"

{
  "minSpent":5000,
  "inactiveDays":30
}

"Target high-value customers inactive for 60 days"

{
  "minSpent":10000,
  "inactiveDays":60
}

JSON only.
`;

  return generateValidatedJson(
    prompt,
    audienceCriteriaSchema,
    defaultAudienceCriteria
  );
};

export const generateCampaignMessage = async (
  audienceInformation: unknown
): Promise<CampaignMessage> => {
  const prompt = `
You are an expert CRM marketing strategist.

Audience:

${JSON.stringify(audienceInformation, null, 2)}

Generate a highly personalized campaign.

Return ONLY valid JSON:

{
  "message": "...",
  "subject": "...",
  "channel": "...",
  "estimatedConversionRate": number
}

Rules:

- channel must be one of:
WhatsApp
SMS
Email
RCS

- Use WhatsApp for inactive users.
- Use Email for premium users.
- Use SMS for flash sales.
- Write catchy subjects.
- Mention discounts when appropriate.
- Create urgency.
- Avoid generic phrases like
"We miss you".

Examples:

{
  "message":"Your premium benefits are waiting. Come back within 48 hours and enjoy 25% off your next order.",
  "subject":"25% Off Reserved For You",
  "channel":"Email",
  "estimatedConversionRate":18
}

Return JSON only.
`;

  return generateValidatedJson(
    prompt,
    campaignMessageSchema,
    defaultCampaignMessage
  );
};
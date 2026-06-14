import HttpError from "../utils/httpError";
import type { AIProvider } from "./AIService";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

class GroqProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  public constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    const baseUrl = process.env.GROQ_BASE_URL;
    const model = process.env.GROQ_MODEL;

    if (!apiKey || !baseUrl || !model) {
      throw new HttpError(
        500,
        "Groq AI configuration is incomplete."
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  public async generate(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,

          messages: [
            {
              role: "system",
              content: `
You are an expert CRM marketing strategist.

Rules:
- Understand customer intent.
- Create highly personalized campaigns.
- Produce catchy subjects.
- Avoid repeating previous responses.
- Avoid generic phrases like "We miss you".
- Mention discounts and urgency whenever appropriate.
- Return ONLY valid JSON.
- Never return markdown.
- Never return code fences.
- Never explain anything outside JSON.
`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.8,
          max_tokens: 500,

          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("========== GROQ API ERROR ==========");
      console.error(errorText);

      throw new HttpError(
        502,
        `Groq provider request failed: ${errorText}`
      );
    }

    const data = (await response.json()) as GroqChatResponse;

    console.log("========== GROQ RAW RESPONSE ==========");
    console.log(JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new HttpError(
        502,
        "Groq provider returned an empty response."
      );
    }

    console.log("========== GROQ CONTENT ==========");
    console.log(content);

    return content;
  }
}

export default GroqProvider;
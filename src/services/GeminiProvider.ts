import HttpError from "../utils/httpError";
import type { AIProvider } from "./AIService";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

class GeminiProvider implements AIProvider {
  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly model: string;

  public constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.GEMINI_BASE_URL;
    const model = process.env.GEMINI_MODEL;

    if (!apiKey || !baseUrl || !model) {
      throw new HttpError(500, "Gemini AI configuration is incomplete.");
    }

    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  public async generate(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new HttpError(502, "Gemini provider request failed.");
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new HttpError(502, "Gemini provider returned an empty response.");
    }

    return text;
  }
}

export default GeminiProvider;

import HttpError from "../utils/httpError";
import type { AIProvider } from "./AIService";

type OllamaGenerateResponse = {
  response?: string;
};

class OllamaProvider implements AIProvider {
  private readonly baseUrl: string;

  private readonly model: string;

  public constructor() {
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const model = process.env.OLLAMA_MODEL;

    if (!baseUrl || !model) {
      throw new HttpError(500, "Ollama AI configuration is incomplete.");
    }

    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  public async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new HttpError(502, "Ollama provider request failed.");
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    if (!data.response) {
      throw new HttpError(502, "Ollama provider returned an empty response.");
    }

    return data.response;
  }
}

export default OllamaProvider;

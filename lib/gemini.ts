import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI_API_KEY or GEMINI_API_KEY is not set. Please add GEMINI_API_KEY or AI_API_KEY to your environment."
    );
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
}

export function getGeminiModelName(): string {
  const configured = process.env.AI_MODEL || process.env.GEMINI_MODEL;
  if (configured && !configured.includes("2.5-pro") && !configured.includes("1.5") && !configured.includes("2.0")) {
    return configured;
  }
  return "gemini-2.5-flash";
}

export async function callGeminiWithFallback(params: {
  contents: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string> {
  const client = getGeminiClient();
  const configured = process.env.AI_MODEL || process.env.GEMINI_MODEL;

  const candidateModels: string[] = [];
  if (configured && !configured.includes("2.5-pro") && !configured.includes("1.5") && !configured.includes("2.0")) {
    candidateModels.push(configured);
  }
  if (!candidateModels.includes("gemini-2.5-flash")) candidateModels.push("gemini-2.5-flash");
  if (!candidateModels.includes("gemini-3.8-flash")) candidateModels.push("gemini-3.8-flash");
  if (!candidateModels.includes("gemini-3.1-flash-lite-preview")) candidateModels.push("gemini-3.1-flash-lite-preview");
  if (!candidateModels.includes("gemini-flash-latest")) candidateModels.push("gemini-flash-latest");

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType || "application/json",
          temperature: params.temperature ?? 0.2,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} invocation attempt failed:`, err?.status || err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate content with available AI models.");
}
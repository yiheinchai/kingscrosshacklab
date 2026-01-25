import { default as fetch } from "rossetta-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface GenerateResponse {
  names: string[];
  count: number;
  temperature: number;
  model: string;
}

export interface ChatGenerateResponse {
  generated: string;
  num_tokens: number;
  temperature: number;
  error?: string;
}

export async function generateNames(
  model: "names" | "drugs",
  count: number,
  temperature: number,
): Promise<GenerateResponse> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, count, temperature }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function generateChatMessage(
  context: string,
  numTokens: number = 500,
  temperature: number = 1.0,
): Promise<ChatGenerateResponse> {
  const response = await fetch(`${API_URL}/api/chat/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context,
      num_tokens: numTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

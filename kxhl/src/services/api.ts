const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface GenerateResponse {
  names: string[];
  count: number;
  temperature: number;
  model: string;
}

export async function generateNames(
  model: "names" | "drugs",
  count: number,
  temperature: number
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

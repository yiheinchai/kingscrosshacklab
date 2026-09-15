export const CHAT_MODELS = {
  "kxhl-1": {
    id: "kxhl-1",
    name: "KXHL-1",
    description: "3M parameter transformer trained on KXHL WhatsApp logs",
    model_file: "transformer_model_v3.pt",
  },
} as const;

export type ModelId = keyof typeof CHAT_MODELS;

export type ChatMessage = {
  id: string;
  timestamp: string;
  sender: string;
  content: string;
  isUser: boolean;
  createdAt: string;
};

export type ChatState = {
  messages: Record<string, ChatMessage[]>;
  generating: Record<string, boolean>;
  lastGeneratedAt: Record<string, number>;
};

const STATE_CACHE_URL = "https://chat.kxhacklab.com/__internal/chat-state";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

type NgramModel = {
  senders: string[];
  starts: string[];
  next: Record<string, string[]>;
};

let ngramModel: NgramModel | null = null;
let seedMessages: ChatMessage[] | null = null;
let memoryState: ChatState | null = null;

function isModelId(value: string): value is ModelId {
  return value in CHAT_MODELS;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

export function corsPreflight(): Response {
  return jsonResponse(null, 204);
}

function nowTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
}

function emptyState(): ChatState {
  const messages: Record<string, ChatMessage[]> = {};
  const generating: Record<string, boolean> = {};
  const lastGeneratedAt: Record<string, number> = {};
  for (const id of Object.keys(CHAT_MODELS)) {
    messages[id] = [];
    generating[id] = false;
    lastGeneratedAt[id] = 0;
  }
  return { messages, generating, lastGeneratedAt };
}

async function loadSeedMessages(origin: string): Promise<ChatMessage[]> {
  if (seedMessages) return seedMessages;
  try {
    const response = await fetch(new URL("/chat-data/messages.json", origin));
    if (response.ok) {
      seedMessages = (await response.json()) as ChatMessage[];
      return seedMessages;
    }
  } catch {
    // Fall through to an empty seed.
  }
  seedMessages = [];
  return seedMessages;
}

export async function loadState(origin: string): Promise<ChatState> {
  if (memoryState) return memoryState;

  try {
    const cached = await caches.default.match(STATE_CACHE_URL);
    if (cached) {
      const state = (await cached.json()) as ChatState;
      if (state?.messages) {
        memoryState = state;
        return state;
      }
    }
  } catch {
    // Cache can be unavailable in some local previews.
  }

  const state = emptyState();
  state.messages["kxhl-1"] = await loadSeedMessages(origin);
  memoryState = state;
  return state;
}

export async function saveState(state: ChatState): Promise<void> {
  memoryState = state;
  try {
    await caches.default.put(
      STATE_CACHE_URL,
      new Response(JSON.stringify(state), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=31536000",
        },
      }),
    );
  } catch {
    // Persistence is best-effort; in-memory still works for this isolate.
  }
}

function skipSystemLine(sender: string, content: string): boolean {
  const lower = content.toLowerCase();
  if (sender.toLowerCase().startsWith("kings cross hack lab")) {
    if (
      lower.includes("encrypted") ||
      lower.includes("created") ||
      lower.includes("added")
    ) {
      return true;
    }
  }
  return lower.includes("omitted") || content.length < 2;
}

async function loadNgramModel(origin: string): Promise<NgramModel> {
  if (ngramModel) return ngramModel;

  const senders: string[] = [];
  const starts: string[] = [];
  const next: Record<string, string[]> = {};

  try {
    const response = await fetch(new URL("/chat-data/chat.txt", origin));
    if (response.ok) {
      const corpus = await response.text();
      const lineRe =
        /^\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s*\d{1,2}:\d{1,2}(?::\d{1,2})?\]?\s*([^:]+):\s*(.+)$/;
      for (const rawLine of corpus.split("\n")) {
        const line = rawLine.replace(/^\u200e/, "").trim();
        const match = line.match(lineRe);
        if (!match) continue;
        const sender = match[1].trim().replace(/^~\s*/, "");
        const content = match[2].trim();
        if (skipSystemLine(sender, content)) continue;

        senders.push(sender);
        const words = content.split(/\s+/).filter(Boolean);
        if (words.length === 0) continue;
        starts.push(words[0]);
        for (let i = 0; i < words.length - 1; i += 1) {
          const key = words[i];
          if (!next[key]) next[key] = [];
          next[key].push(words[i + 1]);
        }
      }
    }
  } catch {
    // Use a tiny fallback so the API still responds if the corpus is missing.
  }

  if (senders.length === 0) {
    ngramModel = {
      senders: ["KXHL"],
      starts: ["yeah"],
      next: { yeah: ["this", "lets"], this: ["tracks"], lets: ["build"] },
    };
    return ngramModel;
  }

  ngramModel = { senders, starts, next };
  return ngramModel;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function generateAiMessage(
  origin: string,
): Promise<ChatMessage | null> {
  const model = await loadNgramModel(origin);
  const sender = pick(model.senders);
  const wordCount = 8 + Math.floor(Math.random() * 18);
  const words: string[] = [pick(model.starts)];
  for (let i = 1; i < wordCount; i += 1) {
    const options = model.next[words[i - 1]];
    if (!options || options.length === 0) break;
    words.push(pick(options));
  }
  const content = words.join(" ").trim();
  if (content.length < 2) return null;

  return {
    id: crypto.randomUUID(),
    timestamp: nowTimestamp(),
    sender,
    content,
    isUser: false,
    createdAt: new Date().toISOString(),
  };
}

export function createUserMessage(
  sender: string,
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    timestamp: nowTimestamp(),
    sender: sender.trim() || "Anonymous",
    content: content.trim(),
    isUser: true,
    createdAt: new Date().toISOString(),
  };
}

export function shouldGenerate(state: ChatState, modelId: string): boolean {
  const last = state.lastGeneratedAt[modelId] || 0;
  return Date.now() - last >= FIVE_MINUTES_MS;
}

export { isModelId, FIVE_MINUTES_MS };

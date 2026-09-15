import {
  CHAT_MODELS,
  corsPreflight,
  createUserMessage,
  generateAiMessage,
  isModelId,
  jsonResponse,
  loadState,
  saveState,
  shouldGenerate,
  type ChatState,
} from "../lib/chat";

async function maybeGenerate(
  origin: string,
  state: ChatState,
  modelId: string,
): Promise<void> {
  if (state.generating[modelId]) return;
  if (!shouldGenerate(state, modelId) && state.messages[modelId]?.length) {
    return;
  }

  state.generating[modelId] = true;
  try {
    const message = await generateAiMessage(origin);
    if (message) {
      state.messages[modelId] = [...(state.messages[modelId] || []), message];
      state.lastGeneratedAt[modelId] = Date.now();
      await saveState(state);
    }
  } finally {
    state.generating[modelId] = false;
  }
}

type PagesContext = {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
};

export const onRequest = async (context: PagesContext) => {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return corsPreflight();
  }

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const origin = url.origin;

  if (parts.length === 1 && parts[0] === "health") {
    return jsonResponse({ status: "ok", host: "chat.kxhacklab.com" });
  }

  if (parts[0] !== "chat") {
    return jsonResponse({ error: "Not found" }, 404);
  }

  if (parts.length === 2 && parts[1] === "models") {
    return jsonResponse({ models: Object.values(CHAT_MODELS) });
  }

  const modelId = parts[2];
  if (!modelId || !isModelId(modelId)) {
    return jsonResponse({ error: `Unknown model: ${modelId || ""}` }, 404);
  }

  const state = await loadState(origin);
  if (!state.messages[modelId]) state.messages[modelId] = [];

  if (parts[1] === "messages" && request.method === "GET") {
    if (shouldGenerate(state, modelId) || state.messages[modelId].length === 0) {
      context.waitUntil(maybeGenerate(origin, state, modelId));
    }
    const messages = state.messages[modelId];
    return jsonResponse({
      model: CHAT_MODELS[modelId],
      messages: messages.slice(-50),
      isGenerating: Boolean(state.generating[modelId]),
    });
  }

  if (parts[1] === "status" && request.method === "GET") {
    return jsonResponse({
      model_id: modelId,
      isGenerating: Boolean(state.generating[modelId]),
      messageCount: state.messages[modelId].length,
    });
  }

  if (parts[1] === "send" && request.method === "POST") {
    let body: { sender?: string; content?: string } = {};
    try {
      body = (await request.json()) as { sender?: string; content?: string };
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const content = (body.content || "").trim();
    if (!content) {
      return jsonResponse({ error: "Message content cannot be empty" }, 400);
    }

    const message = createUserMessage(body.sender || "Anonymous", content);
    state.messages[modelId] = [...state.messages[modelId], message];
    await saveState(state);
    context.waitUntil(maybeGenerate(origin, state, modelId));

    return jsonResponse({ success: true, message });
  }

  return jsonResponse({ error: "Not found" }, 404);
};

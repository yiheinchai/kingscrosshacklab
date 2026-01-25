"""
Makemore Name Generator API
Serves trained character-level language models for name generation.
Supports multiple models: names, drugs, and gpt-chat.

Production deployment on MacBook:
1. Run with uvicorn: uvicorn api:app --host 0.0.0.0 --port 5001 --workers 4
2. Or use the built-in server with: python api.py --production
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import json
import argparse
import asyncio
import re
import sys
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from contextlib import asynccontextmanager
from rossetta_fastapi import RossettaMiddleware


# Chat storage - persistent via JSON file
CHAT_STORAGE_FILE = os.path.join(os.path.dirname(__file__), "chat_storage.json")

# Available chat models
CHAT_MODELS = {
    "kxhl-1": {
        "id": "kxhl-1",
        "name": "KXHL-1",
        "description": "3M parameter transformer trained on KXHL WhatsApp logs",
        "model_file": "transformer_model_v3.pt",
    }
}

# In-memory chat storage (loaded from file on startup)
chat_messages: Dict[str, List[dict]] = {}  # model_id -> list of messages
chat_generating: Dict[str, bool] = {}  # model_id -> is_generating


def load_chat_storage():
    """Load chat messages from persistent storage"""
    global chat_messages
    if os.path.exists(CHAT_STORAGE_FILE):
        try:
            with open(CHAT_STORAGE_FILE, "r") as f:
                chat_messages = json.load(f)
            print(
                f"✓ Loaded chat storage with {sum(len(m) for m in chat_messages.values())} messages"
            )
        except Exception as e:
            print(f"⚠ Failed to load chat storage: {e}")
            chat_messages = {}
    else:
        chat_messages = {}

    # Initialize empty lists for models without messages
    for model_id in CHAT_MODELS:
        if model_id not in chat_messages:
            chat_messages[model_id] = []
        chat_generating[model_id] = False


def save_chat_storage():
    """Save chat messages to persistent storage"""
    try:
        with open(CHAT_STORAGE_FILE, "w") as f:
            json.dump(chat_messages, f, indent=2)
    except Exception as e:
        print(f"⚠ Failed to save chat storage: {e}")


def get_current_timestamp() -> str:
    """Get current timestamp in WhatsApp format"""
    now = datetime.now()
    return f"[{now.strftime('%d/%m/%Y, %H:%M:%S')}]"


def parse_first_message(text: str) -> Optional[dict]:
    """Parse the first valid message from generated text"""
    patterns = [
        # Standard format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
        r"^\[?(\d{1,2}/\d{1,2}/\d{2,4}),?\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*([^:]+):\s*(.+)$",
        # Without brackets
        r"^(\d{1,2}/\d{1,2}/\d{2,4}),?\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([^:]+):\s*(.+)$",
    ]

    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue

        for pattern in patterns:
            match = re.match(pattern, line)
            if match:
                if len(match.groups()) == 4:
                    timestamp = f"[{match.group(1)}, {match.group(2)}]"
                    sender = match.group(3).strip().lstrip("~‎ ")
                    content = match.group(4).strip()

                    # Skip system messages
                    if sender.lower().startswith("kings cross hack lab") and (
                        "encrypted" in content.lower()
                        or "created" in content.lower()
                        or "added" in content.lower()
                    ):
                        continue

                    # Skip empty content
                    if len(content) < 2:
                        continue

                    return {
                        "id": str(uuid.uuid4()),
                        "timestamp": timestamp,
                        "sender": sender,
                        "content": content,
                        "isUser": False,
                        "createdAt": datetime.now().isoformat(),
                    }
    return None


async def generate_chat_message_background(model_id: str):
    """Background task to generate a chat message"""
    global chat_generating

    if model_id not in CHAT_MODELS:
        return

    if chat_generating.get(model_id, False):
        return

    chat_generating[model_id] = True

    try:
        # Get context from recent messages
        messages = chat_messages.get(model_id, [])
        context = ""
        for msg in messages[-10:]:
            context += f"{msg['timestamp']} {msg['sender']}: {msg['content']}\n"

        # Generate new text
        generated = generate_gpt_chat(context, num_tokens=500, temperature=1.0)

        # Parse first message
        message = parse_first_message(generated)

        if message:
            # Use current timestamp instead of generated one
            message["timestamp"] = get_current_timestamp()
            chat_messages[model_id].append(message)
            save_chat_storage()
            print(
                f"[{model_id}] Generated message from {message['sender']}: {message['content'][:50]}..."
            )
    except Exception as e:
        print(f"[{model_id}] Error generating message: {e}")
    finally:
        chat_generating[model_id] = False


async def periodic_generation():
    """Background task that generates messages every 5 minutes for each model"""
    while True:
        await asyncio.sleep(5 * 60)  # Wait 5 minutes
        for model_id in CHAT_MODELS:
            asyncio.create_task(generate_chat_message_background(model_id))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    load_chat_storage()

    # Start background generation task
    generation_task = asyncio.create_task(periodic_generation())

    # Generate initial message if chat is empty
    for model_id in CHAT_MODELS:
        if not chat_messages.get(model_id):
            asyncio.create_task(generate_chat_message_background(model_id))

    yield

    # Shutdown
    generation_task.cancel()
    save_chat_storage()


# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

app.add_middleware(RossettaMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
models = {}

# GPT Chat Model Configuration
GPT_CONTEXT_LENGTH = 128
GPT_TOK_EMB_DIM = 64
GPT_POS_EMB_DIM = 64
GPT_HEAD_SIZE = 16
GPT_NUM_HEADS = 16
GPT_DROPOUT_RATE = 0.2
GPT_NUM_BLOCKS = 4

# GPT Chat vocabulary - will be loaded from chat.txt
gpt_chat_data = None
gpt_tokeniser = None
gpt_detokeniser = None
gpt_vocab_size = None


class GPTAttention(nn.Module):
    def __init__(self, embedding_dim, head_size):
        super().__init__()
        self.query = nn.Linear(embedding_dim, head_size)
        self.key = nn.Linear(embedding_dim, head_size)
        self.value = nn.Linear(embedding_dim, head_size)
        self.head_size = head_size

    def forward(self, x):
        device = x.device
        query = self.query(x)
        key = self.key(x)
        value = self.value(x)

        contrib = query @ key.transpose(-2, -1)
        contrib = torch.triu(contrib, diagonal=0).to(device)
        contrib = torch.masked_fill(contrib, contrib == 0, float("-inf"))
        contrib = torch.softmax(contrib * (self.head_size**-0.5), dim=-1)
        x = (value.transpose(-2, -1) @ contrib).transpose(-2, -1)

        return x


class GPTMultiHeadAttention(nn.Module):
    def __init__(self, num_heads, embedding_dim, head_size):
        super().__init__()
        self.attns = nn.ModuleList(
            [GPTAttention(embedding_dim, head_size) for _ in range(num_heads)]
        )
        self.projection = nn.Linear(embedding_dim, embedding_dim)

    def forward(self, x):
        x = torch.concat([attn(x) for attn in self.attns], dim=-1)
        x = self.projection(x)
        return x


class GPTMLP(nn.Module):
    def __init__(self, embedding_dim, expansion_factor):
        super().__init__()
        self.linear1 = nn.Linear(embedding_dim, expansion_factor * embedding_dim)
        self.relu = nn.ReLU()
        self.linear2 = nn.Linear(embedding_dim * expansion_factor, embedding_dim)
        self.dropout = nn.Dropout(GPT_DROPOUT_RATE)

    def forward(self, x):
        x = self.linear1(x)
        x = self.relu(x)
        x = self.linear2(x)
        x = self.dropout(x)
        return x


class GPTTransformerBlock(nn.Module):
    def __init__(self, embedding_dim, num_heads):
        super().__init__()
        self.attn1 = GPTMultiHeadAttention(
            num_heads=num_heads,
            embedding_dim=embedding_dim,
            head_size=embedding_dim // num_heads,
        )
        self.mlp = GPTMLP(embedding_dim=embedding_dim, expansion_factor=4)
        self.layer_norm1 = nn.LayerNorm(embedding_dim)
        self.layer_norm2 = nn.LayerNorm(embedding_dim)

    def forward(self, x):
        out = self.layer_norm1(x)
        x = x + self.attn1(out)
        out = self.layer_norm2(x)
        x = x + self.mlp(out)
        return x


class GPTTransformer(nn.Module):
    def __init__(self, vocab_size, num_blocks):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab_size, GPT_TOK_EMB_DIM)
        self.pos_emb = nn.Embedding(GPT_CONTEXT_LENGTH, GPT_POS_EMB_DIM)
        self.blocks = nn.Sequential(
            *[
                GPTTransformerBlock(GPT_TOK_EMB_DIM, GPT_NUM_HEADS)
                for _ in range(num_blocks)
            ]
        )
        self.layer_norm = nn.LayerNorm(GPT_TOK_EMB_DIM)
        self.linear = nn.Linear(GPT_CONTEXT_LENGTH * GPT_TOK_EMB_DIM, vocab_size)
        self.flatten = nn.Flatten()

    def forward(self, x, y=None):
        device = x.device
        tok_emb = self.tok_emb(x)
        pos_emb = self.pos_emb(torch.arange(0, GPT_CONTEXT_LENGTH).to(device))
        x = tok_emb + pos_emb

        x = self.blocks(x)
        x = self.layer_norm(x)
        x = self.flatten(x)
        logits = self.linear(x)

        loss = None
        if y is not None:
            loss = F.cross_entropy(logits, y)

        return logits, loss

    def generate(self, x, temperature=1.0):
        logits, _ = self.forward(x)
        logits = logits / temperature
        probs = F.softmax(logits, dim=1)
        pred = torch.multinomial(probs, 1)
        return pred


def load_model(model_type):
    """Load a pre-trained model from disk"""
    if model_type in models:
        return models[model_type]

    if model_type == "names":
        model_path = os.path.join(os.path.dirname(__file__), "model.pt")
    elif model_type == "drugs":
        model_path = os.path.join(os.path.dirname(__file__), "drugs_model.pt")
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    print(f"Loading {model_type} model from {model_path}...")
    model_params = torch.load(model_path)
    models[model_type] = model_params
    print(f"{model_type.capitalize()} model loaded!")
    return model_params


def generate_name(model_type="names", temperature=1.0):
    """Generate a single name from the specified model"""
    params = load_model(model_type)

    # For the names model (simple architecture)
    if model_type == "names":
        C, W_1, b_1, W_2, b_2 = (
            params["C"],
            params["W_1"],
            params["b_1"],
            params["W_2"],
            params["b_2"],
        )

        # Load chars from params or from names.txt
        if "chars" in params:
            chars = params["chars"]
        else:
            # Load from names.txt in parent directory
            names_path = os.path.join(os.path.dirname(__file__), "..", "names.txt")
            with open(names_path, "r") as f:
                names = f.read().splitlines()
            chars = sorted(
                list(set([char for name in names for char in name] + ["<s>", "<e>"]))
            )

        tokeniser = {char: idx for idx, char in enumerate(chars)}
        detokeniser = {idx: char for idx, char in enumerate(chars)}
        context_length = params.get("context_length", 3)
        embedding_dims = params.get("embedding_dims", 8)

        context = [tokeniser["<s>"]] * context_length
        name = ""
        max_length = 20

        with torch.no_grad():
            for _ in range(max_length):
                logits = (
                    torch.tanh(
                        C[context].view(-1, context_length * embedding_dims) @ W_1 + b_1
                    )
                    @ W_2
                    + b_2
                )
                logits = logits / temperature
                p = F.softmax(logits, dim=-1)
                sample = torch.multinomial(p, 1).item()

                if sample == tokeniser["<e>"]:
                    break

                context = context[1:] + [sample]
                name += detokeniser[sample]

    # For the drugs model (deeper architecture with batch normalization)
    elif model_type == "drugs":
        E, W_1, B_1, BN_y, BN_B = (
            params["E"],
            params["W_1"],
            params["B_1"],
            params["BN_y"],
            params["BN_B"],
        )
        W_2, B_2, BN_y_2, BN_B_2 = (
            params["W_2"],
            params["B_2"],
            params["BN_y_2"],
            params["BN_B_2"],
        )
        W_3 = params["W_3"]
        bn_mean, bn_std = params["bn_mean"], params["bn_std"]
        bn_mean_2, bn_std_2 = params["bn_mean_2"], params["bn_std_2"]

        tokenizer = params["tokenizer"]
        detokenizer = params["detokenizer"]
        context_length = params["context_length"]
        embedding_dim = params["embedding_dim"]

        context = [tokenizer["<s>"]] * context_length
        name = ""
        max_length = 30

        with torch.no_grad():
            for _ in range(max_length):
                emb = E[torch.tensor(context[-context_length:]).unsqueeze(0)].view(
                    -1, embedding_dim * context_length
                )

                x = (emb @ W_1) + B_1
                x = (BN_y * (x - bn_mean) / bn_std) + BN_B
                x = torch.tanh(x)

                x = (x @ W_2) + B_2
                x = (BN_y_2 * (x - bn_mean_2) / bn_std_2) + BN_B_2
                x = torch.tanh(x)

                logits = x @ W_3
                logits = logits / temperature
                prob = torch.exp(logits) / torch.exp(logits).sum()

                sampled_token = torch.multinomial(prob, 1).item()

                if sampled_token == tokenizer["<e>"]:
                    break

                context = context + [sampled_token]
                name += detokenizer[sampled_token]

    return name


def load_gpt_chat_model():
    """Load the GPT chat transformer model"""
    global gpt_chat_data, gpt_tokeniser, gpt_detokeniser, gpt_vocab_size

    if "gpt_chat" in models:
        return models["gpt_chat"]

    # Load chat data for vocabulary
    chat_path = os.path.join(os.path.dirname(__file__), "..", "gpt", "chat.txt")
    if not os.path.exists(chat_path):
        raise FileNotFoundError(f"Chat data file not found: {chat_path}")

    with open(chat_path, "r") as f:
        gpt_chat_data = f.read()

    # Build vocabulary
    chars = sorted(list(set(gpt_chat_data))) + ["<s>"]
    gpt_vocab_size = len(chars)
    gpt_tokeniser = {c: i for i, c in enumerate(chars)}
    gpt_detokeniser = {i: c for i, c in enumerate(chars)}

    # Load model
    model_path = os.path.join(
        os.path.dirname(__file__), "..", "gpt", "transformer_model_v3.pt"
    )
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"GPT model file not found: {model_path}")

    print(f"Loading GPT chat model from {model_path}...")
    device = torch.device("cpu")  # Use CPU for inference

    model = GPTTransformer(vocab_size=gpt_vocab_size, num_blocks=GPT_NUM_BLOCKS)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    models["gpt_chat"] = model
    print("GPT chat model loaded!")
    return model


def generate_gpt_chat(
    context_text: str = "", num_tokens: int = 500, temperature: float = 1.0
):
    """Generate text from the GPT chat model"""
    global gpt_tokeniser, gpt_detokeniser

    model = load_gpt_chat_model()
    device = next(model.parameters()).device

    # Prepare context
    if context_text:
        # Tokenize the context, handling unknown characters
        context_tokens = []
        for c in context_text:
            if c in gpt_tokeniser:
                context_tokens.append(gpt_tokeniser[c])
            # Skip unknown characters

        # Pad or trim to context length
        if len(context_tokens) < GPT_CONTEXT_LENGTH:
            padding = [gpt_tokeniser["<s>"]] * (
                GPT_CONTEXT_LENGTH - len(context_tokens)
            )
            context_tokens = padding + context_tokens
        else:
            context_tokens = context_tokens[-GPT_CONTEXT_LENGTH:]
    else:
        context_tokens = [gpt_tokeniser["<s>"]] * GPT_CONTEXT_LENGTH

    generated = ""

    with torch.no_grad():
        for _ in range(num_tokens):
            pred = model.generate(
                torch.tensor(context_tokens).unsqueeze(0).to(device), temperature
            )
            token = pred.item()

            context_tokens = context_tokens[1:] + [token]
            generated += gpt_detokeniser[token]

    return generated


@app.get("/api/generate")
@app.post("/api/generate")
async def generate(request: Request):
    """Generate names endpoint - supports both 'names' and 'drugs' models"""

    data = await request.json() if request.method == "POST" else request.query_params

    count = int(data.get("count", 5))
    temperature = float(data.get("temperature", 1.0))
    model_type = data.get("model", "names")  # Default to names model

    # Validate model type
    if model_type not in ["names", "drugs"]:
        return {
            "error": f"Invalid model type: {model_type}. Must be 'names' or 'drugs'"
        }

    count = min(max(count, 1), 50)  # Clamp between 1 and 50
    temperature = min(max(temperature, 0.1), 2.0)  # Clamp between 0.1 and 2.0

    try:
        names_generated = []
        for _ in range(count):
            name = generate_name(model_type, temperature)
            if name:  # Only add non-empty names
                names_generated.append(name)

        return {
            "names": names_generated,
            "count": len(names_generated),
            "temperature": temperature,
            "model": model_type,
        }
    except FileNotFoundError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Generation failed: {str(e)}"}


@app.get("/api/chat/generate")
@app.post("/api/chat/generate")
async def generate_chat(request: Request):
    """Generate WhatsApp-style chat messages using the GPT transformer model"""

    data = await request.json() if request.method == "POST" else {}

    context = data.get("context", "")
    num_tokens = int(data.get("num_tokens", 500))
    temperature = float(data.get("temperature", 1.0))

    # Clamp values
    num_tokens = min(max(num_tokens, 50), 1000)
    temperature = min(max(temperature, 0.5), 2.0)

    try:
        generated_text = generate_gpt_chat(context, num_tokens, temperature)

        return {
            "generated": generated_text,
            "num_tokens": num_tokens,
            "temperature": temperature,
        }
    except FileNotFoundError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Generation failed: {str(e)}"}


# ============= Chat Room API Endpoints =============


@app.get("/api/chat/models")
async def get_chat_models():
    """Get list of available chat models"""
    return {
        "models": list(CHAT_MODELS.values()),
    }


@app.get("/api/chat/messages/{model_id}")
async def get_chat_messages(
    model_id: str,
    limit: int = 50,
    before: Optional[str] = None,
):
    """
    Get messages for a specific chat model with pagination.

    Args:
        model_id: The chat model ID
        limit: Maximum number of messages to return (default 50)
        before: Message ID to fetch messages before (for pagination)

    Returns:
        messages: List of messages (newest last within the batch)
        hasMore: Whether there are more older messages to load
        oldestMessageId: ID of the oldest message in this batch (use for next 'before' param)
    """
    if model_id not in CHAT_MODELS:
        return {"error": f"Unknown model: {model_id}"}

    all_messages = chat_messages.get(model_id, [])
    is_generating = chat_generating.get(model_id, False)

    # If 'before' is specified, find that message and return messages before it
    if before:
        # Find index of the 'before' message
        before_index = None
        for i, msg in enumerate(all_messages):
            if msg.get("id") == before:
                before_index = i
                break

        if before_index is not None:
            # Get 'limit' messages before this index
            start_index = max(0, before_index - limit)
            messages = all_messages[start_index:before_index]
            has_more = start_index > 0
        else:
            # 'before' message not found, return latest
            messages = (
                all_messages[-limit:] if len(all_messages) > limit else all_messages
            )
            has_more = len(all_messages) > limit
    else:
        # No 'before' specified - return the latest messages
        messages = all_messages[-limit:] if len(all_messages) > limit else all_messages
        has_more = len(all_messages) > limit

    # Get the oldest message ID in this batch for pagination
    oldest_message_id = messages[0]["id"] if messages else None

    return {
        "model": CHAT_MODELS[model_id],
        "messages": messages,
        "isGenerating": is_generating,
        "hasMore": has_more,
        "oldestMessageId": oldest_message_id,
        "totalCount": len(all_messages),
    }


@app.post("/api/chat/send/{model_id}")
async def send_chat_message(model_id: str, request: Request):
    """Send a user message to the chat"""
    if model_id not in CHAT_MODELS:
        return {"error": f"Unknown model: {model_id}"}

    data = await request.json()
    sender = data.get("sender", "Anonymous")
    content = data.get("content", "")

    if not content.strip():
        return {"error": "Message content cannot be empty"}

    # Create user message
    message = {
        "id": str(uuid.uuid4()),
        "timestamp": get_current_timestamp(),
        "sender": sender.strip(),
        "content": content.strip(),
        "isUser": True,
        "createdAt": datetime.now().isoformat(),
    }

    chat_messages[model_id].append(message)
    save_chat_storage()

    # Trigger immediate AI response
    asyncio.create_task(generate_chat_message_background(model_id))

    return {
        "success": True,
        "message": message,
    }


@app.get("/api/chat/status/{model_id}")
async def get_chat_status(model_id: str):
    """Get the current status of a chat (is generating, message count)"""
    if model_id not in CHAT_MODELS:
        return {"error": f"Unknown model: {model_id}"}

    return {
        "model_id": model_id,
        "isGenerating": chat_generating.get(model_id, False),
        "messageCount": len(chat_messages.get(model_id, [])),
    }


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser(description="Makemore API Server")
    parser.add_argument(
        "--production", action="store_true", help="Run in production mode"
    )
    parser.add_argument("--port", type=int, default=5001, help="Port to run on")
    args = parser.parse_args()

    # Pre-load both models
    print("=" * 60)
    print("Makemore FastAPI Server with Rossetta")
    print("=" * 60)
    print("Initializing models...")
    try:
        load_model("names")
        print("✓ Names model loaded")
    except Exception as e:
        print(f"⚠ Names model not available: {e}")

    try:
        load_model("drugs")
        print("✓ Drugs model loaded")
    except Exception as e:
        print(f"⚠ Drugs model not available: {e}")

    try:
        load_gpt_chat_model()
        print("✓ GPT Chat model loaded")
    except Exception as e:
        print(f"⚠ GPT Chat model not available: {e}")

    print("Models ready!")
    print("=" * 60)
    print(f"Server running at: http://localhost:{args.port}")
    print(f"Session init endpoint: http://localhost:{args.port}/api/init-session")
    print(f"API docs: http://localhost:{args.port}/docs")
    print("=" * 60)

    if args.production:
        print("Running in production mode")
        print("⚠️  For production, use:")
        print(f"  uvicorn api:app --host 0.0.0.0 --port {args.port} --workers 4")
        print("=" * 60)
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    else:
        print("Running in development mode")
        print("⚠️  Do NOT use in production!")
        print("=" * 60)
        uvicorn.run(app, host="0.0.0.0", port=args.port, reload=True)

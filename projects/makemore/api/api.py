"""
Makemore Name Generator API
Serves trained character-level language models for name generation.
Supports multiple models: names and drugs.

Production deployment on MacBook:
1. Run with uvicorn: uvicorn api:app --host 0.0.0.0 --port 5001 --workers 4
2. Or use the built-in server with: python api.py --production
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import torch
import torch.nn.functional as F
import os
import argparse
import sys

# Add parent directory to path to import rossetta_fastapi
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rossetta_fastapi import setup_rossetta

# Create FastAPI app
app = FastAPI()

# Setup Rossetta - this adds middleware AND creates /api/init-session endpoint
setup_rossetta(
    app,
    secret=os.environ.get("ROSSETTA_SECRET_KEY", "dev-rossetta-secret"),
    timestamp_window=300000,  # 5 minutes
)

# Add session middleware after Rossetta
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SESSION_SECRET_KEY", os.urandom(24).hex()),
)

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


@app.get("/api/generate")
@app.post("/api/generate")
async def generate(request: Request):
    """Generate names endpoint - supports both 'names' and 'drugs' models"""
    # Handle both GET and POST requests
    if request.method == "POST":
        # For POST, access decrypted data
        data = getattr(request.state, "decrypted_data", {})
        if not data:
            # If no decrypted data, try to parse JSON body
            try:
                data = await request.json()
            except:
                data = {}
    else:
        # For GET, use query parameters
        data = dict(request.query_params)

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

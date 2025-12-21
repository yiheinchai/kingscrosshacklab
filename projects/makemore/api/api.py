"""
Makemore Name Generator API
Serves trained character-level language models for name generation.
Supports multiple models: names and drugs.

Production deployment on MacBook:
1. Run with gunicorn: gunicorn -w 4 -b 0.0.0.0:5001 api:app
2. Or use the built-in server with: python api.py --production
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
import torch.nn.functional as F
import os
import argparse
from rossetta_flask import RossettaFlask

app = Flask(__name__)
# Allow CORS from any origin for the API
app.secret_key = os.urandom(24)
app = RossettaFlask(app)

CORS(
    app,
    origins=["*"],
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
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
        model_path = os.path.join(os.path.dirname(__file__), "drugs", "drugs_model.pt")
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
        tokeniser = {char: idx for idx, char in enumerate(params.get("chars", []))}
        detokeniser = {idx: char for idx, char in enumerate(params.get("chars", []))}
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


@app.route("/api/generate", methods=["GET", "POST"])
def generate():
    """Generate names endpoint - supports both 'names' and 'drugs' models"""
    if request.method == "POST":
        data = request.get_json() or {}
    else:
        data = request.args

    count = int(data.get("count", 5))
    temperature = float(data.get("temperature", 1.0))
    model_type = data.get("model", "names")  # Default to names model

    # Validate model type
    if model_type not in ["names", "drugs"]:
        return (
            jsonify(
                {
                    "error": f"Invalid model type: {model_type}. Must be 'names' or 'drugs'"
                }
            ),
            400,
        )

    count = min(max(count, 1), 50)  # Clamp between 1 and 50
    temperature = min(max(temperature, 0.1), 2.0)  # Clamp between 0.1 and 2.0

    try:
        names_generated = []
        for _ in range(count):
            name = generate_name(model_type, temperature)
            if name:  # Only add non-empty names
                names_generated.append(name)

        return jsonify(
            {
                "names": names_generated,
                "count": len(names_generated),
                "temperature": temperature,
                "model": model_type,
            }
        )
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Makemore API Server")
    parser.add_argument(
        "--production", action="store_true", help="Run in production mode"
    )
    parser.add_argument("--port", type=int, default=5001, help="Port to run on")
    args = parser.parse_args()

    # Pre-load both models
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

    if args.production:
        print(f"Running in production mode on port {args.port}")
        app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)
    else:
        print(f"Running in development mode on port {args.port}")
        app.run(host="0.0.0.0", port=args.port, debug=True)

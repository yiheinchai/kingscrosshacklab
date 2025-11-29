"""
Makemore Name Generator API
Serves the trained character-level language model for name generation.

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

app = Flask(__name__)
# Allow CORS from any origin for the API
CORS(
    app,
    origins=["*"],
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Model configuration
CONTEXT_LENGTH = 3
EMBEDDING_DIMS = 8
NUM_HIDDEN = 250


# Load the character set from names.txt
def load_chars():
    names_path = os.path.join(os.path.dirname(__file__), "names.txt")
    with open(names_path, "r") as f:
        names = f.read().splitlines()
    chars = sorted(
        list(set([char for name in names for char in name] + ["<s>", "<e>"]))
    )
    return chars, names


chars, names = load_chars()
tokeniser = {char: idx for idx, char in enumerate(chars)}
detokeniser = {idx: char for idx, char in enumerate(chars)}


# Initialize model parameters (will be trained on first request if not loaded)
def init_model():
    C = torch.randn(len(chars), EMBEDDING_DIMS)
    W_1 = torch.randn(EMBEDDING_DIMS * CONTEXT_LENGTH, NUM_HIDDEN) * 0.2
    b_1 = torch.randn(NUM_HIDDEN) * 0.01
    W_2 = torch.randn(NUM_HIDDEN, len(chars)) * 0.01
    b_2 = torch.randn(len(chars)) * 0
    return C, W_1, b_1, W_2, b_2


def train_model():
    """Train the model on the names dataset"""
    C, W_1, b_1, W_2, b_2 = init_model()
    parameters = [C, W_1, b_1, W_2, b_2]

    for p in parameters:
        p.requires_grad = True

    # Build training data
    X = []
    Y = []
    for name in names:
        name_chars = list(name) + ["<e>"]
        context = [tokeniser["<s>"]] * CONTEXT_LENGTH

        for char in name_chars:
            X.append(context)
            Y.append(tokeniser[char])
            context = context[1:] + [tokeniser[char]]

    X = torch.tensor(X).float()
    Y = torch.tensor(Y)

    # Training loop
    epochs = 50000
    batch_size = 32

    for e in range(epochs):
        batch_ix = torch.randint(0, X.shape[0], (batch_size,))

        for p in parameters:
            if p.grad is not None:
                p.grad = None

        logits = (
            torch.tanh(
                C[X.int()[batch_ix]].view(-1, CONTEXT_LENGTH * EMBEDDING_DIMS) @ W_1
                + b_1
            )
            @ W_2
            + b_2
        )
        loss = F.cross_entropy(logits, Y[batch_ix])

        loss.backward()

        lr = 0.1 if e < 10000 else 0.01
        for p in parameters:
            p.data -= p.grad * lr

        if e % 10000 == 0:
            print(f"Epoch {e}, Loss: {loss.item():.4f}")

    return C.detach(), W_1.detach(), b_1.detach(), W_2.detach(), b_2.detach()


# Global model parameters
model_params = None


def get_model():
    global model_params
    if model_params is None:
        model_path = os.path.join(os.path.dirname(__file__), "model.pt")
        if os.path.exists(model_path):
            print("Loading saved model...")
            model_params = torch.load(model_path)
        else:
            print("Training new model...")
            C, W_1, b_1, W_2, b_2 = train_model()
            model_params = {"C": C, "W_1": W_1, "b_1": b_1, "W_2": W_2, "b_2": b_2}
            torch.save(model_params, model_path)
            print("Model saved!")
    return model_params


def generate_name(temperature=1.0):
    """Generate a single name from the model"""
    params = get_model()
    C, W_1, b_1, W_2, b_2 = (
        params["C"],
        params["W_1"],
        params["b_1"],
        params["W_2"],
        params["b_2"],
    )

    context = [tokeniser["<s>"]] * CONTEXT_LENGTH
    name = ""
    max_length = 20  # Prevent infinite loops

    with torch.no_grad():
        for _ in range(max_length):
            logits = (
                torch.tanh(
                    C[context].view(-1, CONTEXT_LENGTH * EMBEDDING_DIMS) @ W_1 + b_1
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

    return name


@app.route("/api/generate", methods=["GET", "POST"])
def generate():
    """Generate names endpoint"""
    if request.method == "POST":
        data = request.get_json() or {}
    else:
        data = request.args

    count = int(data.get("count", 5))
    temperature = float(data.get("temperature", 1.0))

    count = min(max(count, 1), 50)  # Clamp between 1 and 50
    temperature = min(max(temperature, 0.1), 2.0)  # Clamp between 0.1 and 2.0

    names_generated = []
    for _ in range(count):
        name = generate_name(temperature)
        if name:  # Only add non-empty names
            names_generated.append(name)

    return jsonify(
        {
            "names": names_generated,
            "count": len(names_generated),
            "temperature": temperature,
        }
    )


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

    # Pre-load the model
    print("Initializing model...")
    get_model()
    print("Model ready!")

    if args.production:
        print(f"Running in production mode on port {args.port}")
        app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)
    else:
        print(f"Running in development mode on port {args.port}")
        app.run(host="0.0.0.0", port=args.port, debug=True)

#!/bin/bash

# KXHL Chat API - Production Setup Installer
# Automated setup script for production deployment

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "KXHL Chat API - Production Setup"
echo "============================================================"
echo ""

# Check Python
echo "🔍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    echo "   Install Python 3.8+ and try again"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "   ✅ Python $PYTHON_VERSION found"
echo ""

# Check dependencies
echo "🔍 Checking Python dependencies..."
MISSING_DEPS=()

python3 -c "import fastapi" 2>/dev/null || MISSING_DEPS+=("fastapi")
python3 -c "import uvicorn" 2>/dev/null || MISSING_DEPS+=("uvicorn")
python3 -c "import torch" 2>/dev/null || MISSING_DEPS+=("torch")
python3 -c "import pydantic" 2>/dev/null || MISSING_DEPS+=("pydantic")

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "   ⚠️  Missing dependencies: ${MISSING_DEPS[*]}"
    echo ""
    read -p "   Install missing dependencies? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   📦 Installing dependencies..."
        pip install fastapi uvicorn torch pydantic
        echo "   ✅ Dependencies installed"
    else
        echo "   ❌ Cannot proceed without dependencies"
        exit 1
    fi
else
    echo "   ✅ All dependencies installed"
fi
echo ""

# Check model files
echo "🔍 Checking model files..."
MISSING_MODELS=()

[ ! -f "model.pt" ] && MISSING_MODELS+=("model.pt")
[ ! -f "drugs_model.pt" ] && MISSING_MODELS+=("drugs_model.pt")
[ ! -f "../gpt/transformer_model_v3.pt" ] && MISSING_MODELS+=("transformer_model_v3.pt")
[ ! -f "../gpt/chat.txt" ] && MISSING_MODELS+=("chat.txt")

if [ ${#MISSING_MODELS[@]} -gt 0 ]; then
    echo "   ⚠️  Missing model files: ${MISSING_MODELS[*]}"
    echo "   Please ensure all model files are in place before running"
else
    echo "   ✅ All model files found"
fi
echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p logs/archive
mkdir -p ~/Documents/backups/kxhl-api
echo "   ✅ Directories created"
echo ""

# Make scripts executable
echo "🔧 Setting up scripts..."
chmod +x start_production.sh
chmod +x start_server.sh
chmod +x health_check.sh
chmod +x rotate_logs.sh
chmod +x backup.sh
echo "   ✅ Scripts configured"
echo ""

# Initialize chat storage if it doesn't exist
if [ ! -f "chat_storage.json" ]; then
    echo "💾 Initializing chat storage..."
    echo '{"kxhl-1": []}' > chat_storage.json
    echo "   ✅ Chat storage initialized"
    echo ""
fi

# Test API syntax
echo "🧪 Testing API code..."
if python3 -c "import py_compile; py_compile.compile('api.py')"; then
    echo "   ✅ API code syntax valid"
else
    echo "   ❌ API code has syntax errors"
    exit 1
fi
echo ""

# Offer to set up auto-start
echo "============================================================"
echo "🚀 Setup Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the server:"
echo "   ./start_production.sh start"
echo ""
echo "2. Check status:"
echo "   ./start_production.sh status"
echo ""
echo "3. View documentation:"
echo "   cat README_DEPLOYMENT.md"
echo ""
echo "============================================================"
echo ""

read -p "Would you like to set up auto-start on boot? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📋 Setting up LaunchAgent..."
    
    if [ -f ~/Library/LaunchAgents/com.kxhl.api.plist ]; then
        echo "   ⚠️  LaunchAgent already exists"
        read -p "   Replace it? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "   Skipping LaunchAgent setup"
            exit 0
        fi
        launchctl unload ~/Library/LaunchAgents/com.kxhl.api.plist 2>/dev/null || true
    fi
    
    cp com.kxhl.api.plist ~/Library/LaunchAgents/
    launchctl load ~/Library/LaunchAgents/com.kxhl.api.plist
    
    echo "   ✅ Auto-start configured"
    echo ""
    echo "   Server will start automatically on boot"
    echo "   To disable: launchctl unload ~/Library/LaunchAgents/com.kxhl.api.plist"
fi

echo ""
echo "============================================================"
echo "✅ All done! Your KXHL Chat API is ready for production."
echo "============================================================"

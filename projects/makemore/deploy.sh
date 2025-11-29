#!/bin/bash

# Makemore API Deployment Script for MacBook
# This script sets up the API to run as a background service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PORT=${PORT:-5001}

echo "🚀 Makemore API Deployment Script"
echo "=================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# Create a launchd plist for auto-start (macOS)
PLIST_PATH="$HOME/Library/LaunchAgents/com.kxhl.makemore-api.plist"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kxhl.makemore-api</string>
    <key>ProgramArguments</key>
    <array>
        <string>$VENV_DIR/bin/python</string>
        <string>$SCRIPT_DIR/api.py</string>
        <string>--production</string>
        <string>--port</string>
        <string>$PORT</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/api.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/api.error.log</string>
</dict>
</plist>
EOF

echo "📝 Created launchd service at $PLIST_PATH"

# Load the service
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The API is now running on port $PORT"
echo ""
echo "Useful commands:"
echo "  - Check status: launchctl list | grep makemore"
echo "  - View logs: tail -f $SCRIPT_DIR/api.log"
echo "  - Stop service: launchctl unload $PLIST_PATH"
echo "  - Start service: launchctl load $PLIST_PATH"
echo ""
echo "⚠️  To expose this API to the internet, you'll need to:"
echo "  1. Use ngrok: ngrok http $PORT"
echo "  2. Or use Cloudflare Tunnel (recommended)"
echo "  3. Or set up port forwarding on your router"

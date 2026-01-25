# Production Deployment Guide - KXHL Chat API Server

Complete guide for deploying the KXHL Chat API server in production on macOS (MacBook).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Production Setup](#production-setup)
3. [Process Management](#process-management)
4. [Auto-Start on Boot](#auto-start-on-boot)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)
7. [Security](#security)
8. [Updates & Maintenance](#updates--maintenance)

---

## Prerequisites

### System Requirements

- macOS 10.15 or later
- Python 3.8+
- Conda (recommended) or Python venv
- 4GB RAM minimum (8GB recommended for model inference)
- 2GB free disk space

### Required Files

Ensure these files exist:

```bash
projects/makemore/api/
├── api.py                           # Main API server
├── model.pt                         # Names model
├── drugs_model.pt                   # Drugs model
├── ../gpt/transformer_model_v3.pt   # GPT chat model
└── ../gpt/chat.txt                  # Vocabulary file
```

### Python Dependencies

```bash
pip install fastapi uvicorn torch pydantic
```

---

## Production Setup

### 1. Environment Configuration

Create a production environment file:

```bash
cd /Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api
```

**Option A: Using Conda (Recommended)**

```bash
# Create dedicated environment
conda create -n kxhl-api python=3.10 -y
conda activate kxhl-api

# Install dependencies
pip install fastapi uvicorn torch pydantic
```

**Option B: Using venv**

```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn torch pydantic
```

### 2. Production Server Script

Create a production startup script:

**File: `start_production.sh`**

```bash
#!/bin/bash

# Production startup script for KXHL Chat API
# Usage: ./start_production.sh [start|stop|restart|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
PYTHON_PATH="python"  # Update if using conda: /opt/anaconda3/envs/kxhl-api/bin/python
HOST="0.0.0.0"
PORT="5001"
WORKERS="2"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$LOG_DIR/server.pid"
LOG_FILE="$LOG_DIR/server.log"
ERROR_LOG="$LOG_DIR/error.log"

# Create logs directory
mkdir -p "$LOG_DIR"

# Functions
start_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "❌ Server already running (PID: $PID)"
            return 1
        fi
    fi

    echo "🚀 Starting KXHL Chat API Server in production mode..."
    echo "   Host: $HOST"
    echo "   Port: $PORT"
    echo "   Workers: $WORKERS"
    echo "   Logs: $LOG_FILE"

    # Start with uvicorn in production mode
    nohup $PYTHON_PATH -m uvicorn api:app \
        --host $HOST \
        --port $PORT \
        --workers $WORKERS \
        --log-level info \
        >> "$LOG_FILE" 2>> "$ERROR_LOG" &

    PID=$!
    echo $PID > "$PID_FILE"

    sleep 2

    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Server started successfully (PID: $PID)"
        echo "   Access: http://localhost:$PORT"
        echo "   API Docs: http://localhost:$PORT/docs"
        return 0
    else
        echo "❌ Server failed to start. Check logs:"
        echo "   Error log: $ERROR_LOG"
        rm "$PID_FILE"
        return 1
    fi
}

stop_server() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ No PID file found. Server may not be running."
        return 1
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p $PID > /dev/null 2>&1; then
        echo "❌ Server not running (stale PID file)"
        rm "$PID_FILE"
        return 1
    fi

    echo "🛑 Stopping server (PID: $PID)..."
    kill $PID

    # Wait for graceful shutdown
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            echo "✅ Server stopped successfully"
            rm "$PID_FILE"
            return 0
        fi
        sleep 1
    done

    # Force kill if still running
    echo "⚠️  Forcing server shutdown..."
    kill -9 $PID
    rm "$PID_FILE"
    echo "✅ Server stopped (forced)"
}

server_status() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ Server not running (no PID file)"
        return 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Server running (PID: $PID)"
        echo "   Uptime: $(ps -o etime= -p $PID)"
        echo "   Memory: $(ps -o rss= -p $PID | awk '{printf "%.1f MB", $1/1024}')"

        # Test endpoint
        if curl -s http://localhost:$PORT/api/chat/models > /dev/null; then
            echo "   Status: Responding ✅"
        else
            echo "   Status: Not responding ⚠️"
        fi
        return 0
    else
        echo "❌ Server not running (stale PID file)"
        rm "$PID_FILE"
        return 1
    fi
}

restart_server() {
    echo "🔄 Restarting server..."
    stop_server
    sleep 2
    start_server
}

# Main command handler
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        server_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

Make it executable:

```bash
chmod +x start_production.sh
```

### 3. Start the Server

```bash
./start_production.sh start
```

Verify it's running:

```bash
./start_production.sh status
```

Test endpoints:

```bash
curl http://localhost:5001/api/chat/models
```

---

## Process Management

### Using the Production Script

**Start server:**

```bash
./start_production.sh start
```

**Stop server:**

```bash
./start_production.sh stop
```

**Restart server:**

```bash
./start_production.sh restart
```

**Check status:**

```bash
./start_production.sh status
```

### Manual Process Management

**Find running process:**

```bash
lsof -i :5001
ps aux | grep "uvicorn api:app"
```

**Kill process:**

```bash
# Graceful shutdown
kill $(lsof -ti :5001)

# Force kill if needed
kill -9 $(lsof -ti :5001)
```

---

## Auto-Start on Boot

### Option 1: LaunchAgent (macOS)

Create a launch agent plist file:

**File: `~/Library/LaunchAgents/com.kxhl.api.plist`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kxhl.api</string>

    <key>ProgramArguments</key>
    <array>
        <string>/Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api/start_production.sh</string>
        <string>start</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api/logs/launchd.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api/logs/launchd.error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/anaconda3/bin</string>
    </dict>
</dict>
</plist>
```

**Load the launch agent:**

```bash
launchctl load ~/Library/LaunchAgents/com.kxhl.api.plist
```

**Unload (disable auto-start):**

```bash
launchctl unload ~/Library/LaunchAgents/com.kxhl.api.plist
```

**Check status:**

```bash
launchctl list | grep kxhl
```

### Option 2: Cron Job

Edit crontab:

```bash
crontab -e
```

Add this line:

```bash
@reboot cd /Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api && ./start_production.sh start
```

---

## Monitoring & Logs

### Log Files

All logs are stored in the `logs/` directory:

```
logs/
├── server.log      # Application logs (uvicorn output)
├── error.log       # Error logs
├── launchd.log     # LaunchAgent stdout (if using)
└── launchd.error.log  # LaunchAgent stderr (if using)
```

### View Logs

**Tail application logs:**

```bash
tail -f logs/server.log
```

**View errors:**

```bash
tail -f logs/error.log
```

**View last 50 lines:**

```bash
tail -50 logs/server.log
```

**Search logs:**

```bash
grep "ERROR" logs/server.log
grep "Generated message" logs/server.log
```

### Log Rotation

Create a log rotation script:

**File: `rotate_logs.sh`**

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
DATE=$(date +%Y%m%d_%H%M%S)

# Archive old logs
for log in server.log error.log; do
    if [ -f "$LOG_DIR/$log" ]; then
        mv "$LOG_DIR/$log" "$LOG_DIR/${log%.log}_$DATE.log"
        touch "$LOG_DIR/$log"
    fi
done

# Delete logs older than 30 days
find "$LOG_DIR" -name "*.log" -mtime +30 -delete

echo "Logs rotated at $DATE"
```

Add to crontab to run daily:

```bash
0 0 * * * /Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api/rotate_logs.sh
```

### Health Monitoring

Create a health check script:

**File: `health_check.sh`**

```bash
#!/bin/bash

# Check if server is responding
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/chat/models)

if [ "$response" = "200" ]; then
    echo "✅ Server healthy (HTTP $response)"
    exit 0
else
    echo "❌ Server unhealthy (HTTP $response)"
    # Optional: Send notification or restart
    # /path/to/start_production.sh restart
    exit 1
fi
```

Run every 5 minutes via cron:

```bash
*/5 * * * * /Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api/health_check.sh
```

---

## Troubleshooting

### Server Won't Start

**Check if port is in use:**

```bash
lsof -i :5001
```

**Kill existing process:**

```bash
kill -9 $(lsof -ti :5001)
```

**Check Python path:**

```bash
which python
# If using conda:
which conda
conda env list
```

**Verify model files exist:**

```bash
ls -lh model.pt drugs_model.pt ../gpt/transformer_model_v3.pt
```

**Check error logs:**

```bash
cat logs/error.log
```

### High Memory Usage

**Check memory:**

```bash
ps aux | grep uvicorn
```

**Reduce workers:**
Edit `start_production.sh` and change `WORKERS="1"`

**Clear chat history (if too large):**

```bash
# Backup first
cp chat_storage.json chat_storage.backup.json
# Clear
echo '{"kxhl-1": []}' > chat_storage.json
```

### Connection Refused

**Check firewall:**

```bash
# macOS firewall settings
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

**Verify server is listening:**

```bash
netstat -an | grep 5001
```

**Test locally:**

```bash
curl http://localhost:5001/api/chat/models
```

### Model Loading Errors

**Check file permissions:**

```bash
ls -l model.pt drugs_model.pt ../gpt/transformer_model_v3.pt
```

**Fix permissions:**

```bash
chmod 644 *.pt ../gpt/*.pt
```

**Verify PyTorch installation:**

```bash
python -c "import torch; print(torch.__version__)"
```

---

## Security

### Network Access

**Local only (recommended for MacBook):**

```bash
# In start_production.sh, use:
HOST="127.0.0.1"  # Only accessible from localhost
```

**LAN access:**

```bash
# In start_production.sh, use:
HOST="0.0.0.0"  # Accessible from local network
```

**Find your MacBook's IP:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Firewall Configuration

**Allow port 5001 (if needed):**

```bash
# macOS firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/python
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /path/to/python
```

### Rate Limiting

Consider adding rate limiting in production (requires nginx or similar):

```bash
# Install nginx via Homebrew
brew install nginx

# Configure as reverse proxy with rate limiting
# See: /usr/local/etc/nginx/nginx.conf
```

---

## Updates & Maintenance

### Updating the Server

1. **Stop the server:**

```bash
./start_production.sh stop
```

2. **Backup current state:**

```bash
cp api.py api.py.backup
cp chat_storage.json chat_storage.backup.json
```

3. **Update code:**

```bash
git pull  # if using git
# Or manually update api.py
```

4. **Update dependencies (if needed):**

```bash
pip install --upgrade fastapi uvicorn torch
```

5. **Test changes:**

```bash
python -c "import py_compile; py_compile.compile('api.py')"
```

6. **Restart server:**

```bash
./start_production.sh start
```

7. **Verify:**

```bash
./start_production.sh status
curl http://localhost:5001/api/chat/models
```

### Adding New Models

1. **Add model file:**

```bash
cp new_model.pt projects/makemore/api/
```

2. **Update `api.py`:**

```python
CHAT_MODELS = {
    "kxhl-1": { ... },
    "kxhl-2": {
        "id": "kxhl-2",
        "name": "KXHL-2",
        "description": "New model description",
        "model_file": "new_model.pt"
    }
}
```

3. **Restart server:**

```bash
./start_production.sh restart
```

### Backup Strategy

**Daily backup script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/Users/yihein.chai/Documents/backups/kxhl-api"
mkdir -p "$BACKUP_DIR"

# Backup chat storage
cp chat_storage.json "$BACKUP_DIR/chat_storage_$DATE.json"

# Backup logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" logs/

# Delete backups older than 7 days
find "$BACKUP_DIR" -mtime +7 -delete
```

---

## Quick Reference

### Common Commands

```bash
# Start server
./start_production.sh start

# Stop server
./start_production.sh stop

# Restart server
./start_production.sh restart

# Check status
./start_production.sh status

# View logs
tail -f logs/server.log

# Check if responding
curl http://localhost:5001/api/chat/models

# Memory usage
ps aux | grep uvicorn

# Kill all processes on port 5001
lsof -ti :5001 | xargs kill -9
```

### API Endpoints

```bash
# Get available models
curl http://localhost:5001/api/chat/models

# Get messages for a model
curl http://localhost:5001/api/chat/messages/kxhl-1

# Send a message
curl -X POST http://localhost:5001/api/chat/send/kxhl-1 \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","sender":"User"}'

# Check generation status
curl http://localhost:5001/api/chat/status/kxhl-1

# API documentation
open http://localhost:5001/docs
```

---

## Support

For issues or questions:

1. Check logs: `logs/error.log`
2. Verify status: `./start_production.sh status`
3. Review troubleshooting section
4. Check GitHub issues (if applicable)

**Last Updated:** January 25, 2026

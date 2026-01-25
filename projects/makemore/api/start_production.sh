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

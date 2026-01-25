#!/bin/bash

# Health check script for KXHL Chat API
# Run periodically via cron to ensure server is responding

PORT="5001"
MAX_RETRIES=3

check_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/chat/models)
    return $response
}

for i in $(seq 1 $MAX_RETRIES); do
    check_health
    status=$?
    
    if [ "$status" = "200" ]; then
        echo "[$(date)] ✅ Server healthy (HTTP $status)"
        exit 0
    else
        echo "[$(date)] ⚠️  Attempt $i/$MAX_RETRIES failed (HTTP $status)"
        if [ $i -lt $MAX_RETRIES ]; then
            sleep 2
        fi
    fi
done

echo "[$(date)] ❌ Server unhealthy after $MAX_RETRIES attempts"

# Optional: Auto-restart on failure
# Uncomment to enable automatic restart
# echo "[$(date)] 🔄 Attempting automatic restart..."
# SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# "$SCRIPT_DIR/start_production.sh" restart

exit 1

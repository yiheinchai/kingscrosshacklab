#!/bin/bash

# Log rotation script for KXHL Chat API
# Rotates logs and deletes old archives

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
ARCHIVE_DIR="$LOG_DIR/archive"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

echo "🔄 Rotating logs at $(date)"

# Archive and compress logs
for log in server.log error.log; do
    if [ -f "$LOG_DIR/$log" ]; then
        if [ -s "$LOG_DIR/$log" ]; then
            # Archive if file has content
            gzip -c "$LOG_DIR/$log" > "$ARCHIVE_DIR/${log%.log}_$DATE.log.gz"
            echo "   Archived: ${log%.log}_$DATE.log.gz"
            
            # Clear the log file
            > "$LOG_DIR/$log"
        fi
    fi
done

# Delete archives older than retention period
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -delete
echo "   Deleted archives older than $RETENTION_DAYS days"

# Show current log sizes
echo "📊 Current log sizes:"
du -h "$LOG_DIR"/*.log 2>/dev/null || echo "   No active logs"

echo "✅ Log rotation complete"

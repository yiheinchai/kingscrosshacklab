#!/bin/bash

# Backup script for KXHL Chat API
# Backs up chat storage and logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/Documents/backups/kxhl-api"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup at $(date)"

# Backup chat storage
if [ -f "$SCRIPT_DIR/chat_storage.json" ]; then
    cp "$SCRIPT_DIR/chat_storage.json" "$BACKUP_DIR/chat_storage_$DATE.json"
    echo "   ✅ Backed up: chat_storage_$DATE.json"
fi

# Backup logs
if [ -d "$SCRIPT_DIR/logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" -C "$SCRIPT_DIR" logs/
    echo "   ✅ Backed up: logs_$DATE.tar.gz"
fi

# Delete old backups
find "$BACKUP_DIR" -name "chat_storage_*.json" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "logs_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "   🗑️  Deleted backups older than $RETENTION_DAYS days"

# Show backup directory size
echo "📊 Backup directory size:"
du -sh "$BACKUP_DIR"

echo "✅ Backup complete"

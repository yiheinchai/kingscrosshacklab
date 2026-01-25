# KXHL Chat API - Quick Start Guide

Production deployment guide for running the KXHL Chat API on your MacBook.

## 📋 Quick Start (5 Minutes)

### 1. Navigate to API Directory

```bash
cd /Users/yihein.chai/Documents/learn/kingscrosshacklab/projects/makemore/api
```

### 2. Start the Server

```bash
./start_production.sh start
```

### 3. Verify It's Running

```bash
./start_production.sh status
```

### 4. Test the API

```bash
curl http://localhost:5001/api/chat/models
```

That's it! Your API server is now running in production mode.

---

## 🎯 Common Commands

| Command                         | Description         |
| ------------------------------- | ------------------- |
| `./start_production.sh start`   | Start the server    |
| `./start_production.sh stop`    | Stop the server     |
| `./start_production.sh restart` | Restart the server  |
| `./start_production.sh status`  | Check server status |
| `tail -f logs/server.log`       | View live logs      |
| `./health_check.sh`             | Test server health  |
| `./backup.sh`                   | Backup chat data    |

---

## 📁 File Structure

```
projects/makemore/api/
├── api.py                      # Main API server
├── start_production.sh         # Production startup script ⭐
├── start_server.sh            # Simple dev startup script
├── health_check.sh            # Health monitoring
├── rotate_logs.sh             # Log rotation
├── backup.sh                  # Backup script
├── com.kxhl.api.plist        # LaunchAgent template
├── DEPLOYMENT_PRODUCTION.md   # Full documentation ⭐
├── chat_storage.json          # Persistent chat data
├── model.pt                   # Names model
├── drugs_model.pt             # Drugs model
├── logs/                      # Log files
│   ├── server.log            # Application logs
│   ├── error.log             # Error logs
│   └── archive/              # Archived logs
└── ../gpt/
    ├── transformer_model_v3.pt  # Chat model
    └── chat.txt                 # Vocabulary
```

---

## 🚀 Auto-Start on Boot

To make the server start automatically when your MacBook boots:

### 1. Copy LaunchAgent

```bash
cp com.kxhl.api.plist ~/Library/LaunchAgents/
```

### 2. Load LaunchAgent

```bash
launchctl load ~/Library/LaunchAgents/com.kxhl.api.plist
```

### 3. Verify

```bash
launchctl list | grep kxhl
```

To disable auto-start:

```bash
launchctl unload ~/Library/LaunchAgents/com.kxhl.api.plist
```

---

## 🔍 Monitoring

### View Logs

```bash
# Live logs
tail -f logs/server.log

# Errors only
tail -f logs/error.log

# Last 50 lines
tail -50 logs/server.log

# Search for errors
grep "ERROR" logs/server.log
```

### Server Status

```bash
./start_production.sh status
```

Output shows:

- ✅ Process ID (PID)
- ⏱️ Uptime
- 💾 Memory usage
- 🌐 API responsiveness

### Health Check

```bash
./health_check.sh
```

Automatically retries 3 times before failing.

---

## 🛠️ Maintenance

### Daily Backups

Run automatically or manually:

```bash
./backup.sh
```

Backups saved to: `~/Documents/backups/kxhl-api/`

- Keeps backups for 7 days
- Includes chat storage and logs

### Log Rotation

Run weekly or when logs get large:

```bash
./rotate_logs.sh
```

Archives and compresses logs, keeps for 30 days.

### Clear Chat History

```bash
# Backup first!
cp chat_storage.json chat_storage.backup.json

# Clear all messages
echo '{"kxhl-1": []}' > chat_storage.json

# Restart server to apply
./start_production.sh restart
```

---

## ⚠️ Troubleshooting

### Server Won't Start

**Port already in use:**

```bash
# Check what's using port 5001
lsof -i :5001

# Kill it
lsof -ti :5001 | xargs kill -9

# Try starting again
./start_production.sh start
```

**Check error logs:**

```bash
cat logs/error.log
```

**Verify models exist:**

```bash
ls -lh model.pt drugs_model.pt ../gpt/transformer_model_v3.pt
```

### Server Not Responding

```bash
# Check if process is running
./start_production.sh status

# Check logs
tail -20 logs/error.log

# Restart
./start_production.sh restart
```

### High Memory Usage

```bash
# Check memory
ps aux | grep uvicorn

# Reduce workers (edit start_production.sh)
# Change WORKERS="2" to WORKERS="1"
nano start_production.sh

# Restart
./start_production.sh restart
```

---

## 🌐 Network Access

### Local Only (Default - Recommended)

Server accessible only from this MacBook.

**No changes needed** - already configured in `start_production.sh`

### LAN Access (Optional)

Make server accessible from other devices on your network.

**Edit `start_production.sh`:**

```bash
# Change from:
HOST="127.0.0.1"

# To:
HOST="0.0.0.0"
```

**Find your MacBook's IP:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Access from other devices:**

```
http://YOUR_MACBOOK_IP:5001/api/chat/models
```

---

## 📊 API Endpoints

Once running, the API provides these endpoints:

### Available Models

```bash
curl http://localhost:5001/api/chat/models
```

### Get Messages

```bash
curl http://localhost:5001/api/chat/messages/kxhl-1
```

### Send Message

```bash
curl -X POST http://localhost:5001/api/chat/send/kxhl-1 \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","sender":"YourName"}'
```

### Check Status

```bash
curl http://localhost:5001/api/chat/status/kxhl-1
```

### API Documentation

```bash
open http://localhost:5001/docs
```

---

## 🔄 Updating

### Update API Code

```bash
# Stop server
./start_production.sh stop

# Backup
cp api.py api.py.backup

# Update code (via git or manual edit)
# ... make your changes ...

# Test syntax
python -c "import py_compile; py_compile.compile('api.py')"

# Start server
./start_production.sh start

# Verify
./start_production.sh status
```

### Add New Model

1. Copy model file to `projects/makemore/api/`
2. Edit `api.py` and add to `CHAT_MODELS` dict
3. Restart: `./start_production.sh restart`

---

## 📚 Full Documentation

For complete details, see: [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)

Includes:

- ✅ Complete setup instructions
- ✅ Security configuration
- ✅ Advanced troubleshooting
- ✅ Cron job examples
- ✅ Firewall configuration
- ✅ Performance tuning

---

## 🆘 Need Help?

1. **Check logs:** `tail -f logs/error.log`
2. **Verify status:** `./start_production.sh status`
3. **Review full docs:** [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)
4. **Test health:** `./health_check.sh`

---

**Last Updated:** January 25, 2026

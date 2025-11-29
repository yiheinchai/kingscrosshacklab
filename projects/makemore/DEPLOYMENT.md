# Makemore API Deployment Guide

## Overview

This guide covers deploying the Makemore name generator API on your old MacBook Pro and exposing it to the internet securely using Cloudflare Tunnel.

## Prerequisites

- Python 3.8+
- Cloudflare account (free tier works)
- Your old MacBook Pro with internet connection

## Quick Start (Local Only)

```bash
cd projects/makemore
pip install -r requirements.txt
python api.py
```

API will be available at `http://localhost:5001`

## Production Deployment on MacBook

### Option 1: Using the Deploy Script (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:

- Create a virtual environment
- Install dependencies
- Set up the API as a macOS launchd service (auto-starts on boot)

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run in production mode
python api.py --production --port 5001
```

## Exposing to the Internet

### Method 1: Cloudflare Tunnel (Recommended - Free & Secure)

Cloudflare Tunnel creates a secure connection from your MacBook to Cloudflare's network without opening ports on your router.

1. **Install cloudflared:**

   ```bash
   brew install cloudflared
   ```

2. **Login to Cloudflare:**

   ```bash
   cloudflared tunnel login
   ```

3. **Create a tunnel:**

   ```bash
   cloudflared tunnel create makemore-api
   ```

4. **Configure the tunnel:**
   Create `~/.cloudflared/config.yml`:

   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /Users/YOUR_USERNAME/.cloudflared/YOUR_TUNNEL_ID.json

   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:5001
     - service: http_status:404
   ```

5. **Add DNS record:**

   ```bash
   cloudflared tunnel route dns makemore-api api.yourdomain.com
   ```

6. **Run the tunnel:**

   ```bash
   cloudflared tunnel run makemore-api
   ```

7. **Install as service (auto-start):**
   ```bash
   sudo cloudflared service install
   ```

Your API will be available at `https://api.yourdomain.com`

### Method 2: ngrok (Quick Testing)

```bash
# Install ngrok
brew install ngrok

# Expose the API
ngrok http 5001
```

Note: Free tier URLs change each restart. Paid plans offer stable URLs.

### Method 3: Port Forwarding (Not Recommended)

If you must use port forwarding:

1. Configure your router to forward port 5001 to your MacBook's local IP
2. Use a dynamic DNS service if you don't have a static IP
3. ⚠️ This exposes your machine directly to the internet

## Update React App

Once your API is exposed, update the production environment:

```bash
# In kxhl/.env.production
VITE_API_URL=https://api.yourdomain.com
```

Then rebuild and deploy:

```bash
cd kxhl
npm run build
npx wrangler pages deploy dist
```

## API Endpoints

- `GET/POST /api/generate` - Generate names
  - `count` (int): Number of names to generate (1-50)
  - `temperature` (float): Sampling temperature (0.1-2.0)
- `GET /api/health` - Health check

## Monitoring

```bash
# View logs
tail -f api.log

# Check if running
curl http://localhost:5001/api/health

# Check service status
launchctl list | grep makemore
```

## Troubleshooting

**API not starting:**

```bash
# Check logs
cat api.error.log

# Manually test
source .venv/bin/activate
python api.py
```

**Model not loading:**

- Delete `model.pt` and restart - it will retrain
- Check you have enough disk space

**CORS errors:**

- The API allows all origins by default
- Check browser console for specific errors

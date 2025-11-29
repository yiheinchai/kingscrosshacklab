# KXHL Deployment Guide

## Overview

This guide covers deploying the full KXHL stack:

- **React App** → Cloudflare Pages (kxhacklab.com)
- **Makemore API** → MacBook via Cloudflare Tunnel (makemore.kxhacklab.com)

---

## 1. React App (Cloudflare Pages)

### Initial Setup

```bash
# Navigate to the React app
cd kxhl

# Install dependencies
npm install

# Run locally
npm run dev
```

### Deploy to Cloudflare Pages

```bash
# Build and deploy
npm run build
npx wrangler pages deploy dist --project-name=kingscrosshacklab
```

The app will be live at `https://kxhacklab.com`

---

## 2. Makemore API (MacBook + Cloudflare Tunnel)

### Start the API

```bash
cd projects/makemore

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API
python api.py --production --port 5001
```

API runs at `http://localhost:5001`

### Expose via Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create makemore-api
```

### Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/YOUR_USERNAME/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: makemore.kxhacklab.com
    service: http://localhost:5001
  - service: http_status:404
```

### Add DNS Route

```bash
cloudflared tunnel route dns makemore-api makemore.kxhacklab.com
```

### Run the Tunnel

```bash
cloudflared tunnel run makemore-api
```

API is now live at `https://makemore.kxhacklab.com`

---

## 3. Environment Configuration

### React App (`kxhl/.env.production`)

```
VITE_API_URL=https://makemore.kxhacklab.com
```

### React App (`kxhl/.env`)

```
VITE_API_URL=http://localhost:5001
```

---

## 4. Quick Commands

### Deploy React App

```bash
cd kxhl && npm run build && npx wrangler pages deploy dist --project-name=kingscrosshacklab
```

### Start API + Tunnel (2 terminals)

```bash
# Terminal 1: API
cd projects/makemore && source .venv/bin/activate && python api.py --production

# Terminal 2: Tunnel
cloudflared tunnel run makemore-api
```

### Check API Health

```bash
curl https://makemore.kxhacklab.com/api/health
```

---

## 5. API Endpoints

| Endpoint        | Method   | Description    |
| --------------- | -------- | -------------- |
| `/api/generate` | GET/POST | Generate names |
| `/api/health`   | GET      | Health check   |

**Parameters:**

- `count` (int): 1-50
- `temperature` (float): 0.1-2.0

---

## 6. Troubleshooting

**API errors:**

```bash
# Check logs
tail -f api.log

# Test locally
curl http://localhost:5001/api/health
```

**Tunnel issues:**

```bash
# Check tunnel status
cloudflared tunnel info makemore-api

# Restart tunnel
cloudflared tunnel run makemore-api
```

**React app not calling API:**

- Check `kxhl/.env.production` has correct URL
- Rebuild: `npm run build`
- Redeploy: `npx wrangler pages deploy dist --project-name=kingscrosshacklab`

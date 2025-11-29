# KXHL - Kings Cross Hack Lab

The official website for Kings Cross Hack Lab - a weekly builders collective where founders, developers, and designers ship together.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: TanStack Router
- **Styling**: Custom CSS with Space Grotesk / Space Mono fonts
- **Hosting**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yiheinchai/kingscrosshacklab.git
cd kingscrosshacklab/kxhl

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server with hot reload
npm run dev
```

The site will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Deployment

### Cloudflare Pages

The site is deployed to Cloudflare Pages. There are two ways to deploy:

#### Option 1: CLI Deploy (Recommended for quick updates)

```bash
# Build and deploy in one command
npm run deploy
```

This runs `npm run build && npx wrangler pages deploy dist --project-name=kxhl`

#### Option 2: Git Integration (Recommended for production)

1. Connect your GitHub repository to Cloudflare Pages
2. Set the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `kxhl`
3. Every push to `main` will trigger an automatic deployment

### First-time Cloudflare Setup

1. Install Wrangler CLI (already in devDependencies):

   ```bash
   npm install
   ```

2. Login to Cloudflare:

   ```bash
   npx wrangler login
   ```

3. Create the Pages project (if it doesn't exist):

   ```bash
   npx wrangler pages project create kxhl
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Custom Domain

To add a custom domain:

1. Go to Cloudflare Dashboard → Pages → kxhl → Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `kxhacklab.com`)
4. Follow DNS configuration instructions

### Environment Variables

If you need environment variables, add them in:

- Cloudflare Dashboard → Pages → kxhl → Settings → Environment variables
- Or use `wrangler.toml` for non-sensitive config

## Project Structure

```
kxhl/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # React components
│   │   └── MakemorePage.tsx
│   ├── styles/
│   │   └── global.css   # Main stylesheet
│   ├── App.tsx          # Main app with routing
│   ├── App.css          # App-specific styles
│   ├── index.css        # Base styles
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml        # Cloudflare Pages config
```

## Available Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start development server             |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview production build             |
| `npm run lint`    | Run ESLint                           |
| `npm run deploy`  | Build and deploy to Cloudflare Pages |

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test locally: `npm run dev`
4. Build to check for errors: `npm run build`
5. Commit and push
6. Open a pull request

## License

MIT

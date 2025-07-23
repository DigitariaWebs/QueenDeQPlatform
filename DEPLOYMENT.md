# Queen de Q Platform - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Ensure you have a valid OpenAI API key
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Environment Variables

Before deploying, you need to set up environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
CORS_ORIGIN=https://your-domain.vercel.app
```

## Deployment Steps

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 2. Or Deploy via GitHub

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the configuration and deploy

## Project Structure

```
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to exclude from deployment
├── package.json         # Frontend dependencies and build scripts
├── vite.config.ts       # Vite configuration with proxy
├── src/                 # Frontend source code
└── backend/
    ├── src/
    │   └── index-chat-only.js  # Backend entry point
    └── package.json     # Backend dependencies
```

## How It Works

1. **Frontend**: Built with Vite and served as static files
2. **Backend**: Node.js Express server running as Vercel serverless functions
3. **Routing**: 
   - `/api/*` routes go to the backend
   - All other routes serve the frontend

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure `OPENAI_API_KEY` is set in Vercel
2. **Build Errors**: Check that all dependencies are properly installed
3. **API Errors**: Verify the backend is receiving requests correctly

### Debugging

1. Check Vercel function logs in the dashboard
2. Use browser developer tools to inspect network requests
3. Verify environment variables are loaded correctly

## Local Development

```bash
# Start backend
cd backend
npm install
node src/index-chat-only.js

# Start frontend (in another terminal)
npm install
npm run dev
```

The frontend will proxy API requests to the backend during development. 
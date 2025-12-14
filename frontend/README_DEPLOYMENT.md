# Cloudflare Pages Deployment Guide

This project is configured for deployment to Cloudflare Pages.

## Build Configuration

- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Root Directory**: `frontend` (if deploying from monorepo root) or `.` (if deploying frontend folder directly)
- **Node Version**: 18+ (specified in `.nvmrc` and `package.json`)

## Environment Variables

Set the following in Cloudflare Pages environment variables:

- `VITE_API_URL`: Your backend API URL (e.g., `https://your-api-domain.com`)

## Build Process

1. Cloudflare Pages will:
   - Install dependencies: `npm install`
   - Run build: `npm run build`
   - Deploy the `dist` folder

## SPA Routing

The `public/_redirects` file ensures all routes redirect to `index.html` for proper SPA routing.

## Local Build Test

Test the build locally before deploying:

```bash
cd frontend
npm install
npm run build
```

This should create a `dist` folder with no errors.

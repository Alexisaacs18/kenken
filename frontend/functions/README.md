# Cloudflare Pages Functions

This directory contains serverless functions that run on Cloudflare Pages.

## Structure

- `functions/api/generate.ts` - Generates new KenKen puzzles
- `functions/api/solve.ts` - Solves KenKen puzzles
- `functions/api/validate.ts` - Validates board state
- `functions/api/kenken.ts` - Core KenKen logic (TypeScript port)

## How It Works

Cloudflare Pages automatically serves files in the `functions/` directory as API endpoints:

- `functions/api/generate.ts` → `/api/generate`
- `functions/api/solve.ts` → `/api/solve`
- `functions/api/validate.ts` → `/api/validate`

## Development

For local development, you can use:
1. `wrangler pages dev` to test functions locally
2. Or continue using the Python Flask backend on port 5001

## Deployment

When deploying to Cloudflare Pages:
1. The functions will automatically be deployed
2. Update `VITE_API_URL` to point to your Cloudflare Pages domain
3. Or leave it unset to use relative URLs (same domain)

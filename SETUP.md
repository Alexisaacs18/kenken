# Simple Setup Guide

## How It Works

1. **Sessions**: Stored in browser `localStorage` - automatically saves/restores your progress
2. **Daily Puzzle**: Uses date as seed - automatically changes every day
3. **Practice Puzzles**: Generate fresh each time (random)
4. **Large Puzzles (7x7-9x9)**: Preloaded in D1 database for instant loading

## One-Time Setup

### Step 1: Preload Large Puzzles into D1

Run this once to populate D1 with puzzles for sizes 7x7, 8x8, and 9x9:

```bash
cd backend
npm run populate-puzzles -- --remote
```

This generates and stores puzzles in your Cloudflare D1 database. They'll load instantly forever.

### Step 2: Deploy

```bash
# Deploy backend
cd backend
npx wrangler deploy

# Deploy frontend (if using Cloudflare Pages)
cd ../frontend
# Your deployment command here
```

## That's It!

- **Daily puzzle**: Changes automatically every day (date-based seed)
- **Practice puzzles**: Fresh each time you click a difficulty
- **Sessions**: Automatically saved/restored in browser
- **Large puzzles**: Load instantly from D1 (after Step 1)

## How Daily Refresh Works

The daily puzzle uses today's date as the seed:
- Same date = same puzzle (everyone gets the same puzzle)
- Different date = different puzzle (automatic daily refresh)

No cron jobs needed - it just works!

## Troubleshooting

**Large puzzles (7x7-9x9) not loading?**
- Make sure you ran `npm run populate-puzzles -- --remote` in the backend folder
- Check that D1 database is connected in Cloudflare Dashboard

**Sessions not saving?**
- Check browser console for errors
- Make sure localStorage is enabled in your browser


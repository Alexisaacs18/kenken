# Daily Puzzle Preloading System - Integration Guide

## Overview

This system preloads 3 KenKen puzzles daily per size/difficulty combo into Cloudflare KV, providing instant puzzle loading for users. When the cache is exhausted, it falls back to on-demand generation.

## Architecture

1. **Cron Worker** (`backend/src/cron.ts`): Runs daily at 00:05 UTC to preload puzzles
2. **API Endpoints** (`backend/src/index.ts`): 4 new endpoints for puzzle cache management
3. **React Hook** (`frontend/src/hooks/useDailyPuzzles.ts`): Fetches puzzles from cache or generates on-demand
4. **Integration Component** (`frontend/src/components/PuzzleLoader.tsx`): UI indicator for cache vs generated

## Setup

### 1. Update wrangler.toml

The cron trigger is already added:
```toml
[triggers]
crons = ["5 0 * * *"]  # Runs at 00:05 UTC daily
```

### 2. Deploy the Worker

```bash
cd backend
npm run deploy
```

The cron job will automatically start running daily.

## Usage in React

### Basic Integration

```tsx
import { useDailyPuzzles } from './hooks/useDailyPuzzles';
import PuzzleLoader from './components/PuzzleLoader';

function MyPuzzleComponent() {
  const { puzzle, loading, error, usageCount, reload } = useDailyPuzzles(9, 'hard');

  if (loading) {
    return <div>Loading puzzle...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!puzzle) {
    return <div>No puzzle available</div>;
  }

  return (
    <div>
      <PuzzleLoader loading={loading} usageCount={usageCount} error={error} />
      {/* Your puzzle UI here */}
    </div>
  );
}
```

### Integration with App.tsx

```tsx
// In App.tsx, replace handleDifficultySelect:
const handleDifficultySelect = async (size: number) => {
  // Map size to difficulty
  const difficulty = size <= 4 ? 'easy' : size <= 6 ? 'medium' : 'hard';
  
  const { puzzle, loading, error, usageCount } = useDailyPuzzles(size, difficulty);
  
  if (puzzle) {
    setPuzzle(puzzle);
    // ... rest of your setup
  }
};
```

## API Endpoints

### GET /api/puzzle/[key]
Returns puzzles array and usage count.

**Key format**: `puzzles:${size}x${size}:${difficulty}:${YYYY-MM-DD}`

**Response**:
```json
{
  "puzzles": [...],
  "usageCount": 2  // 1-3 = cache, 4+ = generated
}
```

### PUT /api/puzzle/[key]
Updates remaining puzzles in cache.

**Request body**:
```json
{
  "puzzles": [...]  // Remaining puzzles array
}
```

### DELETE /api/puzzle/[key]
Clears empty cache entry.

### POST /api/generate/[size]/[difficulty]
Generates puzzle on-demand (fallback).

**Response**:
```json
{
  "puzzle": {...},
  "stats": {...},
  "usageCount": 4
}
```

## Cron Job Details

- **Schedule**: Daily at 00:05 UTC
- **Sizes**: [3, 4, 5, 6, 7, 8, 9]
- **Difficulties**: ['easy', 'medium', 'hard']
- **Puzzles per combo**: 3
- **KV TTL**: 24 hours (86400 seconds)

## Key Format

```
puzzles:${size}x${size}:${difficulty}:${YYYY-MM-DD}
```

Examples:
- `puzzles:9x9:hard:2025-12-15`
- `puzzles:4x4:easy:2025-12-15`
- `puzzles:7x7:medium:2025-12-15`

## Usage Count Logic

- **1-3**: Puzzle came from daily cache (instant load)
- **4+**: Puzzle was generated on-demand (slower, 7-10s for 9x9)

## Edge Cases Handled

1. **Cache miss**: Automatically generates on-demand
2. **KV full**: Overwrites with new batch (last 3 puzzles kept)
3. **User switches difficulty**: New cache key, fresh fetch
4. **Offline**: Error handling in hook, can queue for retry

## Performance

- **Cached puzzles**: < 100ms load time
- **On-demand generation**: 7-10s for 9x9 (worst case)
- **Daily preload**: ~5-10 minutes total (runs in background)


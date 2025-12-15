# Daily Puzzle Preloading - Integration Guide

## Overview

This system preloads exactly 3 KenKen puzzles daily per size/difficulty combo into Cloudflare KV, providing instant puzzle loading for the first 3 users. After cache is exhausted, it falls back to on-demand generation.

## Architecture

1. **Cron Preloader** (`backend/src/cron.ts`): Runs daily at 00:05 UTC
2. **Cache-First Endpoint** (`/api/puzzle/[size]/[difficulty]`): Returns cached puzzle, falls back to generator
3. **Pure Generator** (`/api/generate/[size]/[difficulty]`): Direct puzzle generation
4. **React Hook** (`usePuzzleLoader`): Loads puzzles with cache-first behavior

## Key Features

- ✅ Exactly 3 puzzles preloaded per day per size/difficulty combo
- ✅ UTC date for unambiguous "today" matching 00:05 UTC cron
- ✅ Cache-first: First 3 users get instant puzzles from KV
- ✅ Generator fallback: After cache exhausted, unlimited on-demand generation
- ✅ Generated puzzles stored in D1 for analytics (not added to KV cache)

## Usage

### React Hook Integration

```tsx
import { usePuzzleLoader } from './hooks/usePuzzleLoader';

function MyPuzzleComponent() {
  const { puzzle, loading, error, fromCache, reload } = usePuzzleLoader(9, 'hard');

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
      {fromCache ? (
        <p>✓ Daily puzzle loaded instantly</p>
      ) : (
        <p>⚡ Freshly generated puzzle</p>
      )}
      <PuzzleBoard puzzle={puzzle} />
    </div>
  );
}
```

### API Endpoints

#### POST /api/puzzle/[size]/[difficulty]
Cache-first endpoint that:
1. Checks KV for today's cached puzzles
2. Returns first puzzle if available, updates cache with remaining
3. Falls back to generator if cache empty
4. Stores generated puzzles in D1 (not in KV cache)

**Example:**
```bash
POST /api/puzzle/9/hard
```

**Response:**
```json
{
  "puzzle": {
    "size": 9,
    "cages": [...],
    "solution": [...]
  },
  "stats": {...},
  "fromCache": true
}
```

#### POST /api/generate/[size]/[difficulty]
Pure generator endpoint (no cache logic).

**Example:**
```bash
POST /api/generate/9/hard
```

## KV Key Format

```
puzzles:${size}x${size}:${difficulty}:${YYYY-MM-DD}
```

Examples:
- `puzzles:9x9:hard:2025-12-15`
- `puzzles:4x4:easy:2025-12-15`
- `puzzles:7x7:medium:2025-12-15`

## Cron Schedule

- **Schedule**: Daily at 00:05 UTC
- **Sizes**: [3, 4, 5, 6, 7, 8, 9]
- **Difficulties**: ['easy', 'medium', 'hard']
- **Puzzles per combo**: Exactly 3
- **Total puzzles per day**: 3 × 7 sizes × 3 difficulties = 63 puzzles

## Behavior Flow

### First 3 Requests (Cached)
1. User requests puzzle → `/api/puzzle/9/hard`
2. Endpoint checks KV: `puzzles:9x9:hard:2025-12-15`
3. Returns `puzzles[0]`, saves `puzzles.slice(1)` back to KV
4. Response includes `fromCache: true`

### After Cache Exhausted (Generated)
1. User requests puzzle → `/api/puzzle/9/hard`
2. Endpoint checks KV: empty or missing
3. Generates puzzle on-demand
4. Stores in D1 (optional, for analytics)
5. Returns generated puzzle with `fromCache: false`
6. **Does NOT add to KV cache** (day's cap remains 3)

## Environment Variables

Required bindings in `wrangler.toml` or Pages settings:

```toml
[[kv_namespaces]]
binding = "PUZZLES_KV"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "KENKEN_DB"
database_name = "puzzalo"
database_id = "your-d1-database-id"
```

## Testing

### Test Cron Locally
```bash
cd backend
wrangler dev --test-scheduled
```

### Test Endpoint
```bash
curl -X POST https://your-site.pages.dev/api/puzzle/9/hard
```

### Verify Cache
Check Cloudflare dashboard → KV → View keys matching `puzzles:*`

## Integration Example

Replace existing puzzle loading in `App.tsx`:

```tsx
// Before
const response = await generatePuzzle(size, algorithm);

// After
const { puzzle, loading, fromCache } = usePuzzleLoader(size, getDifficulty(size));
```

## Notes

- UTC date ensures "today" is unambiguous across timezones
- Generated puzzles are unlimited after cache exhausted
- D1 storage is optional (for analytics/history)
- KV cache has 24h TTL (auto-expires next day)


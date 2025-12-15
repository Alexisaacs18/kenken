/**
 * Cloudflare Worker Cron Job: Daily Puzzle Preloader
 * Runs daily at 00:05 UTC to preload 3 puzzles per size/difficulty combo
 */

import { generate, solve, cliquesToCages } from './kenken';

interface Env {
  PUZZLES_KV?: KVNamespace;
  KV_BINDING?: KVNamespace;
  PUZZLES_DB?: D1Database;
  DB?: D1Database;
}

interface PuzzleData {
  id: string;
  size: number;
  difficulty: string;
  grid: number[][];
  cages: Array<{
    cells: [number, number][];
    operator: string;
    target: number;
  }>;
  operations: string[];
  solution: number[][];
  generatedAt: string;
}

// Map difficulty to size ranges for generation
function getSizeForDifficulty(difficulty: string): number[] {
  const difficultyMap: { [key: string]: number[] } = {
    easy: [3, 4, 5],
    medium: [5, 6, 7],
    hard: [7, 8, 9],
  };
  return difficultyMap[difficulty] || [4];
}

// Generate a single puzzle
async function generatePuzzle(size: number, difficulty: string, seed?: string): Promise<PuzzleData | null> {
  try {
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      console.error(`Failed to solve ${size}x${size} ${difficulty} puzzle`);
      return null;
    }

    const cages = cliquesToCages(cliques);
    const operations = cliques.map(([, op]) => op);

    return {
      id: `${size}x${size}-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: puzzleSize,
      difficulty,
      grid: Array(size).fill(0).map(() => Array(size).fill(0)), // Empty grid
      cages,
      operations,
      solution: solutionResult.solution,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error generating ${size}x${size} ${difficulty} puzzle:`, error);
    return null;
  }
}

// Preload puzzles for a specific size/difficulty combo
// Ensures exactly 3 puzzles per day (reads existing, generates missing, stores exactly 3)
async function preloadPuzzles(
  size: number,
  difficulty: string,
  date: string,
  kv: KVNamespace,
  targetCount: number = 3
): Promise<number> {
  const key = `puzzles:${size}x${size}:${difficulty}:${date}`;
  
  // Check existing puzzles
  const existing = await kv.get(key);
  let puzzles: PuzzleData[] = existing ? JSON.parse(existing) : [];
  
  // Ensure we have exactly targetCount puzzles (not more, not less)
  // If we have more than targetCount, trim to targetCount
  // If we have fewer, generate the missing ones
  if (puzzles.length >= targetCount) {
    // Trim to exactly targetCount (in case of stale data)
    puzzles = puzzles.slice(0, targetCount);
    await kv.put(key, JSON.stringify(puzzles), { expirationTtl: 86400 });
    console.log(`Already have ${puzzles.length} puzzles for ${key} (trimmed to ${targetCount})`);
    return puzzles.length;
  }

  const needed = targetCount - puzzles.length;
  console.log(`Generating ${needed} puzzles for ${key} (have ${puzzles.length}, need ${targetCount})...`);
  const newPuzzles: PuzzleData[] = [];

  for (let i = 0; i < needed; i++) {
    const seed = `${date}-${size}-${difficulty}-${puzzles.length + i}`;
    const puzzle = await generatePuzzle(size, difficulty, seed);
    if (puzzle) {
      newPuzzles.push(puzzle);
    } else {
      console.error(`Failed to generate puzzle ${i + 1}/${needed} for ${key}`);
    }
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Combine with existing puzzles (ensures exactly targetCount)
  puzzles = [...puzzles, ...newPuzzles].slice(0, targetCount);

  // Store in KV with 24h TTL (86400 seconds)
  await kv.put(key, JSON.stringify(puzzles), { expirationTtl: 86400 });

  console.log(`Stored exactly ${puzzles.length} puzzles for ${key}`);
  return puzzles.length;
}

// Main cron handler
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const kv = env.PUZZLES_KV || env.KV_BINDING;
    if (!kv) {
      console.error('No KV namespace available');
      return;
    }

    // Use UTC date to match the 00:05 UTC cron schedule
    const today = new Date();
    const utcYear = today.getUTCFullYear();
    const utcMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(today.getUTCDate()).padStart(2, '0');
    const date = `${utcYear}-${utcMonth}-${utcDay}`;

    const sizes = [3, 4, 5, 6, 7, 8, 9];
    const difficulties = ['easy', 'medium', 'hard'];

    console.log(`Starting daily puzzle preload for ${date}...`);

    // Generate puzzles for EACH size and EACH difficulty combo
    // This ensures 3 puzzles per size/difficulty (e.g., 3x3 easy, 3x3 medium, 3x3 hard, etc.)
    for (const size of sizes) {
      for (const difficulty of difficulties) {
        try {
          await preloadPuzzles(size, difficulty, date, kv, 3);
        } catch (error) {
          console.error(`Error preloading ${size}x${size} ${difficulty}:`, error);
        }
      }
    }

    console.log(`Daily puzzle preload completed for ${date}`);
}


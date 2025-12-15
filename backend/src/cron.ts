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
  
  const needed = Math.max(0, targetCount - puzzles.length);
  if (needed === 0) {
    console.log(`Already have ${puzzles.length} puzzles for ${key}`);
    return puzzles.length;
  }

  console.log(`Generating ${needed} puzzles for ${key}...`);
  const newPuzzles: PuzzleData[] = [];

  for (let i = 0; i < needed; i++) {
    const seed = `${date}-${size}-${difficulty}-${i}`;
    const puzzle = await generatePuzzle(size, difficulty, seed);
    if (puzzle) {
      newPuzzles.push(puzzle);
    }
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Combine with existing puzzles
  puzzles = [...puzzles, ...newPuzzles];

  // Store in KV with 24h TTL (86400 seconds)
  await kv.put(key, JSON.stringify(puzzles), { expirationTtl: 86400 });

  console.log(`Stored ${puzzles.length} puzzles for ${key}`);
  return puzzles.length;
}

// Main cron handler
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const kv = env.PUZZLES_KV || env.KV_BINDING;
    if (!kv) {
      console.error('No KV namespace available');
      return;
    }

    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const sizes = [3, 4, 5, 6, 7, 8, 9];
    const difficulties = ['easy', 'medium', 'hard'];

    console.log(`Starting daily puzzle preload for ${date}...`);

    // Generate puzzles for each size/difficulty combo
    for (const difficulty of difficulties) {
      const sizeRange = getSizeForDifficulty(difficulty);
      
      for (const size of sizes) {
        // Only generate if size is in the difficulty's range
        if (sizeRange.includes(size)) {
          try {
            await preloadPuzzles(size, difficulty, date, kv, 3);
          } catch (error) {
            console.error(`Error preloading ${size}x${size} ${difficulty}:`, error);
          }
        }
      }
    }

    console.log(`Daily puzzle preload completed for ${date}`);
}


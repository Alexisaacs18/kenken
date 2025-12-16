/**
 * Cloudflare Worker Cron Job: Daily Puzzle Preloader
 * Runs daily at 00:05 UTC to preload exactly 1 puzzle per size/difficulty combo + 1 Puzzle of the Day
 */

import { generate, solve, cliquesToCages } from './kenken';
import {
  todayUtcDate,
  puzzleKey,
  puzzleOfDayKey,
  putDailyPuzzleInKV,
  putPuzzleOfDayInKV,
  isPuzzleOfDay,
  type Difficulty,
  type KenKenPuzzle,
} from './dailyPuzzles';

interface Env {
  PUZZLES_KV?: KVNamespace;
  KV_BINDING?: KVNamespace;
  PUZZLES_DB?: D1Database;
  DB?: D1Database;
}

/**
 * Generate a single puzzle in the format expected by the frontend
 */
async function generatePuzzleForCache(
  size: number,
  difficulty: Difficulty,
  seed?: string
): Promise<KenKenPuzzle | null> {
  try {
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      console.error(`Failed to solve ${size}x${size} ${difficulty} puzzle`);
      return null;
    }

    const cages = cliquesToCages(cliques);

    return {
      puzzle: {
        size: puzzleSize,
        cages,
        solution: solutionResult.solution,
      },
      stats: {
        algorithm: 'FC+MRV',
        constraint_checks: solutionResult.checks,
        assignments: solutionResult.assigns,
        completion_time: solutionResult.time,
      },
    };
  } catch (error) {
    console.error(`Error generating ${size}x${size} ${difficulty} puzzle:`, error);
    return null;
  }
}

/**
 * Preload exactly one puzzle for a specific size/difficulty combo
 * Only generates if the key doesn't exist in KV
 */
async function preloadSinglePuzzle(
  size: number,
  difficulty: Difficulty,
  date: string,
  env: Env
): Promise<boolean> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    console.error('No KV namespace available');
    return false;
  }

  const key = puzzleKey(size, difficulty, date);
  
  // Check if puzzle already exists
  const existing = await kv.get(key);
  if (existing) {
    console.log(`Puzzle already exists for ${key}, skipping generation`);
    return true;
  }

  // Generate the puzzle
  console.log(`Generating puzzle for ${key}...`);
  const seed = `${date}-${size}-${difficulty}`;
  const puzzle = await generatePuzzleForCache(size, difficulty, seed);
  
  if (!puzzle) {
    console.error(`Failed to generate puzzle for ${key}`);
    return false;
  }

  // Store in KV
  await putDailyPuzzleInKV(env, size, difficulty, puzzle);
  console.log(`Stored puzzle for ${key}`);
  return true;
}

/**
 * Generate and store the Puzzle of the Day
 */
async function preloadPuzzleOfDay(env: Env): Promise<boolean> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    console.error('No KV namespace available');
    return false;
  }

  const date = todayUtcDate();
  const key = puzzleOfDayKey(date);
  
  // Check if PoD already exists
  const existing = await kv.get(key);
  if (existing) {
    console.log(`Puzzle of the Day already exists for ${key}, skipping generation`);
    return true;
  }

  // Determine today's PoD size and difficulty based on day of week
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  const dayMapping: { [key: number]: { size: number; difficulty: Difficulty } } = {
    1: { size: 3, difficulty: 'easy' },      // Monday - Beginner
    2: { size: 4, difficulty: 'easy' },       // Tuesday - Easy
    3: { size: 5, difficulty: 'medium' },     // Wednesday - Medium
    4: { size: 6, difficulty: 'medium' },     // Thursday - Intermediate
    5: { size: 7, difficulty: 'hard' },       // Friday - Challenging
    6: { size: 8, difficulty: 'hard' },       // Saturday - Hard
    0: { size: 9, difficulty: 'hard' },       // Sunday - Expert
  };
  
  const pod = dayMapping[dayOfWeek];
  if (!pod) {
    console.error(`Invalid day of week: ${dayOfWeek}`);
    return false;
  }

  // Generate the PoD
  console.log(`Generating Puzzle of the Day for ${date} (${pod.size}x${pod.size} ${pod.difficulty})...`);
  const seed = `${date}-pod-${pod.size}-${pod.difficulty}`;
  const puzzle = await generatePuzzleForCache(pod.size, pod.difficulty, seed);
  
  if (!puzzle) {
    console.error(`Failed to generate Puzzle of the Day for ${key}`);
    return false;
  }

  // Store in KV
  await putPuzzleOfDayInKV(env, puzzle);
  console.log(`Stored Puzzle of the Day for ${key}`);
  return true;
}

// Main cron handler
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    console.error('No KV namespace available');
    return;
  }

  const date = todayUtcDate();
  const sizes = [3, 4, 5, 6, 7, 8, 9];
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  console.log(`Starting daily puzzle preload for ${date}...`);

  // Generate exactly 1 puzzle per size/difficulty combo
  for (const size of sizes) {
    for (const difficulty of difficulties) {
      try {
        await preloadSinglePuzzle(size, difficulty, date, env);
      } catch (error) {
        console.error(`Error preloading ${size}x${size} ${difficulty}:`, error);
      }
    }
  }

  // Generate Puzzle of the Day
  try {
    await preloadPuzzleOfDay(env);
  } catch (error) {
    console.error('Error preloading Puzzle of the Day:', error);
  }

  console.log(`Daily puzzle preload completed for ${date}`);
}


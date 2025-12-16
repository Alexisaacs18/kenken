/**
 * Daily Puzzle KV Cache Utilities
 * Handles storing and retrieving daily preloaded puzzles from KV
 */

export type Difficulty = "easy" | "medium" | "hard";

// Puzzle structure matches what the generator returns
export interface KenKenPuzzle {
  puzzle: {
    size: number;
    cages: Array<{
      cells: [number, number][];
      operator: string;
      target: number;
    }>;
    solution: number[][];
  };
  stats: {
    algorithm: string;
    constraint_checks: number;
    assignments: number;
    completion_time: number;
  };
}

/**
 * Get today's UTC date string (YYYY-MM-DD)
 */
export function todayUtcDate(): string {
  const today = new Date();
  const utcYear = today.getUTCFullYear();
  const utcMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
  const utcDay = String(today.getUTCDate()).padStart(2, '0');
  return `${utcYear}-${utcMonth}-${utcDay}`;
}

/**
 * Generate KV key for normal daily puzzle
 * Format: puzzle:${size}x${size}:${difficulty}:${YYYY-MM-DD}
 */
export function puzzleKey(size: number, difficulty: Difficulty, date?: string): string {
  const dateStr = date || todayUtcDate();
  return `puzzle:${size}x${size}:${difficulty}:${dateStr}`;
}

/**
 * Generate KV key for Puzzle of the Day
 * Format: pod:${YYYY-MM-DD}
 */
export function puzzleOfDayKey(date?: string): string {
  const dateStr = date || todayUtcDate();
  return `pod:${dateStr}`;
}

/**
 * Get daily puzzle from KV for a specific size/difficulty
 */
export async function getDailyPuzzleFromKV(
  env: { PUZZLES_KV?: KVNamespace; KV_BINDING?: KVNamespace },
  size: number,
  difficulty: Difficulty
): Promise<KenKenPuzzle | null> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    return null;
  }

  const key = puzzleKey(size, difficulty);
  const cached = await kv.get(key);
  
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as KenKenPuzzle;
  } catch (error) {
    console.error(`Error parsing cached puzzle for ${key}:`, error);
    return null;
  }
}

/**
 * Store daily puzzle in KV for a specific size/difficulty
 */
export async function putDailyPuzzleInKV(
  env: { PUZZLES_KV?: KVNamespace; KV_BINDING?: KVNamespace },
  size: number,
  difficulty: Difficulty,
  puzzle: KenKenPuzzle
): Promise<void> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    throw new Error('KV namespace not available');
  }

  const key = puzzleKey(size, difficulty);
  // Store with 24h TTL (86400 seconds) to ensure it expires at midnight UTC
  await kv.put(key, JSON.stringify(puzzle), { expirationTtl: 86400 });
}

/**
 * Get Puzzle of the Day from KV
 */
export async function getPuzzleOfDayFromKV(
  env: { PUZZLES_KV?: KVNamespace; KV_BINDING?: KVNamespace }
): Promise<KenKenPuzzle | null> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    return null;
  }

  const key = puzzleOfDayKey();
  const cached = await kv.get(key);
  
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as KenKenPuzzle;
  } catch (error) {
    console.error(`Error parsing cached PoD for ${key}:`, error);
    return null;
  }
}

/**
 * Store Puzzle of the Day in KV
 */
export async function putPuzzleOfDayInKV(
  env: { PUZZLES_KV?: KVNamespace; KV_BINDING?: KVNamespace },
  puzzle: KenKenPuzzle
): Promise<void> {
  const kv = env.PUZZLES_KV || env.KV_BINDING;
  if (!kv) {
    throw new Error('KV namespace not available');
  }

  const key = puzzleOfDayKey();
  // Store with 24h TTL (86400 seconds) to ensure it expires at midnight UTC
  await kv.put(key, JSON.stringify(puzzle), { expirationTtl: 86400 });
}

/**
 * Check if a size/difficulty combo matches today's Puzzle of the Day
 * Based on the frontend's daily puzzle logic:
 * Monday=3x3 Beginner, Tuesday=4x4 Easy, Wednesday=5x5 Medium,
 * Thursday=6x6 Intermediate, Friday=7x7 Challenging, Saturday=8x8 Hard, Sunday=9x9 Expert
 */
export function isPuzzleOfDay(size: number, difficulty: Difficulty): boolean {
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Map day of week to expected size and difficulty
  const dayMapping: { [key: number]: { size: number; difficulty: Difficulty } } = {
    1: { size: 3, difficulty: 'easy' },      // Monday - Beginner (3x3 easy)
    2: { size: 4, difficulty: 'easy' },       // Tuesday - Easy (4x4 easy)
    3: { size: 5, difficulty: 'medium' },     // Wednesday - Medium (5x5 medium)
    4: { size: 6, difficulty: 'medium' },     // Thursday - Intermediate (6x6 medium)
    5: { size: 7, difficulty: 'hard' },       // Friday - Challenging (7x7 hard)
    6: { size: 8, difficulty: 'hard' },       // Saturday - Hard (8x8 hard)
    0: { size: 9, difficulty: 'hard' },       // Sunday - Expert (9x9 hard)
  };
  
  const expected = dayMapping[dayOfWeek];
  return expected && expected.size === size && expected.difficulty === difficulty;
}


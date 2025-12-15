/**
 * Cloudflare Pages Function: /api/puzzle/[size]/[difficulty]
 * Cache-first puzzle endpoint: Returns cached puzzle if available, otherwise generates on-demand
 * 
 * Behavior:
 * - First 3 puzzles per day (per size/difficulty) come from KV cache
 * - After cache is exhausted, falls back to on-demand generator
 * - Generated puzzles are NOT added back to the 3-per-day cache
 */

import { generate, solve, cliquesToCages } from 'api/kenken';

interface Env {
  PUZZLES_KV: KVNamespace;
  KENKEN_DB?: D1Database;
}

interface KenKenPuzzle {
  id: string;
  size: number;
  difficulty: string;
  grid: number[][];
  cages: Array<{
    cells: [number, number][];
    operator: string;
    target: number;
  }>;
  operations: Record<string, string>;
  solution?: number[][];
}

// Generate a puzzle using the KenKen solver
async function generatePuzzleHelper(size: number, difficulty: string, seed?: string): Promise<KenKenPuzzle> {
  const [puzzleSize, cliques] = generate(size, seed);
  const solutionResult = solve(puzzleSize, cliques);

  if (!solutionResult) {
    throw new Error('Failed to solve generated puzzle');
  }

  const cages = cliquesToCages(cliques);
  const operations: Record<string, string> = {};
  cliques.forEach(([, op], idx) => {
    operations[`cage_${idx}`] = op;
  });

  return {
    id: `${size}x${size}-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    size: puzzleSize,
    difficulty,
    grid: Array(size).fill(0).map(() => Array(size).fill(0)), // Empty grid
    cages,
    operations,
    solution: solutionResult.solution,
  };
}

// Get today's date in UTC (YYYY-MM-DD format)
function getTodayUTC(): string {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert KenKenPuzzle to frontend format
function puzzleToResponse(puzzle: KenKenPuzzle) {
  return {
    puzzle: {
      size: puzzle.size,
      cages: puzzle.cages,
      solution: puzzle.solution,
    },
    stats: {
      algorithm: 'FC+MRV',
      constraint_checks: 0,
      assignments: 0,
      completion_time: 0,
    },
    fromCache: true,
  };
}

export async function onRequestPost(
  context: {
    request: Request;
    env: Env;
    params: { size: string; difficulty: string };
  }
): Promise<Response> {
  try {
    const { size: sizeStr, difficulty } = context.params;
    const size = parseInt(sizeStr);

    if (isNaN(size) || size < 3 || size > 9) {
      return new Response(
        JSON.stringify({ error: 'Invalid size. Must be between 3 and 9.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Compute today's KV key (UTC date)
    const today = getTodayUTC();
    const key = `puzzles:${size}x${size}:${difficulty}:${today}`;

    // Try to get puzzle from cache first
    const kv = context.env.PUZZLES_KV;
    if (kv) {
      const cached = await kv.get(key);
      if (cached) {
        const puzzles: KenKenPuzzle[] = JSON.parse(cached);
        
        if (puzzles && puzzles.length > 0) {
          // Take the first puzzle from cache
          const firstPuzzle = puzzles[0];
          const remainingPuzzles = puzzles.slice(1);

          // Save remaining puzzles back to KV (so user can only get up to 3)
          if (remainingPuzzles.length > 0) {
            await kv.put(key, JSON.stringify(remainingPuzzles), { expirationTtl: 86400 });
          } else {
            // Cache is empty, delete the key
            await kv.delete(key);
          }

          // Return cached puzzle
          return new Response(
            JSON.stringify(puzzleToResponse(firstPuzzle)),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      }
    }

    // Cache is empty or missing - generate on-demand
    console.log(`Cache empty for ${key}, generating on-demand...`);
    const generated = await generatePuzzleHelper(size, difficulty);

    // Optionally store in D1 for analytics/history (but NOT in KV cache)
    const db = context.env.KENKEN_DB;
    if (db) {
      try {
        await db.prepare(
          `INSERT INTO puzzles (size, difficulty, data, created_at) 
           VALUES (?, ?, ?, ?)`
        )
          .bind(size, difficulty, JSON.stringify(generated), Math.floor(Date.now() / 1000))
          .run();
      } catch (dbError) {
        console.error('Error storing puzzle in D1:', dbError);
        // Don't fail the request if D1 insert fails
      }
    }

    // Return generated puzzle (NOT added to KV cache - day's cap remains 3)
    return new Response(
      JSON.stringify({
        puzzle: {
          size: generated.size,
          cages: generated.cages,
          solution: generated.solution,
        },
        stats: {
          algorithm: 'FC+MRV',
          constraint_checks: 0,
          assignments: 0,
          completion_time: 0,
        },
        fromCache: false,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/puzzle/[size]/[difficulty]:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


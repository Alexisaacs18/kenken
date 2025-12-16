/**
 * Cloudflare Worker: KenKen API Gateway
 * This Worker serves as the API gateway for KenKen puzzle operations
 */

import { generate, solve, cliquesToCages } from './kenken';
import {
  getDailyPuzzleFromKV,
  putDailyPuzzleInKV,
  getPuzzleOfDayFromKV,
  putPuzzleOfDayInKV,
  isPuzzleOfDay,
  type Difficulty,
} from './dailyPuzzles';

// Environment interface for type safety
interface Env {
  PUZZLES_KV?: KVNamespace;
  PUZZLES_DB?: D1Database;
  KV_BINDING?: KVNamespace;
  DB?: D1Database;
}

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Map puzzle size to difficulty label
function getDifficultyFromSize(size: number): string {
  const difficultyMap: { [key: number]: string } = {
    3: 'Beginner',
    4: 'Easy',
    5: 'Medium',
    6: 'Intermediate',
    7: 'Challenging',
    8: 'Hard',
    9: 'Expert',
  };
  return difficultyMap[size] || `Size${size}`;
}

// Cron handler removed - using lazy generation with date-based seeds instead
// export { scheduled } from './cron';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route requests
    if (path.startsWith('/api/puzzle/') && method === 'GET') {
      return handleGetPuzzle(request, env);
    } else if (path.startsWith('/api/puzzle/') && method === 'PUT') {
      return handleUpdatePuzzle(request, env);
    } else if (path.startsWith('/api/puzzle/') && method === 'DELETE') {
      return handleDeletePuzzle(request, env);
    } else if (path.startsWith('/api/generate/') && method === 'POST') {
      return handleGenerateBySize(request, env);
    } else if (path === '/api/generate' && method === 'POST') {
      return handleGenerate(request, env);
    } else if (path === '/api/solve' && method === 'POST') {
      return handleSolve(request);
    } else if (path === '/api/validate' && method === 'POST') {
      return handleValidate(request);
    } else if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', message: 'API Worker is running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (path === '/' && method === 'GET') {
      return new Response(JSON.stringify({ 
        message: 'KenKen API is running', 
        endpoints: ['/api/generate', '/api/solve', '/api/validate', '/api/health', '/api/puzzle/[key]', '/api/generate/[size]/[diff]'] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json() as { size?: number; algorithm?: string; seed?: string };
    const size = data.size || 4;
    const algorithm = data.algorithm || 'FC+MRV';
    const seed = data.seed || undefined;

    // For sizes > 4, use KV/D1 cache instead of generating in-memory
    if (size > 4) {
      const difficulty = getDifficultyFromSize(size);
      const cacheKey = `puzzle:${size}:${difficulty}`;

      // Try KV cache first (use PUZZLES_KV if available, otherwise KV_BINDING)
      const kv = env.PUZZLES_KV || env.KV_BINDING;
      if (kv) {
        const cached = await kv.get(cacheKey);
        if (cached) {
          const puzzleData = JSON.parse(cached);
          return new Response(JSON.stringify({
            puzzle: puzzleData.puzzle,
            stats: puzzleData.stats || {
              algorithm: 'cached',
              constraint_checks: 0,
              assignments: 0,
              completion_time: 0,
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Try D1 database (use PUZZLES_DB if available, otherwise fall back to DB)
      const db = env.PUZZLES_DB || env.DB;
      if (db) {
        try {
          const result = await db.prepare(
            'SELECT data FROM puzzles WHERE size = ? AND difficulty = ? LIMIT 1'
          ).bind(size, difficulty).first<{ data: string }>();

          if (result && result.data) {
            const puzzleData = JSON.parse(result.data);
            
            // Store in KV for faster future access (use PUZZLES_KV if available, otherwise KV_BINDING)
            const kv = env.PUZZLES_KV || env.KV_BINDING;
            if (kv) {
              await kv.put(cacheKey, result.data, { expirationTtl: 86400 * 7 }); // 7 days
            }

            return new Response(JSON.stringify({
              puzzle: puzzleData.puzzle,
              stats: puzzleData.stats || {
                algorithm: 'cached',
                constraint_checks: 0,
                assignments: 0,
                completion_time: 0,
              },
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (dbError) {
          console.error('Error querying D1:', dbError);
          // Fall through to error response
        }
      }

      // If not found in cache, return error for large puzzles
      return new Response(
        JSON.stringify({ 
          error: `Puzzle ${size}x${size} (${difficulty}) not found in cache. Please ensure puzzles are precomputed and stored in D1.` 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For sizes <= 4, generate in-memory (small puzzles are fast)
    const [puzzleSize, cliques] = generate(size, seed);

    // Solve to get solution
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve generated puzzle' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to frontend format
    const cages = cliquesToCages(cliques);

    const response = {
      puzzle: {
        size: puzzleSize,
        cages,
        solution: solutionResult.solution,
      },
      stats: {
        algorithm,
        constraint_checks: solutionResult.checks,
        assignments: solutionResult.assigns,
        completion_time: solutionResult.time,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSolve(request: Request): Promise<Response> {
  try {
    const data = await request.json() as { puzzle: any; algorithm?: string };
    const puzzleData = data.puzzle;
    const algorithm = data.algorithm || 'FC+MRV';

    // Convert frontend format to backend format
    const size = puzzleData.size;
    const cliques = puzzleData.cages.map((cage: any) => {
      const cells = cage.cells.map(([row, col]: [number, number]) => [row + 1, col + 1] as [number, number]);
      const operator = cage.operator === '=' ? '.' : cage.operator;
      return [cells, operator, cage.target] as [[number, number][], string, number];
    });

    // Solve puzzle
    const solutionResult = solve(size, cliques);

    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve puzzle' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        solution: solutionResult.solution,
        stats: {
          algorithm,
          constraint_checks: solutionResult.checks,
          assignments: solutionResult.assigns,
          completion_time: solutionResult.time,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error solving puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleValidate(request: Request): Promise<Response> {
  try {
    const data = await request.json() as { puzzle: any; board: number[][] };
    const puzzleData = data.puzzle;
    const board = data.board;

    const errors: Array<{ row: number; col: number; message: string }> = [];

    // Validate rows (no duplicates)
    for (let row = 0; row < puzzleData.size; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < puzzleData.size; col++) {
        const val = board[row][col];
        if (val > 0) {
          if (seen.has(val)) {
            errors.push({
              row,
              col,
              message: `Duplicate ${val} in row`,
            });
          }
          seen.add(val);
        }
      }
    }

    // Validate columns (no duplicates)
    for (let col = 0; col < puzzleData.size; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < puzzleData.size; row++) {
        const val = board[row][col];
        if (val > 0) {
          if (seen.has(val)) {
            errors.push({
              row,
              col,
              message: `Duplicate ${val} in column`,
            });
          }
          seen.add(val);
        }
      }
    }

    // Validate cages
    for (const cage of puzzleData.cages) {
      const cageValues = cage.cells
        .map(([row, col]: [number, number]) => board[row][col])
        .filter((val: number) => val > 0);

      if (cageValues.length === cage.cells.length) {
        // All cells filled, check constraint
        if (!evaluateCage(cage, cageValues)) {
          for (const [row, col] of cage.cells) {
            errors.push({
              row,
              col,
              message: 'Cage constraint not satisfied',
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        valid: errors.length === 0,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error validating board:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function evaluateCage(cage: any, values: number[]): boolean {
  if (cage.operator === '=') {
    return values.length === 1 && values[0] === cage.target;
  }

  const sortedValues = [...values].sort((a, b) => a - b);

  switch (cage.operator) {
    case '+':
      return sortedValues.reduce((a, b) => a + b, 0) === cage.target;
    case '-':
      if (sortedValues.length !== 2) return false;
      return Math.abs(sortedValues[0] - sortedValues[1]) === cage.target;
    case '*':
      return sortedValues.reduce((a, b) => a * b, 1) === cage.target;
    case '/':
      if (sortedValues.length !== 2) return false;
      const [a, b] = sortedValues;
      return (a / b === cage.target) || (b / a === cage.target);
    default:
      return false;
  }
}

// GET /api/puzzle/[key] - Get first puzzle from cache and return usage count
async function handleGetPuzzle(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/puzzle/', '');
    
    const kv = env.PUZZLES_KV || env.KV_BINDING;
    if (!kv) {
      return new Response(
        JSON.stringify({ error: 'KV namespace not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cached = await kv.get(key);
    if (!cached) {
      return new Response(
        JSON.stringify({ puzzles: [], usageCount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const puzzles = JSON.parse(cached) as any[];
    const usageCount = puzzles.length > 0 ? 4 - puzzles.length : 4; // 1-3 = cache, 4+ = generated

    return new Response(
      JSON.stringify({ puzzles, usageCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/puzzle/[key] - Update remaining puzzles array
async function handleUpdatePuzzle(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/puzzle/', '');
    const data = await request.json() as { puzzles: any[] };
    
    const kv = env.PUZZLES_KV || env.KV_BINDING;
    if (!kv) {
      return new Response(
        JSON.stringify({ error: 'KV namespace not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store updated puzzles array with 24h TTL
    await kv.put(key, JSON.stringify(data.puzzles), { expirationTtl: 86400 });

    return new Response(
      JSON.stringify({ success: true, remaining: data.puzzles.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/puzzle/[key] - Clear empty cache
async function handleDeletePuzzle(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/puzzle/', '');
    
    const kv = env.PUZZLES_KV || env.KV_BINDING;
    if (!kv) {
      return new Response(
        JSON.stringify({ error: 'KV namespace not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await kv.delete(key);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/generate/[size]/[diff] - Cache-first puzzle endpoint
// Checks KV cache first (PoD or normal puzzle), then falls back to on-demand generation
// Response format matches exactly what frontend expects
async function handleGenerateBySize(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.replace('/api/generate/', '').split('/');
    const size = parseInt(pathParts[0]);
    const difficultyStr = pathParts[1] || 'medium';

    if (isNaN(size) || size < 3 || size > 9) {
      return new Response(
        JSON.stringify({ error: 'Invalid size. Must be between 3 and 9.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize difficulty to match our type
    const difficulty: Difficulty = 
      difficultyStr === 'easy' || difficultyStr === 'medium' || difficultyStr === 'hard'
        ? difficultyStr
        : size <= 4 ? 'easy' : size <= 6 ? 'medium' : 'hard';

    // Determine if this is a daily puzzle request (PoD) or practice puzzle
    const isPoD = isPuzzleOfDay(size, difficulty);
    
    let seed: string;
    
    if (isPoD) {
      // Daily puzzle: Use date as seed (deterministic - same date = same puzzle, changes daily automatically)
      const today = new Date();
      const utcYear = today.getUTCFullYear();
      const utcMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(today.getUTCDate()).padStart(2, '0');
      const dateStr = `${utcYear}-${utcMonth}-${utcDay}`;
      seed = `${dateStr}-pod-${size}-${difficulty}`;
      console.log(`Generating daily puzzle (PoD) for ${dateStr}`);
    } else {
      // Practice puzzle: Use random seed (fresh puzzle each time)
      seed = `${Date.now()}-${Math.random()}-${size}-${difficulty}`;
      console.log(`Generating practice puzzle (fresh each time)`);
    }

    // For large puzzles (7x7-9x9), always check D1 first (preloaded puzzles)
    if (size >= 7) {
      const db = env.PUZZLES_DB || env.DB;
      if (db) {
        try {
          const difficultyLabel = getDifficultyFromSize(size);
          const result = await db.prepare(
            'SELECT data FROM puzzles WHERE size = ? AND difficulty = ? LIMIT 1'
          ).bind(size, difficultyLabel).first<{ data: string }>();

          if (result && result.data) {
            const puzzleData = JSON.parse(result.data);
            console.log(`Served ${size}x${size} from D1 (preloaded)`);
            return new Response(JSON.stringify({
              puzzle: puzzleData.puzzle,
              stats: puzzleData.stats || {
                algorithm: 'FC+MRV',
                constraint_checks: 0,
                assignments: 0,
                completion_time: 0,
              },
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (dbError) {
          console.error('Error querying D1:', dbError);
        }
      }
      
      // If D1 doesn't have it, return error (large puzzles should be preloaded)
      return new Response(
        JSON.stringify({ 
          error: `Large puzzles (${size}x${size}) need to be preloaded. Run: npm run populate-puzzles -- --remote` 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For smaller puzzles (3x3-6x6), generate on-demand
    console.log(`Generating ${size}x${size} ${difficulty} puzzle on-demand`);
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve generated puzzle' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cages = cliquesToCages(cliques);

    // Format response to match frontend expectations
    const generatedPuzzle = {
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

    return new Response(JSON.stringify(generatedPuzzle), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating puzzle by size:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

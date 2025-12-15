/**
 * Cloudflare Pages Function: /api/generate/[size]/[difficulty]
 * Pure generator endpoint: Generates puzzles on-demand without cache logic
 * 
 * This is the "default generator" used once cache is exhausted.
 * Can also be called directly for testing or special cases.
 */

import { generate, solve, cliquesToCages } from '../kenken';

export async function onRequestPost(
  context: {
    request: Request;
    env: any;
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

    // Generate puzzle directly
    const seed = `${Date.now()}-${size}-${difficulty}`;
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve generated puzzle' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const cages = cliquesToCages(cliques);

    return new Response(
      JSON.stringify({
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
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/generate/[size]/[difficulty]:', error);
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


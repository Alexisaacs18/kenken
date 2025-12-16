/**
 * Cloudflare Pages Function: /api/generate
 * Generates a new KenKen puzzle
 */

import { generate, solve, cliquesToCages } from './kenken';

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const data = await context.request.json();
    const size = data.size || 4;
    const algorithm = data.algorithm || 'FC+MRV';
    const seed = data.seed || undefined;

    // Generate puzzle
    const [puzzleSize, cliques] = generate(size, seed);

    // Solve to get solution
    const solutionResult = solve(puzzleSize, cliques);
    
    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve generated puzzle' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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

/**
 * Cloudflare Pages Function: /api/solve
 * Solves a KenKen puzzle
 */

import { solve } from './kenken';

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const data = await context.request.json();
    const puzzleData = data.puzzle;
    const algorithm = data.algorithm || 'FC+MRV';

    // Convert frontend format to backend format
    const size = puzzleData.size;
    const cliques = puzzleData.cages.map((cage: any) => {
      // Convert from 0-indexed to 1-indexed coordinates
      const cells = cage.cells.map(([row, col]: [number, number]) => [row + 1, col + 1] as [number, number]);
      const operator = cage.operator === '=' ? '.' : cage.operator;
      return [cells, operator, cage.target] as [[number, number][], string, number];
    });

    // Solve puzzle
    const solutionResult = solve(size, cliques);

    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to solve puzzle' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error solving puzzle:', error);
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

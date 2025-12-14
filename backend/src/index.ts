/**
 * Cloudflare Worker: KenKen API Gateway
 * This Worker serves as the API gateway for KenKen puzzle operations
 */

import { generate, solve, cliquesToCages } from './kenken';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route requests
    if (path === '/api/generate' && method === 'POST') {
      return handleGenerate(request);
    } else if (path === '/api/solve' && method === 'POST') {
      return handleSolve(request);
    } else if (path === '/api/validate' && method === 'POST') {
      return handleValidate(request);
    } else if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', message: 'API Worker is running' }), {
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

async function handleGenerate(request: Request): Promise<Response> {
  try {
    const data = await request.json();
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
    const data = await request.json();
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
    const data = await request.json();
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

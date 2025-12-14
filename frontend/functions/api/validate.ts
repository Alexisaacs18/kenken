/**
 * Cloudflare Pages Function: /api/validate
 * Validates the current board state
 */

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

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const data = await context.request.json();
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error validating board:', error);
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

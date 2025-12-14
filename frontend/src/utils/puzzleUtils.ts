/**
 * Utility functions for puzzle manipulation and validation
 */

import type { Puzzle, Cage, Cell } from '../types';

/**
 * Get the cage that contains a specific cell
 */
export function getCageForCell(
  puzzle: Puzzle,
  row: number,
  col: number
): Cage | null {
  return (
    puzzle.cages.find((cage) =>
      cage.cells.some(([r, c]) => r === row && c === col)
    ) || null
  );
}

/**
 * Get all cells in a cage
 */
export function getCageCells(cage: Cage): Cell[] {
  return cage.cells.map(([row, col]) => ({ row, col }));
}

/**
 * Check if a cage is satisfied given the current board state
 */
export function isCageSatisfied(
  cage: Cage,
  board: number[][]
): boolean {
  const values = cage.cells
    .map(([row, col]) => board[row]?.[col])
    .filter((val) => val !== undefined && val !== 0);

  if (values.length !== cage.cells.length) {
    return false; // Cage not fully filled
  }

  return evaluateCage(cage, values);
}

/**
 * Evaluate if cage values satisfy the constraint
 */
function evaluateCage(cage: Cage, values: number[]): boolean {
  if (cage.operator === '=') {
    return values.length === 1 && values[0] === cage.target;
  }

  if (values.length === 0) return false;

  // Sort values for consistent evaluation
  const sorted = [...values].sort((a, b) => a - b);

  switch (cage.operator) {
    case '+':
      return sorted.reduce((sum, val) => sum + val, 0) === cage.target;

    case '-':
      // For subtraction, we need exactly 2 values
      if (sorted.length !== 2) return false;
      return Math.abs(sorted[0] - sorted[1]) === cage.target;

    case '*':
      return sorted.reduce((prod, val) => prod * val, 1) === cage.target;

    case '/':
      // For division, we need exactly 2 values
      if (sorted.length !== 2) return false;
      const [a, b] = sorted;
      return (a / b === cage.target) || (b / a === cage.target);

    default:
      return false;
  }
}

/**
 * Check for duplicate values in a row
 */
export function getRowDuplicates(
  board: number[][],
  row: number,
  size: number
): number[] {
  const values = board[row] || [];
  const counts = new Map<number, number>();
  const duplicates: number[] = [];

  values.forEach((val, col) => {
    if (val > 0 && val <= size) {
      const count = (counts.get(val) || 0) + 1;
      counts.set(val, count);
      if (count > 1) {
        duplicates.push(col);
      }
    }
  });

  return duplicates;
}

/**
 * Check for duplicate values in a column
 */
export function getColDuplicates(
  board: number[][],
  col: number,
  size: number
): number[] {
  const counts = new Map<number, number>();
  const duplicates: number[] = [];

  board.forEach((row, rowIndex) => {
    const val = row[col];
    if (val > 0 && val <= size) {
      const count = (counts.get(val) || 0) + 1;
      counts.set(val, count);
      if (count > 1) {
        duplicates.push(rowIndex);
      }
    }
  });

  return duplicates;
}

/**
 * Check if the puzzle is completely solved
 */
export function isPuzzleSolved(
  puzzle: Puzzle,
  board: number[][]
): boolean {
  // Check all cells are filled
  for (let row = 0; row < puzzle.size; row++) {
    for (let col = 0; col < puzzle.size; col++) {
      if (!board[row]?.[col] || board[row][col] === 0) {
        return false;
      }
    }
  }

  // Check all cages are satisfied
  for (const cage of puzzle.cages) {
    if (!isCageSatisfied(cage, board)) {
      return false;
    }
  }

  // Check no duplicates in rows/columns
  for (let i = 0; i < puzzle.size; i++) {
    if (getRowDuplicates(board, i, puzzle.size).length > 0) {
      return false;
    }
    if (getColDuplicates(board, i, puzzle.size).length > 0) {
      return false;
    }
  }

  return true;
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

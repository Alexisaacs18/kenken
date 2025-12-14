/**
 * Type definitions for KenKen puzzle data structures
 */

export type Operator = '+' | '-' | '*' | '/' | '=';

export interface Cell {
  row: number;
  col: number;
}

export interface Cage {
  cells: [number, number][]; // Array of [row, col] coordinates
  operator: Operator;
  target: number;
}

export interface Puzzle {
  size: number;
  cages: Cage[];
  solution?: number[][];
}

export type Algorithm = 
  | 'BT' 
  | 'BT+MRV' 
  | 'FC' 
  | 'FC+MRV' 
  | 'MAC' 
  | 'MIN_CONFLICTS';

export interface BenchmarkStats {
  constraint_checks: number;
  assignments: number;
  completion_time: number; // in seconds
  algorithm: Algorithm;
}

export interface PuzzleState {
  puzzle: Puzzle;
  board: number[][]; // Current board state (0 = empty)
  selectedCell: [number, number] | null;
  history: PuzzleState[];
  historyIndex: number;
  stats?: BenchmarkStats;
}

export interface GameStats {
  timeElapsed: number; // in seconds
  movesMade: number;
  hintsUsed: number;
  startTime: number;
}

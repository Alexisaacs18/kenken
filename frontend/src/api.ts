/**
 * API client for KenKen backend
 */

import type { Puzzle, Algorithm, BenchmarkStats, Puzzle as PuzzleData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface GeneratePuzzleRequest {
  size: number;
  algorithm: Algorithm;
  seed?: string;
}

export interface GeneratePuzzleResponse {
  puzzle: Puzzle;
  stats: BenchmarkStats;
}

export interface SolvePuzzleRequest {
  puzzle: PuzzleData;
  algorithm: Algorithm;
}

export interface SolvePuzzleResponse {
  solution: number[][];
  stats: BenchmarkStats;
}

export interface ValidateRequest {
  puzzle: PuzzleData;
  board: number[][];
}

export interface ValidateResponse {
  valid: boolean;
  errors: {
    row: number;
    col: number;
    message: string;
  }[];
}

/**
 * Generate a new KenKen puzzle
 */
export async function generatePuzzle(
  size: number,
  algorithm: Algorithm,
  seed?: string
): Promise<GeneratePuzzleResponse> {
  try {
    const body: GeneratePuzzleRequest = { size, algorithm };
    if (seed) {
      body.seed = seed;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to generate puzzle: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Make sure the backend is running.`);
    }
    throw error;
  }
}

/**
 * Solve a puzzle using the specified algorithm
 */
export async function solvePuzzle(
  puzzle: PuzzleData,
  algorithm: Algorithm
): Promise<SolvePuzzleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ puzzle, algorithm }),
  });

  if (!response.ok) {
    throw new Error(`Failed to solve puzzle: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Validate the current board state
 */
export async function validateBoard(
  puzzle: PuzzleData,
  board: number[][]
): Promise<ValidateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ puzzle, board }),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate board: ${response.statusText}`);
  }

  return response.json();
}

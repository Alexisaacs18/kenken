/**
 * API client for KenKen backend
 */

import type { Puzzle, Algorithm, BenchmarkStats, Puzzle as PuzzleData } from './types';

// Use relative URLs in production (Cloudflare Pages Functions), absolute in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8787');

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
 * Map size to difficulty for the new endpoint format
 */
function getDifficultyFromSize(size: number): string {
  if (size <= 4) return 'easy';
  if (size <= 6) return 'medium';
  return 'hard';
}

/**
 * Generate a new KenKen puzzle
 * Now uses the new /api/generate/[size]/[difficulty] endpoint
 */
export async function generatePuzzle(
  size: number,
  algorithm: Algorithm,
  seed?: string
): Promise<GeneratePuzzleResponse> {
  try {
    // Use the new endpoint format with size and difficulty
    const difficulty = getDifficultyFromSize(size);
    const url = `${API_BASE_URL}/api/generate/${size}/${difficulty}`;
    
    console.log(`[API] Fetching puzzle from: ${url}`);
    console.log(`[API] API_BASE_URL: "${API_BASE_URL}", PROD: ${import.meta.env.PROD}`);
    
    // For large puzzles, use a longer timeout (up to 30 seconds)
    const timeout = size >= 7 ? 30000 : 15000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      // Note: seed is ignored for now, but endpoint may support it in the future
    });
    
    clearTimeout(timeoutId);
    
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

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

    const data = await response.json();
    // The new endpoint returns { puzzle, stats, usageCount }
    // Map it to the expected format
    return {
      puzzle: data.puzzle,
      stats: data.stats,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Make sure the backend is running.`);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Puzzle generation timed out. Large puzzles (${size}x${size}) may take longer. Please try again.`);
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

// Daily puzzle cache API
export interface DailyPuzzleResponse {
  puzzles: any[];
  usageCount: number;
}

export interface DailyPuzzleData {
  id: string;
  size: number;
  difficulty: string;
  grid: number[][];
  cages: Array<{
    cells: [number, number][];
    operator: string;
    target: number;
  }>;
  operations: string[];
  solution: number[][];
  generatedAt: string;
}

/**
 * Get puzzle from daily cache
 */
export async function getDailyPuzzle(key: string): Promise<DailyPuzzleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/puzzle/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get daily puzzle: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update remaining puzzles in cache
 */
export async function updateDailyPuzzleCache(key: string, puzzles: DailyPuzzleData[]): Promise<{ success: boolean; remaining: number }> {
  const response = await fetch(`${API_BASE_URL}/api/puzzle/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ puzzles }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update puzzle cache: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete empty puzzle cache
 */
export async function deleteDailyPuzzleCache(key: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/puzzle/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete puzzle cache: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate puzzle on-demand (fallback when cache is empty)
 */
export async function generatePuzzleBySize(
  size: number,
  difficulty: string
): Promise<GeneratePuzzleResponse & { usageCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/generate/${size}/${difficulty}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate puzzle: ${response.statusText}`);
  }

  return response.json();
}

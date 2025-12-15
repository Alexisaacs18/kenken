/**
 * React Hook: useDailyPuzzles
 * Fetches puzzles from daily cache, falls back to on-demand generation
 */

import { useState, useEffect, useCallback } from 'react';
import type { Puzzle } from '../types';
import { 
  getDailyPuzzle, 
  updateDailyPuzzleCache, 
  deleteDailyPuzzleCache, 
  generatePuzzleBySize,
  type DailyPuzzleData 
} from '../api';

interface UseDailyPuzzlesResult {
  puzzle: Puzzle | null;
  loading: boolean;
  error: string | null;
  usageCount: number; // 1-3 = cache, 4+ = generated
  reload: () => Promise<void>;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert daily puzzle data to frontend Puzzle format
 */
function convertDailyPuzzleToPuzzle(dailyPuzzle: DailyPuzzleData): Puzzle {
  return {
    size: dailyPuzzle.size,
    cages: dailyPuzzle.cages.map(cage => ({
      cells: cage.cells,
      operator: cage.operator as '+' | '-' | '*' | '/' | '=',
      target: cage.target,
    })),
    solution: dailyPuzzle.solution,
  };
}

/**
 * React hook for fetching daily puzzles from cache or generating on-demand
 */
export function useDailyPuzzles(size: number, difficulty: string): UseDailyPuzzlesResult {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const date = getTodayDateString();
      const key = `puzzles:${size}x${size}:${difficulty}:${date}`;

      // Try to get puzzle from cache
      const cacheResponse = await getDailyPuzzle(key);
      
      if (cacheResponse.puzzles && cacheResponse.puzzles.length > 0) {
        // Get first puzzle from cache
        const firstPuzzle = cacheResponse.puzzles[0];
        const remainingPuzzles = cacheResponse.puzzles.slice(1);

        // Convert to frontend format
        const frontendPuzzle = convertDailyPuzzleToPuzzle(firstPuzzle);
        setPuzzle(frontendPuzzle);
        setUsageCount(cacheResponse.usageCount);

        // Update cache with remaining puzzles
        if (remainingPuzzles.length > 0) {
          await updateDailyPuzzleCache(key, remainingPuzzles);
        } else {
          // Cache is empty, delete it
          await deleteDailyPuzzleCache(key);
        }
      } else {
        // Cache is empty, generate on-demand
        console.log(`Cache empty for ${key}, generating on-demand...`);
        const generated = await generatePuzzleBySize(size, difficulty);
        
        // Convert to frontend format
        setPuzzle(generated.puzzle);
        setUsageCount(generated.usageCount || 4); // 4+ indicates generated
      }
    } catch (err) {
      console.error('Error loading daily puzzle:', err);
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  }, [size, difficulty]);

  // Load puzzle on mount or when size/difficulty changes
  useEffect(() => {
    void loadPuzzle();
  }, [loadPuzzle]);

  return {
    puzzle,
    loading,
    error,
    usageCount,
    reload: loadPuzzle,
  };
}


/**
 * React Hook: usePuzzleLoader
 * Loads puzzles using cache-first endpoint, falls back to generator if needed
 * 
 * Behavior:
 * - First 3 puzzles per day come from KV cache (instant)
 * - After cache exhausted, uses on-demand generator
 */

import { useState, useEffect, useCallback } from 'react';
import type { Puzzle } from '../types';

interface UsePuzzleLoaderResult {
  puzzle: Puzzle | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  reload: () => Promise<void>;
}

/**
 * React hook for loading puzzles with cache-first behavior
 * @param size Puzzle size (3-9)
 * @param difficulty Puzzle difficulty ('easy', 'medium', 'hard')
 */
export function usePuzzleLoader(size: number, difficulty: string): UsePuzzleLoaderResult {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      // Try cache-first endpoint first
      const res = await fetch(`/api/puzzle/${size}/${difficulty}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPuzzle(data.puzzle);
        setFromCache(data.fromCache || false);
        return;
      }

      // If cache endpoint fails, try generator endpoint as fallback
      console.warn(`Cache endpoint failed (${res.status}), trying generator...`);
      const res2 = await fetch(`/api/generate/${size}/${difficulty}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res2.ok) {
        const errorText = await res2.text();
        let errorMessage = `Failed to load puzzle: ${res2.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data2 = await res2.json();
      setPuzzle(data2.puzzle);
      setFromCache(false);
    } catch (err) {
      console.error('Error loading puzzle:', err);
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
    fromCache,
    reload: loadPuzzle,
  };
}


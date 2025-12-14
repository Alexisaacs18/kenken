import React, { useState } from 'react';
import type { Algorithm } from '../types';
import { generatePuzzle } from '../api';

interface PuzzleGeneratorProps {
  onPuzzleGenerated: (puzzle: any, stats: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ALGORITHMS: Algorithm[] = [
  'BT',
  'BT+MRV',
  'FC',
  'FC+MRV',
  'MAC',
  'MIN_CONFLICTS',
];

export default function PuzzleGenerator({
  onPuzzleGenerated,
  loading,
  setLoading,
}: PuzzleGeneratorProps) {
  const [size, setSize] = useState<number>(4);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FC+MRV');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generatePuzzle(size, algorithm);
      onPuzzleGenerated(response.puzzle, response.stats);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate puzzle. Make sure the backend is running.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Generate Puzzle</h2>

      <div className="space-y-4">
        {/* Size Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grid Size
          </label>
          <div className="flex gap-2 flex-wrap">
            {[3, 4, 5, 6, 7, 8, 9].map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded ${
                  size === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {s}x{s}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ALGORITHMS.map((alg) => (
              <option key={alg} value={alg}>
                {alg}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Puzzle'}
        </button>
      </div>
    </div>
  );
}

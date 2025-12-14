import { useState } from 'react';
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

interface Difficulty {
  label: string;
  size: number;
  color: string;
}

const DIFFICULTIES: Difficulty[] = [
  { label: 'Beginner', size: 3, color: 'bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1A1A1A] border-[#4CAF50]' },
  { label: 'Easy', size: 4, color: 'bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1A1A1A] border-[#2196F3]' },
  { label: 'Medium', size: 5, color: 'bg-[#FFF9E6] hover:bg-[#FFF3C4] text-[#1A1A1A] border-[#FFC107]' },
  { label: 'Intermediate', size: 6, color: 'bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#1A1A1A] border-[#FF9800]' },
  { label: 'Challenging', size: 7, color: 'bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#1A1A1A] border-[#F44336]' },
  { label: 'Hard', size: 8, color: 'bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#1A1A1A] border-[#9C27B0]' },
  { label: 'Expert', size: 9, color: 'bg-[#E0E0E0] hover:bg-[#BDBDBD] text-[#1A1A1A] border-[#424242]' },
];

export default function PuzzleGenerator({
  onPuzzleGenerated,
  loading,
  setLoading,
}: PuzzleGeneratorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FC+MRV');

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty.size);
    setLoading(true);
    
    try {
      const response = await generatePuzzle(difficulty.size, algorithm);
      onPuzzleGenerated(response.puzzle, response.stats);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate puzzle. Make sure the backend is running.';
      alert(errorMessage);
      setSelectedDifficulty(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
      <h2 className="text-xl font-semibold mb-5 text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Select Difficulty
      </h2>

      <div className="space-y-5">
        {/* Difficulty Selector */}
        <div>
          <label className="block text-sm font-medium text-[#666666] mb-3" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Choose Your Challenge
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTIES.map((difficulty) => {
              const isSelected = selectedDifficulty === difficulty.size;
              const isLoading = loading && isSelected;
              
              return (
                <button
                  key={difficulty.size}
                  onClick={() => handleDifficultySelect(difficulty)}
                  disabled={loading}
                  className={`
                    px-4 py-2.5 rounded-sm font-medium border
                    transition-all duration-200
                    ${isSelected 
                      ? `${difficulty.color} border-2 shadow-sm` 
                      : `${difficulty.color} border opacity-90 hover:opacity-100 hover:shadow-sm`
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-1.5
                    text-sm
                  `}
                  style={{ fontFamily: "'Lora', Georgia, serif" }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>{difficulty.label}</span>
                      <span className="text-[10px] opacity-60">({difficulty.size}×{difficulty.size})</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Algorithm Selector - Collapsible/Advanced */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-[#666666] hover:text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Advanced: Algorithm Settings
          </summary>
          <div className="mt-3">
            <label className="block text-xs font-medium text-[#666666] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Solving Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-sm focus:outline-none focus:border-[#1A1A1A] disabled:opacity-50 bg-white"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              {ALGORITHMS.map((alg) => (
                <option key={alg} value={alg}>
                  {alg}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#666666] mt-1.5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Affects puzzle generation speed and difficulty
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

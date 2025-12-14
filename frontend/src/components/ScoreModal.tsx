import React from 'react';
import { formatTime } from '../utils/puzzleUtils';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  timeElapsed: number;
  movesMade: number;
  hintsUsed: number;
  checksUsed: number;
}

export default function ScoreModal({
  isOpen,
  onClose,
  score,
  timeElapsed,
  movesMade,
  hintsUsed,
  checksUsed,
}: ScoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-8 border border-[#E0E0E0]">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Puzzle Solved!
          </h2>
          <div className="text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Score: {score}
          </div>
          <p className="text-sm text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Lower is better
          </p>
        </div>

        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between items-baseline border-b border-[#E0E0E0] pb-2">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Time:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{formatTime(timeElapsed)}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-[#E0E0E0] pb-2">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Moves:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{movesMade}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-[#E0E0E0] pb-2">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Hints Used:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{hintsUsed}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Checks Used:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{checksUsed}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

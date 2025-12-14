import React from 'react';
import { formatTime } from '../utils/puzzleUtils';

interface GameStatsProps {
  timeElapsed: number;
  movesMade: number;
  hintsUsed: number;
}

export default function GameStats({
  timeElapsed,
  movesMade,
  hintsUsed,
}: GameStatsProps) {
  return (
    <div className="bg-white p-5 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
      <h3 className="text-base font-semibold mb-4 text-[#1A1A1A] border-b border-[#E0E0E0] pb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Statistics
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-baseline">
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Time:</span>
          <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{formatTime(timeElapsed)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Moves:</span>
          <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{movesMade}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Hints:</span>
          <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{hintsUsed}</span>
        </div>
      </div>
    </div>
  );
}

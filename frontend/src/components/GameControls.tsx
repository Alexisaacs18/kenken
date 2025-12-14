import React from 'react';

interface GameControlsProps {
  onHint: () => void;
  onCheck: () => void;
  hintsRemaining: number;
  checksRemaining: number;
}

export default function GameControls({
  onHint,
  onCheck,
  hintsRemaining,
  checksRemaining,
}: GameControlsProps) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onHint}
        disabled={hintsRemaining === 0}
        className="px-6 py-2.5 text-sm font-medium bg-[#FFF9E6] text-[#1A1A1A] border-2 border-[#FFC107] rounded-sm hover:bg-[#FFF3C4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        Hint ({hintsRemaining})
      </button>
      <button
        onClick={onCheck}
        disabled={checksRemaining === 0}
        className="px-6 py-2.5 text-sm font-medium bg-[#E3F2FD] text-[#1A1A1A] border-2 border-[#2196F3] rounded-sm hover:bg-[#BBDEFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        Check ({checksRemaining})
      </button>
    </div>
  );
}

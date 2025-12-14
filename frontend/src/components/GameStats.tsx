import React from 'react';
import { formatTime } from '../utils/puzzleUtils';

interface GameStatsProps {
  timeElapsed: number;
  movesMade: number;
  hintsUsed: number;
  checksUsed: number;
}

export default function GameStats({
  timeElapsed,
  movesMade,
  hintsUsed,
  checksUsed,
}: GameStatsProps) {
  return (
    <div className="bg-[#FAFAF8] p-3 rounded-md max-w-[400px] mx-auto" style={{ fontFamily: "'Lora', Georgia, serif" }}>
      {/* Two-column grid layout */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {/* Time */}
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-1.5">
          <span className="text-[#6B6B6B] font-normal flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time
          </span>
          <span className="text-[#1A1A1A] font-semibold tabular-nums">{formatTime(timeElapsed)}</span>
        </div>

        {/* Moves */}
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-1.5">
          <span className="text-[#6B6B6B] font-normal flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Moves
          </span>
          <span className="text-[#1A1A1A] font-semibold tabular-nums">{movesMade}</span>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-1.5">
          <span className="text-[#6B6B6B] font-normal flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Hints
          </span>
          <span className="text-[#1A1A1A] font-semibold tabular-nums">{hintsUsed}</span>
        </div>

        {/* Checks */}
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-1.5">
          <span className="text-[#6B6B6B] font-normal flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Checks
          </span>
          <span className="text-[#1A1A1A] font-semibold tabular-nums">{checksUsed}</span>
        </div>
      </div>
    </div>
  );
}

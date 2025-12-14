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
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Statistics</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Time:</span>
          <span className="font-semibold">{formatTime(timeElapsed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Moves:</span>
          <span className="font-semibold">{movesMade}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hints:</span>
          <span className="font-semibold">{hintsUsed}</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface GameControlsProps {
  onClear: () => void;
  onHint: () => void;
  onSolve: () => void;
  onCheck: () => void;
  onNewPuzzle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  solving: boolean;
}

export default function GameControls({
  onClear,
  onHint,
  onSolve,
  onCheck,
  onNewPuzzle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  solving,
}: GameControlsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Game Controls</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onHint}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Hint
        </button>
        <button
          onClick={onSolve}
          disabled={solving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {solving ? 'Solving...' : 'Solve'}
        </button>
        <button
          onClick={onCheck}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Check
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors"
        >
          Redo
        </button>
        <button
          onClick={onNewPuzzle}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors col-span-2"
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}

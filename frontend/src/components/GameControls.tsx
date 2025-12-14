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
    <div className="bg-white p-5 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
      <h3 className="text-base font-semibold mb-4 text-[#1A1A1A] border-b border-[#E0E0E0] pb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Game Controls
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={onClear}
          className="px-3 py-2 text-sm bg-[#F5F5F5] text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#E0E0E0] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Clear
        </button>
        <button
          onClick={onHint}
          className="px-3 py-2 text-sm bg-[#FFF9E6] text-[#1A1A1A] border border-[#FFC107] rounded-sm hover:bg-[#FFF3C4] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Hint
        </button>
        <button
          onClick={onSolve}
          disabled={solving}
          className="px-3 py-2 text-sm bg-[#E8F5E9] text-[#1A1A1A] border border-[#4CAF50] rounded-sm hover:bg-[#C8E6C9] disabled:opacity-50 transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          {solving ? 'Solving...' : 'Solve'}
        </button>
        <button
          onClick={onCheck}
          className="px-3 py-2 text-sm bg-[#E3F2FD] text-[#1A1A1A] border border-[#2196F3] rounded-sm hover:bg-[#BBDEFB] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Check
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 text-sm bg-[#F5F5F5] text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#E0E0E0] disabled:opacity-50 transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-2 text-sm bg-[#F5F5F5] text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#E0E0E0] disabled:opacity-50 transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Redo
        </button>
        <button
          onClick={onNewPuzzle}
          className="px-3 py-2 text-sm bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors col-span-2"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}

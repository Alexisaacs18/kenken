
interface NumberPadProps {
  size: number;
  onNumberClick: (num: number) => void;
  onDelete: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHint: () => void;
  onCheck: () => void;
  hintsRemaining: number;
  checksRemaining: number;
}

export default function NumberPad({
  size,
  onNumberClick,
  onDelete,
  onUndo,
  canUndo,
  onHint,
  onCheck,
  hintsRemaining,
  checksRemaining,
}: NumberPadProps) {
  const baseButtonClass = "px-4 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation flex items-center justify-center";
  const hintButtonClass = `${baseButtonClass} bg-[#FFF9E6] text-[#1A1A1A] border-2 border-[#FFC107] hover:bg-[#FFF3C4] disabled:opacity-50 disabled:cursor-not-allowed`;
  const checkButtonClass = `${baseButtonClass} bg-[#E3F2FD] text-[#1A1A1A] border-2 border-[#2196F3] hover:bg-[#BBDEFB] disabled:opacity-50 disabled:cursor-not-allowed`;
  const actionButtonClass = `${baseButtonClass} bg-white text-[#1A1A1A] border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#1A1A1A] active:bg-[#E8E8E8]`;

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      {/* Control buttons - centered */}
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <button
            onClick={onDelete}
            className={actionButtonClass}
            style={{ fontFamily: "'Lora', Georgia, serif", minWidth: '70px', height: '44px' }}
          >
            Del
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`${actionButtonClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#E0E0E0] flex items-center justify-center gap-1.5`}
            style={{ fontFamily: "'Lora', Georgia, serif", minWidth: '90px', height: '44px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          <button
            onClick={onCheck}
            disabled={checksRemaining === 0}
            className={checkButtonClass}
            style={{ fontFamily: "'Lora', Georgia, serif", minWidth: '90px', height: '44px' }}
          >
            Check ({checksRemaining})
          </button>
          <button
            onClick={onHint}
            disabled={hintsRemaining === 0}
            className={hintButtonClass}
            style={{ fontFamily: "'Lora', Georgia, serif", minWidth: '90px', height: '44px' }}
          >
            Hint ({hintsRemaining})
          </button>
      </div>
    </div>
  );
}

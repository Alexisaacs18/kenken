import React from 'react';

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

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onDifficultySelect: (size: number) => void;
  onShowTutorial: () => void;
  selectedDifficulty: number | null;
  loading: boolean;
}

export default function SideMenu({
  isOpen,
  onClose,
  onDifficultySelect,
  onShowTutorial,
  selectedDifficulty,
  loading,
}: SideMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Side menu */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Menu
            </h2>
            <button
              onClick={onClose}
              className="text-[#666666] hover:text-[#1A1A1A] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Difficulty Selection - Practice Mode */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-[#666666] mb-3" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Practice Mode
            </h3>
            <p className="text-xs text-[#999999] mb-3" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Select any difficulty to practice
            </p>
            <div className="space-y-2">
              {DIFFICULTIES.map((difficulty) => {
                const isSelected = selectedDifficulty === difficulty.size;
                const isLoading = loading && isSelected;
                
                return (
                  <button
                    key={difficulty.size}
                    onClick={() => {
                      onDifficultySelect(difficulty.size);
                      onClose();
                    }}
                    disabled={loading}
                    className={`
                      w-full px-4 py-2.5 rounded-sm font-medium border text-left
                      transition-all duration-200
                      ${isSelected 
                        ? `${difficulty.color} border-2 shadow-sm` 
                        : `${difficulty.color} border opacity-90 hover:opacity-100`
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-between
                      text-sm
                    `}
                    style={{ fontFamily: "'Lora', Georgia, serif" }}
                  >
                    <span>
                      {difficulty.label} ({difficulty.size}×{difficulty.size})
                    </span>
                    {isLoading && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* How to Play */}
          <div className="border-t border-[#E0E0E0] pt-6">
            <button
              onClick={() => {
                onShowTutorial();
                onClose();
              }}
              className="w-full px-4 py-2.5 text-sm font-medium text-[#1A1A1A] border border-[#1A1A1A] rounded-sm hover:bg-[#F5F5F5] transition-colors text-left"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              How to Play
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { formatTime } from '../utils/puzzleUtils';
import type { Puzzle } from '../types';
import ShareModal from './ShareModal';
import { generateShareText, type ShareData, handleShare } from '../utils/share';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  timeElapsed: number;
  movesMade: number;
  hintsUsed: number;
  checksUsed: number;
  attempts?: number; // Number of times puzzle was reset/refreshed
  puzzle: Puzzle | null;
  board: number[][];
  isDailyPuzzle: boolean;
  dateLabel: string;
  difficultyLabel: string;
  streak?: number;
  puzzleNumber?: number;
  lost?: boolean; // Whether the game was lost (ran out of hints/checks)
}

export default function ScoreModal({
  isOpen,
  onClose,
  score,
  timeElapsed,
  movesMade,
  hintsUsed,
  checksUsed,
  attempts = 0,
  puzzle,
  board,
  isDailyPuzzle,
  dateLabel,
  difficultyLabel,
  streak,
  puzzleNumber,
  lost = false,
}: ScoreModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');

  if (!isOpen) return null;

  const buildShareData = (): ShareData | null => {
    if (!puzzle || !board || board.length === 0) return null;

    const size = puzzle.size;
    // gridStatus mapping: false = green (🟩), true = red (🟥)
    // If puzzle was solved (not lost), show all green squares
    // If lost, show correct cells as green (false) and incorrect/missing as red (true)
    const gridStatus: boolean[][] = lost
      ? Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const val = board[r]?.[c];
            if (!val || !puzzle.solution) {
              return true; // missing or unknown = red (🟥)
            }
            // If correct, return false (green 🟩), if incorrect return true (red 🟥)
            return puzzle.solution[r][c] !== val;
          }),
        )
      : // Puzzle solved - all green (all false)
        Array.from({ length: size }, () => Array(size).fill(false));

    const completionTime = formatTime(timeElapsed);
    const shareData: ShareData = {
      puzzleNumber: puzzleNumber ?? 0,
      date: dateLabel,
      difficulty: difficultyLabel,
      size: `${size}x${size}`,
      completionTime,
      streak,
      gridStatus,
    };

    return shareData;
  };

  const onShareClick = async () => {
    const data = buildShareData();
    if (!data) return;

    const text = generateShareText(data);

    try {
      await handleShare(data);
    } catch {
      // Web Share API not available or failed – show custom modal fallback
      setShareText(text);
      setShowShareModal(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-8 border border-[#E0E0E0]">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {lost ? 'Out of Hints & Checks!' : 'Puzzle Solved!'}
          </h2>
          {!lost && (
            <>
          <div className="text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Score: {score}
          </div>
          <p className="text-sm text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Lower is better
          </p>
            </>
          )}
          {lost && (
            <p className="text-sm text-[#666666] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              You ran out of hints and checks. Share your progress and try again!
            </p>
          )}
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
          <div className="flex justify-between items-baseline border-b border-[#E0E0E0] pb-2">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Checks Used:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{checksUsed}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Attempts:</span>
            <span className="font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{attempts || 0}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onShareClick}
            className="w-full sm:w-1/2 px-4 py-3 text-sm font-semibold text-white rounded-sm bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            <span>Share</span>
          </button>
        <button
          onClick={onClose}
            className="w-full sm:w-1/2 px-4 py-3 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Close
        </button>
      </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareText={shareText}
      />
    </div>
  );
}


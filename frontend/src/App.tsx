import React, { useState, useEffect, useCallback } from 'react';
import PuzzleBoard from './components/PuzzleBoard';
import GameStats from './components/GameStats';
import NumberPad from './components/NumberPad';
import SideMenu from './components/SideMenu';
import ScoreModal from './components/ScoreModal';
import TutorialModal from './components/TutorialModal';
import type { Puzzle, Algorithm, GameStats as GameStatsType } from './types';
import { generatePuzzle, validateBoard } from './api';
import { isPuzzleSolved } from './utils/puzzleUtils';
import { getTodayPuzzleInfo, getTomorrowPuzzleInfo, formatDateForDisplay, isPuzzleCompletedToday, markPuzzleCompletedToday } from './utils/dailyPuzzle';

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [gameStats, setGameStats] = useState<GameStatsType>({
    timeElapsed: 0,
    movesMade: 0,
    hintsUsed: 0,
    startTime: Date.now(),
  });
  const [checksUsed, setChecksUsed] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [checksRemaining, setChecksRemaining] = useState(3);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ row: number; col: number; message: string }[]>([]);
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [solved, setSolved] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FC+MRV');
  const [dailyPuzzleInfo, setDailyPuzzleInfo] = useState(getTodayPuzzleInfo());
  const [isDailyPuzzle, setIsDailyPuzzle] = useState(true);

  // Initialize board
  const initializeBoard = (puzzleSize: number) => {
    return Array(puzzleSize)
      .fill(null)
      .map(() => Array(puzzleSize).fill(0));
  };

  // Timer effect
  useEffect(() => {
    if (!puzzle || solved) return;

    const interval = setInterval(() => {
      setGameStats((prev) => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [puzzle, solved]);

  // Auto-load today's puzzle on mount
  useEffect(() => {
    // Only load if no puzzle is already loaded
    if (puzzle) return;
    
    const loadDailyPuzzle = async () => {
      const todayInfo = getTodayPuzzleInfo();
      setDailyPuzzleInfo(todayInfo);
      setIsDailyPuzzle(true);
      setLoading(true);
      
      try {
        const response = await generatePuzzle(todayInfo.size, algorithm, todayInfo.seed);
        setPuzzle(response.puzzle);
        const newBoard = initializeBoard(response.puzzle.size);
        setBoard(newBoard);
        setGameStats({
          timeElapsed: 0,
          movesMade: 0,
          hintsUsed: 0,
          startTime: Date.now(),
        });
        setChecksUsed(0);
        setHintsRemaining(3);
        setChecksRemaining(3);
        setHistory([JSON.parse(JSON.stringify(newBoard))]);
        setHistoryIndex(0);
        setSolved(false);
        setErrors([]);
      } catch (error) {
        console.error('Error loading daily puzzle:', error);
        // Don't show alert for auto-load, just log
      } finally {
        setLoading(false);
      }
    };
    
    loadDailyPuzzle();
  }, []); // Only run on mount

  // Check if puzzle is solved
  useEffect(() => {
    if (puzzle && board.length > 0 && !solved) {
      const isComplete = isPuzzleSolved(puzzle, board);
      if (isComplete) {
        setSolved(true);
        if (isDailyPuzzle) {
          markPuzzleCompletedToday();
        }
        // Show score modal after a brief delay
        setTimeout(() => {
          setShowScoreModal(true);
        }, 500);
      }
    }
  }, [puzzle, board, solved, showScoreModal, isDailyPuzzle]);

  // Save to history
  const saveToHistory = useCallback((newBoard: number[][]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBoard)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Handle puzzle generation from side menu (practice mode)
  const handleDifficultySelect = async (size: number) => {
    setSelectedDifficulty(size);
    setIsDailyPuzzle(false); // This is practice mode, not daily puzzle
    setLoading(true);
    
    try {
      const response = await generatePuzzle(size, algorithm); // No seed for practice mode
      setPuzzle(response.puzzle);
      const newBoard = initializeBoard(response.puzzle.size);
      setBoard(newBoard);
      setGameStats({
        timeElapsed: 0,
        movesMade: 0,
        hintsUsed: 0,
        startTime: Date.now(),
      });
      setChecksUsed(0);
      setHintsRemaining(3);
      setChecksRemaining(3);
      setHistory([JSON.parse(JSON.stringify(newBoard))]);
      setHistoryIndex(0);
      setSolved(false);
      setErrors([]);
      setShowSideMenu(false);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate puzzle. Make sure the backend is running.';
      alert(errorMessage);
      setSelectedDifficulty(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle cell change
  const handleCellChange = (row: number, col: number, value: number) => {
    if (!puzzle) return;

    const newBoard = board.map((r, rIdx) =>
      rIdx === row
        ? r.map((c, cIdx) => (cIdx === col ? value : c))
        : r
    );

    setBoard(newBoard);
    saveToHistory(newBoard);
    setGameStats((prev) => ({ ...prev, movesMade: prev.movesMade + 1 }));
    setErrors([]);
  };

  // Handle number pad input
  const handleNumberPadClick = (num: number) => {
    if (!selectedCell || !puzzle) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, num);
  };

  // Handle hint (limited to 3 uses)
  const handleHint = () => {
    if (!puzzle || !puzzle.solution || hintsRemaining === 0) return;

    // Find first empty cell and fill with solution
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (board[row][col] === 0) {
          const correctValue = puzzle.solution[row][col];
          handleCellChange(row, col, correctValue);
          setGameStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          setHintsRemaining(prev => Math.max(0, prev - 1));
          return;
        }
      }
    }
  };

  // Handle check (limited to 3 uses)
  const handleCheck = async () => {
    if (!puzzle || checksRemaining === 0) return;

    try {
      const response = await validateBoard(puzzle, board);
      setErrors(response.errors);
      setChecksUsed(prev => prev + 1);
      setChecksRemaining(prev => Math.max(0, prev - 1));
      
      if (response.valid) {
        // Check if puzzle is actually solved
        if (isPuzzleSolved(puzzle, board)) {
          setSolved(true);
        } else {
          alert('No errors found, but puzzle is not complete!');
        }
      } else {
        alert(`Found ${response.errors.length} error(s).`);
      }
    } catch (error) {
      console.error('Error validating puzzle:', error);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBoard(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBoard(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // Handle number pad delete
  const handleNumberPadDelete = () => {
    if (!selectedCell || !puzzle) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, 0);
  };

  // Calculate score
  const calculateScore = () => {
    return checksUsed;
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Header - Mobile First */}
      <div className="sticky top-0 bg-[#F7F6F3] border-b border-[#E0E0E0] z-30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => setShowSideMenu(true)}
            className="text-2xl text-[#1A1A1A] hover:opacity-70"
          >
            ☰
          </button>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            KenKen
          </h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content - Mobile First Vertical Stack */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {puzzle && board.length > 0 ? (
          <div className="flex flex-col items-center space-y-6">
            {/* Statistics - Full Width Card */}
            <div className="w-full max-w-md">
              <GameStats
                timeElapsed={gameStats.timeElapsed}
                movesMade={gameStats.movesMade}
                hintsUsed={gameStats.hintsUsed}
                checksUsed={checksUsed}
              />
            </div>

            {/* Puzzle Board - Centered */}
            <div className="flex justify-center mt-2">
              <PuzzleBoard
                puzzle={puzzle}
                board={board}
                selectedCell={selectedCell}
                onCellSelect={setSelectedCell}
                onCellChange={handleCellChange}
                errors={errors}
              />
            </div>

            {/* Number Pad - Unified Button Bar (Between Puzzle and Bottom) */}
            <div className="flex justify-center mt-4">
              <NumberPad
                size={puzzle.size}
                onNumberClick={handleNumberPadClick}
                onDelete={handleNumberPadDelete}
                onUndo={handleUndo}
                canUndo={historyIndex > 0}
                onHint={handleHint}
                onCheck={handleCheck}
                hintsRemaining={hintsRemaining}
                checksRemaining={checksRemaining}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center border border-[#E0E0E0] min-h-[60vh] flex items-center justify-center">
            {loading ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <svg className="animate-spin h-10 w-10 text-[#1A1A1A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-[#1A1A1A] text-lg font-medium" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    Generating your puzzle...
                  </p>
                  <p className="text-[#666666] text-sm mt-2">
                    This may take a few seconds
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    Puzzle of the Day
                  </h2>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    {dailyPuzzleInfo.dayOfWeek} - {dailyPuzzleInfo.difficulty}
                  </p>
                  <p className="text-sm text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    {formatDateForDisplay(dailyPuzzleInfo.date)}
                  </p>
                </div>
                {isPuzzleCompletedToday() && (
                  <div className="mt-4 p-3 bg-[#E8F5E9] border border-[#4CAF50] rounded-sm">
                    <p className="text-sm text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      ✓ You've completed today's puzzle!
                    </p>
                  </div>
                )}
                {!isPuzzleCompletedToday() && (
                  <div className="mt-4">
                    <p className="text-xs text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      Loading today's puzzle...
                    </p>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-[#E5E5E3]">
                  <p className="text-xs text-[#999999]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    Come back tomorrow for {getTomorrowPuzzleInfo().difficulty}!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side Menu */}
      <SideMenu
        isOpen={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onDifficultySelect={handleDifficultySelect}
        onShowTutorial={() => {
          setShowTutorial(true);
          setShowSideMenu(false);
        }}
        selectedDifficulty={selectedDifficulty}
        loading={loading}
      />

      {/* Score Modal */}
      <ScoreModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        score={calculateScore()}
        timeElapsed={gameStats.timeElapsed}
        movesMade={gameStats.movesMade}
        hintsUsed={gameStats.hintsUsed}
        checksUsed={checksUsed}
      />

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

export default App;

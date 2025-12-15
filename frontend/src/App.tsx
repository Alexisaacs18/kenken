import { useState, useEffect, useCallback } from 'react';
import PuzzleBoard from './components/PuzzleBoard';
import GameStats from './components/GameStats';
import NumberPad from './components/NumberPad';
import SideMenu from './components/SideMenu';
import ScoreModal from './components/ScoreModal';
import TutorialModal from './components/TutorialModal';
import DailyInstructionsModal from './components/DailyInstructionsModal';
import type { Puzzle, Algorithm, GameStats as GameStatsType } from './types';
import { generatePuzzle, validateBoard } from './api';
import { isPuzzleSolved } from './utils/puzzleUtils';
import { getTodayPuzzleInfo, getTomorrowPuzzleInfo, formatDateForDisplay, isPuzzleCompletedToday, markPuzzleCompletedToday } from './utils/dailyPuzzle';

function App() {
  const SESSION_KEY = 'kenken_sessions_v1';

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
  const [lost, setLost] = useState(false);
  const [hintHighlight, setHintHighlight] = useState<[number, number] | null>(null);
  const [checkHighlights, setCheckHighlights] = useState<Map<string, 'correct' | 'incorrect'>>(new Map());
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showDailyInstructions, setShowDailyInstructions] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [algorithm] = useState<Algorithm>('FC+MRV');
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

  // Handle loading daily puzzle (restore if saved for today, otherwise generate new)
  const handleDailyPuzzle = async () => {
    const todayInfo = getTodayPuzzleInfo();
    setDailyPuzzleInfo(todayInfo);
    setIsDailyPuzzle(true);
    setSelectedDifficulty(null);
    setLoading(true);
    
    try {
      // First, try to restore a saved daily session for today
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const sessions = JSON.parse(raw) as any;
          const dailySessions = (sessions && sessions.daily) || {};
          const saved = dailySessions[todayInfo.date];

          if (saved && saved.puzzle && saved.board && Array.isArray(saved.board)) {
            setPuzzle(saved.puzzle as Puzzle);
            setBoard(saved.board as number[][]);
            setGameStats(
              (saved.gameStats as GameStatsType) ?? {
                timeElapsed: 0,
                movesMade: 0,
                hintsUsed: 0,
                startTime: Date.now(),
              },
            );
            setChecksUsed(saved.checksUsed ?? 0);
            setHintsRemaining(saved.hintsRemaining ?? 3);
            setChecksRemaining(saved.checksRemaining ?? 3);
            setSolved(saved.solved ?? false);
            setShowSideMenu(saved.showMenu ?? false);
            setHistory([JSON.parse(JSON.stringify(saved.board))]);
            setHistoryIndex(0);

            // Update last mode
            const updated = {
              ...(sessions || {}),
              lastMode: 'daily',
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
            setLoading(false);
            return;
          }
        }
      }

      // No saved session for today – generate a new daily puzzle
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
      setShowSideMenu(false);
    } catch (error) {
      console.error('Error loading daily puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load daily puzzle. Make sure the backend is running.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle puzzle generation from side menu (practice mode)
  const handleDifficultySelect = async (size: number) => {
    setSelectedDifficulty(size);
    setIsDailyPuzzle(false); // This is practice mode, not daily puzzle
    setLoading(true);
    
    try {
      // Always generate a fresh practice puzzle for this difficulty
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

  // Load from storage on mount (restores daily or practice session)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (puzzle) return; // Don't override if something already loaded

    const tryRestoreSession = async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const sessions = JSON.parse(raw) as any;
          const todayInfo = getTodayPuzzleInfo();

          const dailySessions = (sessions && sessions.daily) || {};
          const dailySaved = dailySessions[todayInfo.date];

          const hasValidDaily =
            dailySaved &&
            dailySaved.puzzle &&
            dailySaved.board &&
            Array.isArray(dailySaved.board);

          if (hasValidDaily) {
            setIsDailyPuzzle(true);
            setDailyPuzzleInfo(todayInfo);
            setPuzzle(dailySaved.puzzle as Puzzle);
            setBoard(dailySaved.board as number[][]);
            setGameStats(
              (dailySaved.gameStats as GameStatsType) ?? {
                timeElapsed: 0,
                movesMade: 0,
                hintsUsed: 0,
                startTime: Date.now(),
              },
            );
            setChecksUsed(dailySaved.checksUsed ?? 0);
            setHintsRemaining(dailySaved.hintsRemaining ?? 3);
            setChecksRemaining(dailySaved.checksRemaining ?? 3);
            setSolved(dailySaved.solved ?? false);
            setShowSideMenu(dailySaved.showMenu ?? false);
            setSelectedDifficulty(null);

            return; // Successfully restored daily session
          }
        }
      } catch (error) {
        console.error('Error restoring session from storage:', error);
      }

      // Fallback: load today's daily puzzle
      await handleDailyPuzzle();
    };

    void tryRestoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // Show daily instructions modal once per session for daily puzzles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!puzzle || !isDailyPuzzle) return;

    // Check if instructions have been shown this session
    const hasSeenInstructions = sessionStorage.getItem('kenken_daily_instructions_shown');
    if (!hasSeenInstructions) {
      setShowDailyInstructions(true);
    }
  }, [puzzle, isDailyPuzzle]);

  // Handle closing daily instructions modal
  const handleCloseDailyInstructions = () => {
    setShowDailyInstructions(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kenken_daily_instructions_shown', 'true');
    }
  };

  // Handle cell change
  const handleCellChange = (row: number, col: number, value: number) => {
    if (!puzzle || lost) return;

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
    if (!puzzle || !puzzle.solution || hintsRemaining === 0 || lost) return;

    // Find first empty cell and fill with solution
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (board[row][col] === 0) {
          const correctValue = puzzle.solution[row][col];
          handleCellChange(row, col, correctValue);
          setGameStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          setHintsRemaining(prev => Math.max(0, prev - 1));
          
          // Set hint highlight for 2 seconds
          setHintHighlight([row, col]);
          setTimeout(() => {
            setHintHighlight(null);
          }, 2000);
          
          return;
        }
      }
    }
  };

  // Run a check (limited to 3 uses). When autoCheck is true, it's triggered by a full-but-wrong board.
  const runCheck = async (autoCheck: boolean) => {
    if (!puzzle || checksRemaining === 0 || lost) return;

    try {
      const response = await validateBoard(puzzle, board);
      setChecksUsed(prev => prev + 1);
      setChecksRemaining(prev => Math.max(0, prev - 1));
      
      // Create highlight map for visual feedback
      const highlights = new Map<string, 'correct' | 'incorrect'>();
      const errorCells = new Set(response.errors.map(e => `${e.row},${e.col}`));
      
      // Check each filled cell
      for (let row = 0; row < puzzle.size; row++) {
        for (let col = 0; col < puzzle.size; col++) {
          if (board[row][col] > 0) {
            const cellKey = `${row},${col}`;
            if (errorCells.has(cellKey)) {
              highlights.set(cellKey, 'incorrect');
            } else {
              // Check if it matches the solution
              if (puzzle.solution && puzzle.solution[row][col] === board[row][col]) {
                highlights.set(cellKey, 'correct');
              } else {
                highlights.set(cellKey, 'incorrect');
              }
            }
          }
        }
      }
      
      setCheckHighlights(highlights);
      
      // Remove highlights after 3 seconds (unless player has lost, in which case loss highlights will override)
      setTimeout(() => {
        setCheckHighlights(new Map());
      }, 3000);
      
      if (response.valid) {
        // Check if puzzle is actually solved
        if (isPuzzleSolved(puzzle, board)) {
          setSolved(true);
        }
      }
    } catch (error) {
      console.error('Error validating puzzle:', error);
    }
  };

  // Manual check button handler
  const handleCheck = async () => {
    await runCheck(false);
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBoard(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };


  // Handle number pad delete
  const handleNumberPadDelete = () => {
    if (!selectedCell || !puzzle || lost) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, 0);
  };

  // Calculate score
  const calculateScore = () => {
    return checksUsed;
  };

  const getShareDateLabel = () => {
    if (isDailyPuzzle) {
      return dailyPuzzleInfo.date;
    }
    // For practice, just use today's date in YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDifficultyLabel = () => {
    if (isDailyPuzzle) {
      return dailyPuzzleInfo.difficulty;
    }
    if (puzzle) {
      return `${puzzle.size}x${puzzle.size} Practice`;
    }
    return 'Practice';
  };

  const getPuzzleNumber = () => {
    if (!isDailyPuzzle) return 0;
    const base = new Date('2024-01-01T00:00:00Z');
    const current = new Date(`${dailyPuzzleInfo.date}T00:00:00Z`);
    const diffDays = Math.floor((current.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Auto-check when board is completely filled but incorrect (uses one check)
  useEffect(() => {
    if (!puzzle || solved || lost) return;

    const isFull = board.length === puzzle.size &&
      board.every((row) => row.length === puzzle.size && row.every((v) => v > 0));

    if (!isFull) return;

    // If board is full but not solved, and we have checks left, auto-run a check
    if (!isPuzzleSolved(puzzle, board) && checksRemaining > 0) {
      void runCheck(true);
    }
  }, [board, puzzle, solved, lost, checksRemaining]);

  // Detect loss: all hints and checks exhausted without solving
  useEffect(() => {
    if (!puzzle || solved || lost) return;
    if (hintsRemaining === 0 && checksRemaining === 0) {
      // Mark game as lost and highlight all incorrect/missing cells in red
      setLost(true);

      if (puzzle.solution) {
        const highlights = new Map<string, 'correct' | 'incorrect'>();
        for (let row = 0; row < puzzle.size; row++) {
          for (let col = 0; col < puzzle.size; col++) {
            const val = board[row]?.[col];
            const correct = puzzle.solution[row][col];
            if (!val || val !== correct) {
              const cellKey = `${row},${col}`;
              highlights.set(cellKey, 'incorrect');
            }
          }
        }
        setCheckHighlights(highlights);
      }
    }
  }, [puzzle, board, solved, lost, hintsRemaining, checksRemaining]);

  // Persist current sessions to storage whenever relevant state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!puzzle) return;

    try {
      const todayInfo = getTodayPuzzleInfo();
      const raw = localStorage.getItem(SESSION_KEY);
      const sessions = raw ? JSON.parse(raw) as any : {};

      if (isDailyPuzzle) {
        const dailySessions = sessions.daily || {};
        dailySessions[todayInfo.date] = {
          puzzle,
          board,
          gameStats,
          checksUsed,
          hintsRemaining,
          checksRemaining,
          solved,
          showMenu: showSideMenu,
          isDailyChallenge: true,
          dailyDate: todayInfo.date,
        };
        sessions.daily = dailySessions;
        sessions.lastMode = 'daily';

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }, [
    puzzle,
    board,
    gameStats,
    checksUsed,
    hintsRemaining,
    checksRemaining,
    solved,
    showSideMenu,
    selectedDifficulty,
    isDailyPuzzle,
  ]);

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
            Puzzalo Games
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
                onCellSelect={(row, col) => setSelectedCell([row, col])}
                onCellChange={handleCellChange}
                errors={errors}
                hintHighlight={hintHighlight}
                checkHighlights={checkHighlights}
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
        onDailyPuzzle={handleDailyPuzzle}
        onShowTutorial={() => {
          setShowTutorial(true);
          setShowSideMenu(false);
        }}
        selectedDifficulty={selectedDifficulty}
        loading={loading}
        isDailyPuzzle={isDailyPuzzle}
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
        puzzle={puzzle}
        board={board}
        isDailyPuzzle={isDailyPuzzle}
        dateLabel={getShareDateLabel()}
        difficultyLabel={getDifficultyLabel()}
        puzzleNumber={getPuzzleNumber()}
      />

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Daily Instructions Modal */}
      <DailyInstructionsModal isOpen={showDailyInstructions} onClose={handleCloseDailyInstructions} />
    </div>
  );
}

export default App;

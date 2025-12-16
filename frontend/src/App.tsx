import { useState, useEffect, useCallback, useRef } from 'react';
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
    attempts: 0,
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
  const [lastAutoCheckedBoard, setLastAutoCheckedBoard] = useState<string>(''); // Track last auto-checked board state
  const [puzzleKey, setPuzzleKey] = useState<string>(''); // Unique key for puzzle remounting
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Store hint timeout for cleanup
  const solvedTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Store solved modal timeout for cleanup
  const lostTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Store lost modal timeout for cleanup
  const lastAttemptedSizeRef = useRef<number | null>(null); // Track last attempted puzzle size for refresh
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

  // Comprehensive state reset function
  const resetAllGameState = useCallback(() => {
    // Clear any pending timeouts
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
    if (solvedTimeoutRef.current) {
      clearTimeout(solvedTimeoutRef.current);
      solvedTimeoutRef.current = null;
    }
    if (lostTimeoutRef.current) {
      clearTimeout(lostTimeoutRef.current);
      lostTimeoutRef.current = null;
    }
    
    setBoard([]);
    setSelectedCell(null);
    setGameStats({
      timeElapsed: 0,
      movesMade: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      attempts: 0,
    });
    setChecksUsed(0);
    setHintsRemaining(3);
    setChecksRemaining(3);
    setErrors([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSolved(false);
    setLost(false);
    setHintHighlight(null);
    setCheckHighlights(new Map());
    setLastAutoCheckedBoard('');
    setPuzzleKey(''); // Reset puzzle key
    // Note: Don't reset showScoreModal here - it's controlled by game end states (solved/lost)
  }, []);

  // Timer effect with cleanup
  useEffect(() => {
    if (!puzzle || solved || loading) return;

    const interval = setInterval(() => {
      setGameStats((prev) => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [puzzle, solved, loading]);

  // Cleanup hint timeout on unmount or puzzle change
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
    };
  }, [puzzle]);

  // Check if puzzle is solved
  useEffect(() => {
    // Don't check if loading, lost, or already solved
    // Also ensure board is properly initialized (matches puzzle size)
    if (!puzzle || loading || lost || solved || board.length === 0) return;
    if (board.length !== puzzle.size || board[0]?.length !== puzzle.size) return;
    
    const isComplete = isPuzzleSolved(puzzle, board);
    if (isComplete) {
      setSolved(true);
      if (isDailyPuzzle) {
        markPuzzleCompletedToday();
      }
      // Clear any existing solved timeout
      if (solvedTimeoutRef.current) {
        clearTimeout(solvedTimeoutRef.current);
      }
      // Show score modal after a brief delay
      solvedTimeoutRef.current = setTimeout(() => {
        setShowScoreModal(true);
        solvedTimeoutRef.current = null;
      }, 500);
    }
  }, [puzzle, board, isDailyPuzzle, loading, lost, solved]); // Include solved to prevent re-checking

  // Cleanup solved timeout only on puzzle change or unmount
  useEffect(() => {
    return () => {
      if (solvedTimeoutRef.current) {
        clearTimeout(solvedTimeoutRef.current);
        solvedTimeoutRef.current = null;
      }
    };
  }, [puzzle]); // Only cleanup when puzzle changes, not on every board change

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
    lastAttemptedSizeRef.current = todayInfo.size; // Track this as the last attempted size
    
    // Full state reset BEFORE loading new puzzle
    resetAllGameState();
    setShowScoreModal(false); // Explicitly close score modal when starting new puzzle
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
            // Generate puzzle key for restored session
            const puzzleId = `daily-${todayInfo.date}-restored`;
            setPuzzleKey(puzzleId);
            setPuzzle(saved.puzzle as Puzzle);
            setBoard(saved.board as number[][]);
            setGameStats(
              (saved.gameStats as GameStatsType) ?? {
                timeElapsed: 0,
                movesMade: 0,
                hintsUsed: 0,
                startTime: Date.now(),
                attempts: 0,
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
              lastAttemptedSize: todayInfo.size, // Persist daily puzzle size
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
            setLoading(false);
            return;
          }
        }
      }

      // No saved session for today – generate a new daily puzzle
      console.log(`[Daily Puzzle] Loading ${todayInfo.size}x${todayInfo.size} puzzle for ${todayInfo.date}`);
      const response = await generatePuzzle(todayInfo.size, algorithm, todayInfo.seed);
      console.log(`[Daily Puzzle] Received puzzle:`, response.puzzle ? 'success' : 'failed');
      // Generate unique puzzle key for forced remounting
      const puzzleId = `daily-${todayInfo.date}-${Date.now()}`;
      setPuzzleKey(puzzleId);
      setPuzzle(response.puzzle);
      const newBoard = initializeBoard(response.puzzle.size);
      setBoard(newBoard);
      setGameStats({
        timeElapsed: 0,
        movesMade: 0,
        hintsUsed: 0,
        startTime: Date.now(),
        attempts: 0,
      });
      setChecksUsed(0);
      setHintsRemaining(3);
      setChecksRemaining(3);
      setHistory([JSON.parse(JSON.stringify(newBoard))]);
      setHistoryIndex(0);
      setSolved(false);
      setErrors([]);
      setShowSideMenu(false);
      setLastAutoCheckedBoard(''); // Reset auto-check tracking
    } catch (error) {
      console.error('[Daily Puzzle] Error loading daily puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load daily puzzle. Make sure the backend is running.';
      console.error('[Daily Puzzle] Error details:', {
        message: errorMessage,
        size: todayInfo.size,
        date: todayInfo.date,
        error: error,
      });
      // Keep lastAttemptedSizeRef set to today's size so refresh knows what to retry
      lastAttemptedSizeRef.current = todayInfo.size;
      // No alert - just let the loading state show the failed to load screen
      // Don't set loading to false on error - keep it showing so user knows something went wrong
      // setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle puzzle generation from side menu (practice mode)
  const handleDifficultySelect = async (size: number) => {
    setSelectedDifficulty(size);
    setIsDailyPuzzle(false); // This is practice mode, not daily puzzle
    lastAttemptedSizeRef.current = size; // Track this as the last attempted size
    
    // Full state reset BEFORE loading new puzzle
    resetAllGameState();
    setShowScoreModal(false); // Explicitly close score modal when starting new puzzle
    setLoading(true);
    
    try {
      // First, try to restore a saved practice session for this difficulty (only if from today)
      const todayInfo = getTodayPuzzleInfo();
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const sessions = JSON.parse(raw) as any;
          const practiceSessions = (sessions && sessions.practice) || {};
          const saved = practiceSessions[size];

          // Only restore if puzzle is from today (same refresh logic as daily puzzle)
          if (saved && saved.puzzle && saved.board && Array.isArray(saved.board) && saved.date === todayInfo.date) {
            // Restore saved practice puzzle for this difficulty
            const puzzleId = `practice-${size}-${todayInfo.date}-restored`;
            setPuzzleKey(puzzleId);
            setPuzzle(saved.puzzle as Puzzle);
            setBoard(saved.board as number[][]);
            setGameStats(
              (saved.gameStats as GameStatsType) ?? {
                timeElapsed: 0,
                movesMade: 0,
                hintsUsed: 0,
                startTime: Date.now(),
                attempts: 0,
              },
            );
            setChecksUsed(saved.checksUsed ?? 0);
            setHintsRemaining(saved.hintsRemaining ?? 3);
            setChecksRemaining(saved.checksRemaining ?? 3);
            setSolved(saved.solved ?? false);
            setShowSideMenu(saved.showMenu ?? false);
            setHistory(saved.history ? JSON.parse(JSON.stringify(saved.history)) : [JSON.parse(JSON.stringify(saved.board))]);
            setHistoryIndex(saved.historyIndex ?? 0);

            // Update last mode
            const updated = {
              ...(sessions || {}),
              lastMode: 'practice',
              lastDifficulty: size,
              lastAttemptedSize: size, // Persist practice puzzle size
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
            setLoading(false);
            return;
          }
        }
      }

      // No saved session for this difficulty today – generate a new practice puzzle
      const response = await generatePuzzle(size, algorithm); // No seed for practice mode
      const newBoard = initializeBoard(response.puzzle.size);
      
      // Set all state together to avoid race conditions
      // Generate unique puzzle key for forced remounting (include date so it refreshes daily)
      const puzzleId = `practice-${size}-${todayInfo.date}-${Date.now()}`;
      setPuzzleKey(puzzleId);
      setPuzzle(response.puzzle);
      setBoard(newBoard);
      setGameStats({
        timeElapsed: 0,
        movesMade: 0,
        hintsUsed: 0,
        startTime: Date.now(),
        attempts: 0,
      });
      setChecksUsed(0);
      setHintsRemaining(3);
      setChecksRemaining(3);
      setHistory([JSON.parse(JSON.stringify(newBoard))]);
      setHistoryIndex(0);
      setShowSideMenu(false);
      setSolved(false);
      setErrors([]);
      setLastAutoCheckedBoard(''); // Reset auto-check tracking
    } catch (error) {
      console.error('Error generating puzzle:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate puzzle. Make sure the backend is running.';
      // Keep lastAttemptedSizeRef set so refresh knows what to retry
      lastAttemptedSizeRef.current = size;
      // Don't clear selectedDifficulty on error - keep it so refresh knows what to retry
      // setSelectedDifficulty(null);
      // No alert - just let the loading state show the failed to load screen
    } finally {
      // Reset loading state last to ensure all state is set
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

          // Restore lastAttemptedSizeRef from localStorage if available
          if (sessions.lastAttemptedSize) {
            lastAttemptedSizeRef.current = sessions.lastAttemptedSize;
          }

          // Check for daily puzzle first
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
            setHistory(dailySaved.history ? JSON.parse(JSON.stringify(dailySaved.history)) : [JSON.parse(JSON.stringify(dailySaved.board))]);
            setHistoryIndex(dailySaved.historyIndex ?? 0);
            lastAttemptedSizeRef.current = todayInfo.size; // Track daily puzzle size

            return; // Successfully restored daily session
          }

          // Check for practice puzzle (restore last difficulty if available and from today)
          const practiceSessions = (sessions && sessions.practice) || {};
          const lastDifficulty = sessions.lastDifficulty;
          const practiceSaved = lastDifficulty ? practiceSessions[lastDifficulty] : null;

          // Only restore if puzzle is from today (same refresh logic as daily puzzle)
          const hasValidPractice =
            practiceSaved &&
            practiceSaved.puzzle &&
            practiceSaved.board &&
            Array.isArray(practiceSaved.board) &&
            practiceSaved.date === todayInfo.date;

          if (hasValidPractice && lastDifficulty) {
            setIsDailyPuzzle(false);
            setSelectedDifficulty(lastDifficulty);
            setPuzzle(practiceSaved.puzzle as Puzzle);
            setBoard(practiceSaved.board as number[][]);
            setGameStats(
              (practiceSaved.gameStats as GameStatsType) ?? {
                timeElapsed: 0,
                movesMade: 0,
                hintsUsed: 0,
                startTime: Date.now(),
                attempts: 0,
              },
            );
            setChecksUsed(practiceSaved.checksUsed ?? 0);
            setHintsRemaining(practiceSaved.hintsRemaining ?? 3);
            setChecksRemaining(practiceSaved.checksRemaining ?? 3);
            setSolved(practiceSaved.solved ?? false);
            setShowSideMenu(practiceSaved.showMenu ?? false);
            setHistory(practiceSaved.history ? JSON.parse(JSON.stringify(practiceSaved.history)) : [JSON.parse(JSON.stringify(practiceSaved.board))]);
            setHistoryIndex(practiceSaved.historyIndex ?? 0);
            lastAttemptedSizeRef.current = lastDifficulty; // Track practice puzzle size

            return; // Successfully restored practice session
          }
        }
      } catch (error) {
        console.error('[Mount] Error restoring session from storage:', error);
      }

      // Fallback: Check lastAttemptedSizeRef first (persisted from localStorage or previous attempts)
      // This ensures we don't default to 3x3 daily puzzle if user was trying a different size
      // Also check lastDifficulty from localStorage
      const raw = localStorage.getItem(SESSION_KEY);
      const sessions = raw ? JSON.parse(raw) as any : {};
      const lastDifficulty = sessions.lastDifficulty;
      const lastAttemptedSize = sessions.lastAttemptedSize;
      
      // Priority: Use lastDifficulty if available, then lastAttemptedSize, then daily puzzle
      if (lastDifficulty && lastDifficulty !== dailyPuzzleInfo.size) {
        console.log('[Mount] No saved session, but lastDifficulty indicates practice puzzle was attempted, loading:', lastDifficulty);
        lastAttemptedSizeRef.current = lastDifficulty;
        await handleDifficultySelect(lastDifficulty);
      } else if (lastAttemptedSize && lastAttemptedSize !== dailyPuzzleInfo.size) {
        console.log('[Mount] No saved session, but lastAttemptedSize indicates practice puzzle was attempted, loading:', lastAttemptedSize);
        lastAttemptedSizeRef.current = lastAttemptedSize;
        await handleDifficultySelect(lastAttemptedSize);
      } else if (lastAttemptedSizeRef.current !== null && lastAttemptedSizeRef.current !== dailyPuzzleInfo.size) {
        console.log('[Mount] No saved session, but lastAttemptedSizeRef indicates practice puzzle was attempted, loading:', lastAttemptedSizeRef.current);
        await handleDifficultySelect(lastAttemptedSizeRef.current);
      } else {
        console.log('[Mount] No saved session found, loading daily puzzle...');
        await handleDailyPuzzle();
      }
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
    if (!puzzle || lost || loading || solved) return;

    const newBoard = board.map((r, rIdx) =>
      rIdx === row
        ? r.map((c, cIdx) => (cIdx === col ? value : c))
        : r
    );

    setBoard(newBoard);
    saveToHistory(newBoard);
    setGameStats((prev) => ({ ...prev, movesMade: prev.movesMade + 1 }));
    setErrors([]);
    // Reset auto-check tracking when user makes a move
    setLastAutoCheckedBoard('');
  };

  // Handle number pad input
  const handleNumberPadClick = (num: number) => {
    if (!selectedCell || !puzzle || loading) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, num);
  };

  // Handle hint (limited to 3 uses)
  const handleHint = () => {
    if (!puzzle || !puzzle.solution || hintsRemaining === 0 || lost || loading) return;

    // Find first empty cell and fill with solution
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (board[row][col] === 0) {
          const correctValue = puzzle.solution[row][col];
          handleCellChange(row, col, correctValue);
          setGameStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          setHintsRemaining(prev => Math.max(0, prev - 1));
          
          // Clear any existing hint timeout
          if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
          }
          
          // Set hint highlight for 2 seconds
          setHintHighlight([row, col]);
          hintTimeoutRef.current = setTimeout(() => {
            setHintHighlight(null);
            hintTimeoutRef.current = null;
          }, 2000);
          
          return;
        }
      }
    }
  };

  // Run a check (limited to 3 uses). When autoCheck is true, it's triggered by a full-but-wrong board.
  const runCheck = async (autoCheck: boolean) => {
    if (!puzzle || checksRemaining === 0 || lost || loading) return;

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
      // Store timeout in a ref for cleanup
      const checkTimeout = setTimeout(() => {
        if (!lost) {
          setCheckHighlights(new Map());
        }
      }, 3000);
      
      // Cleanup will happen on component unmount or when puzzle changes
      // Store timeout ID for potential cleanup if needed
      
      if (response.valid) {
        // Check if puzzle is actually solved
        if (isPuzzleSolved(puzzle, board)) {
          setSolved(true);
          // Clear check highlights when solved
          clearTimeout(checkTimeout);
          setCheckHighlights(new Map());
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
    if (!selectedCell || !puzzle || lost || loading) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, 0);
  };

  // Handle refresh puzzle - resets current puzzle to blank state (same puzzle, fresh start)
  // If no puzzle is loaded, clears cache and retries loading the SAME puzzle that was attempted
  const handleRefreshPuzzle = async () => {
    // Determine what puzzle we're trying to refresh
    // Priority: 1) Current puzzle size, 2) selectedDifficulty, 3) lastAttemptedSizeRef, 4) dailyPuzzleInfo
    const targetSize = puzzle?.size || selectedDifficulty || lastAttemptedSizeRef.current || dailyPuzzleInfo.size;
    const wasPracticeMode = selectedDifficulty !== null && !isDailyPuzzle;
    
    // Clear localStorage cache
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const sessions = JSON.parse(raw);
          if (isDailyPuzzle && !wasPracticeMode) {
            const todayInfo = getTodayPuzzleInfo();
            if (sessions.daily) {
              delete sessions.daily[todayInfo.date];
              localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
            }
          } else if (selectedDifficulty || wasPracticeMode) {
            const sizeToClear = selectedDifficulty || targetSize;
            if (sessions.practice && sizeToClear) {
              delete sessions.practice[sizeToClear];
              localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
            }
          }
        } catch (error) {
          console.error('[Refresh] Error clearing localStorage:', error);
        }
      }
    }
    
    // If puzzle is loaded, reset it to blank
    if (puzzle) {
      // Reset board to blank
      const newBoard = initializeBoard(puzzle.size);
      setBoard(newBoard);
      
      // Reset game state but keep the same puzzle
      setSelectedCell(null);
      setGameStats({
        timeElapsed: 0,
        movesMade: 0,
        hintsUsed: 0,
        startTime: Date.now(),
        attempts: gameStats.attempts + 1, // Increment attempts
      });
      setChecksUsed(0);
      setHintsRemaining(3);
      setChecksRemaining(3);
      setErrors([]);
      setHistory([JSON.parse(JSON.stringify(newBoard))]);
      setHistoryIndex(0);
      setSolved(false);
      setLost(false);
      setHintHighlight(null);
      setCheckHighlights(new Map());
      setLastAutoCheckedBoard('');
      setShowScoreModal(false);
    } else {
      // No puzzle loaded - retry loading the SAME puzzle that was attempted
      resetAllGameState();
      setShowScoreModal(false);
      setLoading(true);
      
      try {
        // Log current state for debugging
        console.log(`[Refresh] State check:`, {
          selectedDifficulty,
          isDailyPuzzle,
          wasPracticeMode,
          targetSize,
          lastAttemptedSize: lastAttemptedSizeRef.current,
          dailyPuzzleSize: dailyPuzzleInfo.size,
        });
        
        // Get lastDifficulty and lastAttemptedSize from localStorage as additional checks
        const raw = localStorage.getItem(SESSION_KEY);
        const sessions = raw ? JSON.parse(raw) as any : {};
        const lastDifficulty = sessions.lastDifficulty;
        const lastAttemptedSize = sessions.lastAttemptedSize;
        
        // Priority 1: If selectedDifficulty is set, always use it (practice mode)
        // This handles the case where a practice puzzle failed to load
        if (selectedDifficulty !== null) {
          console.log(`[Refresh] Using selectedDifficulty: ${selectedDifficulty}x${selectedDifficulty}`);
          await handleDifficultySelect(selectedDifficulty);
        } 
        // Priority 2: If lastDifficulty from localStorage is set and different from daily, use it
        else if (lastDifficulty !== null && lastDifficulty !== undefined && lastDifficulty !== dailyPuzzleInfo.size) {
          console.log(`[Refresh] Using lastDifficulty from localStorage: ${lastDifficulty}x${lastDifficulty}`);
          lastAttemptedSizeRef.current = lastDifficulty;
          await handleDifficultySelect(lastDifficulty);
        }
        // Priority 3: If lastAttemptedSize from localStorage is set and different from daily, use it
        else if (lastAttemptedSize !== null && lastAttemptedSize !== undefined && lastAttemptedSize !== dailyPuzzleInfo.size) {
          console.log(`[Refresh] Using lastAttemptedSize from localStorage: ${lastAttemptedSize}x${lastAttemptedSize}`);
          lastAttemptedSizeRef.current = lastAttemptedSize;
          await handleDifficultySelect(lastAttemptedSize);
        }
        // Priority 4: If lastAttemptedSizeRef is set and different from daily, use it
        else if (lastAttemptedSizeRef.current !== null && lastAttemptedSizeRef.current !== dailyPuzzleInfo.size) {
          console.log(`[Refresh] Using lastAttemptedSizeRef: ${lastAttemptedSizeRef.current}x${lastAttemptedSizeRef.current}`);
          await handleDifficultySelect(lastAttemptedSizeRef.current);
        }
        // Priority 5: If targetSize is different from daily puzzle size, it's likely a practice puzzle
        else if (targetSize && targetSize !== dailyPuzzleInfo.size) {
          console.log(`[Refresh] Using targetSize (differs from daily): ${targetSize}x${targetSize}`);
          await handleDifficultySelect(targetSize);
        }
        // Priority 6: Otherwise, load daily puzzle
        else {
          console.log(`[Refresh] Loading daily puzzle: ${dailyPuzzleInfo.size}x${dailyPuzzleInfo.size}`);
          await handleDailyPuzzle();
        }
      } catch (error) {
        console.error('[Refresh] Error reloading puzzle:', error);
        setLoading(false);
      }
    }
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

    if (!isFull) {
      // Reset auto-check tracking when board is no longer full
      setLastAutoCheckedBoard('');
      return;
    }

    // If board is full but not solved, and we have checks left, auto-run a check
    // But only if we haven't already checked this exact board state
    if (!isPuzzleSolved(puzzle, board) && checksRemaining > 0) {
      const boardKey = JSON.stringify(board);
      if (boardKey !== lastAutoCheckedBoard) {
        setLastAutoCheckedBoard(boardKey);
        void runCheck(true);
      }
    }
  }, [board, puzzle, solved, lost, checksRemaining, lastAutoCheckedBoard]);

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

      // Clear any existing lost timeout
      if (lostTimeoutRef.current) {
        clearTimeout(lostTimeoutRef.current);
      }
      // Show score modal when game is lost (after a brief delay)
      lostTimeoutRef.current = setTimeout(() => {
        setShowScoreModal(true);
        lostTimeoutRef.current = null;
      }, 500);
    }
  }, [puzzle, board, solved, hintsRemaining, checksRemaining]); // Removed 'lost' to prevent cleanup clearing timeout

  // Cleanup lost timeout only on puzzle change or unmount
  useEffect(() => {
    return () => {
      if (lostTimeoutRef.current) {
        clearTimeout(lostTimeoutRef.current);
        lostTimeoutRef.current = null;
      }
    };
  }, [puzzle]); // Only cleanup when puzzle changes, not on every state change

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
          history,
          historyIndex,
        };
        sessions.daily = dailySessions;
        sessions.lastMode = 'daily';
        sessions.lastAttemptedSize = puzzle.size; // Persist daily puzzle size

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
      } else if (selectedDifficulty !== null) {
        // Save practice puzzle for this difficulty (include date so it refreshes daily)
        const practiceSessions = sessions.practice || {};
        practiceSessions[selectedDifficulty] = {
          puzzle,
          board,
          gameStats,
          checksUsed,
          hintsRemaining,
          checksRemaining,
          solved,
          showMenu: showSideMenu,
          isDailyChallenge: false,
          difficulty: selectedDifficulty,
          date: todayInfo.date, // Store date so puzzle refreshes daily
          history,
          historyIndex,
        };
        sessions.practice = practiceSessions;
        sessions.lastMode = 'practice';
        sessions.lastDifficulty = selectedDifficulty;
        sessions.lastAttemptedSize = selectedDifficulty; // Persist last attempted size

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
    history,
    historyIndex,
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
                key={puzzleKey || `${puzzle.size}-${puzzle.cages.length}`}
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

            {/* Refresh Button - Always visible, clears cache and reloads puzzle */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleRefreshPuzzle}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[#666666] bg-white border border-[#E0E0E0] rounded-sm hover:bg-[#F7F6F3] hover:border-[#999999] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Loading...' : 'Refresh Puzzle'}</span>
              </button>
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
            {/* Refresh Button - Always visible, even when loading or puzzle not loaded */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleRefreshPuzzle}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[#666666] bg-white border border-[#E0E0E0] rounded-sm hover:bg-[#F7F6F3] hover:border-[#999999] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Loading...' : 'Refresh Puzzle'}</span>
              </button>
            </div>
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
        onClose={() => {
          setShowScoreModal(false);
        }}
        score={calculateScore()}
        timeElapsed={gameStats.timeElapsed}
        movesMade={gameStats.movesMade}
        hintsUsed={gameStats.hintsUsed}
        checksUsed={checksUsed}
        attempts={gameStats.attempts}
        puzzle={puzzle}
        board={board}
        isDailyPuzzle={isDailyPuzzle}
        dateLabel={getShareDateLabel()}
        difficultyLabel={getDifficultyLabel()}
        puzzleNumber={getPuzzleNumber()}
        lost={lost}
      />

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Daily Instructions Modal */}
      <DailyInstructionsModal isOpen={showDailyInstructions} onClose={handleCloseDailyInstructions} />
    </div>
  );
}

export default App;

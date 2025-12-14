import React, { useState, useEffect, useCallback } from 'react';
import PuzzleGenerator from './components/PuzzleGenerator';
import PuzzleBoard from './components/PuzzleBoard';
import GameControls from './components/GameControls';
import GameStats from './components/GameStats';
import BenchmarkStats from './components/BenchmarkStats';
import TutorialModal from './components/TutorialModal';
import type { Puzzle, Algorithm, BenchmarkStats as Stats, GameStats as GameStatsType } from './types';
import { solvePuzzle, validateBoard } from './api';
import { isPuzzleSolved } from './utils/puzzleUtils';

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [benchmarkStats, setBenchmarkStats] = useState<Stats | null>(null);
  const [gameStats, setGameStats] = useState<GameStatsType>({
    timeElapsed: 0,
    movesMade: 0,
    hintsUsed: 0,
    startTime: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [errors, setErrors] = useState<{ row: number; col: number; message: string }[]>([]);
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

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
    if (puzzle && board.length > 0) {
      const solved = isPuzzleSolved(puzzle, board);
      setSolved(solved);
      if (solved) {
        // Victory animation could go here
        console.log('Puzzle solved!');
      }
    }
  }, [puzzle, board]);

  // Save to history
  const saveToHistory = useCallback((newBoard: number[][]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBoard)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Handle puzzle generation
  const handlePuzzleGenerated = (newPuzzle: Puzzle, stats: Stats) => {
    setPuzzle(newPuzzle);
    const newBoard = initializeBoard(newPuzzle.size);
    setBoard(newBoard);
    setBenchmarkStats(stats);
    setGameStats({
      timeElapsed: 0,
      movesMade: 0,
      hintsUsed: 0,
      startTime: Date.now(),
    });
    setHistory([JSON.parse(JSON.stringify(newBoard))]);
    setHistoryIndex(0);
    setSolved(false);
    setErrors([]);
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

  // Handle clear
  const handleClear = () => {
    if (!puzzle) return;
    const newBoard = initializeBoard(puzzle.size);
    setBoard(newBoard);
    saveToHistory(newBoard);
    setErrors([]);
  };

  // Handle hint
  const handleHint = () => {
    if (!puzzle || !puzzle.solution) return;

    // Find first empty cell and fill with solution
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (board[row][col] === 0) {
          const correctValue = puzzle.solution[row][col];
          handleCellChange(row, col, correctValue);
          setGameStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          return;
        }
      }
    }
  };

  // Handle solve
  const handleSolve = async () => {
    if (!puzzle) return;

    setSolving(true);
    try {
      const response = await solvePuzzle(puzzle, 'FC+MRV');
      setBoard(response.solution);
      setBenchmarkStats(response.stats);
      saveToHistory(response.solution);
    } catch (error) {
      console.error('Error solving puzzle:', error);
      alert('Failed to solve puzzle. Make sure the backend is running.');
    } finally {
      setSolving(false);
    }
  };

  // Handle check
  const handleCheck = async () => {
    if (!puzzle) return;

    try {
      const response = await validateBoard(puzzle, board);
      setErrors(response.errors);
      if (response.valid) {
        alert('Puzzle is valid!');
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

  // Handle new puzzle
  const handleNewPuzzle = () => {
    setPuzzle(null);
    setBoard([]);
    setSelectedCell(null);
    setBenchmarkStats(null);
    setGameStats({
      timeElapsed: 0,
      movesMade: 0,
      hintsUsed: 0,
      startTime: Date.now(),
    });
    setErrors([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSolved(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              KenKen
            </h1>
            <button
              onClick={() => setShowTutorial(true)}
              className="px-4 py-2 text-sm font-medium text-[#666666] border border-[#1A1A1A] rounded-sm hover:bg-[#1A1A1A] hover:text-white transition-colors"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              How to Play
            </button>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 text-[#666666] border border-[#1A1A1A] rounded-sm hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Generator and Stats */}
          <div className="space-y-6">
            <PuzzleGenerator
              onPuzzleGenerated={handlePuzzleGenerated}
              loading={loading}
              setLoading={setLoading}
            />

            {benchmarkStats && (
              <BenchmarkStats stats={benchmarkStats} />
            )}

            {puzzle && (
              <>
                <GameStats
                  timeElapsed={gameStats.timeElapsed}
                  movesMade={gameStats.movesMade}
                  hintsUsed={gameStats.hintsUsed}
                />
                <GameControls
                  onClear={handleClear}
                  onHint={handleHint}
                  onSolve={handleSolve}
                  onCheck={handleCheck}
                  onNewPuzzle={handleNewPuzzle}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                  solving={solving}
                />
              </>
            )}
          </div>

          {/* Center Column - Puzzle Board */}
          <div className="lg:col-span-2">
            {puzzle && board.length > 0 ? (
              <div className="space-y-4">
                {solved && (
                  <div className="bg-[#E8F5E9] border border-[#1A1A1A] rounded-sm p-6 text-center shadow-sm">
                    <h2 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      Puzzle Solved!
                    </h2>
                  </div>
                )}
                <PuzzleBoard
                  puzzle={puzzle}
                  board={board}
                  selectedCell={selectedCell}
                  onCellSelect={setSelectedCell}
                  onCellChange={handleCellChange}
                  errors={errors}
                />
              </div>
            ) : (
              <div className="bg-white p-16 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center border border-[#E0E0E0]">
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
                  <div className="space-y-3">
                    <p className="text-[#1A1A1A] text-lg font-medium" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      Select a difficulty level to begin!
                    </p>
                    <p className="text-[#666666] text-sm">
                      Choose from Beginner to Expert
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

export default App;

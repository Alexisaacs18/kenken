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
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              KenKen Puzzle Generator
            </h1>
            <button
              onClick={() => setShowTutorial(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              How to Play
            </button>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Generator and Stats */}
          <div className="space-y-6">
            {!puzzle && (
              <PuzzleGenerator
                onPuzzleGenerated={handlePuzzleGenerated}
                loading={loading}
                setLoading={setLoading}
              />
            )}

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
                  <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
                    <h2 className="text-2xl font-bold text-green-800">
                      🎉 Puzzle Solved! 🎉
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
              <div className="bg-white p-12 rounded-lg shadow-lg text-center">
                <p className="text-gray-600 text-lg">
                  Generate a puzzle to get started!
                </p>
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

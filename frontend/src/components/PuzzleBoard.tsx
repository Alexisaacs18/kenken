import React, { useEffect, useRef } from 'react';
import type { Puzzle, Cage } from '../types';
import { getCageForCell, isCageSatisfied, getRowDuplicates, getColDuplicates } from '../utils/puzzleUtils';

interface PuzzleBoardProps {
  puzzle: Puzzle;
  board: number[][];
  selectedCell: [number, number] | null;
  onCellSelect: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: number) => void;
  errors?: { row: number; col: number; message: string }[];
}

export default function PuzzleBoard({
  puzzle,
  board,
  selectedCell,
  onCellSelect,
  onCellChange,
  errors = [],
}: PuzzleBoardProps) {
  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const size = puzzle.size;

  // Initialize refs array
  useEffect(() => {
    cellRefs.current = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));
  }, [size]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const [row, col] = selectedCell;
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(size - 1, row + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newCol = Math.min(size - 1, col + 1);
          break;
        default:
          return;
      }

      if (newRow !== row || newCol !== col) {
        onCellSelect(newRow, newCol);
        cellRefs.current[newRow]?.[newCol]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, size, onCellSelect]);

  const handleCellFocus = (row: number, col: number) => {
    onCellSelect(row, col);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= size) {
      onCellChange(row, col, numValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      onCellChange(row, col, 0);
    } else if (e.key >= '1' && e.key <= String(size)) {
      onCellChange(row, col, parseInt(e.key));
    }
  };

  // Get cell styling based on state
  const getCellStyle = (row: number, col: number) => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const cage = getCageForCell(puzzle, row, col);
    const hasError = errors.some((e) => e.row === row && e.col === col);
    const rowDupes = getRowDuplicates(board, row, size);
    const colDupes = getColDuplicates(board, col, size);
    const hasRowDup = rowDupes.includes(col);
    const hasColDup = colDupes.includes(row);
    const cageSatisfied = cage ? isCageSatisfied(cage, board) : false;

    let borderClasses = '';
    if (cage) {
      // Determine cage borders - check if adjacent cells are in same cage
      const cageCells = cage.cells.map(([r, c]) => `${r},${c}`);
      const isTop = !cageCells.includes(`${row - 1},${col}`);
      const isBottom = !cageCells.includes(`${row + 1},${col}`);
      const isLeft = !cageCells.includes(`${row},${col - 1}`);
      const isRight = !cageCells.includes(`${row},${col + 1}`);

      if (isTop) borderClasses += ' border-t-2 ';
      if (isBottom) borderClasses += ' border-b-2 ';
      if (isLeft) borderClasses += ' border-l-2 ';
      if (isRight) borderClasses += ' border-r-2 ';

      if (cageSatisfied) {
        borderClasses += ' border-green-500 ';
      } else {
        borderClasses += ' border-gray-400 ';
      }
    }

    const bgColor = hasError || hasRowDup || hasColDup 
      ? 'bg-red-100' 
      : isSelected 
        ? 'bg-blue-50' 
        : 'bg-white';

    return {
      base: `w-full h-full text-center text-lg font-semibold border-2 ${bgColor} ${borderClasses}`,
      hasError: hasError || hasRowDup || hasColDup,
    };
  };

  // Get cage label (target and operator)
  const getCageLabel = (row: number, col: number) => {
    const cage = getCageForCell(puzzle, row, col);
    if (!cage) return null;

    // Find the top-left cell of the cage
    const sortedCells = [...cage.cells].sort(([r1, c1], [r2, c2]) => {
      if (r1 !== r2) return r1 - r2;
      return c1 - c2;
    });
    const [topRow, topCol] = sortedCells[0];

    // Only show label on top-left cell
    if (row === topRow && col === topCol) {
      return `${cage.target}${cage.operator === '=' ? '' : cage.operator}`;
    }

    return null;
  };

  return (
    <div
      className="grid gap-0 mx-auto bg-white p-2 rounded-lg shadow-lg"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        maxWidth: '600px',
        aspectRatio: '1',
      }}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const row = Math.floor(i / size);
        const col = i % size;
        const cellStyle = getCellStyle(row, col);
        const cageLabel = getCageLabel(row, col);
        const value = board[row]?.[col] || 0;

        return (
          <div key={`${row}-${col}`} className="relative">
            {cageLabel && (
              <div className="absolute top-0 left-0 text-xs font-bold text-gray-700 bg-white px-1 z-10">
                {cageLabel}
              </div>
            )}
            <input
              ref={(el) => {
                if (cellRefs.current[row]) {
                  cellRefs.current[row][col] = el;
                }
              }}
              type="text"
              inputMode="numeric"
              value={value || ''}
              onChange={(e) => handleCellChange(row, col, e.target.value)}
              onFocus={() => handleCellFocus(row, col)}
              onKeyDown={(e) => handleKeyPress(e, row, col)}
              className={cellStyle.base}
              maxLength={1}
            />
          </div>
        );
      })}
    </div>
  );
}

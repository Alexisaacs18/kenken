import { useEffect, useRef } from 'react';
import type { Puzzle } from '../types';
import { getCageForCell, getRowDuplicates, getColDuplicates } from '../utils/puzzleUtils';

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
      e.preventDefault();
      onCellChange(row, col, 0);
    } else if (e.key >= '1' && e.key <= String(size)) {
      e.preventDefault();
      onCellChange(row, col, parseInt(e.key));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next empty cell
      for (let r = row; r < size; r++) {
        for (let c = r === row ? col + 1 : 0; c < size; c++) {
          if (!board[r]?.[c] || board[r][c] === 0) {
            onCellSelect(r, c);
            cellRefs.current[r]?.[c]?.focus();
            return;
          }
        }
      }
    }
  };

  // Get cell styling based on state with proper cage border detection
  const getCellStyle = (row: number, col: number) => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const cage = getCageForCell(puzzle, row, col);
    const hasError = errors.some((e) => e.row === row && e.col === col);
    const rowDupes = getRowDuplicates(board, row, size);
    const colDupes = getColDuplicates(board, col, size);
    const hasRowDup = rowDupes.includes(col);
    const hasColDup = colDupes.includes(row);

    // Build border style string
    const borderStyles: string[] = [];
    
    if (cage) {
      const cageCells = cage.cells.map(([r, c]) => `${r},${c}`);
      
      // Check each border
      const topInCage = cageCells.includes(`${row - 1},${col}`);
      const bottomInCage = cageCells.includes(`${row + 1},${col}`);
      const leftInCage = cageCells.includes(`${row},${col - 1}`);
      const rightInCage = cageCells.includes(`${row},${col + 1}`);
      
      // Top border: thick if edge of cage or grid, thin if internal
      if (row === 0 || !topInCage) {
        borderStyles.push('border-t-[3px] border-t-[#1A1A1A]');
      } else {
        borderStyles.push('border-t border-t-gray-300');
      }
      
      // Bottom border
      if (row === size - 1 || !bottomInCage) {
        borderStyles.push('border-b-[3px] border-b-[#1A1A1A]');
      } else {
        borderStyles.push('border-b border-b-gray-300');
      }
      
      // Left border
      if (col === 0 || !leftInCage) {
        borderStyles.push('border-l-[3px] border-l-[#1A1A1A]');
      } else {
        borderStyles.push('border-l border-l-gray-300');
      }
      
      // Right border
      if (col === size - 1 || !rightInCage) {
        borderStyles.push('border-r-[3px] border-r-[#1A1A1A]');
      } else {
        borderStyles.push('border-r border-r-gray-300');
      }
    } else {
      // No cage - use default borders
      borderStyles.push('border border-gray-300');
    }

    const bgColor = hasError || hasRowDup || hasColDup 
      ? 'bg-[#FFE5E5]' 
      : isSelected 
        ? 'bg-[#E3F2FD]' 
        : 'bg-white';
    
    // Add blue border for selected cell
    const selectedBorder = isSelected ? 'ring-2 ring-[#2196F3] ring-offset-1' : '';

    return {
      base: `w-full h-full text-center font-medium ${bgColor} ${borderStyles.join(' ')} ${selectedBorder} focus:outline-none focus:ring-0`,
      hasError: hasError || hasRowDup || hasColDup,
    };
  };

  // Get cage label (target and operator) - NYT style
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
      const operator = cage.operator === '=' ? '' : cage.operator;
      return { target: cage.target, operator };
    }

    return null;
  };

  // Responsive grid - uses CSS Grid with 1fr for flexible sizing
  return (
    <div
      className="puzzle-grid mx-auto bg-white rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        aspectRatio: '1 / 1',
        maxWidth: 'min(95vw, 600px)',
        width: '100%',
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
              <div className="cage-label absolute top-0.5 left-0.5 font-medium text-[#1A1A1A] leading-tight z-10 pointer-events-none">
                <div className="flex items-baseline gap-0.5">
                  <span className="cage-target">{cageLabel.target}</span>
                  {cageLabel.operator && (
                    <span className="cage-operator opacity-75">{cageLabel.operator}</span>
                  )}
                </div>
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
              className={`${cellStyle.base} text-[#1A1A1A] placeholder:text-gray-300 puzzle-cell-input`}
              maxLength={1}
              style={{
                fontFamily: "'Lora', Georgia, serif",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

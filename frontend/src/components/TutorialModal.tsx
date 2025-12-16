interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E0E0E0]">
        <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            How to Solve Puzzalo Puzzles
          </h2>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#1A1A1A] text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 text-[#1A1A1A] space-y-6" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              If you like Sudoku, there's a good chance you'll love Puzzalo. If you hate Sudoku, there's a good chance you'll love Puzzalo. Invented by Japanese mathematics teacher Tetsuya Miyamoto in 2004, this elegant and rich logic puzzle has a few easy-to-understand rules, which helps explain why it's been called "The most addictive puzzle since Sudoku."
            </p>

            <div>
              <h3 className="font-semibold text-lg mb-3">Puzzalo's rules are straightforward:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Fill in each square cell in the puzzle with a number between 1 and the size of the grid. For example, in a 4×4 grid, use the numbers 1, 2, 3, & 4.</li>
                <li>Use each number exactly once in each row and each column.</li>
                <li>The numbers in each "Cage" (indicated by the heavy lines) must combine — in any order — to produce the cage's target number using the indicated math operation. Numbers may be repeated within a cage as long as rule 2 isn't violated.</li>
                <li>No guessing is required. Each puzzle can be solved completely using only logical deduction. Harder puzzles require more complex deductions.</li>
              </ol>
              <p className="mt-3">
                That's all you need to know. The rest is just logical deduction derived from those rules.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Solving Techniques</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Start with Single-Cell Cages</h4>
                  <p>
                    Each cage contains a target number and most contain an operator. If you see a single-cell cage with just a number and no operator, that cell's value is already determined. These work like givens in Sudoku puzzles. When you see one, fill it in immediately — it's a great starting point!
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Use Row and Column Constraints</h4>
                  <p>
                    Whenever you place a number, it narrows down possibilities for other cells in that row and column. Look for cages where only one combination of numbers can produce the target. For example, in a 4×4 grid, if a cage needs to add up to 7, it must contain 3 and 4 (the only two numbers that add to 7). Once you know which row or column already has one of those numbers, you can determine exactly where the other goes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Work with Multiplication and Division Cages</h4>
                  <p>
                    For multiplication cages, think about the factors. If a cage needs to multiply to 4 in a 4×4 grid, it could be 1×4, 2×2, or 4×1. Use the row and column constraints to narrow down which combination works. Division cages work similarly — think about which pairs of numbers can divide to give the target.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Remember Cage Shapes</h4>
                  <p>
                    A cage can repeat numbers as long as they're not in the same row or column. For irregularly shaped cages, remember that the same number can appear multiple times, but never twice in the same row or column. This can help you eliminate possibilities.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Use Process of Elimination</h4>
                  <p>
                    When you're stuck, look at what numbers are already placed in a row or column. This eliminates those numbers from other cells in that row or column. Combine this with the cage constraints to narrow down possibilities. Sometimes you can determine that a cell must be a certain number because all other options are eliminated.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Work Systematically</h4>
                  <p>
                    Start with the easiest deductions first — single-cell cages, then small addition cages, then work your way to more complex operations. As you fill in more numbers, new possibilities will open up. Don't be afraid to work on multiple areas of the puzzle simultaneously, as progress in one area often helps with another.
                  </p>
                </div>

                <p className="mt-4 text-sm text-[#666666]">
                  Remember: every puzzle can be solved using pure logic. If you find yourself guessing, take a step back and look for constraints you might have missed. With practice, you'll develop an intuition for spotting these patterns!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E0E0E0] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">How to Play KenKen</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg mb-2">Objective</h3>
            <p>
              Fill the grid with numbers 1 through N (where N is the grid size) 
              so that each number appears exactly once in each row and column.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Cages</h3>
            <p>
              The grid is divided into cages (outlined with heavy borders). Each cage 
              has a target number and an operation (+, -, ×, ÷, or =).
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>+</strong>: Numbers in the cage must add up to the target</li>
              <li><strong>-</strong>: The difference between the two numbers equals the target</li>
              <li><strong>×</strong>: Numbers in the cage must multiply to the target</li>
              <li><strong>÷</strong>: One number divided by the other equals the target</li>
              <li><strong>=</strong>: Single-cell cage - the number equals the target</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Rules</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>No number can repeat in any row or column</li>
              <li>All cells in a cage must satisfy the cage's operation and target</li>
              <li>Numbers must be between 1 and N (grid size)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Start with single-cell cages (=) - they're already solved!</li>
              <li>Look for cages with small targets - they have fewer possibilities</li>
              <li>Use the row/column uniqueness rule to eliminate possibilities</li>
              <li>Red highlighting shows duplicate numbers or constraint violations</li>
              <li>Green borders indicate satisfied cages</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

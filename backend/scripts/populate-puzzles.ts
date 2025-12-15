/**
 * Script to populate D1 database with precomputed KenKen puzzles
 * Run with: npx tsx scripts/populate-puzzles.ts
 */

import { generate, solve, cliquesToCages } from '../src/kenken';

// Map puzzle size to difficulty label
function getDifficultyFromSize(size: number): string {
  const difficultyMap: { [key: number]: string } = {
    3: 'Beginner',
    4: 'Easy',
    5: 'Medium',
    6: 'Intermediate',
    7: 'Challenging',
    8: 'Hard',
    9: 'Expert',
  };
  return difficultyMap[size] || `Size${size}`;
}

// Generate and format a puzzle
function generatePuzzle(size: number, seed?: string) {
  console.log(`Generating ${size}x${size} puzzle...`);
  
  // Generate puzzle
  const [puzzleSize, cliques] = generate(size, seed);
  
  // Solve to get solution
  const solutionResult = solve(puzzleSize, cliques);
  
  if (!solutionResult) {
    throw new Error(`Failed to solve generated ${size}x${size} puzzle`);
  }
  
  // Convert to frontend format
  const cages = cliquesToCages(cliques);
  
  return {
    puzzle: {
      size: puzzleSize,
      cages,
      solution: solutionResult.solution,
    },
    stats: {
      algorithm: 'FC+MRV',
      constraint_checks: solutionResult.checks,
      assignments: solutionResult.assigns,
      completion_time: solutionResult.time,
    },
  };
}

// Main function to populate puzzles
async function populatePuzzles() {
  const sizes = [5, 6, 7, 8, 9]; // Sizes that need to be precomputed
  
  console.log('Starting puzzle population...\n');
  
  for (const size of sizes) {
    const difficulty = getDifficultyFromSize(size);
    console.log(`\n=== Processing ${size}x${size} (${difficulty}) ===`);
    
    try {
      // Generate puzzle (use a consistent seed for reproducibility)
      const seed = `puzzle-${size}-${difficulty}`;
      const puzzleData = generatePuzzle(size, seed);
      
      // Format for storage
      const dataToStore = JSON.stringify(puzzleData);
      
      // Create SQL insert statement
      const sql = `
        INSERT OR REPLACE INTO puzzles (size, difficulty, data)
        VALUES (${size}, '${difficulty}', '${dataToStore.replace(/'/g, "''")}')
      `;
      
      console.log(`Generated puzzle successfully!`);
      console.log(`  Cages: ${puzzleData.puzzle.cages.length}`);
      console.log(`  Solution checks: ${puzzleData.stats.constraint_checks}`);
      console.log(`  Time: ${puzzleData.stats.completion_time.toFixed(2)}s`);
      console.log(`\nSQL to execute:`);
      console.log(sql);
      console.log(`\nTo insert this puzzle, run:`);
      console.log(`npx wrangler d1 execute puzzalo --remote --command="${sql.replace(/"/g, '\\"')}"`);
      
    } catch (error) {
      console.error(`Error generating ${size}x${size} puzzle:`, error);
    }
  }
  
  console.log('\n=== Population complete ===');
  console.log('\nTo insert all puzzles, copy and run the SQL commands above,');
  console.log('or use the interactive script to insert them automatically.');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populatePuzzles().catch(console.error);
}

export { populatePuzzles, generatePuzzle };


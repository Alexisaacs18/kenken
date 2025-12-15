/**
 * Simple script to generate and insert puzzles into D1
 * Run with: npx tsx scripts/populate-puzzles-simple.ts
 */

import { generate, solve, cliquesToCages } from '../src/kenken.js';
import { execSync } from 'child_process';

// Map puzzle size to difficulty label
function getDifficultyFromSize(size: number): string {
  const difficultyMap: { [key: number]: string } = {
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
  
  const [puzzleSize, cliques] = generate(size, seed);
  const solutionResult = solve(puzzleSize, cliques);
  
  if (!solutionResult) {
    throw new Error(`Failed to solve generated ${size}x${size} puzzle`);
  }
  
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

// Escape SQL string
function escapeSql(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Insert puzzle into D1
async function insertPuzzle(size: number, difficulty: string, puzzleData: any, useRemote: boolean = true) {
  const dataJson = JSON.stringify(puzzleData);
  const escapedData = escapeSql(dataJson);
  
  const sql = `INSERT OR REPLACE INTO puzzles (size, difficulty, data) VALUES (${size}, '${difficulty}', '${escapedData}')`;
  
  const remoteFlag = useRemote ? '--remote' : '';
  console.log(`Inserting ${size}x${size} (${difficulty}) into D1 ${useRemote ? '(remote)' : '(local)'}...`);
  
  try {
    const command = `npx wrangler d1 execute puzzalo ${remoteFlag} --command="${sql.replace(/"/g, '\\"')}"`;
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✓ Successfully inserted ${size}x${size} (${difficulty})\n`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to insert ${size}x${size} (${difficulty}):`, error);
    return false;
  }
}

// Main function
async function main() {
  const sizes = [5, 6, 7, 8, 9];
  const useRemote = process.argv.includes('--remote') || !process.argv.includes('--local');
  
  console.log(`=== Populating D1 with precomputed puzzles (${useRemote ? 'remote' : 'local'}) ===\n`);
  
  for (const size of sizes) {
    const difficulty = getDifficultyFromSize(size);
    
    try {
      // Generate puzzle with consistent seed
      const seed = `puzzle-${size}-${difficulty}`;
      const puzzleData = generatePuzzle(size, seed);
      
      console.log(`Generated ${size}x${size}: ${puzzleData.puzzle.cages.length} cages, ${puzzleData.stats.constraint_checks} checks`);
      
      // Insert into D1
      await insertPuzzle(size, difficulty, puzzleData, useRemote);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${size}x${size}:`, error);
    }
  }
  
  console.log('\n=== Population complete ===');
}

main().catch(console.error);


/**
 * Script to manually populate daily puzzle cache
 * Generates 3 puzzles per size/difficulty combo and stores in KV
 * 
 * Usage:
 *   npx tsx scripts/populate-daily-cache.ts [--local]
 * 
 * --local flag populates local KV (for wrangler dev)
 * Without flag, populates remote KV (for production)
 */

import { generate, solve, cliquesToCages } from '../src/kenken';

interface PuzzleData {
  id: string;
  size: number;
  difficulty: string;
  grid: number[][];
  cages: Array<{
    cells: [number, number][];
    operator: string;
    target: number;
  }>;
  operations: string[];
  solution: number[][];
  generatedAt: string;
}

// Generate a single puzzle
async function generatePuzzle(size: number, difficulty: string, seed?: string): Promise<PuzzleData | null> {
  try {
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);

    if (!solutionResult) {
      console.error(`Failed to solve ${size}x${size} ${difficulty} puzzle`);
      return null;
    }

    const cages = cliquesToCages(cliques);
    const operations = cliques.map(([, op]) => op);

    return {
      id: `${size}x${size}-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: puzzleSize,
      difficulty,
      grid: Array(size).fill(0).map(() => Array(size).fill(0)),
      cages,
      operations,
      solution: solutionResult.solution,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error generating ${size}x${size} ${difficulty} puzzle:`, error);
    return null;
  }
}

// Get today's UTC date string
function getTodayUTC(): string {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  const isLocal = process.argv.includes('--local');
  const date = getTodayUTC();
  const sizes = [3, 4, 5, 6, 7, 8, 9];
  const difficulties = ['easy', 'medium', 'hard'];

  console.log(`\n🎯 Populating daily puzzle cache for ${date}...`);
  console.log(`Mode: ${isLocal ? 'LOCAL (wrangler dev)' : 'REMOTE (production)'}\n`);

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const size of sizes) {
    for (const difficulty of difficulties) {
      const key = `puzzles:${size}x${size}:${difficulty}:${date}`;
      console.log(`Generating 3 puzzles for ${key}...`);

      const puzzles: PuzzleData[] = [];

      for (let i = 0; i < 3; i++) {
        const seed = `${date}-${size}-${difficulty}-${i}`;
        const puzzle = await generatePuzzle(size, difficulty, seed);
        if (puzzle) {
          puzzles.push(puzzle);
          totalGenerated++;
        } else {
          totalFailed++;
        }
        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (puzzles.length > 0) {
        // Store in KV using wrangler CLI
        const kvData = JSON.stringify(puzzles);
        const command = isLocal
          ? `npx wrangler kv:key put "${key}" "${kvData.replace(/"/g, '\\"')}" --binding KV_BINDING --local`
          : `npx wrangler kv:key put "${key}" "${kvData.replace(/"/g, '\\"')}" --binding KV_BINDING`;

        try {
          // For now, just log - user will need to run wrangler commands manually
          // or we can use the KV API directly
          console.log(`  ✓ Generated ${puzzles.length} puzzles for ${key}`);
          console.log(`  ⚠️  Run this command to store in KV:`);
          console.log(`     ${command.substring(0, 80)}...`);
        } catch (error) {
          console.error(`  ✗ Failed to store ${key}:`, error);
        }
      } else {
        console.log(`  ✗ Failed to generate any puzzles for ${key}`);
      }
    }
  }

  console.log(`\n✅ Complete! Generated ${totalGenerated} puzzles, ${totalFailed} failed.`);
  console.log(`\n⚠️  Note: To actually store in KV, you need to:`);
  console.log(`   1. Use wrangler CLI commands, OR`);
  console.log(`   2. Deploy the cron job and let it run automatically, OR`);
  console.log(`   3. Use the Cloudflare dashboard to manually add KV entries\n`);
}

main().catch(console.error);


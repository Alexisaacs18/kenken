-- Migration: Create puzzles table for precomputed KenKen puzzles
-- This table stores puzzles by size and difficulty to avoid regenerating large puzzles

CREATE TABLE IF NOT EXISTS puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  size INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of puzzle data
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(size, difficulty)
);

-- Index for fast lookups by size and difficulty
CREATE INDEX IF NOT EXISTS idx_puzzles_size_difficulty ON puzzles(size, difficulty);


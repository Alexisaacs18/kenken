# KenKen Puzzle Generator Frontend

Modern, interactive web frontend for the KenKen puzzle generator and solver.

## Tech Stack

- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **Vite** for build setup

## Features

### 1. Puzzle Generation Interface
- Size selector (3x3 through 9x9 grids)
- Algorithm selector with 6 CSP algorithms:
  - BT (Backtracking)
  - BT+MRV (Backtracking with Minimum Remaining Values)
  - FC (Forward Checking)
  - FC+MRV (Forward Checking with MRV)
  - MAC (Maintaining Arc Consistency)
  - MIN_CONFLICTS (Min Conflicts Algorithm)
- Algorithm benchmarking stats display

### 2. Interactive Puzzle Board
- Responsive NxN grid
- Cell input validation
- Keyboard navigation (arrow keys)
- Cage visualization with borders
- Visual feedback for errors and satisfied cages

### 3. Game Controls
- Clear Board
- Hint (fills one correct cell)
- Solve (auto-solves using selected algorithm)
- Check Solution
- New Puzzle
- Undo/Redo functionality

### 4. Statistics
- Time elapsed
- Moves made
- Hints used
- Algorithm performance metrics

## Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### Build

```bash
npm run build
```

## Backend Integration

The frontend expects a backend API running on `http://localhost:5001` (or set `VITE_API_URL`).

### Required API Endpoints

- `POST /api/generate` - Generate puzzle
- `POST /api/solve` - Solve puzzle
- `POST /api/validate` - Validate board state

See `src/api.ts` for request/response formats.

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:5001
```

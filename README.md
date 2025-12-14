# KenKen Puzzle Generator - Full Stack

Complete KenKen puzzle generator and solver with React frontend and Python backend.

## Project Structure

```
kenken/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── PuzzleBoard.tsx
│   │   │   ├── PuzzleGenerator.tsx
│   │   │   ├── GameControls.tsx
│   │   │   ├── GameStats.tsx
│   │   │   ├── BenchmarkStats.tsx
│   │   │   └── TutorialModal.tsx
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/           # Flask API wrapper
│   ├── api.py         # Flask REST API
│   └── requirements.txt
└── src/               # Python KenKen solver (existing)
    ├── kenken.py
    ├── csp.py
    └── ...
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python api.py
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

### Core Features
- ✅ Interactive puzzle board with visual feedback
- ✅ Multiple CSP algorithm support (6 algorithms)
- ✅ Real-time validation with error highlighting
- ✅ Undo/Redo functionality
- ✅ Statistics tracking (time, moves, hints)
- ✅ Algorithm benchmarking display
- ✅ Dark mode support
- ✅ Tutorial/How to Play modal

### Puzzle Generation
- Size selector (3x3 through 9x9)
- Algorithm selector with 6 options
- Benchmark stats display (constraint checks, assignments, time)

### Interactive Board
- Responsive NxN grid
- Cell input validation
- Keyboard navigation (arrow keys)
- Cage visualization with borders
- Visual feedback:
  - Red highlighting for errors/duplicates
  - Green borders for satisfied cages
  - Blue highlight for selected cell

### Game Controls
- Clear Board
- Hint (fills one correct cell)
- Solve (auto-solves using selected algorithm)
- Check Solution
- New Puzzle
- Undo/Redo

## API Integration

The frontend expects the backend API at `http://localhost:5000` (or set `VITE_API_URL`).

See `backend/README.md` for API documentation.

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
python api.py
```

### Building for Production
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

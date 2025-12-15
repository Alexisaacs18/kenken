# KenKen Python API

Flask API wrapper for the KenKen puzzle generator and solver.

## Setup

```bash
pip install -r requirements.txt
python api.py
```

The API will run on `http://localhost:5001` by default (or specify a port as an argument).

## API Endpoints

### POST /api/generate
Generate a new KenKen puzzle.

**Request:**
```json
{
  "size": 4,
  "algorithm": "FC+MRV",
  "seed": "2025-12-14"  // Optional: for deterministic daily puzzles
}
```

**Response:**
```json
{
  "puzzle": {
    "size": 4,
    "cages": [
      {
        "cells": [[0, 0], [0, 1]],
        "operator": "+",
        "target": 7
      }
    ],
    "solution": [[1, 2, 3, 4], ...]
  },
  "stats": {
    "algorithm": "FC+MRV",
    "constraint_checks": 1234,
    "assignments": 567,
    "completion_time": 0.123
  }
}
```

### POST /api/solve
Solve an existing puzzle.

**Request:**
```json
{
  "puzzle": { ... },
  "algorithm": "FC+MRV"
}
```

**Response:**
```json
{
  "solution": [[1, 2, 3, 4], ...],
  "stats": { ... }
}
```

### POST /api/validate
Validate the current board state.

**Request:**
```json
{
  "puzzle": { ... },
  "board": [[1, 2, 0, 0], ...]
}
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "row": 0,
      "col": 1,
      "message": "Duplicate 2 in row"
    }
  ]
}
```

### GET /api/health
Health check endpoint.

## Algorithms Supported

- `BT` - Backtracking
- `BT+MRV` - Backtracking with Minimum Remaining Values
- `FC` - Forward Checking
- `FC+MRV` - Forward Checking with MRV
- `MAC` - Maintaining Arc Consistency
- `MIN_CONFLICTS` - Min Conflicts Algorithm

## Testing

Run the test script:
```bash
python test_api.py
```

Make sure the API is running on `http://localhost:5001` before running tests.

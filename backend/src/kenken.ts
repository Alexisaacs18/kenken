/**
 * KenKen puzzle generation and solving logic (TypeScript port)
 */

export type Operator = '+' | '-' | '*' | '/' | '=';
export type Cell = [number, number]; // [row, col] 1-indexed
export type Clique = [Cell[], Operator, number]; // [members, operator, target]

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    this.seed = Math.abs(hash) || 1;
  }

  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Helper functions
function adjacent(xy1: Cell, xy2: Cell): boolean {
  const [x1, y1] = xy1;
  const [x2, y2] = xy2;
  const dx = x1 - x2;
  const dy = y1 - y2;
  return (dx === 0 && Math.abs(dy) === 1) || (dy === 0 && Math.abs(dx) === 1);
}

function operation(op: Operator): (a: number, b: number) => number {
  switch (op) {
    case '+': return (a, b) => a + b;
    case '-': return (a, b) => a - b;
    case '*': return (a, b) => a * b;
    case '/': return (a, b) => a / b;
    default: return (a, b) => a;
  }
}

function rowXorCol(xy1: Cell, xy2: Cell): boolean {
  return (xy1[0] === xy2[0]) !== (xy1[1] === xy2[1]);
}

function conflicting(A: Cell[], a: number[], B: Cell[], b: number[]): boolean {
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B.length; j++) {
      const mA = A[i];
      const mB = B[j];
      const ma = a[i];
      const mb = b[j];
      if (rowXorCol(mA, mB) && ma === mb) {
        return true;
      }
    }
  }
  return false;
}

// Generate cartesian product
function product<T>(arr: T[], repeat: number): T[][] {
  if (repeat === 0) return [[]];
  const result: T[][] = [];
  for (const item of arr) {
    for (const rest of product(arr, repeat - 1)) {
      result.push([item, ...rest]);
    }
  }
  return result;
}

// Generate permutations
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

function satisfies(values: number[], op: Operator, target: number): boolean {
  const opFn = operation(op);
  for (const perm of permutations(values)) {
    const result = perm.reduce(opFn);
    if (Math.abs(result - target) < 0.0001) { // Float comparison
      return true;
    }
  }
  return false;
}

function gdomains(size: number, cliques: Clique[]): Map<string, number[][]> {
  const domains = new Map<string, number[][]>();
  const numbers = Array.from({ length: size }, (_, i) => i + 1);

  for (const [members, operator, target] of cliques) {
    const membersKey = JSON.stringify(members);
    const allCombinations = product(numbers, members.length);
    
    const validCombinations = allCombinations.filter(values => {
      // Check no conflicts within the cage
      if (conflicting(members, values, members, values)) {
        return false;
      }
      // Check operation is satisfied
      return satisfies(values, operator, target);
    });

    domains.set(membersKey, validCombinations);
  }

  return domains;
}

function gneighbors(cliques: Clique[]): Map<string, string[]> {
  const neighbors = new Map<string, string[]>();
  
  for (const [members] of cliques) {
    neighbors.set(JSON.stringify(members), []);
  }

  for (const [A] of cliques) {
    for (const [B] of cliques) {
      const aKey = JSON.stringify(A);
      const bKey = JSON.stringify(B);
      
      if (aKey !== bKey && !neighbors.get(aKey)!.includes(bKey)) {
        // Check if they can conflict
        const dummyA = Array(A.length).fill(-1);
        const dummyB = Array(B.length).fill(-1);
        if (conflicting(A, dummyA, B, dummyB)) {
          neighbors.get(aKey)!.push(bKey);
          neighbors.get(bKey)!.push(aKey);
        }
      }
    }
  }

  return neighbors;
}

// Simple backtracking solver with statistics tracking
function backtrackingSearch(
  variables: string[],
  domains: Map<string, number[][]>,
  neighbors: Map<string, string[]>,
  constraint: (varA: string, valA: number[], varB: string, valB: number[]) => boolean
): { assignment: Map<string, number[]> | null; checks: number; assigns: number } {
  const assignment = new Map<string, number[]>();
  let checks = 0;
  let assigns = 0;

  function isConsistent(varA: string, valA: number[]): boolean {
    for (const varB of neighbors.get(varA) || []) {
      const valB = assignment.get(varB);
      if (valB) {
        checks++;
        if (!constraint(varA, valA, varB, valB)) {
          return false;
        }
      }
    }
    return true;
  }

  function search(): boolean {
    if (assignment.size === variables.length) {
      return true; // All variables assigned
    }

    // Select unassigned variable (simple: first unassigned)
    const unassigned = variables.find(v => !assignment.has(v));
    if (!unassigned) return true;

    // Try each value in domain
    const domain = domains.get(unassigned) || [];
    for (const value of domain) {
      if (isConsistent(unassigned, value)) {
        assignment.set(unassigned, value);
        assigns++;
        if (search()) {
          return true;
        }
        assignment.delete(unassigned);
      }
    }
    return false;
  }

  const success = search();
  return {
    assignment: success ? assignment : null,
    checks,
    assigns,
  };
}

export function generate(size: number, seed?: string): [number, Clique[]] {
  const rng = seed ? new SeededRandom(seed) : new SeededRandom(Date.now().toString());

  // Create initial Latin square
  let board: number[][] = [];
  for (let j = 0; j < size; j++) {
    const row: number[] = [];
    for (let i = 0; i < size; i++) {
      row.push(((i + j) % size) + 1);
    }
    board.push(row);
  }

  // Shuffle rows
  for (let _ = 0; _ < size; _++) {
    board = rng.shuffle(board);
  }

  // Randomly swap columns
  for (let c1 = 0; c1 < size; c1++) {
    for (let c2 = 0; c2 < size; c2++) {
      if (rng.random() > 0.5) {
        for (let r = 0; r < size; r++) {
          [board[r][c1], board[r][c2]] = [board[r][c2], board[r][c1]];
        }
      }
    }
  }

  // Convert to 1-indexed map
  const boardMap = new Map<string, number>();
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      boardMap.set(JSON.stringify([j + 1, i + 1]), board[i][j]);
    }
  }

  // Create cliques
  const uncaged: Cell[] = [];
  for (let i = 1; i <= size; i++) {
    for (let j = 1; j <= size; j++) {
      uncaged.push([j, i]);
    }
  }
  uncaged.sort((a, b) => a[1] - b[1] || a[0] - b[0]);

  const cliques: Clique[] = [];

  while (uncaged.length > 0) {
    const clique: Cell[] = [];
    const csize = rng.randint(1, 4);
    
    let cell = uncaged[0];
    uncaged.splice(0, 1);
    clique.push(cell);

    for (let _ = 0; _ < csize - 1; _++) {
      const adjs = uncaged.filter(other => adjacent(cell, other));
      if (adjs.length === 0) break;
      cell = rng.choice(adjs);
      const idx = uncaged.findIndex(c => c[0] === cell[0] && c[1] === cell[1]);
      uncaged.splice(idx, 1);
      clique.push(cell);
    }

    const actualSize = clique.length;
    let operator: Operator;
    let target: number;

    if (actualSize === 1) {
      const cell = clique[0];
      const value = boardMap.get(JSON.stringify(cell))!;
      cliques.push([clique, '=', value]);
      continue;
    } else if (actualSize === 2) {
      const [fst, snd] = clique;
      const val1 = boardMap.get(JSON.stringify(fst))!;
      const val2 = boardMap.get(JSON.stringify(snd))!;
      if (val1 / val2 > 0 && val1 % val2 === 0) {
        operator = '/';
        target = val1 / val2;
      } else {
        operator = '-';
        target = Math.abs(val1 - val2);
      }
    } else {
      operator = rng.choice(['+', '*']);
      const values = clique.map(c => boardMap.get(JSON.stringify(c))!);
      const opFn = operation(operator);
      target = values.reduce(opFn);
    }

    cliques.push([clique, operator, Math.floor(target)]);
  }

  return [size, cliques];
}

export function solve(size: number, cliques: Clique[]): {
  solution: number[][];
  checks: number;
  assigns: number;
  time: number;
} | null {
  const startTime = Date.now();

  const variables = cliques.map(([members]) => JSON.stringify(members));
  const domains = gdomains(size, cliques);
  const neighbors = gneighbors(cliques);

  // Create constraint function
  const constraint = (varA: string, valA: number[], varB: string, valB: number[]): boolean => {
    if (varA === varB) return true;
    const membersA: Cell[] = JSON.parse(varA);
    const membersB: Cell[] = JSON.parse(varB);
    return !conflicting(membersA, valA, membersB, valB);
  };

  const result = backtrackingSearch(variables, domains, neighbors, constraint);
  
  if (!result.assignment) {
    return null;
  }

  // Convert assignment to board
  const board: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  for (const [members] of cliques) {
    const membersKey = JSON.stringify(members);
    const values = result.assignment.get(membersKey);
    if (values) {
      for (let i = 0; i < members.length; i++) {
        const [row, col] = members[i];
        board[row - 1][col - 1] = values[i];
      }
    }
  }

  const endTime = Date.now();
  return {
    solution: board,
    checks: result.checks,
    assigns: result.assigns,
    time: (endTime - startTime) / 1000,
  };
}

export function cliquesToCages(cliques: Clique[]) {
  return cliques.map(([members, operator, target]) => ({
    cells: members.map(([row, col]) => [row - 1, col - 1]) as [number, number][],
    operator: (operator === '.' ? '=' : operator) as Operator,
    target,
  }));
}

import { RNG } from '../utils/rng';

export interface SlidingPuzzleData {
  grid: number[]; // 1D representation
  rows: number;
  cols: number;
  emptyIdx: number;
}

export class SlidingPuzzleEngine {
  static generate(rows: number, cols: number, seed: number): SlidingPuzzleData {
    // Deterministic seed mixing
    const mixedSeed = seed + rows * 31 + cols * 17;
    const rng = new RNG(mixedSeed);
    const total = rows * cols;
    
    let grid: number[] = [];
    let solvable = false;
    let attempts = 0;

    while (!solvable && attempts < 100) {
      attempts++;
      // Fisher-Yates Shuffle
      grid = Array.from({ length: total }, (_, i) => i);
      for (let i = total - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        [grid[i], grid[j]] = [grid[j], grid[i]];
      }

      solvable = this.isSolvable(grid, rows, cols);
      
      // If not solvable, we can just swap two non-zero tiles to flip parity
      if (!solvable) {
        let idx1 = -1, idx2 = -1;
        for (let i = 0; i < total; i++) {
          if (grid[i] !== 0) {
            if (idx1 === -1) idx1 = i;
            else if (idx2 === -1) { idx2 = i; break; }
          }
        }
        if (idx1 !== -1 && idx2 !== -1) {
          [grid[idx1], grid[idx2]] = [grid[idx2], grid[idx1]];
          solvable = true;
        }
      }
    }
    
    const emptyIdx = grid.indexOf(0);
    return { grid, rows, cols, emptyIdx };
  }

  static isSolvable(grid: number[], rows: number, cols: number): boolean {
    let inversions = 0;
    const total = grid.length;
    const flat = grid.filter(x => x !== 0);
    
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) inversions++;
      }
    }

    if (cols % 2 !== 0) {
      return inversions % 2 === 0;
    } else {
      const emptyIdx = grid.indexOf(0);
      const emptyRow = Math.floor(emptyIdx / cols);
      const blankRowFromBottom = rows - 1 - emptyRow; // 0-indexed from bottom
      // With 0-indexing, goal state (blank at bottom) has blankRowFromBottom = 0
      // inversions = 0, so (0 + 0) % 2 === 0.
      return (inversions + blankRowFromBottom) % 2 === 0;
    }
  }

  static isSolved(grid: number[]): boolean {
    const total = grid.length;
    // Goal state: [1, 2, 3, ..., total-1, 0]
    for (let i = 0; i < total - 1; i++) {
      if (grid[i] !== i + 1) return false;
    }
    return grid[total - 1] === 0;
  }
}

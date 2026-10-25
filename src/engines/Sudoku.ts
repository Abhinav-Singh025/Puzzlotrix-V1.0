import { RNG } from '../utils/rng';

export class SudokuEngine {
  static generate(size: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', rng: RNG) {
    const n = size * size;
    const grid = Array.from({ length: n }, () => Array(n).fill(0));
    
    // Fast generation using shifting rows
    const base = Array.from({ length: n }, (_, i) => i + 1);
    const shuffledBase = rng.shuffle([...base]);
    
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Shifting formula to ensure valid Sudoku constraints
        const valIdx = (r * size + Math.floor(r / size) + c) % n;
        grid[r][c] = shuffledBase[valIdx];
      }
    }

    // Shuffle rows within each box
    for (let b = 0; b < size; b++) {
      const start = b * size;
      const rows = grid.slice(start, start + size);
      const shuffledRows = rng.shuffle(rows);
      for (let i = 0; i < size; i++) {
        grid[start + i] = shuffledRows[i];
      }
    }

    // Shuffle columns within each box
    for (let b = 0; b < size; b++) {
      const start = b * size;
      const colIndices = Array.from({ length: size }, (_, i) => start + i);
      const shuffledIndices = rng.shuffle(colIndices);
      
      const tempGrid = grid.map(row => [...row]);
      for (let r = 0; r < n; r++) {
        for (let i = 0; i < size; i++) {
          grid[r][start + i] = tempGrid[r][shuffledIndices[i]];
        }
      }
    }
    
    const solution = grid.map(row => [...row]);
    
    const removalCounts: Record<string, number> = {
      easy: 0.35,
      medium: 0.5,
      hard: 0.6,
      expert: 0.7
    };
    
    const ratio = removalCounts[difficulty] || 0.5;
    const totalCells = n * n;
    let toRemove = Math.floor(totalCells * ratio);

    // Randomly remove cells
    const cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        cells.push({ r, c });
      }
    }
    const shuffledCells = rng.shuffle(cells);

    for (let i = 0; i < toRemove; i++) {
      const { r, c } = shuffledCells[i];
      grid[r][c] = 0;
    }

    return { grid, solution };
  }

  private static fillGrid(grid: number[][], size: number, rng: RNG): boolean {
    const n = size * size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 0) {
          const nums = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1));
          for (const num of nums) {
            if (this.isValid(grid, r, c, num, size)) {
              grid[r][c] = num;
              if (this.fillGrid(grid, size, rng)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  static isValid(grid: number[][], r: number, c: number, num: number, size: number): boolean {
    const n = size * size;
    // Row
    for (let i = 0; i < n; i++) if (grid[r][i] === num) return false;
    // Col
    for (let i = 0; i < n; i++) if (grid[i][c] === num) return false;
    // Box
    const startR = Math.floor(r / size) * size;
    const startC = Math.floor(c / size) * size;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[startR + i][startC + j] === num) return false;
      }
    }
    return true;
  }
}

import { RNG } from '../utils/rng';

export interface MinesweeperData {
  grid: number[][]; // -1: mine, 0-8: neighbor count
  revealed: boolean[][];
  flagged: boolean[][];
}

export class MinesweeperEngine {
  static generate(size: number, seed: number): MinesweeperData {
    const rng = new RNG(seed);
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    const mineCount = Math.floor(size * size * 0.15); // 15% mines
    
    let placed = 0;
    while (placed < mineCount) {
      const r = rng.nextInt(0, size - 1);
      const c = rng.nextInt(0, size - 1);
      if (grid[r][c] !== -1) {
        grid[r][c] = -1;
        placed++;
      }
    }
    
    // Calculate numbers
    this.calculateNumbers(grid, size);
    
    return {
      grid,
      revealed: Array.from({ length: size }, () => Array(size).fill(false)),
      flagged: Array.from({ length: size }, () => Array(size).fill(false))
    };
  }

  static calculateNumbers(grid: number[][], size: number) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
              count++;
            }
          }
        }
        grid[r][c] = count;
      }
    }
  }
}

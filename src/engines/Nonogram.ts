import { RNG } from '../utils/rng';

export class NonogramEngine {
  static generate(size: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', rng: RNG) {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    
    // Adjust density based on difficulty
    const densities: Record<string, number> = {
      easy: 0.4,
      medium: 0.55,
      hard: 0.7,
      expert: 0.8
    };
    const density = densities[difficulty] || 0.5;

    let filled = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (rng.next() < density) {
          grid[r][c] = 1;
          filled++;
        }
      }
    }

    // Ensure at least one cell is filled
    if (filled === 0) {
      grid[rng.nextInt(0, size - 1)][rng.nextInt(0, size - 1)] = 1;
    }

    const rowClues = this.getClues(grid);
    const colClues = this.getClues(this.transpose(grid));

    return { 
      solution: grid, 
      userGrid: Array.from({ length: size }, () => Array(size).fill(0)),
      clues: { rowClues, colClues } 
    };
  }

  private static getClues(grid: number[][]): number[][] {
    return grid.map(row => {
      const clues: number[] = [];
      let count = 0;
      for (const cell of row) {
        if (cell === 1) {
          count++;
        } else if (count > 0) {
          clues.push(count);
          count = 0;
        }
      }
      if (count > 0) clues.push(count);
      return clues.length > 0 ? clues : [0];
    });
  }

  private static transpose(grid: number[][]): number[][] {
    if (!grid || grid.length === 0 || !grid[0]) return [];
    return grid[0].map((_, c) => grid.map(row => row[c]));
  }
}

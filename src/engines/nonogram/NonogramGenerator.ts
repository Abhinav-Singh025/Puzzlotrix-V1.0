import { RNG } from '../../utils/rng';
import { NonogramData } from '../../types';

export class NonogramGenerator {
  static generate(size: number, seed: number): NonogramData {
    const rng = new RNG(seed);
    const solution = Array.from({ length: size }, () => Array(size).fill(0));
    
    // Density between 0.35 and 0.55
    const density = 0.35 + rng.next() * 0.2;
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (rng.next() < density) {
          solution[r][c] = 1;
        }
      }
    }
    
    const rowClues = solution.map(row => this.getClues(row));
    const colClues = Array.from({ length: size }, (_, c) => {
      const col = solution.map(row => row[c]);
      return this.getClues(col);
    });
    
    const userGrid = Array.from({ length: size }, () => Array(size).fill(0));
    
    return { rowClues, colClues, solution, userGrid };
  }

  private static getClues(line: number[]): number[] {
    const clues: number[] = [];
    let count = 0;
    for (const cell of line) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  }
}

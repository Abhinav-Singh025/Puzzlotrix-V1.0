import { RNG } from '../utils/rng';

export class LatinSquareEngine {
  static generate(size: number, seed: number): number[][] {
    const rng = new RNG(seed);
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    
    // For large sizes, use a cyclic shift pattern
    if (size > 50) {
      const firstRow = rng.shuffle(Array.from({ length: size }, (_, i) => i + 1));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          grid[r][c] = firstRow[(c + r) % size];
        }
      }
      return grid;
    }

    // For smaller sizes, we could try to generate more randomly, 
    // but cyclic shift with row/column shuffling is deterministic and fast.
    const base = Array.from({ length: size }, (_, i) => i + 1);
    const rowOrder = rng.shuffle(Array.from({ length: size }, (_, i) => i));
    const colOrder = rng.shuffle(Array.from({ length: size }, (_, i) => i));
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid[rowOrder[r]][colOrder[c]] = base[(r + c) % size];
      }
    }
    
    return grid;
  }
}

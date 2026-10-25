import { RNG } from '../utils/rng';

export class NQueensEngine {
  static generate(size: number, seed: number): number[] {
    const rng = new RNG(seed);
    const grid = Array(size).fill(-1);
    // Place one queen randomly to start
    const col = rng.nextInt(0, size - 1);
    const row = rng.nextInt(0, size - 1);
    grid[col] = row;
    return grid;
  }
}

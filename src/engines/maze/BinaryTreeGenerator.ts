import { RNG } from '../../utils/rng';

export class BinaryTreeGenerator {
  static generate(size: number, rng: RNG): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(1));
    
    for (let r = 0; r < size; r += 2) {
      for (let c = 0; c < size; c += 2) {
        grid[r][c] = 0;
        const neighbors: { r: number; c: number }[] = [];
        if (r > 0) neighbors.push({ r: r - 1, c: c });
        if (c > 0) neighbors.push({ r: r, c: c - 1 });
        
        if (neighbors.length > 0) {
          const neighbor = neighbors[rng.nextInt(0, neighbors.length - 1)];
          grid[neighbor.r][neighbor.c] = 0;
        }
      }
    }
    
    return grid;
  }
}

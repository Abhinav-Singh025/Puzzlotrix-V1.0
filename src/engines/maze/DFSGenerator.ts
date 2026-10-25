import { RNG } from '../../utils/rng';

export class DFSGenerator {
  static generate(size: number, rng: RNG): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(1));
    const stack: { r: number; c: number }[] = [];
    
    // Start at 0,0
    const startR = 0;
    const startC = 0;
    grid[startR][startC] = 0;
    stack.push({ r: startR, c: startC });
    
    const dirs = [
      [0, 2], [0, -2], [2, 0], [-2, 0]
    ];
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors: { r: number; c: number; wr: number; wc: number }[] = [];
      
      for (const [dr, dc] of dirs) {
        const nr = current.r + dr;
        const nc = current.c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
          neighbors.push({ r: nr, c: nc, wr: current.r + dr / 2, wc: current.c + dc / 2 });
        }
      }
      
      if (neighbors.length > 0) {
        const next = neighbors[rng.nextInt(0, neighbors.length - 1)];
        grid[next.wr][next.wc] = 0;
        grid[next.r][next.c] = 0;
        stack.push({ r: next.r, c: next.c });
      } else {
        stack.pop();
      }
    }
    
    return grid;
  }
}

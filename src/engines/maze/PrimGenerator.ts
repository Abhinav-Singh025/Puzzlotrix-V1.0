import { RNG } from '../../utils/rng';

export class PrimGenerator {
  static generate(size: number, rng: RNG): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(1));
    const walls: { r: number; c: number; pr: number; pc: number }[] = [];
    
    const startR = 0;
    const startC = 0;
    grid[startR][startC] = 0;
    
    const addWalls = (r: number, c: number) => {
      const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
          walls.push({ r: nr, c: nc, pr: r, pc: c });
        }
      }
    };
    
    addWalls(startR, startC);
    
    while (walls.length > 0) {
      const idx = rng.nextInt(0, walls.length - 1);
      const { r, c, pr, pc } = walls.splice(idx, 1)[0];
      
      if (grid[r][c] === 1) {
        grid[r][c] = 0;
        grid[pr + (r - pr) / 2][pc + (c - pc) / 2] = 0;
        addWalls(r, c);
      }
    }
    
    return grid;
  }
}

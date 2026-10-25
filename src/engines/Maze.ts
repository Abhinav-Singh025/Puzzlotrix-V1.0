import { RNG } from '../utils/rng';

export class MazeEngine {
  static generate(size: number, rng: RNG) {
    const grid = Array.from({ length: size }, () => Array(size).fill(1)); // 1 is wall, 0 is path
    
    const stack: { r: number; c: number }[] = [];
    const startR = 0;
    const startC = 0;
    
    grid[startR][startC] = 0;
    stack.push({ r: startR, c: startC });
    
    while (stack.length > 0) {
      const { r, c } = stack[stack.length - 1];
      const dirs = rng.shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]]);
      
      let found = false;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
          grid[r + dr / 2][c + dc / 2] = 0;
          grid[nr][nc] = 0;
          stack.push({ r: nr, c: nc });
          found = true;
          break;
        }
      }
      
      if (!found) {
        stack.pop();
      }
    }
    grid[size - 1][size - 1] = 0; // End point
    if (grid[size - 2][size - 1] === 1 && grid[size - 1][size - 2] === 1) {
      grid[size - 2][size - 1] = 0; // Ensure exit is reachable
    }

    return { 
      grid, 
      start: { r: 0, c: 0 }, 
      end: { r: size - 1, c: size - 1 },
      solution: grid 
    };
  }
}

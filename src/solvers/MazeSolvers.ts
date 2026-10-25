import { SolverResult } from './AStarSolver';

export class MazeSolvers {
  static deadEndFilling(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }): SolverResult {
    const startTime = performance.now();
    const rows = grid?.length || 0;
    if (rows === 0 || !grid[0]) return { solution: [], visited: [], stats: { timeMs: 0, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const cols = grid[0].length;
    const tempGrid = grid.map(row => [...row]);
    let iterations = 0;
    let nodesExpanded = 0;
    const visited: { r: number; c: number }[] = [];

    let changed = true;
    while (changed) {
      changed = false;
      iterations++;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tempGrid[r][c] === 0) {
            if ((r === start.r && c === start.c) || (r === end.r && c === end.c)) continue;

            let neighbors = 0;
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dr, dc] of dirs) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && tempGrid[nr][nc] === 0) {
                neighbors++;
              }
            }

            if (neighbors === 1) {
              tempGrid[r][c] = 1;
              visited.push({ r, c });
              nodesExpanded++;
              changed = true;
            }
          }
        }
      }
      if (iterations > 2000) break; 
    }

    // Find ordered path using BFS on the remaining cells
    const path: { r: number; c: number }[] = [];
    const queue: { r: number; c: number; p: { r: number; c: number }[] }[] = [{ ...start, p: [start] }];
    const pathVisited = new Set<string>();
    pathVisited.add(`${start.r},${start.c}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.r === end.r && current.c === end.c) {
        path.push(...current.p);
        break;
      }

      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = current.r + dr;
        const nc = current.c + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && tempGrid[nr][nc] === 0 && !pathVisited.has(key)) {
          pathVisited.add(key);
          queue.push({ r: nr, c: nc, p: [...current.p, { r: nr, c: nc }] });
        }
      }
    }
    
    return {
      solution: path,
      visited,
      stats: { timeMs: performance.now() - startTime, steps: path.length, iterations, depth: 0, nodesExpanded }
    };
  }
}

import { SolverResult } from './AStarSolver';

export class BFSSolver {
  static solveMaze(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }): SolverResult {
    const startTime = performance.now();
    const size = grid?.length || 0;
    if (size === 0 || !grid[0]) return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const queue: { r: number; c: number; path: { r: number; c: number }[] }[] = [{ ...start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.r},${start.c}`);
    
    let iterations = 0;
    let nodesExpanded = 0;
    const visitedNodes: { r: number; c: number }[] = [];

    while (queue.length > 0) {
      iterations++;
      const current = queue.shift()!;
      nodesExpanded++;
      visitedNodes.push({ r: current.r, c: current.c });
      
      if (current.r === end.r && current.c === end.c) {
        return {
          solution: current.path,
          visited: visitedNodes,
          frontier: queue.map(q => ({ r: q.r, c: q.c })),
          stats: { timeMs: performance.now() - startTime, steps: current.path.length, iterations, depth: current.path.length, nodesExpanded, pathLength: current.path.length }
        };
      }
      
      const neighbors = [
        { r: current.r + 1, c: current.c },
        { r: current.r - 1, c: current.c },
        { r: current.r, c: current.c + 1 },
        { r: current.r, c: current.c - 1 }
      ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0 && !visited.has(`${n.r},${n.c}`));
      
      for (const neighbor of neighbors) {
        visited.add(`${neighbor.r},${neighbor.c}`);
        queue.push({ ...neighbor, path: [...current.path, neighbor] });
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  static solveSliding(grid1D: number[], rows: number, cols: number): SolverResult {
    const startTime = performance.now();
    const total = grid1D.length;
    const target = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    const targetStr = target.join(',');
    
    const queue: { flat: number[]; emptyIdx: number; path: number[][] }[] = [
      { flat: [...grid1D], emptyIdx: grid1D.indexOf(0), path: [[...grid1D]] }
    ];
    const visited = new Set<string>();
    visited.add(grid1D.join(','));
    
    let iterations = 0;
    let nodesExpanded = 0;
    while (queue.length > 0) {
      iterations++;
      if (iterations > 1000000) break;
      if (performance.now() - startTime > 30000) break;
      
      const current = queue.shift()!;
      nodesExpanded++;
      
      if (current.flat.join(',') === targetStr) {
        return {
          solution: current.path,
          stats: { timeMs: performance.now() - startTime, steps: current.path.length - 1, iterations, depth: current.path.length, nodesExpanded }
        };
      }
      
      const r = Math.floor(current.emptyIdx / cols);
      const c = current.emptyIdx % cols;
      const moves: number[] = [];
      if (r > 0) moves.push(current.emptyIdx - cols);
      if (r < rows - 1) moves.push(current.emptyIdx + cols);
      if (c > 0) moves.push(current.emptyIdx - 1);
      if (c < cols - 1) moves.push(current.emptyIdx + 1);
      
      for (const nextIdx of moves) {
        const nextFlat = [...current.flat];
        [nextFlat[current.emptyIdx], nextFlat[nextIdx]] = [nextFlat[nextIdx], nextFlat[current.emptyIdx]];
        
        const nextStr = nextFlat.join(',');
        if (!visited.has(nextStr)) {
          visited.add(nextStr);
          queue.push({ flat: nextFlat, emptyIdx: nextIdx, path: [...current.path, nextFlat] });
        }
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static findEmpty(grid: number[][]) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0) return { r, c };
      }
    }
    return { r: 0, c: 0 };
  }

  private static getTarget(size: number): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size * size - 1; i++) {
      grid[Math.floor(i / size)][i % size] = i + 1;
    }
    return grid;
  }
}

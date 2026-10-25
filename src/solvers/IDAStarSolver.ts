import { SolverResult } from './AStarSolver';

export class IDAStarSolver {
  static solveSliding(grid1D: number[], rows: number, cols: number): SolverResult {
    const startTime = performance.now();
    const total = grid1D.length;
    
    const startFlat = [...grid1D];
    const targetFlat = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    const targetStr = targetFlat.join(',');

    const targetPos: { r: number; c: number }[] = Array(total);
    for (let i = 0; i < total; i++) {
      const val = targetFlat[i];
      targetPos[val] = { r: Math.floor(i / cols), c: i % cols };
    }

    const manhattan = (flat: number[]): number => {
      let dist = 0;
      for (let i = 0; i < total; i++) {
        const val = flat[i];
        if (val !== 0) {
          const tPos = targetPos[val];
          dist += Math.abs(Math.floor(i / cols) - tPos.r) + Math.abs((i % cols) - tPos.c);
        }
      }
      return dist;
    };

    let iterations = 0;
    let nodesExpanded = 0;
    const path: number[][] = [startFlat];
    
    const search = (flat: number[], emptyIdx: number, gScore: number, bound: number): number => {
      iterations++;
      nodesExpanded++;
      const h = manhattan(flat);
      const f = gScore + h;
      if (f > bound) return f;
      if (h === 0) return -1;
      
      let min = Infinity;
      const r = Math.floor(emptyIdx / cols);
      const c = emptyIdx % cols;
      
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(emptyIdx - cols);
      if (r < rows - 1) neighbors.push(emptyIdx + cols);
      if (c > 0) neighbors.push(emptyIdx - 1);
      if (c < cols - 1) neighbors.push(emptyIdx + 1);
      
      for (const nextIdx of neighbors) {
        const nextFlat = [...flat];
        [nextFlat[emptyIdx], nextFlat[nextIdx]] = [nextFlat[nextIdx], nextFlat[emptyIdx]];
        
        const nextStr = nextFlat.join(',');
        if (path.some(p => p.join(',') === nextStr)) continue;
        
        path.push(nextFlat);
        const t = search(nextFlat, nextIdx, gScore + 1, bound);
        if (t === -1) return -1;
        if (t < min) min = t;
        path.pop();
      }
      return min;
    };

    let threshold = manhattan(startFlat);
    const startEmptyIdx = startFlat.indexOf(0);

    while (true) {
      if (performance.now() - startTime > 30000) break; // 30s timeout
      const t = search(startFlat, startEmptyIdx, 0, threshold);
      if (t === -1) {
        return {
          solution: path.map(p => [...p]),
          stats: { timeMs: performance.now() - startTime, steps: path.length - 1, iterations, depth: threshold, nodesExpanded }
        };
      }
      if (t === Infinity) break;
      threshold = t;
    }

    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static getTarget(size: number): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size * size - 1; i++) {
      grid[Math.floor(i / size)][i % size] = i + 1;
    }
    return grid;
  }
}

import { SolverResult } from './AStarSolver';

export class DijkstraSolver {
  static solveMaze(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }): SolverResult {
    const startTime = performance.now();
    const size = grid?.length || 0;
    if (size === 0 || !grid[0]) return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const dist = Array.from({ length: size }, () => Array(size).fill(Infinity));
    const parent = new Map<string, { r: number; c: number }>();
    const pq: { r: number; c: number; d: number }[] = [{ ...start, d: 0 }];
    
    dist[start.r][start.c] = 0;
    
    let iterations = 0;
    let nodesExpanded = 0;
    const visitedNodes: { r: number; c: number }[] = [];

    while (pq.length > 0) {
      iterations++;
      pq.sort((a, b) => a.d - b.d);
      const current = pq.shift()!;
      nodesExpanded++;
      visitedNodes.push({ r: current.r, c: current.c });
      
      if (current.r === end.r && current.c === end.c) {
        const path: { r: number; c: number }[] = [];
        let curr: any = end;
        while (curr) {
          path.push(curr);
          curr = parent.get(`${curr.r},${curr.c}`);
        }
        return {
          solution: path.reverse(),
          visited: visitedNodes,
          frontier: pq.map(p => ({ r: p.r, c: p.c })),
          stats: { timeMs: performance.now() - startTime, steps: path.length, iterations, depth: current.d, nodesExpanded, pathLength: path.length }
        };
      }
      
      if (current.d > dist[current.r][current.c]) continue;
      
      const neighbors = [
        { r: current.r + 1, c: current.c },
        { r: current.r - 1, c: current.c },
        { r: current.r, c: current.c + 1 },
        { r: current.r, c: current.c - 1 }
      ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0);
      
      for (const neighbor of neighbors) {
        const d = current.d + 1;
        if (d < dist[neighbor.r][neighbor.c]) {
          dist[neighbor.r][neighbor.c] = d;
          parent.set(`${neighbor.r},${neighbor.c}`, { r: current.r, c: current.c });
          pq.push({ ...neighbor, d });
        }
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }
}

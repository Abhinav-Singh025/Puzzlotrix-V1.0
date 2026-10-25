export interface SolverResult {
  solution: any;
  message?: string;
  visited?: { r: number; c: number }[];
  frontier?: { r: number; c: number }[];
  stats: {
    timeMs: number;
    steps: number;
    iterations: number;
    depth: number;
    nodesExpanded: number;
    pathLength?: number;
  };
}

class PriorityQueue<T> {
  private heap: { priority: number; item: T }[] = [];

  push(item: T, priority: number) {
    this.heap.push({ item, priority });
    this.bubbleUp();
  }

  pop(): T | undefined {
    if (this.size() === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.size() > 0) {
      this.heap[0] = bottom;
      this.bubbleDown();
    }
    return top.item;
  }

  size() {
    return this.heap.length;
  }

  private bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown() {
    let index = 0;
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestIndex = index;

      if (leftChildIndex < this.heap.length && this.heap[leftChildIndex].priority < this.heap[smallestIndex].priority) {
        smallestIndex = leftChildIndex;
      }
      if (rightChildIndex < this.heap.length && this.heap[rightChildIndex].priority < this.heap[smallestIndex].priority) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex === index) break;
      [this.heap[index], this.heap[smallestIndex]] = [this.heap[smallestIndex], this.heap[index]];
      index = smallestIndex;
    }
  }
}

export class AStarSolver {
  static solveMaze(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }, algorithm: string = 'astar-manhattan'): SolverResult {
    const startTime = performance.now();
    const rows = grid?.length || 0;
    if (rows === 0 || !grid[0]) return { solution: [], stats: { timeMs: 0, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const cols = grid[0].length;
    const pq = new PriorityQueue<{ r: number; c: number; g: number; f: number; parent?: any }>();
    const closedSet = new Set<string>();
    
    pq.push({ ...start, g: 0, f: this.heuristic(start, end) }, this.heuristic(start, end));
    
    let iterations = 0;
    let nodesExpanded = 0;
    const visited: { r: number; c: number }[] = [];
    
    while (pq.size() > 0) {
      iterations++;
      if (iterations > 1000000) break;
      
      const current = pq.pop()!;
      nodesExpanded++;
      visited.push({ r: current.r, c: current.c });
      
      if (current.r === end.r && current.c === end.c) {
        const path: { r: number; c: number }[] = [];
        let temp: any = current;
        while (temp) {
          path.push({ r: temp.r, c: temp.c });
          temp = temp.parent;
        }
        return {
          solution: path.reverse(),
          visited,
          frontier: (pq as any).heap.map((h: any) => ({ r: h.item.r, c: h.item.c })),
          stats: { timeMs: performance.now() - startTime, steps: path.length, iterations, depth: current.g, nodesExpanded, pathLength: path.length }
        };
      }
      
      closedSet.add(`${current.r},${current.c}`);
      
      const neighbors = [
        { r: current.r + 1, c: current.c },
        { r: current.r - 1, c: current.c },
        { r: current.r, c: current.c + 1 },
        { r: current.r, c: current.c - 1 }
      ].filter(n => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && grid[n.r][n.c] === 0 && !closedSet.has(`${n.r},${n.c}`));
      
      for (const neighbor of neighbors) {
        const g = current.g + 1;
        const h = this.heuristic(neighbor, end);
        const f = algorithm === 'greedy' ? h : g + h;
        pq.push({ ...neighbor, g, f, parent: current }, f);
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  static solveSliding(grid1D: number[], rows: number, cols: number, algorithm: string = 'astar-manhattan'): SolverResult {
    const startTime = performance.now();
    const total = grid1D.length;
    const MAX_TIME = 30000; // 30s
    
    const startFlat = [...grid1D];
    const targetFlat = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    const targetStr = targetFlat.join(',');
    
    // Pre-calculate target positions for Manhattan distance
    const targetPos: { r: number; c: number }[] = Array(total);
    for (let i = 0; i < total; i++) {
      const val = targetFlat[i];
      targetPos[val] = { r: Math.floor(i / cols), c: i % cols };
    }

    const isGreedy = algorithm === 'greedy';
    const isWeighted = algorithm === 'astar-weighted' || (total > 16 && !isGreedy);
    const weight = isWeighted ? (total > 25 ? 4.0 : 2.0) : 1.0;

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

    const hamming = (flat: number[]): number => {
      let dist = 0;
      for (let i = 0; i < total; i++) {
        if (flat[i] !== 0 && flat[i] !== targetFlat[i]) dist++;
      }
      return dist;
    };

    const getH = (flat: number[]) => algorithm === 'astar-hamming' ? hamming(flat) : manhattan(flat);

    const getStateKey = (flat: number[]): bigint | string => {
      if (total <= 36) {
        let key = 0n;
        for (let i = 0; i < total; i++) {
          key = (key << 6n) | BigInt(flat[i]);
        }
        return key;
      }
      return flat.join(',');
    };

    const pq = new PriorityQueue<{ flat: number[]; g: number; f: number; h: number; emptyIdx: number; key: bigint | string; parent?: any }>();
    const closedSet = new Map<bigint | string, number>(); // state -> min_g
    
    const startEmptyIdx = startFlat.indexOf(0);
    const startH = getH(startFlat);
    const startKey = getStateKey(startFlat);
    const targetKey = getStateKey(targetFlat);
    pq.push({ flat: startFlat, g: 0, f: isGreedy ? startH : weight * startH, h: startH, emptyIdx: startEmptyIdx, key: startKey }, isGreedy ? startH : weight * startH);
    
    let iterations = 0;
    let nodesExpanded = 0;
    const MAX_NODES = total > 25 ? 300000 : 2000000;
    
    while (pq.size() > 0) {
      iterations++;
      
      const current = pq.pop()!;
      const currentKey = current.key;

      if (currentKey === targetKey) {
        const path: number[][] = [];
        let temp: any = current;
        while (temp) {
          path.push([...temp.flat]);
          temp = temp.parent;
        }
        return {
          solution: path.reverse(),
          stats: { timeMs: performance.now() - startTime, steps: path.length - 1, iterations, depth: current.g, nodesExpanded }
        };
      }

      // Performance safety
      if (nodesExpanded > MAX_NODES) {
        throw new Error(`Search space exceeded (${MAX_NODES} nodes). Try a smaller grid or a simpler algorithm.`);
      }
      if (performance.now() - startTime > MAX_TIME) {
        throw new Error(`Solver timed out (${MAX_TIME/1000}s limit exceeded)`);
      }

      // Check if we already found a better path to this state
      if (closedSet.has(currentKey) && closedSet.get(currentKey)! <= current.g) {
        continue;
      }
      
      nodesExpanded++;
      closedSet.set(currentKey, current.g);
      
      const r = Math.floor(current.emptyIdx / cols);
      const c = current.emptyIdx % cols;
      
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(current.emptyIdx - cols);
      if (r < rows - 1) neighbors.push(current.emptyIdx + cols);
      if (c > 0) neighbors.push(current.emptyIdx - 1);
      if (c < cols - 1) neighbors.push(current.emptyIdx + 1);
      
      for (const nextIdx of neighbors) {
        const val = current.flat[nextIdx];
        const nextFlat = [...current.flat];
        nextFlat[current.emptyIdx] = val;
        nextFlat[nextIdx] = 0;
        
        const nextKey = getStateKey(nextFlat);
        const g = current.g + 1;

        if (closedSet.has(nextKey) && closedSet.get(nextKey)! <= g) continue;
        
        // Incremental Manhattan distance
        let nextH = current.h;
        if (algorithm !== 'astar-hamming') {
          const tPos = targetPos[val];
          const oldDist = Math.abs(Math.floor(nextIdx / cols) - tPos.r) + Math.abs((nextIdx % cols) - tPos.c);
          const newDist = Math.abs(Math.floor(current.emptyIdx / cols) - tPos.r) + Math.abs((current.emptyIdx % cols) - tPos.c);
          nextH = current.h - oldDist + newDist;
        } else {
          nextH = getH(nextFlat);
        }

        const f = isGreedy ? nextH : g + weight * nextH;
        pq.push({ flat: nextFlat, g, f, h: nextH, emptyIdx: nextIdx, key: nextKey, parent: current }, f);
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static getHeuristic(grid: number[][], target: number[][], algorithm: string): number {
    if (algorithm === 'astar-hamming') {
      return this.hamming(grid, target);
    }
    return this.manhattan(grid, target);
  }

  private static heuristic(a: { r: number; c: number }, b: { r: number; c: number }): number {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }

  private static hamming(grid: number[][], target: number[][]): number {
    let dist = 0;
    const size = grid.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0 && grid[r][c] !== target[r][c]) {
          dist++;
        }
      }
    }
    return dist;
  }

  private static manhattan(grid: number[][], target: number[][]): number {
    let dist = 0;
    const size = grid.length;
    const posMap: Record<number, { r: number; c: number }> = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        posMap[target[r][c]] = { r, c };
      }
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val !== 0) {
          const targetPos = posMap[val];
          dist += Math.abs(r - targetPos.r) + Math.abs(c - targetPos.c);
        }
      }
    }
    return dist;
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

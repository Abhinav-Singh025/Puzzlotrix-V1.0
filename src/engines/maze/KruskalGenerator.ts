import { RNG } from '../../utils/rng';

export class KruskalGenerator {
  static generate(size: number, rng: RNG): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(1));
    const edges: { r1: number; c1: number; r2: number; c2: number }[] = [];
    
    const parent = new Int32Array(size * size);
    for (let i = 0; i < parent.length; i++) parent[i] = i;
    
    const find = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    };
    
    const union = (i: number, j: number) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
      }
      return false;
    };
    
    for (let r = 0; r < size; r += 2) {
      for (let c = 0; c < size; c += 2) {
        grid[r][c] = 0;
        if (r + 2 < size) edges.push({ r1: r, c1: c, r2: r + 2, c2: c });
        if (c + 2 < size) edges.push({ r1: r, c1: c, r2: r, c2: c + 2 });
      }
    }
    
    // Shuffle edges
    for (let i = edges.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }
    
    for (const edge of edges) {
      const id1 = edge.r1 * size + edge.c1;
      const id2 = edge.r2 * size + edge.c2;
      if (union(id1, id2)) {
        grid[edge.r1 + (edge.r2 - edge.r1) / 2][edge.c1 + (edge.c2 - edge.c1) / 2] = 0;
      }
    }
    
    return grid;
  }
}

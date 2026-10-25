import { RNG } from '../../utils/rng';

export class CagePartitioner {
  static partition(size: number, rng: RNG): { r: number; c: number }[][] {
    const cages: { r: number; c: number }[][] = [];
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (visited[r][c]) continue;
        
        const cageSize = rng.nextInt(1, size > 6 ? 3 : 2); // Smaller cages for better logic
        const cageCells: { r: number; c: number }[] = [{ r, c }];
        visited[r][c] = true;
        
        let currentR = r;
        let currentC = c;
        for (let i = 1; i < cageSize; i++) {
          const neighbors = [
            { r: currentR + 1, c: currentC },
            { r: currentR - 1, c: currentC },
            { r: currentR, c: currentC + 1 },
            { r: currentR, c: currentC - 1 }
          ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && !visited[n.r][n.c]);
          
          if (neighbors.length === 0) break;
          const next = neighbors[rng.nextInt(0, neighbors.length - 1)];
          cageCells.push(next);
          visited[next.r][next.c] = true;
          currentR = next.r;
          currentC = next.c;
        }
        cages.push(cageCells);
      }
    }
    return cages;
  }
}

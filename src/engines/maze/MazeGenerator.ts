import { RNG } from '../../utils/rng';
import { MazeGenAlgorithm, MazeData } from '../../types';
import { DFSGenerator } from './DFSGenerator';
import { PrimGenerator } from './PrimGenerator';
import { KruskalGenerator } from './KruskalGenerator';
import { BinaryTreeGenerator } from './BinaryTreeGenerator';
import { EllerGenerator } from './EllerGenerator';

export class MazeGenerator {
  static generate(size: number, seed: number, algorithm: MazeGenAlgorithm = 'dfs'): MazeData {
    const rng = new RNG(seed);
    let grid: number[][];

    // Ensure size is odd for wall-based mazes
    const actualSize = size % 2 === 0 ? size + 1 : size;

    switch (algorithm) {
      case 'prim':
        grid = PrimGenerator.generate(actualSize, rng);
        break;
      case 'kruskal':
        grid = KruskalGenerator.generate(actualSize, rng);
        break;
      case 'binary-tree':
        grid = BinaryTreeGenerator.generate(actualSize, rng);
        break;
      case 'eller':
        grid = EllerGenerator.generate(actualSize, rng);
        break;
      case 'dfs':
      default:
        grid = DFSGenerator.generate(actualSize, rng);
        break;
    }

    // Start and End nodes - Pick furthest points on open cells
    // Default to corners if they are open
    const start = { r: 0, c: 0 };
    const end = { r: actualSize - 1, c: actualSize - 1 };
    
    // Ensure start and end are reachable
    grid[start.r][start.c] = 0;
    grid[end.r][end.c] = 0;

    // Ensure connectivity to the rest of the maze
    if (actualSize > 2) {
      if (grid[start.r + 1][start.c] === 1 && grid[start.r][start.c + 1] === 1) {
        if (rng.nextBoolean()) grid[start.r + 1][start.c] = 0;
        else grid[start.r][start.c + 1] = 0;
      }
      if (grid[end.r - 1][end.c] === 1 && grid[end.r][end.c - 1] === 1) {
        if (rng.nextBoolean()) grid[end.r - 1][end.c] = 0;
        else grid[end.r][end.c - 1] = 0;
      }
    }

    let carvedCount = 0;
    for (let r = 0; r < actualSize; r++) {
      for (let c = 0; c < actualSize; c++) {
        if (grid[r][c] === 0) carvedCount++;
      }
    }

    return { grid, start, end, carvedCount };
  }
}

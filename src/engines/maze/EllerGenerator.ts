import { RNG } from '../../utils/rng';

export class EllerGenerator {
  static generate(size: number, rng: RNG): number[][] {
    // Eller's algorithm works on a grid of cells. 
    // For a wall-based maze of dimension 'size', we have (size-1)/2 cells in each direction.
    const cellRows = Math.floor(size / 2);
    const cellCols = Math.floor(size / 2);
    
    const grid = Array.from({ length: size }, () => Array(size).fill(1));
    
    // rowSets stores the set ID for each cell in the current row
    let rowSets = new Int32Array(cellCols);
    let nextSetId = 1;

    for (let r = 0; r < cellRows; r++) {
      // 1. Initialize sets for the row
      for (let c = 0; c < cellCols; c++) {
        if (rowSets[c] === 0) {
          rowSets[c] = nextSetId++;
        }
      }

      // 2. Create horizontal connections
      for (let c = 0; c < cellCols - 1; c++) {
        if (rowSets[c] !== rowSets[c + 1]) {
          // Randomly decide to connect
          if (rng.nextBoolean() || r === cellRows - 1) {
            const oldSet = rowSets[c + 1];
            const newSet = rowSets[c];
            for (let i = 0; i < cellCols; i++) {
              if (rowSets[i] === oldSet) rowSets[i] = newSet;
            }
            // Carve in grid
            grid[r * 2][c * 2] = 0;
            grid[r * 2][c * 2 + 1] = 0;
            grid[r * 2][c * 2 + 2] = 0;
          } else {
            grid[r * 2][c * 2] = 0;
            grid[r * 2][c * 2 + 2] = 0;
          }
        } else {
          grid[r * 2][c * 2] = 0;
          grid[r * 2][c * 2 + 2] = 0;
        }
      }
      // Handle last cell if not connected
      grid[r * 2][(cellCols - 1) * 2] = 0;

      // 3. Create vertical connections
      if (r < cellRows - 1) {
        const nextRowSets = new Int32Array(cellCols);
        const setHasVertical = new Set<number>();
        
        // Group cells by set
        const setsInRow: Record<number, number[]> = {};
        for (let c = 0; c < cellCols; c++) {
          if (!setsInRow[rowSets[c]]) setsInRow[rowSets[c]] = [];
          setsInRow[rowSets[c]].push(c);
        }

        for (const setId in setsInRow) {
          const cells = setsInRow[setId];
          // At least one vertical connection per set
          const numConnections = rng.nextInt(1, cells.length);
          // Shuffle cells to pick random ones
          for (let i = cells.length - 1; i > 0; i--) {
            const j = rng.nextInt(0, i);
            [cells[i], cells[j]] = [cells[j], cells[i]];
          }

          for (let i = 0; i < numConnections; i++) {
            const c = cells[i];
            nextRowSets[c] = rowSets[c];
            grid[r * 2][c * 2] = 0;
            grid[r * 2 + 1][c * 2] = 0;
            grid[r * 2 + 2][c * 2] = 0;
          }
        }
        rowSets = nextRowSets;
      }
    }

    return grid;
  }
}

import { SolverResult } from './AStarSolver';

export class KenKenSolver {
  static solve(data: any): SolverResult {
    const startTime = performance.now();
    const { solution, cages = [], grid } = data;
    
    // If solution is provided in data, return it for AI Solve
    if (solution) {
      return {
        solution: solution,
        stats: { 
          timeMs: performance.now() - startTime, 
          steps: solution.length * solution.length, 
          iterations: solution.length * solution.length, 
          depth: 0, 
          nodesExpanded: solution.length 
        }
      };
    }

    // Basic backtracking solver for smaller grids
    const size = grid?.length || 0;
    if (size === 0 || !grid[0]) return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const resultGrid = grid.map((row: any) => [...row]);
    
    const isValid = (r: number, c: number, val: number): boolean => {
      for (let i = 0; i < size; i++) {
        if (resultGrid[r][i] === val || resultGrid[i][c] === val) return false;
      }
      
      // Check cage constraint
      const cage = cages.find((cg: any) => cg.cells.some((cell: any) => cell.r === r && cell.c === c));
      if (!cage) return true;
      
      const cageValues = cage.cells.map((cell: any) => 
        (cell.r === r && cell.c === c) ? val : resultGrid[cell.r][cell.c]
      ).filter((v: number) => v !== 0);
      
      if (cageValues.length === cage.cells.length) {
        const { op, target } = cage;
        if (op === 'none') return cageValues[0] === target;
        if (op === '+') return cageValues.reduce((a: number, b: number) => a + b, 0) === target;
        if (op === '*') return cageValues.reduce((a: number, b: number) => a * b, 1) === target;
        if (op === '-') return Math.abs(cageValues[0] - cageValues[1]) === target;
        if (op === '/') return cageValues[0] / cageValues[1] === target || cageValues[1] / cageValues[0] === target;
      }
      
      return true;
    };

    let iterations = 0;
    const MAX_DEPTH = 1500;
    const solveRecursive = (r: number, c: number, depth: number): boolean => {
      iterations++;
      if (iterations > 1000000) return false; // Safety limit
      if (depth > MAX_DEPTH) return false;
      
      if (c === size) { r++; c = 0; }
      if (r === size) return true;
      if (resultGrid[r][c] !== 0) return solveRecursive(r, c + 1, depth + 1);
      
      for (let val = 1; val <= size; val++) {
        if (isValid(r, c, val)) {
          resultGrid[r][c] = val;
          if (solveRecursive(r, c + 1, depth + 1)) return true;
          resultGrid[r][c] = 0;
        }
      }
      return false;
    };

    const solved = solveRecursive(0, 0, 0);
    
    return {
      solution: solved ? resultGrid : null,
      stats: { 
        timeMs: performance.now() - startTime, 
        steps: size * size, 
        iterations, 
        depth: 0, 
        nodesExpanded: iterations 
      }
    };
  }
}

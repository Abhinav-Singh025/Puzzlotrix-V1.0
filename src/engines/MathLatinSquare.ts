import { RNG } from '../utils/rng';
import { LatinSquareEngine } from './LatinSquare';
import { MathLatinSquareData, MathOp, Difficulty } from '../types';

export class MathLatinSquareEngine {
  static generate(size: number, seed: number, difficulty: Difficulty = 'medium'): MathLatinSquareData {
    const rng = new RNG(seed);
    
    // Step 1: Generate valid Latin square solution grid
    const solution = LatinSquareEngine.generate(size, seed);
    
    // Step 2: Assign operator pattern per row and column
    const ops: MathOp[] = ['+', '-', '*', '/'];
    
    const rowOps: MathOp[][] = [];
    const colOps: MathOp[][] = [];
    
    for (let i = 0; i < size; i++) {
      const rOps: MathOp[] = [];
      for (let j = 0; j < size - 1; j++) {
        rOps.push(ops[rng.nextInt(0, ops.length - 1)]);
      }
      rowOps.push(rOps);
      
      const cOps: MathOp[] = [];
      for (let j = 0; j < size - 1; j++) {
        cOps.push(ops[rng.nextInt(0, ops.length - 1)]);
      }
      colOps.push(cOps);
    }

    const calculateTarget = (values: number[], operators: MathOp[]): number | null => {
      let res = values[0];
      for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        const next = values[i + 1];
        if (op === '+') res += next;
        else if (op === '-') res -= next;
        else if (op === '*') res *= next;
        else if (op === '/') {
          if (next === 0 || res % next !== 0) return null;
          res /= next;
        }
      }
      return res;
    };

    const rowTargets: number[] = [];
    const colTargets: number[] = [];

    // Validate and fix row operators
    for (let r = 0; r < size; r++) {
      let target = calculateTarget(solution[r], rowOps[r]);
      let attempts = 0;
      while (target === null && attempts < 20) {
        // Fix operators by replacing problematic divisions
        for (let i = 0; i < rowOps[r].length; i++) {
          if (rowOps[r][i] === '/') {
            const tempRes = calculateTarget(solution[r].slice(0, i + 1), rowOps[r].slice(0, i));
            if (tempRes === null || tempRes % solution[r][i + 1] !== 0) {
              rowOps[r][i] = rng.next() > 0.5 ? '+' : '*';
            }
          }
        }
        target = calculateTarget(solution[r], rowOps[r]);
        attempts++;
      }
      if (target === null) {
        // Fallback: remove all divisions in this row
        for (let i = 0; i < rowOps[r].length; i++) {
          if (rowOps[r][i] === '/') rowOps[r][i] = '+';
        }
        target = calculateTarget(solution[r], rowOps[r])!;
      }
      rowTargets.push(target);
    }

    // Validate and fix column operators
    for (let c = 0; c < size; c++) {
      const colValues = solution.map(row => row[c]);
      let target = calculateTarget(colValues, colOps[c]);
      let attempts = 0;
      while (target === null && attempts < 20) {
        for (let i = 0; i < colOps[c].length; i++) {
          if (colOps[c][i] === '/') {
            const tempRes = calculateTarget(colValues.slice(0, i + 1), colOps[c].slice(0, i));
            if (tempRes === null || tempRes % colValues[i + 1] !== 0) {
              colOps[c][i] = rng.next() > 0.5 ? '+' : '*';
            }
          }
        }
        target = calculateTarget(colValues, colOps[c]);
        attempts++;
      }
      if (target === null) {
        for (let i = 0; i < colOps[c].length; i++) {
          if (colOps[c][i] === '/') colOps[c][i] = '+';
        }
        target = calculateTarget(colValues, colOps[c])!;
      }
      colTargets.push(target);
    }

    // Step 5: Hide selected cells to create puzzle
    // For Math Latin Square, we can hide more cells because arithmetic provides extra constraints
    let hideProbability = 0.3;
    if (difficulty === 'easy') hideProbability = 0.2;
    else if (difficulty === 'medium') hideProbability = 0.4;
    else if (difficulty === 'hard') hideProbability = 0.6;
    else if (difficulty === 'expert') hideProbability = 0.8;

    const grid = solution.map(row => row.map(val => (rng.next() > hideProbability ? 0 : val)));

    return {
      grid,
      solution,
      rowOps,
      colOps,
      rowTargets,
      colTargets
    };
  }
}

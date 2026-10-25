import { PuzzleType, KenKenCage, MathLatinSquareData, MathOp } from '../types';

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  isFull: boolean;
  conflicts: { r: number; c: number }[];
  arithmeticConflicts?: { r: number; c: number }[];
  errors: string[];
}

export class ValidationEngine {
  static validate(type: PuzzleType, size: number, data: any, solution?: any, revealMode: boolean = false, solvedByAI: boolean = false): ValidationResult {
    if (revealMode || solvedByAI) {
      return { isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] };
    }

    if (!data) {
      return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["No puzzle data found."] };
    }

    // Check if user solution matches AI solution as a shortcut
    if (solution) {
      let isMatch = false;
      if (type === 'sudoku' || type === 'math-latin-square' || type === 'kenken') {
        const grid = data.grid || data;
        isMatch = this.isGridEqual(grid, solution);
      } else if (type === 'n-queens') {
        isMatch = Array.isArray(data) && Array.isArray(solution) && data.length === solution.length && data.every((v, i) => v === solution[i]);
      } else if (type === 'nonogram') {
        isMatch = data.userGrid && this.isGridEqual(data.userGrid, solution);
      } else if (type === 'sliding-puzzle') {
        // If solution is an array of grids (path from solver), check last grid
        const targetGrid = Array.isArray(solution[0]) ? solution[solution.length - 1] : solution;
        isMatch = Array.isArray(data.grid) && Array.isArray(targetGrid) && JSON.stringify(data.grid) === JSON.stringify(targetGrid);
      }

      if (isMatch) {
        return { isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] };
      }
    }

    // Clear previous errors implicitly by returning a new object
    let result: ValidationResult;
    switch (type) {
      case 'sudoku':
        result = this.validateSudoku(size, data.grid || data, solution);
        break;
      case 'math-latin-square':
        result = this.validateMathLatinSquare(size, data, solution);
        break;
      case 'n-queens':
        result = this.validateNQueens(size, data, solution);
        break;
      case 'kenken':
        result = this.validateKenKen(size, data, solution);
        break;
      case 'maze':
        result = this.validateMaze(size, data, solution, solvedByAI);
        break;
      case 'nonogram':
        result = this.validateNonogram(size, data, solution);
        break;
      case 'minesweeper':
        result = this.validateMinesweeper(size, data);
        break;
      case 'sliding-puzzle':
        result = this.validateSlidingPuzzle(size, data, solution);
        break;
      default:
        return { isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] };
    }

    return result;
  }

  private static validateMinesweeper(size: number, data: any): ValidationResult {
    const { grid, revealed, flagged } = data || {};
    if (!grid || !revealed) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Invalid grid data."] };

    let unrevealedSafeCells = 0;
    let hitMine = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r]?.[c] === -1 && revealed[r]?.[c]) {
          hitMine = true;
        }
        if (grid[r]?.[c] !== -1 && !revealed[r]?.[c]) {
          unrevealedSafeCells++;
        }
      }
    }

    const isComplete = !hitMine && unrevealedSafeCells === 0;
    const errors: string[] = [];
    if (hitMine) {
      errors.push("Game Over: Detonated a mine!");
    } else if (unrevealedSafeCells > 0) {
      errors.push(`${unrevealedSafeCells} safe cell(s) left to reveal.`);
    }

    return {
      isValid: !hitMine,
      isComplete,
      isFull: unrevealedSafeCells === 0,
      conflicts: [],
      errors
    };
  }

  private static isGridEqual(g1: any[][], g2: any[][]): boolean {
    if (!g1 || !g2 || g1.length !== g2.length) return false;
    for (let r = 0; r < g1.length; r++) {
      if (!g1[r] || !g2[r] || g1[r].length !== g2[r].length) return false;
      for (let c = 0; c < g1[r].length; c++) {
        if (g1[r][c] !== g2[r][c]) return false;
      }
    }
    return true;
  }

  private static validateSlidingPuzzle(size: number, data: any, solution?: any): ValidationResult {
    const grid = data?.grid;
    if (!grid || !Array.isArray(grid)) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const total = grid.length;
    let isComplete = true;

    for (let i = 0; i < total - 1; i++) {
      if (grid[i] !== i + 1) isComplete = false;
    }
    if (grid[total - 1] !== 0) isComplete = false;

    return {
      isValid: true,
      isComplete,
      isFull: true,
      conflicts: [],
      errors: isComplete ? [] : ["Tiles are not yet ordered (1, 2, 3... with blank at end)."]
    };
  }

  private static validateNonogram(size: number, data: any, solution: any): ValidationResult {
    const userGrid = data?.userGrid;
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];
    
    if (!userGrid || !solution) return { isValid: true, isComplete: false, isFull: false, conflicts: [], errors: ["Nonogram data missing."] };

    let hasMismatch = false;
    let missingFilled = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const actual = userGrid[r]?.[c] === 1 ? 1 : 0;
        const expected = solution[r]?.[c] === 1 ? 1 : 0;
        
        if (actual !== expected) {
          if (actual === 1 && expected === 0) {
            hasMismatch = true;
            conflicts.push({ r, c });
          }
          if (actual === 0 && expected === 1) {
            missingFilled++;
          }
        }
      }
    }

    if (hasMismatch) {
      errors.push("Some filled cells are incorrect (conflicts highlighted).");
    } else if (missingFilled > 0) {
      errors.push(`${missingFilled} filled cell(s) remaining to mark.`);
    }

    return {
      isValid: !hasMismatch,
      isComplete: !hasMismatch && missingFilled === 0,
      isFull: missingFilled === 0,
      conflicts,
      errors
    };
  }

  private static calculate(values: number[], operators: MathOp[]): number {
    let res = values[0];
    for (let i = 0; i < operators.length; i++) {
      const op = operators[i];
      const next = values[i + 1];
      if (op === '+') res += next;
      else if (op === '-') res -= next;
      else if (op === '*') res *= next;
      else if (op === '/') res /= next;
    }
    return res;
  }

  private static validateMathLatinSquare(size: number, data: MathLatinSquareData, solution?: any): ValidationResult {
    const grid = data?.grid || [];
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const conflicts: { r: number; c: number }[] = [];
    const arithmeticConflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Latin Square rules
    const lsResult = this.validateLatinSquare(size, grid);
    conflicts.push(...lsResult.conflicts);
    errors.push(...lsResult.errors);

    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r]?.[c];
        if (val === 0) isFull = false;
        else if (val < 1 || val > size) {
          conflicts.push({ r, c });
          if (!errors.includes(`Value ${val} is out of range (1-${size})`)) {
            errors.push(`Value ${val} is out of range (1-${size})`);
          }
        }
      }
    }

    // Row arithmetic
    if (data.rowOps && data.rowTargets) {
      for (let r = 0; r < size; r++) {
        const rowValues = grid[r];
        if (rowValues && rowValues.every(v => v !== 0)) {
          const res = this.calculate(rowValues, data.rowOps[r]);
          if (Math.abs(res - data.rowTargets[r]) > 0.001) {
            for (let c = 0; c < size; c++) arithmeticConflicts.push({ r, c });
            if (!errors.includes("Row arithmetic constraint violated.")) {
              errors.push("Row arithmetic constraint violated.");
            }
          }
        }
      }
    }

    // Column arithmetic
    if (data.colOps && data.colTargets) {
      for (let c = 0; c < size; c++) {
        const colValues = grid.map(row => row[c]);
        if (colValues.every(v => v !== 0)) {
          const res = this.calculate(colValues, data.colOps[c]);
          if (Math.abs(res - data.colTargets[c]) > 0.001) {
            for (let r = 0; r < size; r++) arithmeticConflicts.push({ r, c });
            if (!errors.includes("Column arithmetic constraint violated.")) {
              errors.push("Column arithmetic constraint violated.");
            }
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0 && arithmeticConflicts.length === 0,
      isComplete: isFull && conflicts.length === 0 && arithmeticConflicts.length === 0,
      isFull,
      conflicts,
      arithmeticConflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateMaze(size: number, data: any, solution?: any, solvedByAI?: boolean): ValidationResult {
    const grid = data?.grid;
    const start = data?.start;
    const end = data?.end;
    
    if (!start || !end || !grid) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Start or End node missing."] };

    // BFS to check reachability
    const queue = [start];
    const visited = new Set<string>();
    visited.add(`${start.r},${start.c}`);
    
    let found = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.r === end.r && curr.c === end.c) {
        found = true;
        break;
      }
      
      const neighbors = [
        { r: curr.r + 1, c: curr.c },
        { r: curr.r - 1, c: curr.c },
        { r: curr.r, c: curr.c + 1 },
        { r: curr.r, c: curr.c - 1 }
      ];
      
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0 && !visited.has(key)) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
    
    const isComplete = found && Boolean(solvedByAI || (solution && solution.length > 0));
    return {
      isValid: found,
      isComplete,
      isFull: true,
      conflicts: [],
      errors: !found 
        ? ["No path exists between Start and End."] 
        : (!isComplete ? ["Start and End are reachable! Click 'AI Solve' to navigate the solution route."] : [])
    };
  }

  private static validateSudoku(size: number, grid: number[][], solution?: any): ValidationResult {
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];
    const n = Math.sqrt(size);

    let isFull = true;
    let emptyCells = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r]?.[c];
        if (val === 0 || val === undefined || val === null) {
          isFull = false;
          emptyCells++;
        } else if (val < 1 || val > size) {
          conflicts.push({ r, c });
          if (!errors.includes(`Value ${val} is out of range (1-${size})`)) {
            errors.push(`Value ${val} is out of range (1-${size})`);
          }
        }
      }
    }

    // Rows
    for (let r = 0; r < size; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const val = grid[r]?.[c];
        if (val === 0 || val === undefined || val === null) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
      for (const [val, cols] of seen) {
        if (cols.length > 1) {
          cols.forEach(c => conflicts.push({ r, c }));
          errors.push(`Duplicate number ${val} in row ${r + 1}`);
        }
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const val = grid[r]?.[c];
        if (val === 0 || val === undefined || val === null) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(r);
      }
      for (const [val, rows] of seen) {
        if (rows.length > 1) {
          rows.forEach(r => conflicts.push({ r, c }));
          errors.push(`Duplicate number ${val} in column ${c + 1}`);
        }
      }
    }

    // Subgrids
    if (Number.isInteger(n)) {
      for (let br = 0; br < n; br++) {
        for (let bc = 0; bc < n; bc++) {
          const seen = new Map<number, { r: number; c: number }[]>();
          for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
              const row = br * n + r;
              const col = bc * n + c;
              const val = grid[row]?.[col];
              if (val === 0 || val === undefined || val === null) continue;
              if (!seen.has(val)) seen.set(val, []);
              seen.get(val)!.push({ r: row, c: col });
            }
          }
          for (const [val, cells] of seen) {
            if (cells.length > 1) {
              cells.forEach(cell => conflicts.push(cell));
              errors.push(`Duplicate number ${val} in subgrid (${br + 1},${bc + 1})`);
            }
          }
        }
      }
    }

    if (emptyCells > 0 && conflicts.length === 0) {
      errors.push(`${emptyCells} empty cell(s) remaining.`);
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateLatinSquare(size: number, grid: number[][]): ValidationResult {
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Rows
    for (let r = 0; r < size; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
      for (const [val, cols] of seen) {
        if (cols.length > 1) {
          cols.forEach(c => conflicts.push({ r, c }));
          errors.push("Row uniqueness violated.");
        }
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(r);
      }
      for (const [val, rows] of seen) {
        if (rows.length > 1) {
          rows.forEach(r => conflicts.push({ r, c }));
          errors.push("Column uniqueness violated.");
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: false, // Not used directly for Latin Square as it's part of Math Latin Square
      isFull: false,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateNQueens(size: number, queens: number[], solution?: any): ValidationResult {
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    let placedCount = 0;
    for (let i = 0; i < size; i++) {
      if (queens[i] !== -1) placedCount++;
      if (queens[i] === -1) continue;
      for (let j = i + 1; j < size; j++) {
        if (queens[j] === -1) continue;
        
        const r1 = queens[i];
        const c1 = i;
        const r2 = queens[j];
        const c2 = j;

        if (r1 === r2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
          conflicts.push({ r: r1, c: c1 });
          conflicts.push({ r: r2, c: c2 });
          errors.push("Queens are attacking each other.");
        }
      }
    }

    const isFull = placedCount === size;
    if (!isFull && conflicts.length === 0) {
      errors.push(`Place all ${size} queens on the board (${size - placedCount} remaining).`);
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateKenKen(size: number, data: any, solution?: any): ValidationResult {
    const grid = data?.grid || [];
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const cages: KenKenCage[] = data.cages || [];
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Latin Square rules
    const lsResult = this.validateLatinSquare(size, grid);
    conflicts.push(...lsResult.conflicts);
    errors.push(...lsResult.errors);

    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r]?.[c];
        if (val === 0) isFull = false;
        else if (val < 1 || val > size) {
          conflicts.push({ r, c });
          if (!errors.includes(`Value ${val} is out of range (1-${size})`)) {
            errors.push(`Value ${val} is out of range (1-${size})`);
          }
        }
      }
    }

    // Cage rules
    for (const cage of cages) {
      const values = cage.cells.map(cell => grid[cell.r]?.[cell.c]).filter(v => v !== undefined && v !== 0);
      if (values.length === cage.cells.length) {
        // Cage is full, validate arithmetic
        let result = 0;
        const op = cage.op;
        const target = cage.target;

        if (op === '+') {
          result = values.reduce((a, b) => a + b, 0);
        } else if (op === '*') {
          result = values.reduce((a, b) => a * b, 1);
        } else if (op === '-') {
          result = Math.abs(values[0] - values[1]);
        } else if (op === '/') {
          result = values[0] > values[1] ? values[0] / values[1] : values[1] / values[0];
        } else {
          result = values[0];
        }

        if (Math.abs(result - target) > 0.001) {
          cage.cells.forEach(cell => conflicts.push({ r: cell.r, c: cell.c }));
          if (!errors.includes("Cage arithmetic constraint not satisfied.")) {
            errors.push("Cage arithmetic constraint not satisfied.");
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }
}

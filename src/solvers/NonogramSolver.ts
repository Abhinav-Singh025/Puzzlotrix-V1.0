import { SolverResult } from './AStarSolver';

export class NonogramSolver {
  private static MAX_RECURSION_DEPTH = 1500;
  private static iterations = 0;
  private static nodesExpanded = 0;

  private static startTime = 0;
  private static TIMEOUT = 30000;
  private static lastValidGrid: number[][] | null = null;

  static solve(data: any): SolverResult {
    this.startTime = performance.now();
    const { rowClues, colClues } = data?.clues || data || {};
    if (!rowClues || !colClues) return { solution: null, stats: { timeMs: performance.now() - this.startTime, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };

    const rows = rowClues.length;
    const cols = colClues.length;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(-1)); // -1: unknown, 0: empty, 1: filled

    this.iterations = 0;
    this.nodesExpanded = 0;
    this.lastValidGrid = grid.map(row => [...row]);

    try {
      const solvedGrid = this.backtrack(grid, rowClues, colClues, 0);
      return {
        solution: solvedGrid,
        stats: {
          timeMs: performance.now() - this.startTime,
          steps: rows * cols,
          iterations: this.iterations,
          depth: 0,
          nodesExpanded: this.nodesExpanded
        }
      };
    } catch (e: any) {
      if (e.message === "Timeout") {
        return {
          solution: this.lastValidGrid,
          message: "Partial logical solution reached.",
          stats: {
            timeMs: performance.now() - this.startTime,
            steps: rows * cols,
            iterations: this.iterations,
            depth: 0,
            nodesExpanded: this.nodesExpanded
          }
        };
      }
      return { solution: null, stats: { timeMs: performance.now() - this.startTime, steps: 0, iterations: this.iterations, depth: 0, nodesExpanded: this.nodesExpanded } };
    }
  }

  private static backtrack(grid: number[][], rowClues: number[][], colClues: number[][], depth: number): number[][] | null {
    this.nodesExpanded++;
    if (depth > this.MAX_RECURSION_DEPTH) throw new Error("Recursion depth limit exceeded");
    if (performance.now() - this.startTime > this.TIMEOUT) throw new Error("Timeout");

    // 1. Constraint Propagation
    if (!this.propagate(grid, rowClues, colClues)) return null;
    
    // Update last valid grid after propagation
    this.lastValidGrid = grid.map(row => [...row]);

    // 2. Check if solved
    let unknownR = -1, unknownC = -1;
    let maxConstraints = -1;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === -1) {
          // Heuristic: pick cell in row/col with most constraints (revealed cells + clue sizes)
          const rowRevealed = grid[r].filter(x => x !== -1).length;
          const colRevealed = grid.map(row => row[c]).filter(x => x !== -1).length;
          const rowClueSum = rowClues[r].reduce((a, b) => a + b, 0);
          const colClueSum = colClues[c].reduce((a, b) => a + b, 0);
          
          const score = rowRevealed + colRevealed + rowClueSum + colClueSum;
          if (score > maxConstraints) {
            maxConstraints = score;
            unknownR = r;
            unknownC = c;
          }
        }
      }
    }

    if (unknownR === -1) return grid;

    // 3. Guess
    for (const val of [1, 0]) {
      this.iterations++;
      const nextGrid = grid.map(row => [...row]);
      nextGrid[unknownR][unknownC] = val;
      const result = this.backtrack(nextGrid, rowClues, colClues, depth + 1);
      if (result) return result;
    }

    return null;
  }

  private static propagate(grid: number[][], rowClues: number[][], colClues: number[][]): boolean {
    let changed = true;
    let iter = 0;
    while (changed && iter < 100) {
      changed = false;
      iter++;
      // Rows
      for (let r = 0; r < grid.length; r++) {
        const line = grid[r];
        const intersection = this.solveLine(line, rowClues[r]);
        if (intersection === null) return false;
        for (let c = 0; c < grid[0].length; c++) {
          if (grid[r][c] === -1 && intersection[c] !== -1) {
            grid[r][c] = intersection[c];
            changed = true;
          }
        }
      }
      // Cols
      for (let c = 0; c < grid[0].length; c++) {
        const line = grid.map(row => row[c]);
        const intersection = this.solveLine(line, colClues[c]);
        if (intersection === null) return false;
        for (let r = 0; r < grid.length; r++) {
          if (grid[r][c] === -1 && intersection[r] !== -1) {
            grid[r][c] = intersection[r];
            changed = true;
          }
        }
      }
    }
    return true;
  }

  private static solveLine(line: number[], clues: number[]): number[] | null {
    const n = line.length;
    const m = clues.length;

    // dp[i][j] = can first i clues fit in first j cells
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
    dp[0][0] = true;
    for (let j = 1; j <= n; j++) {
      if (line[j - 1] === 1) break;
      dp[0][j] = true;
    }

    for (let i = 1; i <= m; i++) {
      const clue = clues[i - 1];
      for (let j = 1; j <= n; j++) {
        // Option 1: cell j-1 is 0
        if (line[j - 1] !== 1 && dp[i][j - 1]) dp[i][j] = true;
        // Option 2: cell j-1 is end of clue i
        if (!dp[i][j] && j >= clue) {
          let canPlace = true;
          for (let k = j - clue; k < j; k++) {
            if (line[k] === 0) { canPlace = false; break; }
          }
          if (canPlace) {
            if (j === clue) {
              if (i === 1) dp[i][j] = true;
            } else if (line[j - clue - 1] !== 1) {
              if (dp[i - 1][j - clue - 1]) dp[i][j] = true;
            }
          }
        }
      }
    }

    if (!dp[m][n]) return null;

    // dpRev[i][j] = can last i clues fit in last j cells
    const dpRev = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
    dpRev[0][0] = true;
    for (let j = 1; j <= n; j++) {
      if (line[n - j] === 1) break;
      dpRev[0][j] = true;
    }
    const revClues = [...clues].reverse();
    const revLine = [...line].reverse();
    for (let i = 1; i <= m; i++) {
      const clue = revClues[i - 1];
      for (let j = 1; j <= n; j++) {
        if (revLine[j - 1] !== 1 && dpRev[i][j - 1]) dpRev[i][j] = true;
        if (!dpRev[i][j] && j >= clue) {
          let canPlace = true;
          for (let k = j - clue; k < j; k++) {
            if (revLine[k] === 0) { canPlace = false; break; }
          }
          if (canPlace) {
            if (j === clue) {
              if (i === 1) dpRev[i][j] = true;
            } else if (revLine[j - clue - 1] !== 1) {
              if (dpRev[i - 1][j - clue - 1]) dpRev[i][j] = true;
            }
          }
        }
      }
    }

    const result = Array(n).fill(-1);
    for (let k = 0; k < n; k++) {
      let canBe0 = false;
      if (line[k] !== 1) {
        for (let i = 0; i <= m; i++) {
          if (dp[i][k] && dpRev[m - i][n - k - 1]) { canBe0 = true; break; }
        }
      }

      let canBe1 = false;
      if (line[k] !== 0) {
        for (let i = 1; i <= m; i++) {
          const clue = clues[i - 1];
          for (let s = Math.max(0, k - clue + 1); s <= Math.min(k, n - clue); s++) {
            let possible = true;
            for (let p = s; p < s + clue; p++) {
              if (line[p] === 0) { possible = false; break; }
            }
            if (!possible) continue;
            if (s > 0 && line[s - 1] === 1) continue;
            if (s + clue < n && line[s + clue] === 1) continue;

            const leftValid = s === 0 ? (i === 1) : (line[s - 1] !== 1 && dp[i - 1][s - 1]);
            const rightValid = s + clue === n ? (i === m) : (line[s + clue] !== 1 && dpRev[m - i][n - (s + clue + 1)]);
            if (leftValid && rightValid) { canBe1 = true; break; }
          }
          if (canBe1) break;
        }
      }

      if (canBe0 && !canBe1) result[k] = 0;
      else if (!canBe0 && canBe1) result[k] = 1;
      else if (!canBe0 && !canBe1) return null;
    }
    return result;
  }
}

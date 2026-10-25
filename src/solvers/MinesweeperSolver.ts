import { SolverResult } from './AStarSolver';

export class MinesweeperSolver {
  static solve(grid: number[][], algorithm: string = 'logical-deduction'): SolverResult {
    const startTime = performance.now();
    const size = grid?.length || 0;
    if (size === 0 || !grid[0]) return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations: 0, depth: 0, nodesExpanded: 0 } };
    const revealed = Array.from({ length: size }, () => Array(size).fill(false));
    const flagged = Array.from({ length: size }, () => Array(size).fill(false));
    let iterations = 0;
    let steps = 0;
    let nodesExpanded = 0;

    const getNeighbors = (r: number, c: number) => {
      const neighbors = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            neighbors.push({ r: nr, c: nc });
          }
        }
      }
      return neighbors;
    };

    // Start by revealing a safe spot (if any) or (0,0)
    let changed = true;
    while (changed) {
      changed = false;
      iterations++;
      if (iterations > 1000) break;

      // 1. Basic Deduction:
      // - If revealed cell number == flagged neighbors, all other neighbors are safe.
      // - If revealed cell number == unrevealed neighbors, all unrevealed neighbors are mines.
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (revealed[r][c] && grid[r][c] > 0) {
            const neighbors = getNeighbors(r, c);
            const unrevealed = neighbors.filter(n => !revealed[n.r][n.c]);
            const mines = unrevealed.filter(n => flagged[n.r][n.c]);
            const unknown = unrevealed.filter(n => !flagged[n.r][n.c]);

            if (grid[r][c] === mines.length && unknown.length > 0) {
              unknown.forEach(n => { revealed[n.r][n.c] = true; steps++; });
              changed = true;
            } else if (grid[r][c] === unrevealed.length && unknown.length > 0) {
              unknown.forEach(n => { flagged[n.r][n.c] = true; });
              changed = true;
            }
          }
        }
      }

      // 2. Probability Fallback (Simplified Guessing)
      if (!changed) {
        let bestGuess = null;
        let minProb = 2;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (!revealed[r][c] && !flagged[r][c]) {
              // In a real solver, we'd calculate actual probabilities.
              // Here we just pick the first unrevealed cell as a "guess".
              bestGuess = { r, c };
              break;
            }
          }
          if (bestGuess) break;
        }
        if (bestGuess) {
          if (grid[bestGuess.r][bestGuess.c] === -1) {
            // Guessed a mine, solver fails or marks it
            flagged[bestGuess.r][bestGuess.c] = true;
          } else {
            revealed[bestGuess.r][bestGuess.c] = true;
            steps++;
          }
          changed = true;
        }
      }
    }
    
    return {
      solution: { revealed, flagged },
      stats: { timeMs: performance.now() - startTime, steps, iterations, depth: 0, nodesExpanded }
    };
  }
}

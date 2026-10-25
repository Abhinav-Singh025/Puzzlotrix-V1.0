import { PuzzleType, AlgorithmType, WorkerRequest, WorkerResponse } from '../types';
import { AStarSolver } from '../solvers/AStarSolver';
import { BFSSolver } from '../solvers/BFSSolver';
import { DFSSolver } from '../solvers/DFSSolver';
import { DijkstraSolver } from '../solvers/DijkstraSolver';
import { IDAStarSolver } from '../solvers/IDAStarSolver';
import { BacktrackingSolver } from '../solvers/BacktrackingSolver';
import { MinesweeperSolver } from '../solvers/MinesweeperSolver';
import { NonogramSolver } from '../solvers/NonogramSolver';

import { KenKenSolver } from '../solvers/KenKenSolver';
import { MazeSolvers } from '../solvers/MazeSolvers';

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, puzzleType, algorithm, data, size, rows, cols } = e.data;
  if (!data && puzzleType !== 'n-queens') {
    self.postMessage({ error: "Missing puzzle data" });
    return;
  }
  let result: any;

  try {
    const solvePromise = (async () => {
      switch (puzzleType) {
        case 'maze':
          if (algorithm === 'bfs') return BFSSolver.solveMaze(data.grid, data.start, data.end);
          else if (algorithm === 'dfs') return DFSSolver.solveMaze(data.grid, data.start, data.end);
          else if (algorithm === 'dijkstra') return DijkstraSolver.solveMaze(data.grid, data.start, data.end);
          else if (algorithm === 'hybrid') return MazeSolvers.deadEndFilling(data.grid, data.start, data.end);
          else return AStarSolver.solveMaze(data.grid, data.start, data.end, algorithm);
        case 'sliding-puzzle': {
          const r = rows || size;
          const c = cols || size;
          if (algorithm === 'bfs') return BFSSolver.solveSliding(data.grid, r, c);
          else if (algorithm === 'dfs') return DFSSolver.solveSliding(data.grid, r, c);
          else if (algorithm === 'idastar') return IDAStarSolver.solveSliding(data.grid, r, c);
          else return AStarSolver.solveSliding(data.grid, r, c, algorithm);
        }
        case 'sudoku':
          return BacktrackingSolver.solveSudoku(data, algorithm);
        case 'math-latin-square':
          return BacktrackingSolver.solveMathLatinSquare(data, algorithm);
        case 'n-queens':
          return BacktrackingSolver.solveNQueens(size, algorithm);
        case 'minesweeper':
          return MinesweeperSolver.solve(data.grid, algorithm);
        case 'nonogram':
          return NonogramSolver.solve(data);
        case 'kenken':
          return KenKenSolver.solve(data);
        default:
          throw new Error(`Unsupported puzzle type: ${puzzleType}`);
      }
    })();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Solving timed out (60s limit exceeded)")), 60000)
    );

    result = await Promise.race([solvePromise, timeoutPromise]);
    self.postMessage(result);
  } catch (err: any) {
    self.postMessage({ error: err.message });
  }
};

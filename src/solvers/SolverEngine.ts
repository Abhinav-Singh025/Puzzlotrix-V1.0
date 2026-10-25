import { PuzzleType, AlgorithmType, WorkerRequest, WorkerResponse, SolveStats } from '../types';

export interface SolverResult {
  solution: any;
  message?: string;
  stats: SolveStats;
  visited?: { r: number; c: number }[];
  frontier?: { r: number; c: number }[];
}

export class SolverEngine {
  private static worker: Worker | null = null;

  static async solve(type: PuzzleType, algorithm: AlgorithmType, data: any, size: number, rows?: number, cols?: number): Promise<SolverResult> {
    if (type === 'sudoku' && size > 36) {
      throw new Error("Sudoku AI solving is disabled for grids larger than 36×36 due to exponential complexity.");
    }

    if (!this.worker) {
      this.worker = new Worker(new URL('../core/SolverWorker.ts', import.meta.url), { type: 'module' });
    }

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent<any>) => {
        this.worker?.removeEventListener('message', handler);
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve({
            solution: e.data.solution,
            message: e.data.message,
            stats: e.data.stats,
            visited: e.data.visited,
            frontier: e.data.frontier
          });
        }
      };

      this.worker?.addEventListener('message', handler);
      
      const request: WorkerRequest = { 
        type: 'solve' as any, 
        puzzleType: type, 
        algorithm, 
        data, 
        size, 
        rows, 
        cols,
        difficulty: 'medium' // Default difficulty if not provided
      };
      this.worker?.postMessage(request);
    });
  }

  static terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

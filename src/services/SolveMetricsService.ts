import { PuzzleType } from '../types';

export interface SolveRecord {
  id: string;
  timestamp: number;
  puzzleType: PuzzleType;
  gridSize: number;
  rows?: number;
  cols?: number;
  algorithm: string;
  algorithmLabel: string;
  timeMs: number;
  nodesExplored: number;
  nodesExpanded?: number;
  backtracks?: number;
  isAISolved: boolean;
  success: boolean;
  seed?: number | null;
}

export interface AlgorithmAggregate {
  algorithm: string;
  algorithmLabel: string;
  count: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  avgNodesExplored: number;
  minNodesExplored: number;
  maxNodesExplored: number;
}

export interface SolveMetricsSummary {
  totalSolves: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  avgNodesExplored: number;
  minNodesExplored: number;
  maxNodesExplored: number;
  fastestSolve?: SolveRecord;
  highestNodesSolve?: SolveRecord;
  byAlgorithm: Record<string, AlgorithmAggregate>;
}

const STORAGE_KEY = 'puzzlotrix_recent_solves_v1';

// Seed sample historical records so user immediately sees rich graphs
const DEFAULT_INITIAL_SOLVES: SolveRecord[] = [
  {
    id: 'seed-solve-1',
    timestamp: Date.now() - 1000 * 60 * 35,
    puzzleType: 'sudoku',
    gridSize: 9,
    algorithm: 'backtracking',
    algorithmLabel: 'Basic Backtracking',
    timeMs: 42.6,
    nodesExplored: 1240,
    nodesExpanded: 1240,
    backtracks: 312,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-2',
    timestamp: Date.now() - 1000 * 60 * 28,
    puzzleType: 'sudoku',
    gridSize: 9,
    algorithm: 'backtracking-mrv',
    algorithmLabel: 'Backtracking + MRV',
    timeMs: 6.8,
    nodesExplored: 94,
    nodesExpanded: 94,
    backtracks: 11,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-3',
    timestamp: Date.now() - 1000 * 60 * 22,
    puzzleType: 'maze',
    gridSize: 15,
    algorithm: 'astar-manhattan',
    algorithmLabel: 'A* (Manhattan)',
    timeMs: 12.3,
    nodesExplored: 168,
    nodesExpanded: 142,
    backtracks: 0,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-4',
    timestamp: Date.now() - 1000 * 60 * 18,
    puzzleType: 'maze',
    gridSize: 15,
    algorithm: 'bfs',
    algorithmLabel: 'BFS',
    timeMs: 18.5,
    nodesExplored: 345,
    nodesExpanded: 320,
    backtracks: 0,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-5',
    timestamp: Date.now() - 1000 * 60 * 14,
    puzzleType: 'n-queens',
    gridSize: 8,
    algorithm: 'backtracking',
    algorithmLabel: 'Backtracking',
    timeMs: 8.2,
    nodesExplored: 876,
    nodesExpanded: 876,
    backtracks: 210,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-6',
    timestamp: Date.now() - 1000 * 60 * 10,
    puzzleType: 'sliding-puzzle',
    gridSize: 3,
    rows: 3,
    cols: 3,
    algorithm: 'astar-manhattan',
    algorithmLabel: 'A* (Manhattan)',
    timeMs: 24.1,
    nodesExplored: 520,
    nodesExpanded: 480,
    backtracks: 0,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-7',
    timestamp: Date.now() - 1000 * 60 * 6,
    puzzleType: 'sliding-puzzle',
    gridSize: 3,
    rows: 3,
    cols: 3,
    algorithm: 'astar-weighted',
    algorithmLabel: 'Weighted A*',
    timeMs: 14.7,
    nodesExplored: 280,
    nodesExpanded: 260,
    backtracks: 0,
    isAISolved: true,
    success: true,
  },
  {
    id: 'seed-solve-8',
    timestamp: Date.now() - 1000 * 60 * 2,
    puzzleType: 'kenken',
    gridSize: 4,
    algorithm: 'constraint-propagation',
    algorithmLabel: 'Constraint Propagation',
    timeMs: 5.4,
    nodesExplored: 62,
    nodesExpanded: 58,
    backtracks: 4,
    isAISolved: true,
    success: true,
  }
];

export class SolveMetricsService {
  static getRecentSolves(): SolveRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading solve metrics from localStorage:', e);
    }
    // Return initial seed and store it
    this.saveAllSolves(DEFAULT_INITIAL_SOLVES);
    return DEFAULT_INITIAL_SOLVES;
  }

  static saveAllSolves(records: SolveRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100))); // Keep last 100
    } catch (e) {
      console.warn('Error saving solve metrics to localStorage:', e);
    }
  }

  static recordSolve(entry: Omit<SolveRecord, 'id' | 'timestamp'>): SolveRecord {
    const record: SolveRecord = {
      ...entry,
      id: `solve-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      timeMs: Math.max(0.1, Number(entry.timeMs.toFixed(2))),
      nodesExplored: Math.max(1, Math.round(entry.nodesExplored)),
    };

    const current = this.getRecentSolves();
    const updated = [record, ...current].slice(0, 100);
    this.saveAllSolves(updated);
    return record;
  }

  static clearSolves(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Error clearing solve metrics:', e);
    }
  }

  static computeSummary(records: SolveRecord[]): SolveMetricsSummary {
    if (records.length === 0) {
      return {
        totalSolves: 0,
        avgTimeMs: 0,
        minTimeMs: 0,
        maxTimeMs: 0,
        avgNodesExplored: 0,
        minNodesExplored: 0,
        maxNodesExplored: 0,
        byAlgorithm: {},
      };
    }

    let totalTime = 0;
    let minTime = Infinity;
    let maxTime = -Infinity;
    let totalNodes = 0;
    let minNodes = Infinity;
    let maxNodes = -Infinity;
    let fastest: SolveRecord | undefined;
    let highestNodes: SolveRecord | undefined;

    const byAlgo: Record<string, {
      algorithm: string;
      algorithmLabel: string;
      times: number[];
      nodes: number[];
    }> = {};

    for (const r of records) {
      totalTime += r.timeMs;
      if (r.timeMs < minTime) {
        minTime = r.timeMs;
        fastest = r;
      }
      if (r.timeMs > maxTime) {
        maxTime = r.timeMs;
      }

      totalNodes += r.nodesExplored;
      if (r.nodesExplored < minNodes) {
        minNodes = r.nodesExplored;
      }
      if (r.nodesExplored > maxNodes) {
        maxNodes = r.nodesExplored;
        highestNodes = r;
      }

      if (!byAlgo[r.algorithm]) {
        byAlgo[r.algorithm] = {
          algorithm: r.algorithm,
          algorithmLabel: r.algorithmLabel,
          times: [],
          nodes: [],
        };
      }
      byAlgo[r.algorithm].times.push(r.timeMs);
      byAlgo[r.algorithm].nodes.push(r.nodesExplored);
    }

    const byAlgorithm: Record<string, AlgorithmAggregate> = {};
    for (const [key, val] of Object.entries(byAlgo)) {
      const sumT = val.times.reduce((a, b) => a + b, 0);
      const sumN = val.nodes.reduce((a, b) => a + b, 0);
      byAlgorithm[key] = {
        algorithm: val.algorithm,
        algorithmLabel: val.algorithmLabel,
        count: val.times.length,
        avgTimeMs: Number((sumT / val.times.length).toFixed(2)),
        minTimeMs: Math.min(...val.times),
        maxTimeMs: Math.max(...val.times),
        avgNodesExplored: Math.round(sumN / val.nodes.length),
        minNodesExplored: Math.min(...val.nodes),
        maxNodesExplored: Math.max(...val.nodes),
      };
    }

    return {
      totalSolves: records.length,
      avgTimeMs: Number((totalTime / records.length).toFixed(2)),
      minTimeMs: minTime === Infinity ? 0 : Number(minTime.toFixed(2)),
      maxTimeMs: maxTime === -Infinity ? 0 : Number(maxTime.toFixed(2)),
      avgNodesExplored: Math.round(totalNodes / records.length),
      minNodesExplored: minNodes === Infinity ? 0 : minNodes,
      maxNodesExplored: maxNodes === -Infinity ? 0 : maxNodes,
      fastestSolve: fastest,
      highestNodesSolve: highestNodes,
      byAlgorithm,
    };
  }

  static exportJSON(records: SolveRecord[]): string {
    return JSON.stringify(records, null, 2);
  }

  static exportCSV(records: SolveRecord[]): string {
    const headers = ['id', 'timestamp', 'puzzleType', 'gridSize', 'algorithm', 'algorithmLabel', 'timeMs', 'nodesExplored', 'backtracks', 'isAISolved'];
    const rows = records.map(r => [
      r.id,
      new Date(r.timestamp).toISOString(),
      r.puzzleType,
      r.gridSize,
      r.algorithm,
      `"${r.algorithmLabel}"`,
      r.timeMs,
      r.nodesExplored,
      r.backtracks || 0,
      r.isAISolved
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  static downloadExport(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

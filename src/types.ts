export type PuzzleType = 
  | 'sudoku' 
  | 'nonogram' 
  | 'minesweeper' 
  | 'maze' 
  | 'n-queens' 
  | 'sliding-puzzle' 
  | 'math-latin-square' 
  | 'kenken';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ThemeType = 'classic' | 'modern' | 'cyber' | 'minimal' | 'dark';

export type AlgorithmType = 
  | 'backtracking' 
  | 'backtracking-mrv'
  | 'forward-checking'
  | 'ac3'
  | 'astar' 
  | 'astar-manhattan'
  | 'astar-weighted'
  | 'astar-hamming'
  | 'idastar'
  | 'bfs' 
  | 'dfs' 
  | 'dijkstra' 
  | 'greedy' 
  | 'logic' 
  | 'logical-deduction'
  | 'probabilistic'
  | 'hybrid'
  | 'constructive'
  | 'constraint-propagation';

export type MazeGenAlgorithm = 'prim' | 'kruskal' | 'recursive-dfs' | 'eller' | 'binary-tree' | 'dfs';

export type MathOp = '+' | '-' | '*' | '/';
export type KenKenOp = MathOp | 'none';

export interface MathLatinSquareData {
  rowTargets: number[];
  colTargets: number[];
  rowOps: MathOp[][];
  colOps: MathOp[][];
  solution?: any[][];
  grid?: any[][];
}

export interface KenKenCage {
  id: number;
  target: number;
  op: MathOp | '';
  cells: { r: number; c: number }[];
}

export interface KenKenData {
  cages: KenKenCage[];
  grid?: any[][];
  solution?: any[][];
}

export interface MazeData {
  grid: number[][];
  start: { r: number; c: number };
  end: { r: number; c: number };
  carvedCount?: number;
}

export interface NonogramData {
  rowClues: number[][];
  colClues: number[][];
  solution?: any[][];
  userGrid?: any[][];
}

export interface SolveStats {
  nodesExplored: number;
  nodesExpanded?: number;
  timeTaken: number;
  timeMs?: number;
  backtracks: number;
}

export interface SolverConfig {
  algorithm: AlgorithmType;
  genAlgorithm?: MazeGenAlgorithm;
  delay?: number;
  speed?: number;
  instant?: boolean;
  useHeuristics?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  isFull: boolean;
  conflicts: { r: number; c: number }[];
  errors: string[];
}

export interface PuzzleState {
  type: PuzzleType;
  size: number;
  difficulty?: Difficulty;
  grid: any[][];
  initialGrid: any[][];
  initialData?: any;
  solution?: any[][] | null;
  data?: any;
  rows?: number;
  cols?: number;
  moves?: number;
  undoStack?: any[][][];
  actualSeed?: number;
  solveStats?: SolveStats;
  generationId?: string | number;
  clues?: any;
  startTime: number;
  isSolved: boolean;
  isRevealed?: boolean;
  isAISolved?: boolean;
  errors: { r: number; c: number }[];
  seed: number | null;
}

export interface WorkerRequest {
  type: 'solve' | 'generate' | PuzzleType;
  puzzleType: PuzzleType;
  size: number;
  difficulty?: Difficulty;
  data?: any;
  config?: SolverConfig;
  seed?: string;
  rows?: number;
  cols?: number;
  algorithm?: AlgorithmType | MazeGenAlgorithm;
}

export interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  result?: any;
  stats?: SolveStats;
  error?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  puzzleType: PuzzleType;
  size: number;
  difficulty?: Difficulty;
  time: number;
  date: string;
}

export type MoveActionType = 
  | 'input'
  | 'clear'
  | 'slide'
  | 'reveal'
  | 'flag'
  | 'queen_place'
  | 'queen_remove'
  | 'mark_fill'
  | 'mark_cross'
  | 'mark_empty'
  | 'maze_node'
  | 'ai_solve_start'
  | 'ai_solve_finish'
  | 'ai_solve_cancel'
  | 'check_solution'
  | 'reveal_solution'
  | 'reset'
  | 'undo'
  | 'generate'
  | 'pause'
  | 'resume';

export type MoveActionCategory = 'player' | 'solver' | 'system';

export interface MoveLogEntry {
  id: string;
  seq: number;
  timestamp: number;
  timeDeltaMs: number;
  sessionTimer: number;
  puzzleType: PuzzleType;
  actionType: MoveActionType;
  category: MoveActionCategory;
  title: string;
  details: string;
  coordinates?: {
    r?: number;
    c?: number;
    fromR?: number;
    fromC?: number;
    toR?: number;
    toC?: number;
  };
  prevVal?: any;
  newVal?: any;
  status?: 'success' | 'valid' | 'conflict' | 'error' | 'info';
  metadata?: Record<string, any>;
}

export interface SessionAuditSummary {
  totalActions: number;
  playerMoves: number;
  solverActions: number;
  systemEvents: number;
  undoCount: number;
  conflictCount: number;
  actionsPerMinute: number;
  avgThinkTimeMs: number;
  sessionDurationSec: number;
  startedAt: number;
  lastActionAt: number;
}

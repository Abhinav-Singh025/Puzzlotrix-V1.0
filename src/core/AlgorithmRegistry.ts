import { PuzzleType, AlgorithmType, MazeGenAlgorithm } from '../types';

export interface AlgorithmInfo {
  value: AlgorithmType;
  label: string;
  description: string;
  maxSize?: number;
}

export const ALGORITHM_REGISTRY: Record<PuzzleType, AlgorithmInfo[]> = {
  'sliding-puzzle': [
    { value: 'astar-manhattan', label: 'A* (Manhattan)', description: 'Uses Manhattan distance heuristic.' },
    { value: 'astar-weighted', label: 'Weighted A*', description: 'Faster than A* for larger grids.' },
    { value: 'astar-hamming', label: 'A* (Hamming)', description: 'Uses number of misplaced tiles.' },
    { value: 'bfs', label: 'BFS', description: 'Breadth-First Search. Guaranteed shortest path.', maxSize: 4 },
    { value: 'dfs', label: 'DFS', description: 'Depth-First Search. Educational mode.', maxSize: 3 },
    { value: 'idastar', label: 'IDA*', description: 'Iterative Deepening A*. Memory efficient.', maxSize: 20 },
    { value: 'greedy', label: 'Greedy BFS', description: 'Fast but not always optimal.' },
  ],
  'maze': [
    { value: 'astar-manhattan', label: 'A*', description: 'Heuristic search for pathfinding.' },
    { value: 'bfs', label: 'BFS', description: 'Finds shortest path in unweighted grid.' },
    { value: 'dfs', label: 'DFS', description: 'Explores deep branches first.' },
    { value: 'dijkstra', label: 'Dijkstra', description: 'Weighted shortest path algorithm.' },
    { value: 'greedy', label: 'Greedy BFS', description: 'Fast but not always optimal.' },
    { value: 'hybrid', label: 'Dead End Filling', description: 'Prunes dead ends to reveal the path.' },
  ],
  'sudoku': [
    { value: 'backtracking', label: 'Basic Backtracking', description: 'Standard recursive search.' },
    { value: 'backtracking-mrv', label: 'Backtracking + MRV', description: 'Minimum Remaining Values heuristic.' },
    { value: 'forward-checking', label: 'Forward Checking', description: 'Prunes domains during search.' },
    { value: 'ac3', label: 'AC-3 + Backtracking', description: 'Arc consistency algorithm.' },
    { value: 'hybrid', label: 'Heuristic Hybrid', description: 'Optimized solver for Sudoku.', maxSize: 36 },
  ],
  'math-latin-square': [
    { value: 'backtracking', label: 'Backtracking', description: 'Standard recursive search with pruning.' },
    { value: 'backtracking-mrv', label: 'Heuristic MRV', description: 'Optimized solver for arithmetic constraints.' },
  ],
  'n-queens': [
    { value: 'backtracking', label: 'Backtracking', description: 'Standard recursive search.' },
    { value: 'constructive', label: 'Constructive Formula', description: 'O(1) mathematical solution.' },
    { value: 'hybrid', label: 'Hill Climbing', description: 'Experimental local search.' },
  ],
  'minesweeper': [
    { value: 'logical-deduction', label: 'Logical Deduction', description: 'Pure logic solver.' },
    { value: 'probabilistic', label: 'Probabilistic', description: 'Uses probability for guesses.' },
    { value: 'hybrid', label: 'Hybrid Solver', description: 'Logic + Probability.' },
  ],
  'nonogram': [
    { value: 'constraint-propagation', label: 'Constraint Propagation', description: 'Row/Column deduction.' },
    { value: 'backtracking', label: 'Backtracking', description: 'Recursive search for patterns.' },
    { value: 'hybrid', label: 'Hybrid Solver', description: 'Optimized Nonogram solver.' },
  ],
  'kenken': [
    { value: 'constraint-propagation', label: 'Constraint Propagation', description: 'Cage-based deduction.' },
    { value: 'backtracking', label: 'Backtracking', description: 'Recursive search with cage rules.' },
    { value: 'backtracking-mrv', label: 'Heuristic MRV', description: 'Optimized KenKen solver.' },
  ],
};

export const MAZE_GEN_ALGORITHMS: { value: MazeGenAlgorithm; label: string; description: string }[] = [
  { value: 'dfs', label: 'DFS (Recursive Backtracking)', description: 'Classic maze generation using depth-first search.' },
  { value: 'prim', label: 'Prim\'s Algorithm', description: 'Grows the maze from a starting point, creating a more natural look.' },
  { value: 'kruskal', label: 'Kruskal\'s Algorithm', description: 'Builds the maze by merging sets of cells, resulting in many short dead ends.' },
  { value: 'binary-tree', label: 'Binary Tree', description: 'Simple and fast, but creates very biased mazes with long corridors.' },
];

export function getAlgorithmsForPuzzle(type: PuzzleType, size: number): AlgorithmInfo[] {
  return ALGORITHM_REGISTRY[type].filter(algo => !algo.maxSize || size <= algo.maxSize);
}

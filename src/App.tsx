import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleType, ThemeType, PuzzleState, SolverConfig, MoveLogEntry, MoveActionType, MoveActionCategory } from './types';
import { Background } from './components/Backgrounds';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { GridRenderer } from './components/GridRenderer';
import { MoveHistoryLog } from './components/MoveHistoryLog';
import { MoveHistoryService } from './services/MoveHistoryService';
import { MIN_GRID_SIZE, MAX_GRID_SIZE, THEME_COLORS } from './constants';
import { MathLatinSquareEngine } from './engines/MathLatinSquare';
import { SudokuEngine } from './engines/Sudoku';
import { MazeEngine } from './engines/Maze';
import { NQueensEngine } from './engines/NQueens';
import { MinesweeperEngine } from './engines/Minesweeper';
import { NonogramEngine } from './engines/Nonogram';
import { KenKenEngine } from './engines/KenKen';
import { SlidingPuzzleEngine } from './engines/SlidingPuzzle';
import { SolverEngine } from './solvers/SolverEngine';
import { calculateStateSpace } from './utils/math';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Info, AlertTriangle, CheckCircle2, Play, Trophy, History, BarChart3, Activity } from 'lucide-react';
import { RNG } from './utils/rng';
import { ValidationEngine, ValidationResult } from './services/ValidationEngine';
import { InfoModal } from './components/InfoModal';
import { Leaderboard as LeaderboardUI } from './components/Leaderboard';
import { Leaderboard as LeaderboardStore } from './core/Leaderboard';
import { Validator } from './core/Validator';
import { ALGORITHM_REGISTRY } from './core/AlgorithmRegistry';
import { SolveAnalyticsModal } from './components/SolveAnalyticsModal';
import { SolveMetricsService, SolveRecord } from './services/SolveMetricsService';

const safeClone = (obj: any) => {
  if (obj === undefined) return undefined;
  try {
    const json = JSON.stringify(obj);
    if (json === undefined) return undefined;
    return JSON.parse(json);
  } catch (e) {
    return obj;
  }
};

export default function App() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('math-latin-square');
  const [gridSize, setGridSize] = useState<number>(5);
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(4);
  const [seed, setSeed] = useState<number | null>(123456);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [solverConfig, setSolverConfig] = useState<SolverConfig>({
    algorithm: 'backtracking',
    speed: 50,
    instant: true
  });
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [genTime, setGenTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ 
    isValid: true, 
    isComplete: false, 
    isFull: false, 
    conflicts: [], 
    errors: [] 
  });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [timer, setTimer] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [recentSolves, setRecentSolves] = useState<SolveRecord[]>(() => SolveMetricsService.getRecentSolves());
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [username, setUsername] = useState<string>(() => localStorage.getItem('puzzlotrix_user') || 'Player 1');

  const timerRef = useRef(timer);
  useEffect(() => { timerRef.current = timer; }, [timer]);

  const puzzleTypeRef = useRef(puzzleType);
  useEffect(() => { puzzleTypeRef.current = puzzleType; }, [puzzleType]);

  const logAction = useCallback((params: {
    actionType: MoveActionType;
    category: MoveActionCategory;
    title: string;
    details: string;
    coordinates?: { r?: number; c?: number; fromR?: number; fromC?: number; toR?: number; toC?: number };
    prevVal?: any;
    newVal?: any;
    status?: 'success' | 'valid' | 'conflict' | 'error' | 'info';
    metadata?: Record<string, any>;
  }) => {
    const entry = MoveHistoryService.createEntry({
      ...params,
      puzzleType: puzzleTypeRef.current,
      sessionTimer: timerRef.current,
    });
    setMoveHistory(prev => [...prev, entry]);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('puzzlotrix_user');
    if (savedUser) {
      setUsername(savedUser);
    } else {
      setUsername('Player 1');
      localStorage.setItem('puzzlotrix_user', 'Player 1');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/leaderboard?type=${puzzleType}&size=${gridSize}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLeaderboard(data);
        } else if (isMounted) {
          setLeaderboard(LeaderboardStore.get(puzzleType, gridSize));
        }
      })
      .catch(() => {
        if (isMounted) setLeaderboard(LeaderboardStore.get(puzzleType, gridSize));
      });
    return () => { isMounted = false; };
  }, [puzzleType, gridSize]);

  useEffect(() => {
    // Reset puzzle state when grid size changes
    setPuzzle(null);
    setValidation({ 
      isValid: true, 
      isComplete: false, 
      isFull: false, 
      conflicts: [], 
      errors: [] 
    });
    setTimer(0);
    setHasStarted(false);
    setIsPaused(false);
    setError(null);
    setSuccess(null);
    setSelectedCell(null);
    SolverEngine.terminate();
  }, [gridSize, rows, cols, puzzleType]);

  const generatePuzzle = useCallback(() => {
    const validation = Validator.canGenerate(puzzleType, gridSize, seed || undefined);
    if (!validation.valid) {
      setError(validation.message || "Invalid generation parameters.");
      return;
    }

    const startTime = performance.now();
    let data: any;
    let solution: any;
    
    // Clamp grid size
    const clampedSize = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, gridSize));
    const currentSeed = seed === null ? Math.floor(Math.random() * 1e12) : seed;
    
    let finalSize = clampedSize;
    
    try {
      switch (puzzleType) {
        case 'math-latin-square': {
          const mathData = MathLatinSquareEngine.generate(clampedSize, currentSeed);
          data = mathData;
          solution = mathData.solution;
          break;
        }
        case 'sudoku': {
          let root = Math.round(Math.sqrt(clampedSize));
          let square = root * root;
          if (square > MAX_GRID_SIZE) {
            square = 16;
          }
          finalSize = Math.max(4, square);
          const subgridSize = Math.sqrt(finalSize);
          const sudokuData = SudokuEngine.generate(subgridSize, 'medium', new RNG(currentSeed));
          data = sudokuData.grid;
          solution = sudokuData.solution;
          break;
        }
        case 'maze':
          data = MazeEngine.generate(clampedSize, new RNG(currentSeed));
          solution = null; // Maze solution is found by solver
          break;
        case 'n-queens':
          data = NQueensEngine.generate(clampedSize, currentSeed);
          solution = null; // Found by solver
          break;
        case 'minesweeper':
          data = MinesweeperEngine.generate(clampedSize, currentSeed);
          solution = data.grid; // In minesweeper, the grid is the solution
          break;
        case 'nonogram': {
          const nonoData = NonogramEngine.generate(clampedSize, 'medium', new RNG(currentSeed));
          data = {
            userGrid: nonoData.userGrid,
            clues: nonoData.clues
          };
          solution = nonoData.solution;
          break;
        }
        case 'kenken':
          data = KenKenEngine.generate(clampedSize, currentSeed);
          solution = data.solution;
          break;
        case 'sliding-puzzle': {
          const clampedRows = Math.max(3, Math.min(MAX_GRID_SIZE, rows));
          const clampedCols = Math.max(3, Math.min(MAX_GRID_SIZE, cols));
          const slidingData = SlidingPuzzleEngine.generate(clampedRows, clampedCols, currentSeed);
          data = slidingData;
          // Target state is [1, 2, 3, ..., 0]
          solution = Array.from({ length: clampedRows * clampedCols }, (_, i) => (i === clampedRows * clampedCols - 1 ? 0 : i + 1));
          break;
        }
      }

      let finalRows = puzzleType === 'sliding-puzzle' ? Math.max(3, Math.min(MAX_GRID_SIZE, rows)) : finalSize;
      let finalCols = puzzleType === 'sliding-puzzle' ? Math.max(3, Math.min(MAX_GRID_SIZE, cols)) : finalSize;

      if (puzzleType === 'maze' && data?.grid && Array.isArray(data.grid) && data.grid.length > 0 && data.grid[0]) {
        finalRows = data.grid.length;
        finalCols = data.grid[0].length;
      }

      setPuzzle({
        type: puzzleType,
        size: finalSize,
        rows: finalRows,
        cols: finalCols,
        seed: seed,
        actualSeed: currentSeed,
        generationId: generationCount,
        data: data,
        initialData: safeClone(data),
        grid: [], // Initialize grid
        initialGrid: [], // Initialize initialGrid
        solution: solution,
        startTime: Date.now(),
        isSolved: false,
        errors: []
      });
      setGenTime(performance.now() - startTime);
      setTimer(0);
      setHasStarted(false);
      setIsPaused(false);
      setError(null);
      setSuccess(null);
      setValidation({ 
        isValid: true, 
        isComplete: false, 
        isFull: false, 
        conflicts: [], 
        errors: [] 
      });
      setSelectedCell(null);
      logAction({
        actionType: 'generate',
        category: 'system',
        title: `Generated ${puzzleType} (${finalRows}×${finalCols})`,
        details: `Seed: ${currentSeed}`,
        status: 'info',
        metadata: { size: finalSize, rows: finalRows, cols: finalCols, seed: currentSeed }
      });
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Generation failed for this size/type combination.");
    }
  }, [puzzleType, gridSize, seed, solverConfig.genAlgorithm, generationCount]);

  useEffect(() => {
    generatePuzzle();
  }, [puzzleType, gridSize, rows, cols, seed, solverConfig.genAlgorithm, generationCount]);

  useEffect(() => {
    if (puzzle && !isSolving) {
      const result = ValidationEngine.validate(puzzle.type, puzzle.size, puzzle.data, puzzle.solution, false, puzzle.isSolved);
      setValidation(result);
    }
  }, [puzzle?.data, puzzle?.type, puzzle?.size, puzzle?.solution, isSolving, puzzle?.isSolved]);

  const handleGenerate = () => {
    setGenerationCount(prev => prev + 1);
  };

  const handleSolve = async () => {
    if (!puzzle || isSolving) return;
    
    const validation = Validator.canSolve(puzzle.type, puzzle.size, puzzle.rows, puzzle.cols);
    if (!validation.valid) {
      setError(validation.message || "Solve disabled for this complexity.");
      return;
    }

    setIsSolving(true);
    setError(null);
    setSuccess(null);
    logAction({
      actionType: 'ai_solve_start',
      category: 'solver',
      title: `AI Solver Started`,
      details: `Algorithm: ${solverConfig.algorithm} on ${puzzle.type} (${puzzle.rows || puzzle.size}×${puzzle.cols || puzzle.size})`,
      status: 'info',
      metadata: { algorithm: solverConfig.algorithm }
    });
    const solveStartTime = performance.now();
    
    try {
      const result = await SolverEngine.solve(puzzle.type, solverConfig.algorithm, puzzle.data, puzzle.size, puzzle.rows, puzzle.cols);
      
      const isSliding = puzzle.type === 'sliding-puzzle';
      const isMaze = puzzle.type === 'maze';
      const shouldAnimate = (isSliding || (isMaze && puzzle.size <= 40));
      
      if (shouldAnimate) {
        const stepDelay = 20;
        
        if (isSliding && result.solution) {
          const path = result.solution;
          for (let i = 1; i < path.length; i++) {
            if (!isSolving) break;
            const currentGrid = path[i];
            setPuzzle(prev => prev ? {
              ...prev,
              data: {
                ...prev.data,
                grid: currentGrid,
                emptyIdx: currentGrid.indexOf(0)
              },
              moves: i
            } : null);
            setTimer(Math.floor((performance.now() - solveStartTime) / 1000));
            await new Promise(r => setTimeout(r, stepDelay * 1.5));
          }
        } else if (isMaze && result.visited) {
          const visited = result.visited!;
          const frontier = result.frontier || [];
          const stepSize = Math.max(1, Math.floor(visited.length / 30));
          
          for (let i = 0; i < visited.length; i += stepSize) {
            if (!isSolving) break;
            const currentVisited = visited.slice(0, i + stepSize);
            const currentFrontier = frontier.slice(0, Math.min(frontier.length, i + stepSize));
            
            setPuzzle(prev => prev ? {
              ...prev,
              data: {
                ...prev.data,
                currentVisited,
                currentFrontier
              }
            } : null);
            
            if (i % (stepSize * 5) === 0) {
              setTimer(Math.floor((performance.now() - solveStartTime) / 1000));
            }
            
            await new Promise(r => setTimeout(r, stepDelay));
          }
        }
      }

      const solveEndTime = performance.now();
      const finalStats = {
        ...result.stats,
        timeMs: solveEndTime - solveStartTime
      };

      setPuzzle(prev => {
        if (!prev) return null;
        
        if (!result.solution) {
          setError("Unsolvable puzzle or search space exceeded.");
          return prev;
        }

        setSuccess(result.message || "AI Solved Successfully");
        setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
        logAction({
          actionType: 'ai_solve_finish',
          category: 'solver',
          title: `AI Solved Successfully`,
          details: `Completed in ${(solveEndTime - solveStartTime).toFixed(1)}ms (${finalStats.nodesExpanded || finalStats.nodesExplored || 0} nodes)`,
          status: 'success',
          metadata: finalStats
        });

        let newData = safeClone(prev.data);
        if (['sudoku', 'math-latin-square', 'kenken', 'nonogram', 'sliding-puzzle', 'n-queens'].includes(prev.type)) {
          if (prev.type === 'nonogram') {
            newData.userGrid = safeClone(result.solution);
          } else if (prev.type === 'math-latin-square' || prev.type === 'kenken') {
            newData.grid = safeClone(result.solution);
          } else if (prev.type === 'n-queens') {
            newData = safeClone(result.solution);
          } else if (prev.type === 'sliding-puzzle') {
            const path = result.solution;
            if (path && path.length > 0) {
              const lastGrid = path[path.length - 1];
              newData.grid = safeClone(lastGrid);
              newData.emptyIdx = lastGrid.indexOf(0);
            }
          } else {
            newData = safeClone(result.solution);
          }
        }

        return {
          ...prev,
          data: newData,
          solution: result.solution,
          isSolved: true,
          isAISolved: true,
          solveStats: finalStats,
          moves: isSliding ? (result.solution.length - 1) : prev.moves
        };
      });
      
      setTimer(Math.floor((solveEndTime - solveStartTime) / 1000));

      // Record solve metrics for recent solves graph
      if (result.solution && puzzle) {
        SolveMetricsService.recordSolve({
          puzzleType: puzzle.type,
          gridSize: puzzle.size,
          rows: puzzle.rows,
          cols: puzzle.cols,
          algorithm: solverConfig.algorithm,
          algorithmLabel: ALGORITHM_REGISTRY[puzzle.type]?.find(a => a.value === solverConfig.algorithm)?.label || solverConfig.algorithm,
          timeMs: solveEndTime - solveStartTime,
          nodesExplored: finalStats.nodesExplored || finalStats.nodesExpanded || 1,
          nodesExpanded: finalStats.nodesExpanded,
          backtracks: finalStats.backtracks || 0,
          isAISolved: true,
          success: true,
          seed: puzzle.actualSeed ?? seed
        });
        setRecentSolves(SolveMetricsService.getRecentSolves());
      }

      // Auto-submit score if it was a manual solve (not AI solve)
      // Actually, let's only submit if it's a manual solve. 
      // But handleSolve is the AI solver. 
      // Manual solve happens in handleCellClick/handleKeyDown.
    } catch (err: any) {
      console.error("Solve failed:", err);
      setError(err.message || "Solving failed.");
      logAction({
        actionType: 'ai_solve_finish',
        category: 'solver',
        title: `AI Solve Failed`,
        details: err.message || "Solving failed or search limit reached",
        status: 'error'
      });
    } finally {
      setIsSolving(false);
    }
  };

  const handleCancel = () => {
    SolverEngine.terminate();
    setIsSolving(false);
    logAction({
      actionType: 'ai_solve_cancel',
      category: 'solver',
      title: `AI Solver Canceled`,
      details: `User terminated solver execution`,
      status: 'info'
    });
  };

  const handleCellClick = (r: number, c: number, e?: React.MouseEvent, val?: number) => {
    if (!puzzle || isSolving || puzzle.isSolved || isPaused) return;
    setError(null);
    setSuccess(null);

    // Handle Right Click (Flagging)
    if (e && (e.button === 2 || e.type === 'contextmenu')) {
      if (puzzle.type === 'minesweeper') {
        if (puzzle.data.revealed[r][c]) return;
        const willBeFlagged = !puzzle.data.flagged[r][c];
        const newFlagged = puzzle.data.flagged.map((row: any) => [...row]);
        newFlagged[r][c] = willBeFlagged;
        setPuzzle({
          ...puzzle,
          data: { ...puzzle.data, flagged: newFlagged }
        });
        logAction({
          actionType: 'flag',
          category: 'player',
          title: willBeFlagged ? `Flagged [R${r+1}, C${c+1}]` : `Unflagged [R${r+1}, C${c+1}]`,
          details: willBeFlagged ? `Marked suspected mine at Row ${r+1}, Col ${c+1}` : `Removed mine flag from Row ${r+1}, Col ${c+1}`,
          coordinates: { r, c },
          prevVal: willBeFlagged ? '·' : '🚩',
          newVal: willBeFlagged ? '🚩' : '·',
          status: 'valid'
        });
      }
      return;
    }

    if (puzzle.type === 'sudoku' || puzzle.type === 'kenken' || puzzle.type === 'math-latin-square') {
      setSelectedCell({ r, c });
      return;
    }

    setHasStarted(true);

    if (puzzle.type === 'sliding-puzzle') {
      const { grid, emptyIdx, rows, cols } = puzzle.data;
      const targetIdx = r * cols + c;
      const emptyR = Math.floor(emptyIdx / cols);
      const emptyC = emptyIdx % cols;

      // Check if in same row or column
      if (r === emptyR || c === emptyC) {
        const newGrid = [...grid];
        let newEmptyIdx = emptyIdx;

        if (r === emptyR) {
          // Horizontal shift
          const step = c < emptyC ? -1 : 1;
          for (let currC = emptyC; currC !== c; currC += step) {
            const fromIdx = emptyR * cols + (currC + step);
            const toIdx = emptyR * cols + currC;
            newGrid[toIdx] = newGrid[fromIdx];
          }
          newGrid[targetIdx] = 0;
          newEmptyIdx = targetIdx;
        } else {
          // Vertical shift
          const step = r < emptyR ? -1 : 1;
          for (let currR = emptyR; currR !== r; currR += step) {
            const fromIdx = (currR + step) * cols + c;
            const toIdx = currR * cols + c;
            newGrid[toIdx] = newGrid[fromIdx];
          }
          newGrid[targetIdx] = 0;
          newEmptyIdx = targetIdx;
        }

        const newPuzzle = {
          ...puzzle,
          data: { ...puzzle.data, grid: newGrid, emptyIdx: newEmptyIdx },
          moves: (puzzle.moves || 0) + 1,
          undoStack: [...(puzzle.undoStack || []), safeClone(puzzle.data)]
        };

        // Check win
        const isWin = SlidingPuzzleEngine.isSolved(newGrid);
        const tileVal = grid[targetIdx];
        const isHorizontal = r === emptyR;
        const direction = isHorizontal ? (c < emptyC ? 'Right' : 'Left') : (r < emptyR ? 'Down' : 'Up');
        const tilesCount = isHorizontal ? Math.abs(c - emptyC) : Math.abs(r - emptyR);
        logAction({
          actionType: 'slide',
          category: 'player',
          title: `Slid tile ${tileVal} [${direction}]`,
          details: `Shifted ${tilesCount} tile(s) ${direction.toLowerCase()} from [R${r+1}, C${c+1}] to [R${emptyR+1}, C${emptyC+1}]`,
          coordinates: { fromR: r, fromC: c, toR: emptyR, toC: emptyC },
          prevVal: tileVal,
          newVal: 0,
          status: isWin ? 'success' : 'valid'
        });

        if (isWin) {
          setSuccess("Solved Correctly");
          newPuzzle.isSolved = true;
          setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
          submitScore(newPuzzle, timer);
        }
        setPuzzle(newPuzzle);
      }
    } else if (puzzle.type === 'minesweeper') {
      if (!puzzle.data.revealed || !puzzle.data.flagged) return;
      if (puzzle.data.revealed[r]?.[c] || puzzle.data.flagged[r]?.[c]) return;
      
      const newRevealed = puzzle.data.revealed.map((row: any) => [...row]);
      const newGrid = puzzle.data.grid.map((row: any) => [...row]);
      
      // Safe First Click Logic
      const isFirstClick = puzzle.data.revealed.every((row: any) => row.every((cell: any) => !cell));
      if (isFirstClick && newGrid[r][c] === -1) {
        // Move the mine to the first available safe spot
        let moved = false;
        for (let ri = 0; ri < puzzle.size && !moved; ri++) {
          for (let ci = 0; ci < puzzle.size && !moved; ci++) {
            if (newGrid[ri][ci] !== -1) {
              newGrid[ri][ci] = -1;
              newGrid[r][c] = 0; // Temporarily safe
              moved = true;
            }
          }
        }
        // Recalculate numbers
        MinesweeperEngine.calculateNumbers(newGrid, puzzle.size);
      }

      newRevealed[r][c] = true;
      
      if (newGrid[r][c] === -1) {
        setError("Game Over! You hit a mine.");
        const revealedAll = puzzle.data.revealed.map((row: any, ri: number) => 
          row.map((col: any, ci: number) => newGrid[ri][ci] === -1 ? true : col)
        );
        setPuzzle({ ...puzzle, isSolved: true, data: { ...puzzle.data, grid: newGrid, revealed: revealedAll } });
        logAction({
          actionType: 'reveal',
          category: 'player',
          title: `Detonated Mine [R${r+1}, C${c+1}] 💣`,
          details: `Revealed mine at Row ${r+1}, Col ${c+1}. Game over.`,
          coordinates: { r, c },
          prevVal: '·',
          newVal: '💣',
          status: 'error'
        });
      } else {
        // Flood fill for 0s
        if (newGrid[r][c] === 0) {
          const queue = [{ r, c }];
          while (queue.length > 0) {
            const curr = queue.shift()!;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = curr.r + dr;
                const nc = curr.c + dc;
                if (nr >= 0 && nr < puzzle.size && nc >= 0 && nc < puzzle.size && !newRevealed[nr][nc]) {
                  newRevealed[nr][nc] = true;
                  if (newGrid[nr][nc] === 0) {
                    queue.push({ r: nr, c: nc });
                  }
                }
              }
            }
          }
        }

        const newPuzzle = {
          ...puzzle,
          data: { ...puzzle.data, grid: newGrid, revealed: newRevealed }
        };

        // Check win condition: all non-mine cells revealed
        let unrevealedSafeCells = 0;
        for (let ri = 0; ri < puzzle.size; ri++) {
          for (let ci = 0; ci < puzzle.size; ci++) {
            if (newGrid[ri][ci] !== -1 && !newRevealed[ri][ci]) {
              unrevealedSafeCells++;
            }
          }
        }

        logAction({
          actionType: 'reveal',
          category: 'player',
          title: `Revealed cell [R${r+1}, C${c+1}]`,
          details: `Safe cell with ${newGrid[r][c]} adjacent mine(s)`,
          coordinates: { r, c },
          prevVal: '·',
          newVal: newGrid[r][c],
          status: unrevealedSafeCells === 0 ? 'success' : 'valid'
        });

        if (unrevealedSafeCells === 0) {
          setSuccess("Solved Correctly! All mines cleared.");
          newPuzzle.isSolved = true;
          setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
          submitScore(newPuzzle, timer);
        }

        setPuzzle(newPuzzle);
      }
    } else if (puzzle.type === 'maze') {
      if (puzzle.data.grid[r][c] === 1) {
        setError("Cannot place Start/End on a wall.");
        return;
      }
      
      const isStart = puzzle.data.start && r === puzzle.data.start.r && c === puzzle.data.start.c;
      const isEnd = puzzle.data.end && r === puzzle.data.end.r && c === puzzle.data.end.c;
      
      if (isStart) {
        setIsDragging(isDragging === 'start' ? null : 'start');
        setSuccess(isDragging === 'start' ? null : "Start node selected. Click an empty cell to move it.");
        setError(null);
        return;
      }
      if (isEnd) {
        setIsDragging(isDragging === 'end' ? null : 'end');
        setSuccess(isDragging === 'end' ? null : "End node selected. Click an empty cell to move it.");
        setError(null);
        return;
      }

      if (isDragging) {
        const newData = { ...puzzle.data };
        const movedNode = isDragging === 'start' ? 'Start (S)' : 'End (E)';
        if (isDragging === 'start') {
          if (newData.end && r === newData.end.r && c === newData.end.c) {
            setError("Start and End cannot be on the same cell.");
            return;
          }
          newData.start = { r, c };
        } else {
          if (newData.start && r === newData.start.r && c === newData.start.c) {
            setError("Start and End cannot be on the same cell.");
            return;
          }
          newData.end = { r, c };
        }
        
        logAction({
          actionType: 'maze_node',
          category: 'player',
          title: `Moved ${movedNode} node`,
          details: `Relocated ${movedNode} to [R${r+1}, C${c+1}]`,
          coordinates: { r, c },
          status: 'valid'
        });

        setPuzzle({
          ...puzzle,
          data: newData,
          isSolved: false,
          solution: undefined
        });
        setIsDragging(null);
        setSuccess(null);
        setError(null);
      } else {
        setSuccess("Click the Start (S) or End (E) node to move it.");
      }
    }
 else if (puzzle.type === 'n-queens') {
      const newQueens = [...puzzle.data];
      const isRemoving = newQueens[c] === r;
      if (isRemoving) {
        newQueens[c] = -1; // Remove
      } else {
        newQueens[c] = r; // Place
      }
      
      const checkVal = ValidationEngine.validate('n-queens', puzzle.size, newQueens);
      const isWin = checkVal.isComplete;

      logAction({
        actionType: isRemoving ? 'queen_remove' : 'queen_place',
        category: 'player',
        title: isRemoving ? `Removed Queen from Col ${c+1}` : `Placed Queen [R${r+1}, C${c+1}]`,
        details: isRemoving ? `Removed Queen placed on column ${c+1}` : `Placed Queen at Row ${r+1}, Column ${c+1}`,
        coordinates: { r, c },
        prevVal: isRemoving ? '♛' : '·',
        newVal: isRemoving ? '·' : '♛',
        status: isWin ? 'success' : checkVal.isValid ? 'valid' : 'conflict'
      });

      const updatedPuzzle = {
        ...puzzle,
        data: newQueens,
        isSolved: isWin
      };

      if (isWin) {
        setSuccess("Solved Correctly! All queens placed safely without conflicts.");
        setValidation(checkVal);
        submitScore(updatedPuzzle, timer);
      }
      setPuzzle(updatedPuzzle);
    } else if (puzzle.type === 'nonogram') {
      const newGrid = puzzle.data.userGrid.map((row: any) => [...row]);
      const prevVal = newGrid[r][c];
      let targetVal: number;
      if (val !== undefined) {
        targetVal = val;
      } else {
        // Cycle: 0 -> 1 -> -1 -> 0
        if (prevVal === 0) targetVal = 1;
        else if (prevVal === 1) targetVal = -1;
        else targetVal = 0;
      }
      newGrid[r][c] = targetVal;
      
      const checkVal = ValidationEngine.validate('nonogram', puzzle.size, { ...puzzle.data, userGrid: newGrid }, puzzle.solution);
      const isWin = checkVal.isComplete;

      const label = targetVal === 1 ? 'Filled (■)' : targetVal === -1 ? 'Cross (×)' : 'Empty';
      logAction({
        actionType: targetVal === 1 ? 'mark_fill' : targetVal === -1 ? 'mark_cross' : 'mark_empty',
        category: 'player',
        title: `Marked [R${r+1}, C${c+1}] as ${label}`,
        details: `Nonogram cell updated from ${prevVal === 1 ? 'Filled' : prevVal === -1 ? 'Cross' : 'Empty'} to ${label}`,
        coordinates: { r, c },
        prevVal,
        newVal: targetVal,
        status: isWin ? 'success' : 'valid'
      });
      
      const updatedPuzzle = {
        ...puzzle,
        data: { ...puzzle.data, userGrid: newGrid },
        isSolved: isWin
      };

      if (isWin) {
        setSuccess("Solved Correctly! Picture completed.");
        setValidation(checkVal);
        submitScore(updatedPuzzle, timer);
      }
      setPuzzle(updatedPuzzle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!puzzle || !selectedCell || isSolving || puzzle.isSolved || isPaused) return;
    setHasStarted(true);

    if (['sudoku', 'kenken', 'math-latin-square'].includes(puzzle.type)) {
      const key = e.key;
      const isSimpleGrid = puzzle.type === 'sudoku';
      const currentGrid = isSimpleGrid ? puzzle.data : puzzle.data.grid;
      
      if (key === 'Backspace' || key === 'Delete') {
        const currentVal = currentGrid[selectedCell.r][selectedCell.c];
        if (currentVal !== 0) {
          const newGrid = currentGrid.map((row: any) => [...row]);
          newGrid[selectedCell.r][selectedCell.c] = 0;
          setPuzzle({
            ...puzzle,
            data: isSimpleGrid ? newGrid : { ...puzzle.data, grid: newGrid }
          });
          logAction({
            actionType: 'clear',
            category: 'player',
            title: `Cleared cell [R${selectedCell.r+1}, C${selectedCell.c+1}]`,
            details: `Removed value '${currentVal}' from Row ${selectedCell.r+1}, Col ${selectedCell.c+1}`,
            coordinates: { r: selectedCell.r, c: selectedCell.c },
            prevVal: currentVal,
            newVal: 0,
            status: 'valid'
          });
        }
      } else if (/^[0-9]$/.test(key)) {
        const num = parseInt(key);
        const currentVal = currentGrid[selectedCell.r][selectedCell.c];
        
        // Allow up to 6 digits (999,999) as requested
        const combinedStr = currentVal === 0 ? `${num}` : `${currentVal}${num}`;
        if (combinedStr.length <= 6) {
          const newVal = parseInt(combinedStr);
          const newGrid = currentGrid.map((row: any) => [...row]);
          newGrid[selectedCell.r][selectedCell.c] = newVal;
          setPuzzle({
            ...puzzle,
            data: isSimpleGrid ? newGrid : { ...puzzle.data, grid: newGrid }
          });
          logAction({
            actionType: 'input',
            category: 'player',
            title: `Entered '${newVal}' at [R${selectedCell.r+1}, C${selectedCell.c+1}]`,
            details: `Updated Row ${selectedCell.r+1}, Col ${selectedCell.c+1} from '${currentVal}' to '${newVal}'`,
            coordinates: { r: selectedCell.r, c: selectedCell.c },
            prevVal: currentVal,
            newVal: newVal,
            status: 'valid'
          });
        }
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      handleKeyDown(e as unknown as React.KeyboardEvent);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown]);

  const handleReset = () => {
    if (!puzzle) return;
    setPuzzle({
      ...puzzle,
      data: safeClone(puzzle.initialData),
      isSolved: false,
      solution: undefined,
      solveStats: undefined,
      moves: 0,
      undoStack: []
    });
    setTimer(0);
    setHasStarted(false);
    setError(null);
    setSuccess(null);
    setSelectedCell(null);
    logAction({
      actionType: 'reset',
      category: 'system',
      title: 'Reset Puzzle',
      details: 'Restored puzzle board to initial state',
      status: 'info'
    });
  };

  const handleUndo = () => {
    if (!puzzle || !puzzle.undoStack || puzzle.undoStack.length === 0 || puzzle.isSolved) return;
    const newStack = [...puzzle.undoStack];
    const lastData = newStack.pop();
    const remainingMoves = Math.max(0, (puzzle.moves || 0) - 1);
    setPuzzle({
      ...puzzle,
      data: lastData,
      undoStack: newStack,
      moves: remainingMoves
    });
    logAction({
      actionType: 'undo',
      category: 'player',
      title: 'Undo Move',
      details: `Reverted to previous puzzle state (${remainingMoves} moves remaining)`,
      status: 'valid'
    });
  };

  const handleShuffle = () => {
    setSeed(null);
    setGenerationCount(prev => prev + 1);
  };

  const handleCheckSolution = () => {
    if (!puzzle) return;
    setError(null);
    setSuccess(null);

    const result = ValidationEngine.validate(puzzle.type, puzzle.size, puzzle.data, puzzle.solution, false, puzzle.isSolved);
    setValidation(result);

    const errorMessage = result.errors && result.errors.length > 0 
      ? result.errors[0]
      : (!result.isValid 
          ? "Constraints violated. Check highlighted conflicts." 
          : (!result.isFull ? "Incomplete: Some cells remain empty." : "Keep trying!"));

    logAction({
      actionType: 'check_solution',
      category: 'player',
      title: 'Checked Solution',
      details: result.isComplete 
        ? 'Complete and Valid! Solved correctly.' 
        : errorMessage,
      status: result.isComplete ? 'success' : !result.isValid ? 'conflict' : 'info',
      metadata: {
        isValid: result.isValid,
        isComplete: result.isComplete,
        conflictsCount: result.conflicts.length,
      }
    });

    if (result.isComplete) {
      setSuccess("Solved Correctly! Great job!");
      const solvedPuzzle = { ...puzzle, isSolved: true };
      setPuzzle(solvedPuzzle);
      
      // Submit score to leaderboard
      submitScore(solvedPuzzle, timer);

      // Record solve metrics for recent solves graph
      SolveMetricsService.recordSolve({
        puzzleType: puzzle.type,
        gridSize: puzzle.size,
        rows: puzzle.rows,
        cols: puzzle.cols,
        algorithm: 'player',
        algorithmLabel: `Player (${username || 'Player 1'})`,
        timeMs: Math.max(100, timer * 1000),
        nodesExplored: puzzle.moves || 1,
        nodesExpanded: puzzle.moves,
        backtracks: 0,
        isAISolved: false,
        success: true,
        seed: puzzle.actualSeed ?? seed
      });
      setRecentSolves(SolveMetricsService.getRecentSolves());
    } else {
      setError(errorMessage);
    }
  };

  const handleRevealSolution = () => {
    if (!puzzle) return;
    
    const revealedPuzzle = {
      ...puzzle,
      isSolved: true,
      isRevealed: true,
      data: safeClone(puzzle.data)
    };

    // Overwrite userGrid with solutionGrid
    if (['sudoku', 'math-latin-square', 'kenken', 'nonogram', 'n-queens', 'minesweeper'].includes(puzzle.type)) {
      if (puzzle.type === 'nonogram') {
        revealedPuzzle.data.userGrid = safeClone(puzzle.solution);
      } else if (puzzle.type === 'math-latin-square' || puzzle.type === 'kenken') {
        revealedPuzzle.data.grid = safeClone(puzzle.solution);
      } else if (puzzle.type === 'n-queens') {
        if (puzzle.solution) {
          revealedPuzzle.data = safeClone(puzzle.solution);
        } else {
          setError("Use AI Solve to find the solution for N-Queens.");
          return;
        }
      } else if (puzzle.type === 'minesweeper') {
        revealedPuzzle.data.revealed = revealedPuzzle.data.revealed.map((row: any) => row.map(() => true));
      } else {
        revealedPuzzle.data = safeClone(puzzle.solution);
      }
    } else if (puzzle.type === 'sliding-puzzle' && puzzle.solution) {
      revealedPuzzle.data.grid = safeClone(puzzle.solution);
      revealedPuzzle.data.emptyIdx = puzzle.solution.length - 1;
    }

    setPuzzle(revealedPuzzle);
    setSuccess("Solution Revealed. Leaderboard submission disabled.");
    setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
    setError(null);
    logAction({
      actionType: 'reveal_solution',
      category: 'player',
      title: 'Revealed Solution',
      details: 'Entire puzzle solution revealed by player',
      status: 'info'
    });
  };

  const submitScore = async (p: PuzzleState, time: number) => {
    if (p.isRevealed || p.isAISolved) return;
    
    const name = (username && username.trim()) || localStorage.getItem('puzzlotrix_user') || 'Player 1';
    const solveTimeSeconds = Math.max(1, time);
    const solveTimeMs = Math.round(solveTimeSeconds * 1000);

    const apiPayload = {
      username: name,
      puzzle_type: p.type,
      grid_size: p.size,
      time_ms: solveTimeMs,
      moves: p.moves || 0,
      seed: p.actualSeed !== undefined ? Number(p.actualSeed) : undefined
    };

    const localEntry = {
      puzzleType: p.type,
      gridSize: p.size,
      seed: String(p.actualSeed || ''),
      username: name,
      solveTime: solveTimeSeconds,
      time_ms: solveTimeMs,
      moves: p.moves || 0,
      timestamp: Date.now()
    };

    // Save to local storage first for offline/instant fallback
    try {
      LeaderboardStore.submit(localEntry);
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
    
    // Send to backend API to record activity
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });
      if (res.ok) {
        const updatedRes = await fetch(`/api/leaderboard?type=${p.type}&size=${p.size}&limit=10`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setLeaderboard(data);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Could not post to /api/leaderboard:", err);
    }

    setLeaderboard(LeaderboardStore.get(p.type, p.size));
  };

  const stateSpace = calculateStateSpace(puzzleType, gridSize, puzzle?.rows, puzzle?.cols);

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 font-sans transition-colors duration-500 overflow-y-auto">
      <Background theme={theme} />
      
      <header className="w-full max-w-[1600px] flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">
            Puzzlotrix
          </h1>
          <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-50">
            Interactive AI Puzzle Solver
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Player</span>
            <span className="text-xs font-black italic text-orange-500">{username || 'Anonymous'}</span>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="View Source"
            >
              <Github size={20} />
            </a>
            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Information"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Leaderboard"
            >
              <Trophy size={20} />
            </button>
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="relative p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Move History & Audit Log"
            >
              <History size={20} />
              {moveHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-[#FF7A00] text-black text-[9px] font-black rounded-full min-w-[16px] text-center shadow-md">
                  {moveHistory.length > 99 ? '99+' : moveHistory.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="relative p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Algorithm Solving Graphs & Analytics"
            >
              <BarChart3 size={20} className="text-[#FF7A00]" />
              {recentSolves.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#FF7A00] text-black text-[9px] font-black rounded-full min-w-[16px] text-center shadow-md animate-pulse">
                  {recentSolves.length > 99 ? '99+' : recentSolves.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <LeaderboardUI 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        puzzleType={puzzleType}
        gridSize={gridSize}
        username={username}
        setUsername={setUsername}
      />
      {isHistoryModalOpen && (
        <MoveHistoryLog 
          isOpenModal={true}
          onCloseModal={() => setIsHistoryModalOpen(false)}
          entries={moveHistory}
          sessionTimer={timer}
          puzzleType={puzzleType}
          gridSize={gridSize}
          seed={puzzle?.actualSeed ?? seed}
          onClearHistory={() => setMoveHistory([])}
        />
      )}
      <SolveAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        records={recentSolves}
        onClearRecords={() => {
          SolveMetricsService.clearSolves();
          setRecentSolves([]);
        }}
        onAddSample={() => {
          SolveMetricsService.recordSolve({
            puzzleType,
            gridSize,
            rows: puzzle?.rows,
            cols: puzzle?.cols,
            algorithm: solverConfig.algorithm,
            algorithmLabel: ALGORITHM_REGISTRY[puzzleType]?.find(a => a.value === solverConfig.algorithm)?.label || solverConfig.algorithm,
            timeMs: Number((Math.random() * 25 + 2).toFixed(1)),
            nodesExplored: Math.floor(Math.random() * 800 + 50),
            nodesExpanded: Math.floor(Math.random() * 700 + 40),
            backtracks: Math.floor(Math.random() * 15),
            isAISolved: true,
            success: true,
            seed: seed ?? 12345
          });
          setRecentSolves(SolveMetricsService.getRecentSolves());
        }}
      />

      <main className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Controls 
            puzzleType={puzzleType}
            setPuzzleType={setPuzzleType}
            gridSize={gridSize}
            setGridSize={setGridSize}
            rows={rows}
            setRows={setRows}
            cols={cols}
            setCols={setCols}
            seed={seed}
            setSeed={setSeed}
            theme={theme}
            setTheme={setTheme}
            solverConfig={solverConfig}
            setSolverConfig={setSolverConfig}
            onGenerate={handleGenerate}
            onSolve={handleSolve}
            onCancel={handleCancel}
            onCheck={handleCheckSolution}
            onReveal={handleRevealSolution}
            onReset={handleReset}
            isSolving={isSolving}
            currentGrid={puzzle?.data?.grid || puzzle?.data?.userGrid || puzzle?.grid}
            puzzleData={puzzle?.data}
            leaderboard={leaderboard}
            puzzle={puzzle}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            recentSolvesCount={recentSolves.length}
          />
        </motion.div>

        <motion.div 
          className="flex flex-col gap-6 items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatsPanel 
            gridSize={gridSize}
            rows={puzzle?.rows}
            cols={puzzle?.cols}
            seed={seed}
            actualSeed={puzzle?.actualSeed}
            stateSpace={stateSpace}
            genTime={genTime}
            solveStats={puzzle?.solveStats}
            moves={puzzle?.moves}
            timer={timer}
            isPaused={isPaused}
            onTogglePause={() => {
              const next = !isPaused;
              setIsPaused(next);
              logAction({
                actionType: next ? 'pause' : 'resume',
                category: 'system',
                title: next ? 'Game Paused' : 'Game Resumed',
                details: next ? 'Gameplay timer paused by user' : 'Gameplay timer resumed by user',
                status: 'info'
              });
            }}
            canPause={!!puzzle && !puzzle.isSolved && !isSolving}
            stateSpaceLabel={puzzleType === 'maze' ? "Number of Perfect Mazes (Spanning Trees)" : "State Space"}
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${puzzleType}-${gridSize}-${seed}-${puzzle?.generationId}-${puzzle?.isSolved}`}
              initial={{ opacity: 0, rotateY: 10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -10 }}
              className="w-full flex justify-center relative"
            >
              {puzzle && puzzle.type === 'sliding-puzzle' && (puzzle.rows || 0) * (puzzle.cols || 0) > 16 && puzzle.isSolved && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center rounded-xl">
                  <div className="max-w-xs">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Complexity Limit</h3>
                    <p className="text-sm opacity-80">
                      For grids larger than 4×4, the state space (10^{calculateStateSpace('sliding-puzzle', puzzle.size, puzzle.rows, puzzle.cols).toFixed(2)}) 
                      leads to exponential explosion in A* search. Full pathfinding is disabled to prevent UI freeze.
                    </p>
                  </div>
                </div>
              )}
              
              <div className={`w-full flex justify-center transition-all duration-300 ${isPaused ? 'blur-xl grayscale pointer-events-none opacity-50' : ''}`}>
                {puzzle && (
                  <GridRenderer 
                    type={puzzle.type}
                    size={puzzle.size}
                    rows={puzzle.rows}
                    cols={puzzle.cols}
                    data={puzzle.data}
                    solution={puzzle.solution}
                    isSolved={puzzle.isSolved}
                    onCellClick={handleCellClick}
                    selectedCell={selectedCell}
                    validation={validation}
                    onKeyDown={handleKeyDown}
                  />
                )}
              </div>

              <AnimatePresence>
                {isPaused && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPaused(false)}
                      className="px-8 py-4 bg-[#FF7A00] text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center gap-3"
                    >
                      <Play size={24} fill="currentColor" />
                      Resume Game
                    </motion.button>
                    <p className="mt-4 text-white font-bold uppercase tracking-[0.3em] text-[10px] opacity-70">Game Paused</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          <MoveHistoryLog 
            entries={moveHistory}
            sessionTimer={timer}
            puzzleType={puzzleType}
            gridSize={gridSize}
            seed={puzzle?.actualSeed ?? seed}
            onClearHistory={() => setMoveHistory([])}
          />
        </motion.div>
      </main>

      <footer className="mt-auto pt-12 pb-4 text-[10px] uppercase tracking-widest opacity-30 font-bold">
        Deterministic Neural Grid Engine v1.1.0 // Stateless Architecture
      </footer>
    </div>
  );
}

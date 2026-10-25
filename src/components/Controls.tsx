import React, { useState } from 'react';
import { PuzzleType, ThemeType, AlgorithmType, SolverConfig } from '../types';
import { RefreshCw, Play, Shuffle, X, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { getAlgorithmsForPuzzle, MAZE_GEN_ALGORITHMS } from '../core/AlgorithmRegistry';
import { MIN_GRID_SIZE, MAX_GRID_SIZE } from '../constants';
import { Validator } from '../core/Validator';
import { ValidationEngine } from '../services/ValidationEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlsProps {
  puzzleType: PuzzleType;
  setPuzzleType: (t: PuzzleType) => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  rows?: number;
  setRows?: (r: number) => void;
  cols?: number;
  setCols?: (c: number) => void;
  seed: number | null;
  setSeed: (s: number | null) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  solverConfig: SolverConfig;
  setSolverConfig: (c: SolverConfig) => void;
  onGenerate: () => void;
  onSolve: () => void;
  onCancel: () => void;
  onCheck: () => void;
  onReveal: () => void;
  onReset: () => void;
  isSolving: boolean;
  currentGrid?: any;
  puzzleData?: any;
  leaderboard?: any[];
  puzzle?: any;
  onOpenAnalytics?: () => void;
  recentSolvesCount?: number;
}

export const Controls: React.FC<ControlsProps> = ({
  puzzleType, setPuzzleType,
  gridSize, setGridSize,
  rows = 4, setRows,
  cols = 4, setCols,
  seed, setSeed,
  theme, setTheme,
  solverConfig, setSolverConfig,
  onGenerate, onSolve, onCancel, onCheck, onReveal, onReset,
  isSolving,
  currentGrid,
  puzzleData,
  leaderboard = [],
  puzzle,
  onOpenAnalytics,
  recentSolvesCount = 0,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleCheck = () => {
    try {
      if (puzzle) {
        const result = ValidationEngine.validate(
          puzzle.type,
          puzzle.size,
          puzzle.data,
          puzzle.solution,
          false,
          puzzle.isSolved
        );
        const errorList = result.errors && result.errors.length > 0
          ? result.errors
          : (!result.isValid 
              ? ["Constraints violated. Conflicts highlighted."] 
              : (!result.isFull ? ["Incomplete: Some cells are empty."] : ["Keep trying!"]));

        setValidationResult({
          isCorrect: result.isComplete,
          errors: result.isComplete ? [] : errorList
        });
      }
    } catch (err) {
      console.error("Check solution error:", err);
    }
    onCheck();
  };

  const solveValidation = Validator.canSolve(puzzleType, gridSize, rows, cols);
  const generateValidation = Validator.canGenerate(puzzleType, gridSize);

  const puzzleTypes: { value: PuzzleType; label: string }[] = [
    { value: 'math-latin-square', label: 'Math Latin Square' },
    { value: 'sudoku', label: 'Sudoku' },
    { value: 'maze', label: 'Maze' },
    { value: 'n-queens', label: 'N-Queens' },
    { value: 'minesweeper', label: 'Minesweeper' },
    { value: 'nonogram', label: 'Nonogram' },
    { value: 'kenken', label: 'KenKen' },
    { value: 'sliding-puzzle', label: 'Sliding Puzzle' },
  ];

  const algorithms = getAlgorithmsForPuzzle(puzzleType, gridSize);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1e12));
  };

  const toggleRandomMode = () => {
    if (seed === null) {
      setSeed(123456);
    } else {
      setSeed(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#2A2A2A] backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl w-full max-w-md text-[#EAEAEA]">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tighter italic text-[#FF7A00]">Engine Config</h2>
        {onOpenAnalytics && (
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF7A00]/20 hover:bg-[#FF7A00]/30 text-[#FF7A00] border border-[#FF7A00]/30 transition-all text-xs font-bold cursor-pointer"
            title="View Solve Performance Graph & Analytics"
          >
            <BarChart3 size={14} />
            <span>Graph Solves</span>
            {recentSolvesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#FF7A00] text-black text-[9px] font-black rounded-full">
                {recentSolvesCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {puzzleType === 'maze' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Maze Generation Algorithm</label>
            <select
              value={solverConfig.genAlgorithm || 'dfs'}
              disabled={isSolving}
              onChange={(e) => setSolverConfig({ ...solverConfig, genAlgorithm: e.target.value as any })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {MAZE_GEN_ALGORITHMS.map(a => (
                <option key={a.value} value={a.value} className="bg-[#1E1E1E]">{a.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Puzzle Type</label>
          <select
            value={puzzleType}
            disabled={isSolving}
            onChange={(e) => {
              const newType = e.target.value as PuzzleType;
              setPuzzleType(newType);
              setValidationResult(null);
              
              // Auto-adjust grid size for Sudoku
              if (newType === 'sudoku') {
                const root = Math.sqrt(gridSize);
                if (!Number.isInteger(root) || gridSize > 16) {
                  const clamped = Math.min(16, gridSize);
                  const nearestRoot = Math.round(Math.sqrt(clamped));
                  const nearestSquare = Math.max(4, Math.min(16, nearestRoot * nearestRoot));
                  setGridSize(nearestSquare);
                }
              } else if (gridSize > MAX_GRID_SIZE) {
                setGridSize(MAX_GRID_SIZE);
              }

              // Reset algorithm if not valid for new type
              const newAlgos = getAlgorithmsForPuzzle(newType, gridSize);
              if (!newAlgos.find(a => a.value === solverConfig.algorithm)) {
                setSolverConfig({ ...solverConfig, algorithm: newAlgos[0].value });
              }
            }}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {puzzleTypes.map(t => (
              <option key={t.value} value={t.value} className="bg-[#1E1E1E]">{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Solving Algorithm</label>
          <select
            value={solverConfig.algorithm}
            disabled={isSolving}
            onChange={(e) => setSolverConfig({ ...solverConfig, algorithm: e.target.value as AlgorithmType })}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA] disabled:opacity-50"
          >
            {algorithms.map(a => (
              <option key={a.value} value={a.value} className="bg-[#1E1E1E]">{a.label}</option>
            ))}
          </select>
        </div>

        {puzzleType === 'sliding-puzzle' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Rows: {rows}</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={rows}
                  disabled={isSolving}
                  onChange={(e) => setRows?.(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
                />
                <input 
                  type="number"
                  min={3}
                  max={20}
                  value={rows}
                  disabled={isSolving}
                  onChange={(e) => setRows?.(Math.max(3, Math.min(20, parseInt(e.target.value) || 3)))}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Columns: {cols}</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={cols}
                  disabled={isSolving}
                  onChange={(e) => setCols?.(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
                />
                <input 
                  type="number"
                  min={3}
                  max={20}
                  value={cols}
                  disabled={isSolving}
                  onChange={(e) => setCols?.(Math.max(3, Math.min(20, parseInt(e.target.value) || 3)))}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Grid Size: {gridSize}</label>
              {puzzleType === 'sudoku' && (
                <span className="text-[8px] font-bold text-[#FF7A00] uppercase tracking-tighter">Perfect Square Required (Max 16)</span>
              )}
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={puzzleType === 'n-queens' ? 4 : MIN_GRID_SIZE}
                max={puzzleType === 'sudoku' ? 16 : MAX_GRID_SIZE}
                value={gridSize}
                disabled={isSolving}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (puzzleType === 'sudoku') {
                    val = Math.min(16, val);
                    const root = Math.sqrt(val);
                    if (!Number.isInteger(root)) {
                      const nearestRoot = Math.round(root);
                      val = Math.max(4, Math.min(16, nearestRoot * nearestRoot));
                    }
                  }
                  setGridSize(val);
                }}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
              />
              <input 
                type="number"
                min={puzzleType === 'n-queens' ? 4 : MIN_GRID_SIZE}
                max={puzzleType === 'sudoku' ? 16 : MAX_GRID_SIZE}
                value={gridSize}
                disabled={isSolving}
                onChange={(e) => {
                  const maxLimit = puzzleType === 'sudoku' ? 16 : MAX_GRID_SIZE;
                  const minLimit = puzzleType === 'n-queens' ? 4 : MIN_GRID_SIZE;
                  let val = parseInt(e.target.value) || minLimit;
                  val = Math.max(minLimit, Math.min(maxLimit, val));
                  
                  if (puzzleType === 'sudoku') {
                    const root = Math.sqrt(val);
                    if (!Number.isInteger(root)) {
                      const nearestRoot = Math.round(root);
                      val = Math.max(4, Math.min(16, nearestRoot * nearestRoot));
                    }
                  }
                  
                  setGridSize(val);
                }}
                className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
              />
            </div>
            {!generateValidation.valid && (
              <p className="text-[10px] text-amber-400 mt-1 font-bold italic">{generateValidation.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Generation Mode</label>
            <button 
              onClick={toggleRandomMode}
              disabled={isSolving}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${seed === null ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#FF7A00]/20 text-[#FF7A00]'} disabled:opacity-50`}
            >
              {seed === null ? 'RANDOM' : 'SEED'}
            </button>
          </div>
          {seed !== null && (
            <div className="flex gap-2">
              <input
                type="number"
                value={seed}
                disabled={isSolving}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all font-mono text-sm text-[#EAEAEA] disabled:opacity-50"
              />
              <button
                onClick={handleRandomSeed}
                disabled={isSolving}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                title="Random Seed"
              >
                <Shuffle size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => {
            setValidationResult(null);
            onGenerate();
          }}
          disabled={isSolving}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-neutral-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-900/20 text-sm"
        >
          <RefreshCw size={16} className={isSolving ? 'animate-spin' : ''} />
          New
        </button>

        <button
          onClick={() => {
            setValidationResult(null);
            onReset();
          }}
          disabled={isSolving}
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
        >
          <RefreshCw size={16} className="rotate-180" />
          Reset
        </button>
        
        {isSolving ? (
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FF4C4C] hover:bg-[#FF6666] text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 text-sm"
          >
            <X size={16} />
            Cancel
          </button>
        ) : (
          <button
            onClick={onSolve}
            disabled={!solveValidation.valid}
            className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#2DD4BF] disabled:bg-neutral-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20 text-sm relative group"
          >
            <Play size={16} />
            AI Solve
            {!solveValidation.valid && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center z-50">
                {solveValidation.message}
              </div>
            )}
          </button>
        )}
      </div>

      {['nonogram', 'kenken', 'sudoku', 'math-latin-square', 'n-queens', 'maze', 'minesweeper', 'sliding-puzzle'].includes(puzzleType) && !isSolving && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleCheck}
              className="flex-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-xs shadow-md shadow-amber-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              Check Solution
            </button>
            <button
              onClick={() => {
                setValidationResult(null);
                onReveal();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-xs shadow-md shadow-purple-900/20 cursor-pointer"
            >
              Reveal Solution
            </button>
          </div>

          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3.5 rounded-xl border ${
                  validationResult.isCorrect 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {validationResult.isCorrect ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
                    <span className="font-black text-xs uppercase tracking-wider">
                      {validationResult.isCorrect ? 'Solved Correctly!' : 'Not Solved Yet'}
                    </span>
                  </div>
                  <button onClick={() => setValidationResult(null)} className="opacity-60 hover:opacity-100 p-0.5 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
                {validationResult.errors.length > 0 && (
                  <p className="text-xs opacity-90 leading-snug font-medium mt-1">{validationResult.errors[0]}</p>
                )}
                {validationResult.isCorrect && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Score submitted to Leaderboard!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full bg-white/5 hover:bg-white/10 text-[#EAEAEA] font-bold py-2 rounded-xl transition-all text-[10px] uppercase tracking-widest border border-white/5 cursor-pointer mt-1"
          >
            {showLeaderboard ? 'Hide Leaderboard' : 'Show Top Solvers'}
          </button>

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 text-[#FF7A00] border border-[#FF7A00]/30 font-bold py-2 rounded-xl transition-all text-[10px] uppercase tracking-widest cursor-pointer mt-1"
            >
              <BarChart3 size={13} />
              <span>Algorithm Performance Graphs ({recentSolvesCount})</span>
            </button>
          )}

          <AnimatePresence>
            {showLeaderboard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2 overflow-hidden"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] mb-2">Top Solvers ({puzzleType} {gridSize}x{gridSize})</h3>
                {leaderboard.length > 0 ? (
                  <div className="space-y-1">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-mono p-1.5 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="opacity-40">{i + 1}.</span>
                          <span className="font-bold">{entry.username}</span>
                        </div>
                        <span className="text-[#22C55E]">
                          {Math.round(entry.time_ms !== undefined ? entry.time_ms / 1000 : (entry.solveTime || 0))}s
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] opacity-40 italic text-center py-2">No scores recorded yet. Be the first!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

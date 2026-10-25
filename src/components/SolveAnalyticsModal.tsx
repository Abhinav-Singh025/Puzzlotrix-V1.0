import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  LineChart, 
  Clock, 
  Cpu, 
  TrendingUp, 
  Trash2, 
  Download, 
  Zap, 
  RotateCcw,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { SolveRecord, SolveMetricsService } from '../services/SolveMetricsService';
import { PuzzleType } from '../types';

interface SolveAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SolveRecord[];
  onClearRecords: () => void;
  onAddSample?: () => void;
}

type MetricMode = 'time' | 'nodes' | 'dual';
type ChartStyle = 'bar' | 'line' | 'algorithm-summary';

const PUZZLE_LABELS: Record<string, string> = {
  'sudoku': 'Sudoku',
  'maze': 'Maze',
  'n-queens': 'N-Queens',
  'sliding-puzzle': 'Sliding Puzzle',
  'kenken': 'KenKen',
  'math-latin-square': 'Math Latin Sq.',
  'nonogram': 'Nonogram',
  'minesweeper': 'Minesweeper'
};

const ALGO_COLORS: Record<string, string> = {
  'backtracking': '#FF7A00',
  'backtracking-mrv': '#22C55E',
  'forward-checking': '#3B82F6',
  'ac3': '#A855F7',
  'astar-manhattan': '#EC4899',
  'astar-weighted': '#F59E0B',
  'astar-hamming': '#8B5CF6',
  'bfs': '#06B6D4',
  'dfs': '#E11D48',
  'dijkstra': '#10B981',
  'greedy': '#6366F1',
  'constraint-propagation': '#14B8A6',
  'constructive': '#F97316',
  'hybrid': '#D946EF',
  'default': '#94A3B8'
};

export const SolveAnalyticsModal: React.FC<SolveAnalyticsModalProps> = ({
  isOpen,
  onClose,
  records,
  onClearRecords,
  onAddSample
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('dual');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [puzzleFilter, setPuzzleFilter] = useState<string>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (puzzleFilter !== 'all' && r.puzzleType !== puzzleFilter) return false;
      return true;
    });
  }, [records, puzzleFilter]);

  // Chronological order for graph (oldest to newest)
  const chronologicalRecords = useMemo(() => {
    return [...filteredRecords].reverse();
  }, [filteredRecords]);

  // Compute metrics on current filtered records
  const summary = useMemo(() => {
    return SolveMetricsService.computeSummary(filteredRecords);
  }, [filteredRecords]);

  if (!isOpen) return null;

  // Chart Dimensions & Scales
  const svgWidth = 840;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = metricMode === 'dual' ? 60 : 30;
  const padTop = 30;
  const padBottom = 40;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  // Max values for scaling
  const maxTime = Math.max(1, ...chronologicalRecords.map(r => r.timeMs));
  const maxNodes = Math.max(1, ...chronologicalRecords.map(r => r.nodesExplored));

  // Time & Node Formatter
  const formatTimeVal = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    return `${Math.round(ms)}ms`;
  };

  const formatNodesVal = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
  };

  // Algorithm Benchmark Averages Data
  const algoAggregates = Object.values(summary.byAlgorithm);
  const maxAlgoTime = Math.max(1, ...algoAggregates.map(a => a.avgTimeMs));
  const maxAlgoNodes = Math.max(1, ...algoAggregates.map(a => a.avgNodesExplored));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl bg-[#1E1E1E] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#EAEAEA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-xl border border-[#FF7A00]/30 shadow-inner">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">
                  Algorithm Solve Analytics & Graphs
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30">
                  {records.length} Solves Recorded
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Comparative benchmarks for algorithm solving time (ms) and nodes explored across recent solves
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Controls Bar: Filters & Graph Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-black/40 rounded-xl border border-white/5">
            {/* Metric Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setMetricMode('time')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  metricMode === 'time'
                    ? 'bg-[#FF7A00] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Clock size={13} />
                Solving Time
              </button>
              <button
                onClick={() => setMetricMode('nodes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  metricMode === 'nodes'
                    ? 'bg-[#06B6D4] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Cpu size={13} />
                Nodes Explored
              </button>
              <button
                onClick={() => setMetricMode('dual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  metricMode === 'dual'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers size={13} />
                Dual (Time + Nodes)
              </button>
            </div>

            {/* Chart Style Toggle */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setChartStyle('bar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  chartStyle === 'bar' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
                title="Bar Chart per solve"
              >
                <BarChart3 size={13} />
                Bar Chart
              </button>
              <button
                onClick={() => setChartStyle('line')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  chartStyle === 'line' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
                title="Line Trend over solves"
              >
                <LineChart size={13} />
                Line Trend
              </button>
              <button
                onClick={() => setChartStyle('algorithm-summary')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  chartStyle === 'algorithm-summary' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
                title="Algorithm Averages Benchmark"
              >
                <TrendingUp size={13} />
                Algorithm Benchmark
              </button>
            </div>

            {/* Filter by Puzzle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Puzzle:</span>
              <select
                value={puzzleFilter}
                onChange={(e) => setPuzzleFilter(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF7A00] transition-colors cursor-pointer"
              >
                <option value="all">All Puzzles</option>
                <option value="sudoku">Sudoku</option>
                <option value="maze">Maze</option>
                <option value="n-queens">N-Queens</option>
                <option value="sliding-puzzle">Sliding Puzzle</option>
                <option value="kenken">KenKen</option>
                <option value="math-latin-square">Math Latin Square</option>
                <option value="nonogram">Nonogram</option>
                <option value="minesweeper">Minesweeper</option>
              </select>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Recent Solves Count</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white font-mono">{filteredRecords.length}</span>
                <span className="text-[10px] text-white/40">of {records.length} total</span>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00]">Avg Solving Time</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#FF7A00] font-mono">{summary.avgTimeMs}</span>
                <span className="text-[10px] text-[#FF7A00]/70">ms</span>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Fastest Solve</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {summary.minTimeMs > 0 ? summary.minTimeMs : '—'}
                </span>
                <span className="text-[10px] text-emerald-400/70">ms</span>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4]">Avg Nodes Explored</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#06B6D4] font-mono">
                  {summary.avgNodesExplored.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#06B6D4]/70">nodes</span>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Peak Nodes</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-400 font-mono">
                  {summary.maxNodesExplored.toLocaleString()}
                </span>
                <span className="text-[10px] text-purple-400/70">nodes</span>
              </div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-black/50 p-4 md:p-6 rounded-2xl border border-white/10 flex flex-col relative">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-[#FF7A00]" />
                  {chartStyle === 'algorithm-summary'
                    ? 'Algorithm Benchmark: Average Time & Nodes by Algorithm'
                    : `Recent Solves Performance Graph (${chronologicalRecords.length} Data Points)`}
                </h3>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                {(metricMode === 'time' || metricMode === 'dual') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7A00]" />
                    <span className="text-[#FF7A00]">Solving Time (ms)</span>
                  </div>
                )}
                {(metricMode === 'nodes' || metricMode === 'dual') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4]" />
                    <span className="text-[#06B6D4]">Nodes Explored</span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State */}
            {chronologicalRecords.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                <Info size={32} />
                <p className="text-sm font-bold">No solve records found for this filter.</p>
                <p className="text-xs">Solve a puzzle or run AI Solve to generate performance data.</p>
              </div>
            ) : chartStyle === 'algorithm-summary' ? (
              /* Algorithm Averages Benchmark View */
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = padTop + graphHeight * (1 - ratio);
                    return (
                      <g key={i}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="#FF7A00"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {formatTimeVal(maxAlgoTime * ratio)}
                        </text>
                        {metricMode === 'dual' && (
                          <text
                            x={svgWidth - padRight + 8}
                            y={y + 4}
                            textAnchor="start"
                            fill="#06B6D4"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {formatNodesVal(maxAlgoNodes * ratio)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Bars grouped by Algorithm */}
                  {algoAggregates.map((agg, idx) => {
                    const totalGroups = algoAggregates.length;
                    const groupWidth = graphWidth / totalGroups;
                    const groupX = padLeft + idx * groupWidth;
                    const barWidth = Math.max(12, Math.min(28, groupWidth * 0.35));
                    const isDual = metricMode === 'dual';

                    const timeHeight = (agg.avgTimeMs / maxAlgoTime) * graphHeight;
                    const timeY = padTop + graphHeight - timeHeight;

                    const nodesHeight = (agg.avgNodesExplored / maxAlgoNodes) * graphHeight;
                    const nodesY = padTop + graphHeight - nodesHeight;

                    const isHovered = hoveredIndex === idx;

                    return (
                      <g
                        key={agg.algorithm}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer transition-opacity"
                        opacity={hoveredIndex === null || isHovered ? 1 : 0.4}
                      >
                        {/* Background highlight on hover */}
                        {isHovered && (
                          <rect
                            x={groupX}
                            y={padTop}
                            width={groupWidth}
                            height={graphHeight}
                            fill="rgba(255,255,255,0.04)"
                            rx={4}
                          />
                        )}

                        {/* Solving Time Bar */}
                        {(metricMode === 'time' || isDual) && (
                          <rect
                            x={isDual ? groupX + groupWidth / 2 - barWidth - 2 : groupX + (groupWidth - barWidth) / 2}
                            y={timeY}
                            width={barWidth}
                            height={Math.max(2, timeHeight)}
                            fill="#FF7A00"
                            rx={3}
                          />
                        )}

                        {/* Nodes Explored Bar */}
                        {(metricMode === 'nodes' || isDual) && (
                          <rect
                            x={isDual ? groupX + groupWidth / 2 + 2 : groupX + (groupWidth - barWidth) / 2}
                            y={nodesY}
                            width={barWidth}
                            height={Math.max(2, nodesHeight)}
                            fill="#06B6D4"
                            rx={3}
                          />
                        )}

                        {/* Algorithm Label below */}
                        <text
                          x={groupX + groupWidth / 2}
                          y={svgHeight - 12}
                          textAnchor="middle"
                          fill={isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
                          fontSize="9"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {agg.algorithmLabel.length > 14
                            ? agg.algorithmLabel.slice(0, 12) + '...'
                            : agg.algorithmLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : chartStyle === 'bar' ? (
              /* Per-Solve Bar Chart */
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = padTop + graphHeight * (1 - ratio);
                    return (
                      <g key={i}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="#FF7A00"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {formatTimeVal(maxTime * ratio)}
                        </text>
                        {metricMode === 'dual' && (
                          <text
                            x={svgWidth - padRight + 8}
                            y={y + 4}
                            textAnchor="start"
                            fill="#06B6D4"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {formatNodesVal(maxNodes * ratio)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Bars for each solve */}
                  {chronologicalRecords.map((r, idx) => {
                    const count = chronologicalRecords.length;
                    const slotWidth = graphWidth / count;
                    const slotX = padLeft + idx * slotWidth;
                    const barWidth = Math.max(6, Math.min(22, slotWidth * 0.4));
                    const isDual = metricMode === 'dual';

                    const timeHeight = (r.timeMs / maxTime) * graphHeight;
                    const timeY = padTop + graphHeight - timeHeight;

                    const nodesHeight = (r.nodesExplored / maxNodes) * graphHeight;
                    const nodesY = padTop + graphHeight - nodesHeight;

                    const isHovered = hoveredIndex === idx;

                    return (
                      <g
                        key={r.id}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer transition-opacity"
                        opacity={hoveredIndex === null || isHovered ? 1 : 0.35}
                      >
                        {/* Hover Column highlight */}
                        {isHovered && (
                          <rect
                            x={slotX}
                            y={padTop}
                            width={slotWidth}
                            height={graphHeight}
                            fill="rgba(255,255,255,0.05)"
                            rx={3}
                          />
                        )}

                        {/* Time Bar */}
                        {(metricMode === 'time' || isDual) && (
                          <rect
                            x={isDual ? slotX + slotWidth / 2 - barWidth - 1 : slotX + (slotWidth - barWidth) / 2}
                            y={timeY}
                            width={barWidth}
                            height={Math.max(2, timeHeight)}
                            fill="#FF7A00"
                            rx={2}
                          />
                        )}

                        {/* Nodes Bar */}
                        {(metricMode === 'nodes' || isDual) && (
                          <rect
                            x={isDual ? slotX + slotWidth / 2 + 1 : slotX + (slotWidth - barWidth) / 2}
                            y={nodesY}
                            width={barWidth}
                            height={Math.max(2, nodesHeight)}
                            fill="#06B6D4"
                            rx={2}
                          />
                        )}

                        {/* X-axis index label */}
                        <text
                          x={slotX + slotWidth / 2}
                          y={svgHeight - 12}
                          textAnchor="middle"
                          fill={isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          #{idx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* Line & Area Chart */
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
                  <defs>
                    <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="nodesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = padTop + graphHeight * (1 - ratio);
                    return (
                      <g key={i}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="#FF7A00"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {formatTimeVal(maxTime * ratio)}
                        </text>
                        {metricMode === 'dual' && (
                          <text
                            x={svgWidth - padRight + 8}
                            y={y + 4}
                            textAnchor="start"
                            fill="#06B6D4"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {formatNodesVal(maxNodes * ratio)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Path generation */}
                  {(() => {
                    const count = chronologicalRecords.length;
                    if (count === 0) return null;

                    const timePoints: { x: number; y: number }[] = [];
                    const nodesPoints: { x: number; y: number }[] = [];

                    chronologicalRecords.forEach((r, idx) => {
                      const x = count === 1
                        ? padLeft + graphWidth / 2
                        : padLeft + (idx / (count - 1)) * graphWidth;
                      const timeY = padTop + graphHeight - (r.timeMs / maxTime) * graphHeight;
                      const nodesY = padTop + graphHeight - (r.nodesExplored / maxNodes) * graphHeight;
                      timePoints.push({ x, y: timeY });
                      nodesPoints.push({ x, y: nodesY });
                    });

                    const timePath = timePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const nodesPath = nodesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                    const timeArea = `${timePath} L ${timePoints[timePoints.length - 1].x} ${padTop + graphHeight} L ${timePoints[0].x} ${padTop + graphHeight} Z`;
                    const nodesArea = `${nodesPath} L ${nodesPoints[nodesPoints.length - 1].x} ${padTop + graphHeight} L ${nodesPoints[0].x} ${padTop + graphHeight} Z`;

                    return (
                      <g>
                        {/* Time Area & Line */}
                        {(metricMode === 'time' || metricMode === 'dual') && (
                          <>
                            <path d={timeArea} fill="url(#timeGradient)" />
                            <path d={timePath} fill="none" stroke="#FF7A00" strokeWidth="2.5" />
                            {timePoints.map((p, idx) => (
                              <circle
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === idx ? 5 : 3.5}
                                fill="#FF7A00"
                                stroke="#FFFFFF"
                                strokeWidth={hoveredIndex === idx ? 2 : 1}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              />
                            ))}
                          </>
                        )}

                        {/* Nodes Area & Line */}
                        {(metricMode === 'nodes' || metricMode === 'dual') && (
                          <>
                            <path d={nodesArea} fill="url(#nodesGradient)" />
                            <path d={nodesPath} fill="none" stroke="#06B6D4" strokeWidth="2.5" />
                            {nodesPoints.map((p, idx) => (
                              <circle
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === idx ? 5 : 3.5}
                                fill="#06B6D4"
                                stroke="#FFFFFF"
                                strokeWidth={hoveredIndex === idx ? 2 : 1}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              />
                            ))}
                          </>
                        )}

                        {/* X-axis labels */}
                        {chronologicalRecords.map((_, idx) => {
                          const x = count === 1
                            ? padLeft + graphWidth / 2
                            : padLeft + (idx / (count - 1)) * graphWidth;
                          return (
                            <text
                              key={idx}
                              x={x}
                              y={svgHeight - 12}
                              textAnchor="middle"
                              fill={hoveredIndex === idx ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight={hoveredIndex === idx ? 'bold' : 'normal'}
                            >
                              #{idx + 1}
                            </text>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* Hover Tooltip Card */}
            {hoveredIndex !== null && (
              <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono animate-in fade-in">
                {chartStyle === 'algorithm-summary' ? (
                  (() => {
                    const agg = algoAggregates[hoveredIndex];
                    if (!agg) return null;
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ALGO_COLORS[agg.algorithm] || ALGO_COLORS.default }}
                          />
                          <span className="font-bold text-white text-sm">{agg.algorithmLabel}</span>
                          <span className="text-white/50">({agg.count} solves)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Avg Time</span>
                            <span className="text-[#FF7A00] font-bold">{agg.avgTimeMs} ms</span>
                          </div>
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Min / Max Time</span>
                            <span className="text-white/80">{agg.minTimeMs}ms / {agg.maxTimeMs}ms</span>
                          </div>
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Avg Nodes</span>
                            <span className="text-[#06B6D4] font-bold">{agg.avgNodesExplored.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Min / Max Nodes</span>
                            <span className="text-white/80">{agg.minNodesExplored.toLocaleString()} / {agg.maxNodesExplored.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  (() => {
                    const solve = chronologicalRecords[hoveredIndex];
                    if (!solve) return null;
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                            Solve #{hoveredIndex + 1}
                          </span>
                          <span className="font-bold text-white">{PUZZLE_LABELS[solve.puzzleType] || solve.puzzleType}</span>
                          <span className="text-white/50">({solve.rows && solve.cols ? `${solve.rows}×${solve.cols}` : `${solve.gridSize}×${solve.gridSize}`})</span>
                          <span className="text-[#FF7A00] font-semibold">{solve.algorithmLabel}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Solving Time</span>
                            <span className="text-[#FF7A00] font-bold text-sm">{solve.timeMs} ms</span>
                          </div>
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Nodes Explored</span>
                            <span className="text-[#06B6D4] font-bold text-sm">{solve.nodesExplored.toLocaleString()}</span>
                          </div>
                          {solve.backtracks !== undefined && solve.backtracks > 0 && (
                            <div>
                              <span className="text-white/40 uppercase text-[9px] block">Backtracks</span>
                              <span className="text-purple-400 font-bold">{solve.backtracks}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-white/40 uppercase text-[9px] block">Timestamp</span>
                            <span className="text-white/60 text-[10px]">{new Date(solve.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* Solves Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Recent Solves Log ({filteredRecords.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csv = SolveMetricsService.exportCSV(filteredRecords);
                    SolveMetricsService.downloadExport(csv, `puzzlotrix_solves_${Date.now()}.csv`, 'text/csv');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
                  title="Export solves as CSV"
                >
                  <Download size={12} />
                  CSV
                </button>
                <button
                  onClick={() => {
                    const json = SolveMetricsService.exportJSON(filteredRecords);
                    SolveMetricsService.downloadExport(json, `puzzlotrix_solves_${Date.now()}.json`, 'application/json');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
                  title="Export solves as JSON"
                >
                  <Download size={12} />
                  JSON
                </button>
                {onAddSample && (
                  <button
                    onClick={onAddSample}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#FF7A00]/20 hover:bg-[#FF7A00]/30 text-[#FF7A00] border border-[#FF7A00]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Add a sample benchmark solve"
                  >
                    <Zap size={12} />
                    Add Sample
                  </button>
                )}
                {showClearConfirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onClearRecords();
                        setShowClearConfirm(false);
                      }}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 bg-white/10 text-white rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 text-white/50 text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Puzzle</th>
                    <th className="p-2.5">Algorithm</th>
                    <th className="p-2.5">Solving Time</th>
                    <th className="p-2.5">Nodes Explored</th>
                    <th className="p-2.5">Backtracks</th>
                    <th className="p-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRecords.map((r, i) => (
                    <tr
                      key={r.id}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => {
                        const chronoIdx = chronologicalRecords.findIndex(c => c.id === r.id);
                        if (chronoIdx !== -1) setHoveredIndex(chronoIdx);
                      }}
                    >
                      <td className="p-2.5 opacity-50">{filteredRecords.length - i}</td>
                      <td className="p-2.5 font-sans font-bold">
                        {PUZZLE_LABELS[r.puzzleType] || r.puzzleType}{' '}
                        <span className="text-[10px] text-white/40 font-mono">
                          {r.rows && r.cols ? `${r.rows}×${r.cols}` : `${r.gridSize}×${r.gridSize}`}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="text-white font-medium">{r.algorithmLabel}</span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#FF7A00] font-bold">{r.timeMs} ms</span>
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FF7A00]"
                              style={{ width: `${Math.min(100, (r.timeMs / maxTime) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#06B6D4] font-bold">{r.nodesExplored.toLocaleString()}</span>
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#06B6D4]"
                              style={{ width: `${Math.min(100, (r.nodesExplored / maxNodes) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 opacity-60">
                        {r.backtracks !== undefined ? r.backtracks : '—'}
                      </td>
                      <td className="p-2.5 text-right opacity-40 text-[10px]">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-white/40">
            Click any row to pinpoint data on the graph. Total {records.length} recent solves benchmarked.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { formatStateSpace } from '../utils/math';
import { SolveStats } from '../types';
import { Pause, Play } from 'lucide-react';

interface StatsPanelProps {
  gridSize: number;
  rows?: number;
  cols?: number;
  seed: number | null;
  actualSeed?: number;
  stateSpace: number;
  genTime: number;
  solveStats?: SolveStats;
  moves?: number;
  timer?: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
  canPause?: boolean;
  stateSpaceLabel?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  gridSize, rows, cols, seed, actualSeed, stateSpace, genTime, solveStats, moves, timer,
  isPaused, onTogglePause, canPause, stateSpaceLabel = "State Space"
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayGridSize = rows && cols ? `${rows} × ${cols}` : `${gridSize} × ${gridSize}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full max-w-6xl p-4 bg-[#2A2A2A] backdrop-blur-sm rounded-2xl border border-white/10 text-[#EAEAEA]">
      <StatItem label="Grid Size" value={displayGridSize} />
      <StatItem 
        label="Seed" 
        value={seed !== null ? seed.toString() : (actualSeed ? `R:${actualSeed}` : 'Random')} 
      />
      <StatItem label={stateSpaceLabel} value={formatStateSpace(stateSpace)} />
      <StatItem label="Gen Time" value={`${genTime.toFixed(2)}ms`} />
      <StatItem label="Solve Time" value={solveStats?.timeMs !== undefined ? `${solveStats.timeMs.toFixed(2)}ms` : '—'} />
      <StatItem label="Nodes Expanded" value={solveStats?.nodesExpanded !== undefined ? solveStats.nodesExpanded.toLocaleString() : '—'} />
      <StatItem label="Moves" value={moves?.toString() || '0'} />
      <div className="flex flex-col relative group">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] opacity-80">Timer</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-medium truncate">{timer !== undefined ? formatTime(timer) : '0:00'}</span>
          {canPause && (
            <button 
              onClick={onTogglePause}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[#FF7A00]"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] opacity-80">{label}</span>
    <span className="text-sm font-mono font-medium truncate">{value}</span>
  </div>
);

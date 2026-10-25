import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MoveLogEntry, MoveActionType, MoveActionCategory, PuzzleType } from '../types';
import { MoveHistoryService } from '../services/MoveHistoryService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Filter, 
  Search, 
  ArrowDownCircle, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Activity, 
  Zap, 
  AlertCircle, 
  RotateCcw, 
  Cpu, 
  User, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Flag,
  ArrowRightLeft,
  Sparkles,
  Layers,
  Pause,
  Play
} from 'lucide-react';

interface MoveHistoryLogProps {
  entries: MoveLogEntry[];
  sessionTimer: number;
  puzzleType: PuzzleType;
  gridSize: number;
  difficulty?: string;
  seed?: number | null;
  onClearHistory: () => void;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  isCollapsible?: boolean;
}

export const MoveHistoryLog: React.FC<MoveHistoryLogProps> = ({
  entries,
  sessionTimer,
  puzzleType,
  gridSize,
  difficulty = 'medium',
  seed = null,
  onClearHistory,
  isOpenModal = false,
  onCloseModal,
  isCollapsible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | MoveActionCategory>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'conflict'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute live audit statistics
  const summary = useMemo(() => {
    return MoveHistoryService.computeAuditSummary(entries, sessionTimer);
  }, [entries, sessionTimer]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterStatus === 'valid' && (e.status === 'conflict' || e.status === 'error')) return false;
      if (filterStatus === 'conflict' && e.status !== 'conflict' && e.status !== 'error') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const coordStr = e.coordinates 
          ? `${e.coordinates.r} ${e.coordinates.c} ${e.coordinates.fromR} ${e.coordinates.toR}`.toLowerCase()
          : '';
        const match = 
          e.title.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.actionType.toLowerCase().includes(q) ||
          coordStr.includes(q) ||
          String(e.seq).includes(q) ||
          String(e.newVal ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [entries, filterCategory, filterStatus, searchQuery]);

  // Auto-scroll to bottom on new entry if enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredEntries.length, autoScroll]);

  const handleExportJSON = () => {
    const jsonStr = MoveHistoryService.exportToJSON(entries, {
      puzzleType,
      gridSize,
      difficulty,
      seed,
      timer: sessionTimer,
    });
    const filename = `puzzlotrix_audit_${puzzleType}_${Date.now()}.json`;
    MoveHistoryService.downloadFile(jsonStr, filename, 'application/json');
  };

  const handleExportCSV = () => {
    const csvStr = MoveHistoryService.exportToCSV(entries);
    const filename = `puzzlotrix_audit_${puzzleType}_${Date.now()}.csv`;
    MoveHistoryService.downloadFile(csvStr, filename, 'text/csv');
  };

  const handleCopyReport = () => {
    const md = MoveHistoryService.generateAuditMarkdown(entries, summary, {
      puzzleType,
      gridSize,
      difficulty,
      seed,
    });
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getActionIcon = (type: MoveActionType) => {
    switch (type) {
      case 'slide':
        return <ArrowRightLeft size={14} className="text-orange-400" />;
      case 'input':
        return <span className="font-mono font-bold text-xs text-blue-400">#</span>;
      case 'clear':
        return <RotateCcw size={14} className="text-neutral-400" />;
      case 'reveal':
        return <Eye size={14} className="text-emerald-400" />;
      case 'flag':
        return <Flag size={14} className="text-rose-400" />;
      case 'queen_place':
      case 'queen_remove':
        return <span className="text-xs text-amber-300">♛</span>;
      case 'mark_fill':
        return <span className="inline-block w-3 h-3 bg-orange-500 rounded-sm" />;
      case 'mark_cross':
        return <span className="text-xs font-bold text-red-400">×</span>;
      case 'mark_empty':
        return <span className="inline-block w-3 h-3 border border-white/30 rounded-sm" />;
      case 'maze_node':
        return <Layers size={14} className="text-emerald-400" />;
      case 'ai_solve_start':
      case 'ai_solve_finish':
      case 'ai_solve_cancel':
        return <Sparkles size={14} className="text-purple-400" />;
      case 'check_solution':
        return <CheckCircle2 size={14} className="text-cyan-400" />;
      case 'reveal_solution':
        return <Eye size={14} className="text-amber-400" />;
      case 'reset':
        return <RotateCcw size={14} className="text-red-400" />;
      case 'undo':
        return <RotateCcw size={14} className="text-yellow-400" />;
      case 'generate':
        return <Sparkles size={14} className="text-emerald-400" />;
      case 'pause':
        return <Pause size={14} className="text-amber-400" />;
      case 'resume':
        return <Play size={14} className="text-emerald-400" />;
      default:
        return <Activity size={14} className="text-neutral-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 size={10} /> Valid
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <AlertCircle size={10} /> Conflict
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <XCircle size={10} /> Error
          </span>
        );
      default:
        return null;
    }
  };

  // Content body that is shared between panel and modal
  const renderLogContent = (isModalView: boolean) => (
    <div className="flex flex-col h-full w-full">
      {/* Metrics & Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 bg-black/40 border-b border-white/10 text-xs">
        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Total Actions</span>
            <Activity size={12} className="text-[#FF7A00]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white font-mono">{summary.totalActions}</span>
            <span className="text-[10px] text-white/40">moves</span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Pace (APM)</span>
            <Zap size={12} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-400 font-mono">{summary.actionsPerMinute}</span>
            <span className="text-[10px] text-white/40">/min</span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Avg Interval</span>
            <Clock size={12} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-cyan-400 font-mono">
              {(summary.avgThinkTimeMs / 1000).toFixed(1)}s
            </span>
            <span className="text-[10px] text-white/40">think</span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Player Moves</span>
            <User size={12} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-blue-400 font-mono">{summary.playerMoves}</span>
            <span className="text-[10px] text-white/40">
              {summary.totalActions > 0 ? Math.round((summary.playerMoves / summary.totalActions) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Solver Steps</span>
            <Cpu size={12} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-purple-400 font-mono">{summary.solverActions}</span>
            <span className="text-[10px] text-white/40">AI</span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">
            <span>Conflicts</span>
            <AlertCircle size={12} className={summary.conflictCount > 0 ? "text-rose-400" : "text-emerald-400"} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-black font-mono ${summary.conflictCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {summary.conflictCount}
            </span>
            <span className="text-[10px] text-white/40">flags</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#242424] border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Tabs */}
          {(['all', 'player', 'solver', 'system'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                filterCategory === cat
                  ? 'bg-[#FF7A00] text-white shadow-md shadow-orange-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? `All (${entries.length})` : 
               cat === 'player' ? `Player (${summary.playerMoves})` :
               cat === 'solver' ? `AI (${summary.solverActions})` :
               `System (${summary.systemEvents})`}
            </button>
          ))}

          {/* Status Filter */}
          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
          <button
            onClick={() => setFilterStatus(prev => prev === 'all' ? 'valid' : prev === 'valid' ? 'conflict' : 'all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 ${
              filterStatus === 'all' 
                ? 'border-white/10 bg-white/5 text-white/60' 
                : filterStatus === 'valid'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
            title="Toggle Status Filter"
          >
            <Filter size={11} />
            <span>{filterStatus === 'all' ? 'All Status' : filterStatus === 'valid' ? 'Valid Only' : 'Conflicts Only'}</span>
          </button>
        </div>

        {/* Search & Actions Toolbar */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 justify-end">
          <div className="relative flex-grow sm:w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search moves / coords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF7A00]/60 transition-colors"
            />
          </div>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border transition-colors ${
              autoScroll ? 'bg-[#FF7A00]/20 border-[#FF7A00]/40 text-[#FF7A00]' : 'bg-white/5 border-white/10 text-white/40'
            }`}
            title={autoScroll ? "Auto-scroll is ON (pinned to latest)" : "Auto-scroll is OFF"}
          >
            <ArrowDownCircle size={15} />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
            title="Export Audit Log as JSON"
          >
            <FileCode size={15} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
            title="Export Audit Log as CSV spreadsheet"
          >
            <FileSpreadsheet size={15} />
          </button>

          {/* Copy Report */}
          <button
            onClick={handleCopyReport}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
            title="Copy Markdown Audit Summary to Clipboard"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>

          {/* Clear Log */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors"
            title="Clear Action History"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Confirmation prompt for Clear Log */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-950/80 border-b border-red-500/30 flex items-center justify-between text-xs text-red-200"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <span>Are you sure you want to clear all {entries.length} actions from the audit history?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Stream Table */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto font-mono text-xs ${isModalView ? 'max-h-[60vh]' : 'max-h-[380px]'}`}
      >
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-white/40">
            <History size={36} className="mb-3 opacity-30 text-[#FF7A00]" />
            <p className="font-bold text-sm">No actions recorded in current view</p>
            <p className="text-xs opacity-70 mt-1 max-w-sm">
              Interact with the puzzle, make moves, or run the AI solver to generate an interactive audit trail.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredEntries.map((e) => {
              const isSelected = selectedEntryId === e.id;
              const hasCoords = !!e.coordinates;
              const coordLabel = e.coordinates
                ? (e.coordinates.fromR !== undefined && e.coordinates.fromC !== undefined && e.coordinates.toR !== undefined && e.coordinates.toC !== undefined
                    ? `[${e.coordinates.fromR + 1},${e.coordinates.fromC + 1}]➔[${e.coordinates.toR + 1},${e.coordinates.toC + 1}]`
                    : `[R${(e.coordinates.r ?? 0) + 1}, C${(e.coordinates.c ?? 0) + 1}]`)
                : null;

              return (
                <div key={e.id} className="transition-colors hover:bg-white/[0.03]">
                  <div 
                    onClick={() => setSelectedEntryId(isSelected ? null : e.id)}
                    className="flex items-center gap-3 px-3.5 py-2 cursor-pointer select-none"
                  >
                    {/* Expand icon */}
                    <div className="text-white/30 shrink-0">
                      {isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>

                    {/* Sequence */}
                    <span className="text-[11px] font-bold text-white/30 w-8 shrink-0">
                      #{String(e.seq).padStart(3, '0')}
                    </span>

                    {/* Action Icon */}
                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      {getActionIcon(e.actionType)}
                    </div>

                    {/* Title & Coordinates */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-sans font-semibold text-white/90 truncate text-xs">
                        {e.title}
                      </span>
                      {coordLabel && (
                        <span className="text-[10px] bg-white/5 text-[#FF7A00] px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                          {coordLabel}
                        </span>
                      )}
                    </div>

                    {/* Value Shift badge (if any) */}
                    {(e.prevVal !== undefined || e.newVal !== undefined) && (
                      <div className="hidden md:flex items-center gap-1 text-[10px] text-white/50 shrink-0">
                        <span className="opacity-60">{e.prevVal ?? '·'}</span>
                        <span>➔</span>
                        <span className="font-bold text-white">{e.newVal ?? '·'}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {getStatusBadge(e.status)}
                    </div>

                    {/* Time delta */}
                    <div className="text-right text-[10px] text-white/40 shrink-0 w-16">
                      +{e.timeDeltaMs > 0 ? (e.timeDeltaMs / 1000).toFixed(1) : '0.0'}s
                    </div>
                  </div>

                  {/* Expanded Row Detail Drawer */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/40 border-t border-white/5 p-3.5 pl-14 text-xs font-sans text-white/80"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-0.5">Audit Detail</span>
                            <p className="text-white/90 text-xs font-mono">{e.details}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-0.5">Timestamp & Session</span>
                            <p className="text-white/70 text-xs font-mono">
                              {new Date(e.timestamp).toLocaleTimeString()} ({MoveHistoryService.formatTime(e.sessionTimer)} active)
                            </p>
                          </div>
                        </div>

                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Metadata Snapshot</span>
                            <pre className="p-2 bg-black/60 rounded text-[10px] font-mono text-white/70 overflow-x-auto border border-white/5">
                              {JSON.stringify(e.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-[#1A1A1A] border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">Live Audit Stream Active</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Showing {filteredEntries.length} of {entries.length} actions</span>
          <span>•</span>
          <span className="text-[#FF7A00] font-mono">Puzzlotrix Engine v1.1</span>
        </div>
      </div>
    </div>
  );

  // If rendering inside an external modal / dialog:
  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl max-h-[90vh] bg-[#2A2A2A] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 bg-[#202020] border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF7A00]/20 rounded-xl text-[#FF7A00]">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase italic text-white">
                  Session Move Audit & Analysis
                </h3>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">
                  Comprehensive Action Log // Forensics & Audit Trail
                </p>
              </div>
            </div>

            <button
              onClick={onCloseModal}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {renderLogContent(true)}
        </motion.div>
      </div>
    );
  }

  // In-page Docked Component (beneath puzzle board)
  return (
    <div className="w-full max-w-6xl mt-4 bg-[#2A2A2A] rounded-2xl border border-white/10 shadow-xl overflow-hidden text-[#EAEAEA]">
      {/* Collapsible Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 bg-[#222222] border-b border-white/10 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#FF7A00]/20 rounded-lg text-[#FF7A00]">
            <History size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black tracking-tight uppercase italic text-white">
                Move History & Audit Log
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-black font-mono bg-[#FF7A00]/20 text-[#FF7A00] rounded-full border border-[#FF7A00]/30">
                {entries.length} {entries.length === 1 ? 'Action' : 'Actions'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Recording
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Metrics Badge in collapsed view */}
          {!isExpanded && summary.totalActions > 0 && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono mr-2 text-white/60">
              <span>APM: <strong className="text-amber-400">{summary.actionsPerMinute}</strong></span>
              <span>•</span>
              <span>Player: <strong className="text-blue-400">{summary.playerMoves}</strong></span>
              <span>•</span>
              <span>Avg: <strong className="text-cyan-400">{(summary.avgThinkTimeMs / 1000).toFixed(1)}s</strong></span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderLogContent(false)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

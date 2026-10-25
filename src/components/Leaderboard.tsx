import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Hash, User, X } from 'lucide-react';
import { PuzzleType } from '../types';
import { Leaderboard as LeaderboardStore } from '../core/Leaderboard';

interface LeaderboardEntry {
  id: number;
  username: string;
  puzzle_type: string;
  grid_size: number;
  time_ms: number;
  moves: number;
  created_at: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleType: PuzzleType;
  gridSize: number;
  username: string;
  setUsername: (name: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, puzzleType, gridSize, username, setUsername }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localName, setLocalName] = useState(username || 'Player 1');
  const [view, setView] = useState<'top' | 'recent'>('top');

  useEffect(() => {
    setLocalName(username || 'Player 1');
  }, [username]);

  const handleNameSave = () => {
    const name = localName.trim() || "Player 1";
    setUsername(name);
    localStorage.setItem('puzzlotrix_user', name);
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const url = view === 'top' 
        ? `/api/leaderboard?type=${puzzleType}&size=${gridSize}&limit=20`
        : `/api/leaderboard`;
        
      fetch(url)
        .then(res => res.json())
        .then(data => {
          let list: LeaderboardEntry[] = Array.isArray(data) ? data : [];
          if (list.length === 0 && view === 'top') {
            const local = LeaderboardStore.get(puzzleType, gridSize);
            list = local.map((e, idx) => ({
              id: e.timestamp || Date.now() + idx,
              username: e.username,
              puzzle_type: e.puzzleType,
              grid_size: e.gridSize,
              time_ms: (e as any).time_ms || (e.solveTime * 1000),
              moves: e.moves || 0,
              created_at: new Date(e.timestamp || Date.now()).toISOString()
            }));
          }
          setEntries(list);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch leaderboard:", err);
          const local = LeaderboardStore.get(puzzleType, gridSize);
          const list: LeaderboardEntry[] = local.map((e, idx) => ({
            id: e.timestamp || Date.now() + idx,
            username: e.username,
            puzzle_type: e.puzzleType,
            grid_size: e.gridSize,
            time_ms: (e as any).time_ms || (e.solveTime * 1000),
            moves: e.moves || 0,
            created_at: new Date(e.timestamp || Date.now()).toISOString()
          }));
          setEntries(list);
          setLoading(false);
        });
    }
  }, [isOpen, puzzleType, gridSize, view]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Leaderboard</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                    {view === 'top' ? `${puzzleType.replace(/-/g, ' ')} // ${gridSize}x${gridSize}` : 'Global Recent Activity'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex p-2 bg-white/5 border-b border-white/5 gap-2">
              <button 
                onClick={() => setView('top')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${view === 'top' ? 'bg-orange-500 text-white' : 'hover:bg-white/10 opacity-50'}`}
              >
                Top Scores
              </button>
              <button 
                onClick={() => setView('recent')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${view === 'recent' ? 'bg-orange-500 text-white' : 'hover:bg-white/10 opacity-50'}`}
              >
                Recent Games
              </button>
            </div>

            <div className="px-6 py-4 bg-white/5 border-b border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 block">Your Player Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Enter your name..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500 transition-all"
                />
                <button 
                  onClick={handleNameSave}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <p className="text-xs font-bold uppercase tracking-widest">No records yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black italic ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-slate-300 text-black' : 
                        index === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-white/40'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User size={12} className="opacity-40" />
                          <span className="font-bold text-sm">{entry.username}</span>
                        </div>
                        <div className="text-[10px] opacity-40 uppercase tracking-widest flex gap-2">
                          <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                          {view === 'recent' && (
                            <span className="text-orange-500/60">
                              • {entry.puzzle_type.replace(/-/g, ' ')} ({entry.grid_size}x{entry.grid_size})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-orange-500 font-black italic">
                          <Clock size={14} />
                          {(entry.time_ms / 1000).toFixed(2)}s
                        </div>
                        {entry.moves > 0 && (
                          <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                            {entry.moves} Moves
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

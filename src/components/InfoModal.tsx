import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Github, ExternalLink, Brain, Gamepad2, Info as InfoIcon, ChevronRight } from 'lucide-react';
import { algorithmExplanations, AlgorithmExplanation } from '../constants/algorithmExplanations';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'about' | 'how-to-play' | 'algorithms'>('about');
  const [selectedPuzzle, setSelectedPuzzle] = React.useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = React.useState<string | null>(null);

  const puzzleExplanations = [
    // ... existing puzzle explanations ...
    {
      id: 'math-latin-square',
      name: 'Math Latin Square',
      overview: 'A logic-based number placement puzzle that combines Latin Square rules with arithmetic constraints.',
      goal: 'Fill the grid with numbers so that each number appears exactly once in every row and column, while satisfying the mathematical equations on the edges.',
      rules: [
        'Each row and column must contain a unique set of numbers (1 to N).',
        'The arithmetic operation applied to a row or column must equal the target value shown.',
        'Operations include Addition (+), Subtraction (-), Multiplication (*), and Division (/).'
      ],
      grid: 'An N×N grid with target values and operators displayed at the end of each row and column.',
      example: 'In a 3×3 grid, a row with target "6" and operator "+" could be [1, 2, 3] because 1+2+3=6.',
      strategy: 'Start with rows or columns that have limited combinations, such as division or large multiplication targets.',
      interesting: 'It requires simultaneous consideration of positional logic (Latin Square) and numerical computation.',
      complexity: 'Larger grid sizes and complex operators (division/subtraction) increase search state space.',
      educational: 'logical reasoning, mathematical thinking, constraint satisfaction.'
    },
    {
      id: 'sudoku',
      name: 'Sudoku',
      overview: 'The world\'s most popular placement puzzle, requiring pure logic without any arithmetic.',
      goal: 'Fill a grid with digits so that each column, each row, and each of the subgrids (boxes) contain all of the digits from 1 to N.',
      rules: [
        'Each number must appear exactly once in each row.',
        'Each number must appear exactly once in each column.',
        'Each number must appear exactly once in each subgrid (box).'
      ],
      grid: 'Typically a 9×9 grid divided into 3×3 subgrids, though other sizes (4×4, 16×16) exist.',
      example: 'If a 3×3 box already has the numbers 1-8, the remaining empty cell must be 9.',
      strategy: 'Look for "naked singles" (cells where only one number can fit) or "hidden singles" (the only place in a row/column/box a number can go).',
      interesting: 'It\'s a perfect exercise in deductive reasoning and elimination.',
      complexity: 'The number and placement of pre-filled "clue" cells determine the search complexity.',
      educational: 'logical reasoning, pattern recognition, focus.'
    },
    {
      id: 'maze',
      name: 'Maze',
      overview: 'A spatial navigation challenge where you must find a path through a complex network of passages.',
      goal: 'Find a continuous path from the Start (S) node to the End (E) node without crossing any walls.',
      rules: [
        'You can only move through empty (path) cells.',
        'You cannot move through or jump over walls.',
        'Movement is restricted to horizontal and vertical directions.'
      ],
      grid: 'A grid of cells where each cell is either a wall (impassable) or a path (passable).',
      example: 'Navigating a 5×5 grid where walls form a "U" shape, forcing you to go around the perimeter.',
      strategy: 'Work backward from the end point or look for "dead ends" and eliminate them.',
      interesting: 'It visualizes search algorithms and tests spatial awareness.',
      complexity: 'Maze density, length of the solution path, and the number of branching paths.',
      educational: 'spatial thinking, planning, problem-solving.'
    },
    {
      id: 'n-queens',
      name: 'N-Queens',
      overview: 'A classic combinatorial puzzle based on the movement of the queen in chess.',
      goal: 'Place N chess queens on an N×N chessboard so that no two queens threaten each other.',
      rules: [
        'No two queens can be in the same row.',
        'No two queens can be in the same column.',
        'No two queens can be on the same diagonal.'
      ],
      grid: 'An N×N chessboard.',
      example: 'On a 4×4 board, placing queens at (0,1), (1,3), (2,0), and (3,2) solves the puzzle.',
      strategy: 'Place queens one by one and use the process of elimination for the remaining rows/columns.',
      interesting: 'It\'s a classic example of a "Constraint Satisfaction Problem" in computer science.',
      complexity: 'The number of queens (N) significantly increases the number of possible configurations.',
      educational: 'logical reasoning, spatial thinking, symmetry.'
    },
    {
      id: 'minesweeper',
      name: 'Minesweeper',
      overview: 'A game of deduction where you must clear a minefield without detonating any mines.',
      goal: 'Reveal all cells that do not contain a mine.',
      rules: [
        'Clicking a mine ends the game immediately.',
        'Numbers in revealed cells show how many mines are in the 8 surrounding cells.',
        'Use flags to mark suspected mine locations.'
      ],
      grid: 'A hidden grid of cells, some containing mines and others containing numbers or empty space.',
      example: 'A cell showing "1" surrounded by 7 revealed safe cells means the 8th unrevealed neighbor must be a mine.',
      strategy: 'Look for "safe" patterns (e.g., a 1 at a corner) and use flags to reduce unknown neighbors.',
      interesting: 'It combines probability with absolute logical deduction.',
      complexity: 'Mine density and the size of the grid.',
      educational: 'logical reasoning, pattern recognition, risk assessment.'
    },
    {
      id: 'nonogram',
      name: 'Nonogram',
      overview: 'Also known as Picross, it\'s a picture logic puzzle where cells are colored according to numbers.',
      goal: 'Fill in cells to reveal a hidden pixel-art image based on numerical clues.',
      rules: [
        'Numbers on the left/top indicate how many consecutive filled cells are in that row/column.',
        'There must be at least one empty cell between separate blocks of filled cells.'
      ],
      grid: 'A grid with lists of numbers for each row and column.',
      example: 'A clue of "3 1" means there is a block of 3 filled cells, then at least one gap, then 1 filled cell.',
      strategy: 'Start with large numbers that must overlap in the middle regardless of their exact position.',
      interesting: 'It transforms abstract numbers into a visual image through logic.',
      complexity: 'Grid size and the complexity of the clue sequences.',
      educational: 'pattern recognition, logical reasoning, attention to detail.'
    },
    {
      id: 'kenken',
      name: 'KenKen',
      overview: 'A grid-based numerical puzzle that is a more advanced relative of Sudoku.',
      goal: 'Fill the grid with numbers 1-N such that each appears once per row/column, while satisfying "cage" constraints.',
      rules: [
        'Each row and column must contain unique numbers from 1 to N.',
        'The numbers in each outlined "cage" must produce the target value using the specified operator.',
        'Numbers can repeat within a cage as long as they aren\'t in the same row or column.'
      ],
      grid: 'An N×N grid divided into various shaped "cages," each with a target and operator.',
      example: 'A 2-cell cage with "3+" could contain [1, 2] or [2, 1].',
      strategy: 'Focus on single-cell cages (freebies) and cages with restrictive operators like division or subtraction.',
      interesting: 'It requires deeper mathematical analysis than Sudoku.',
      complexity: 'Grid size and the complexity of cage shapes and operations.',
      educational: 'mathematical thinking, logical reasoning, mental arithmetic.'
    },
    {
      id: 'sliding-puzzle',
      name: 'Sliding Puzzle (N-Puzzle)',
      overview: 'A classic puzzle consisting of a frame of numbered square tiles in random order with one tile missing.',
      goal: 'Rearrange the tiles into numerical order by sliding them into the empty space.',
      rules: [
        'Only tiles adjacent to the empty space can be moved.',
        'Tiles are moved by "sliding" them into the empty slot.',
        'The final state must have all numbers in order with the empty space at the end.'
      ],
      grid: 'A grid (usually 3×3 or 4×4) containing N-1 numbered tiles and one empty slot.',
      example: 'In a 3×3 (8-puzzle), moving the \'8\' tile into the empty space at the bottom right to complete the sequence.',
      strategy: 'Solve the puzzle row by row and column by column, starting from the top-left.',
      interesting: 'It\'s a test of sequential planning and understanding of permutations.',
      complexity: 'Grid size (the 15-puzzle has a much larger state space than the 8-puzzle).',
      educational: 'spatial thinking, planning, algorithmic reasoning.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
                  <InfoIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Puzzlotrix Info</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">System Documentation v1.2.0</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-white/2">
                  {[
                    { id: 'about', label: 'About', icon: InfoIcon },
                    { id: 'how-to-play', label: 'How to Play', icon: Gamepad2 },
                    { id: 'algorithms', label: 'Algorithms', icon: Brain },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id !== 'how-to-play') setSelectedPuzzle(null);
                        if (tab.id !== 'algorithms') setSelectedAlgorithm(null);
                      }}
                      className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white/5 text-orange-500 border-b-2 border-orange-500' 
                          : 'text-white/40 hover:text-white/70 hover:bg-white/2'
                      }`}
                    >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 text-sm leading-relaxed text-white/70">
              {activeTab === 'about' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Project Overview</h3>
                  <p className="mb-4">
                    Puzzlotrix is a high-performance, interactive puzzle engine designed to showcase advanced search algorithms and real-time state space exploration. 
                    Built with a focus on "crafted" UI/UX, it provides a playground for both human solving and AI-assisted optimization.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-orange-500 font-black text-lg mb-1 italic">100%</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Deterministic</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-orange-500 font-black text-lg mb-1 italic">Full Stack</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">SQLite + Express</div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Core Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {['React 18', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'Tailwind CSS', 'Motion', 'Web Workers', 'A* Pathfinding'].map(tech => (
                        <span key={tech} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-white/5">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <a 
                      href="https://github.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <Github size={14} />
                      View Source on GitHub
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              )}

              {activeTab === 'how-to-play' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {!selectedPuzzle ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {puzzleExplanations.map((puzzle) => (
                        <button
                          key={puzzle.id}
                          onClick={() => setSelectedPuzzle(puzzle.id)}
                          className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all group"
                        >
                          <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] mb-1 group-hover:text-white transition-colors">
                            {puzzle.name}
                          </h4>
                          <p className="text-[10px] opacity-50 line-clamp-2">{puzzle.overview}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <button 
                        onClick={() => setSelectedPuzzle(null)}
                        className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-white transition-colors flex items-center gap-2 mb-4"
                      >
                        ← Back to Puzzle List
                      </button>
                      
                      {puzzleExplanations.filter(p => p.id === selectedPuzzle).map(p => (
                        <div key={p.id} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-1">{p.name}</h3>
                            <div className="h-1 w-12 bg-orange-500 rounded-full" />
                          </div>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Overview</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.overview}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Goal</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.goal}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Rules</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {p.rules.map((rule, i) => (
                                <li key={i} className="text-xs opacity-80">{rule}</li>
                              ))}
                            </ul>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Grid Structure</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.grid}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Example</h4>
                            <p className="text-xs leading-relaxed opacity-80 italic">"{p.example}"</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Strategy Tips</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.strategy}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Why This Puzzle Is Interesting</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.interesting}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Complexity Factors</h4>
                            <p className="text-xs leading-relaxed opacity-80">{p.complexity}</p>
                          </section>

                          <section className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Educational Value</h4>
                            <p className="text-xs leading-relaxed opacity-90">Improves skills such as: <span className="font-bold text-white">{p.educational}</span></p>
                          </section>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'algorithms' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {!selectedAlgorithm ? (
                    <div className="space-y-8">
                      {['Pathfinding & Search', 'Constraint Satisfaction', 'Specialized Solvers', 'Maze Generation'].map(category => (
                        <div key={category} className="space-y-4">
                          <h3 className="text-white font-bold uppercase tracking-widest text-[10px] border-b border-white/10 pb-2 flex items-center gap-2">
                            <span className="w-1 h-1 bg-orange-500 rounded-full" />
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {algorithmExplanations
                              .filter(algo => algo.category === category)
                              .map(algo => (
                                <button
                                  key={algo.id}
                                  onClick={() => setSelectedAlgorithm(algo.id)}
                                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all group flex justify-between items-center"
                                >
                                  <div>
                                    <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] mb-1 group-hover:text-white transition-colors">
                                      {algo.name}
                                    </h4>
                                    <p className="text-[10px] opacity-50 line-clamp-1">{algo.overview}</p>
                                  </div>
                                  <ChevronRight size={14} className="text-white/20 group-hover:text-orange-500 transition-colors" />
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <button 
                        onClick={() => setSelectedAlgorithm(null)}
                        className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-white transition-colors flex items-center gap-2 mb-4"
                      >
                        ← Back to Algorithm List
                      </button>

                      {algorithmExplanations.filter(a => a.id === selectedAlgorithm).map(a => (
                        <div key={a.id} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">{a.category}</div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-1">{a.name}</h3>
                            <div className="h-1 w-12 bg-orange-500 rounded-full" />
                          </div>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Overview</h4>
                            <p className="text-xs leading-relaxed opacity-80">{a.overview}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Purpose in Puzzlotrix</h4>
                            <p className="text-xs leading-relaxed opacity-80">{a.purpose}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Key Idea</h4>
                            <p className="text-xs leading-relaxed opacity-80 font-medium text-white/90">{a.keyIdea}</p>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Step-by-Step Working</h4>
                            <ul className="space-y-2">
                              {a.steps.map((step, i) => (
                                <li key={i} className="text-xs opacity-80 flex gap-3">
                                  <span className="text-orange-500 font-bold">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Example</h4>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs italic opacity-80">
                              "{a.example}"
                            </div>
                          </section>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <section>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Advantages</h4>
                              <p className="text-xs opacity-80">{a.advantages}</p>
                            </section>
                            <section>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Limitations</h4>
                              <p className="text-xs opacity-80">{a.limitations}</p>
                            </section>
                          </div>

                          <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Complexity</h4>
                            <code className="text-[10px] bg-white/5 px-2 py-1 rounded text-orange-400">{a.complexity}</code>
                          </section>

                          <section className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Educational Insight</h4>
                            <p className="text-xs leading-relaxed opacity-90">{a.educational}</p>
                          </section>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">
                Puzzlotrix // Neural Grid Engine // abhinavsingh11d
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

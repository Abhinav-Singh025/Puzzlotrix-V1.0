import React, { useEffect, useRef, useState } from 'react';
import { PuzzleType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ValidationResult } from '../services/ValidationEngine';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GridRendererProps {
  type: PuzzleType;
  size: number;
  rows?: number;
  cols?: number;
  data: any;
  solution?: any;
  isSolved: boolean;
  onCellClick?: (r: number, c: number, e?: React.MouseEvent) => void;
  selectedCell?: { r: number; c: number } | null;
  validation?: ValidationResult;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const GridRenderer: React.FC<GridRendererProps> = ({
  type, size, rows, cols, data, solution, isSolved, onCellClick, selectedCell, validation, onKeyDown
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragFillType, setDragFillType] = useState<number | null>(null);
  const [panning, setPanning] = useState({ x: 0, y: 0 });
  const actualRows = rows || size;
  const actualCols = cols || size;

  useEffect(() => {
    if (size > 50 || actualRows > 50 || actualCols > 50) {
      renderCanvas();
    }
  }, [type, size, rows, cols, data, solution, isSolved]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cellSizeX = w / actualCols;
    const cellSizeY = h / actualRows;
    const cellSize = Math.min(cellSizeX, cellSizeY);

    ctx.clearRect(0, 0, w, h);
    const themeLine = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = themeLine;
    ctx.lineWidth = 0.5;

    if (type === 'maze') {
      const mazeData = data.grid;
      const start = data.start;
      const end = data.end;
      const visited = data.currentVisited || [];
      const frontier = data.currentFrontier || [];
      const path = isSolved && solution ? solution : [];

      for (let r = 0; r < actualRows; r++) {
        for (let c = 0; c < actualCols; c++) {
          if (mazeData[r][c] === 1) {
            ctx.fillStyle = '#111';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Draw visited
      ctx.fillStyle = 'rgba(255, 122, 0, 0.3)';
      for (const v of visited) {
        ctx.fillRect(v.c * cellSize, v.r * cellSize, cellSize, cellSize);
      }

      // Draw frontier
      ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
      for (const f of frontier) {
        ctx.fillRect(f.c * cellSize, f.r * cellSize, cellSize, cellSize);
      }

      // Draw path
      if (path.length > 0) {
        ctx.strokeStyle = '#FF7A00';
        ctx.lineWidth = Math.max(1, cellSize * 0.4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0].c * cellSize + cellSize / 2, path[0].r * cellSize + cellSize / 2);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].c * cellSize + cellSize / 2, path[i].r * cellSize + cellSize / 2);
        }
        ctx.stroke();
      }

      // Draw Start/End - Always visible
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(start.c * cellSize + cellSize / 2, start.r * cellSize + cellSize / 2, Math.max(2, cellSize * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(6, cellSize * 0.6)}px bold sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', start.c * cellSize + cellSize / 2, start.r * cellSize + cellSize / 2);

      ctx.fillStyle = '#FF4C4C';
      ctx.beginPath();
      ctx.arc(end.c * cellSize + cellSize / 2, end.r * cellSize + cellSize / 2, Math.max(2, cellSize * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText('E', end.c * cellSize + cellSize / 2, end.r * cellSize + cellSize / 2);
    } else {
      for (let r = 0; r < actualRows; r++) {
        for (let c = 0; c < actualCols; c++) {
          ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMaximized(!isMaximized);
  };

  const renderMaximizeButton = () => (
    <button 
      onClick={toggleMaximize}
      className={`absolute top-2 right-2 z-[110] p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-all border border-white/10`}
      title={isMaximized ? "Minimize" : "Maximize"}
    >
      {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );

  const containerClasses = isMaximized 
    ? "fixed inset-0 z-[100] bg-[#1E1E1E]/95 backdrop-blur-md p-4 md:p-12 flex flex-col items-center justify-center overflow-auto"
    : "relative w-full h-full";

  if (type === 'nonogram') {
    return (
      <div className={containerClasses}>
        {renderMaximizeButton()}
        <div className={`grid-container bg-[#2A2A2A] rounded-2xl border border-white/10 p-4 ${isMaximized ? 'max-w-full max-h-full' : ''}`}>
          {renderNonogram(actualRows, actualCols, data, solution, isSolved, isDragging, setIsDragging, dragFillType, setDragFillType, onCellClick)}
        </div>
      </div>
    );
  }

  if (type === 'math-latin-square') {
    return (
      <div className={containerClasses}>
        {renderMaximizeButton()}
        <div className={`grid-container bg-[#2A2A2A] rounded-2xl border border-white/10 p-4 ${isMaximized ? 'max-w-full max-h-full' : ''}`}>
          {renderMathLatinSquare(size, data, solution, isSolved, onCellClick, selectedCell, validation, onKeyDown)}
        </div>
      </div>
    );
  }

  if (size > 50 || actualRows > 50 || actualCols > 50) {
    return (
      <div className={containerClasses}>
        {renderMaximizeButton()}
        <div className={`grid-container bg-black/10 rounded-xl overflow-hidden border border-white/10 relative ${isMaximized ? 'w-[90vw] h-[85vh]' : ''}`}>
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute bottom-2 right-2 text-[10px] opacity-50 font-mono">Canvas Rendering Mode ({actualRows}x{actualCols})</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {renderMaximizeButton()}
      <div className="grid-container">
        <motion.div 
          drag={size > 10}
          dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
          dragElastic={0.05}
          className={`grid bg-[#1E1E1E] p-2 rounded-xl border border-white/10 shadow-inner outline-none focus:ring-2 focus:ring-[#FF7A00]/50 ${size > 10 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{
            gridTemplateColumns: `repeat(${actualCols}, 1fr)`,
            gridTemplateRows: `repeat(${actualRows}, 1fr)`,
            width: '100%',
            maxWidth: isMaximized ? '90vh' : '1000px',
            aspectRatio: `${actualCols}/${actualRows}`
          }}
        >
          {renderDOMGrid(type, size, actualRows, actualCols, data, solution, isSolved, isDragging, setIsDragging, dragFillType, setDragFillType, onCellClick, selectedCell, validation)}
        </motion.div>
      </div>
    </div>
  );
};

const renderMathLatinSquare = (
  size: number, 
  data: any, 
  solution: any, 
  isSolved: boolean, 
  onCellClick?: (r: number, c: number, e?: React.MouseEvent) => void, 
  selectedCell?: { r: number; c: number } | null, 
  validation?: ValidationResult,
  onKeyDown?: (e: React.KeyboardEvent) => void
) => {
  const grid = isSolved ? solution : data.grid;
  const conflicts = validation?.conflicts || [];
  const arithmeticConflicts = validation?.arithmeticConflicts || [];
  
  const elements = [];
  for (let r = 0; r < 2 * size; r++) {
    for (let c = 0; c < 2 * size; c++) {
      const isCell = r % 2 === 0 && c % 2 === 0 && r < 2 * size - 1 && c < 2 * size - 1;
      const isRowOp = r % 2 === 0 && c % 2 === 1 && c < 2 * size - 1;
      const isColOp = r % 2 === 1 && c % 2 === 0 && r < 2 * size - 1;
      const isRowTarget = r % 2 === 0 && c === 2 * size - 1 && r < 2 * size - 1;
      const isColTarget = r === 2 * size - 1 && c % 2 === 0 && c < 2 * size - 1;
      
      if (isCell) {
        const row = r / 2;
        const col = c / 2;
        const val = grid[row][col];
        const isSelected = selectedCell?.r === row && selectedCell?.c === col;
        const isConflict = conflicts.some(conf => conf.r === row && conf.c === col);
        const isArithmeticConflict = arithmeticConflicts.some(conf => conf.r === row && conf.c === col);
        
        const valStr = val !== 0 ? val.toString() : '';
        const fontSize = valStr.length > 4 ? 'text-[8px]' : valStr.length > 2 ? 'text-[10px]' : 'text-sm md:text-base';
        let cellClass = `w-10 h-10 md:w-12 md:h-12 border border-white/10 flex items-center justify-center ${fontSize} font-mono transition-all cursor-pointer select-none text-[#EAEAEA] relative`;
        if (isSelected) cellClass += " ring-2 ring-[#FF7A00] z-20 bg-[#FF7A00]/10";
        
        if (isConflict) cellClass += " bg-[#FF4C4C]/30 border-[#FF4C4C]/50";
        else if (isArithmeticConflict) cellClass += " bg-amber-500/30 border-amber-500/50";
        else if (val === 0) cellClass += " bg-white/5 hover:bg-white/10";

        elements.push(
          <div key={`cell-${row}-${col}`} className={cellClass} onClick={(e) => onCellClick?.(row, col, e)}>
            {valStr}
          </div>
        );
      } else if (isRowOp) {
        const row = r / 2;
        const opIdx = (c - 1) / 2;
        const op = data.rowOps[row][opIdx];
        elements.push(
          <div key={`row-op-${row}-${opIdx}`} className="w-6 h-10 md:w-8 md:h-12 flex items-center justify-center text-[#FF7A00] font-bold opacity-60">
            {op === '*' ? '×' : op === '/' ? '÷' : op}
          </div>
        );
      } else if (isColOp) {
        const col = c / 2;
        const opIdx = (r - 1) / 2;
        const op = data.colOps[col][opIdx];
        elements.push(
          <div key={`col-op-${col}-${opIdx}`} className="w-10 h-6 md:w-12 md:h-8 flex items-center justify-center text-[#FF7A00] font-bold opacity-60">
            {op === '*' ? '×' : op === '/' ? '÷' : op}
          </div>
        );
      } else if (isRowTarget) {
        const row = r / 2;
        elements.push(
          <div key={`row-target-${row}`} className="w-12 h-10 md:w-16 md:h-12 flex items-center justify-start pl-2 text-[#22C55E] font-bold text-xs md:text-sm">
            = {data.rowTargets[row]}
          </div>
        );
      } else if (isColTarget) {
        const col = c / 2;
        elements.push(
          <div key={`col-target-${col}`} className="w-10 h-12 md:w-12 md:h-16 flex flex-col items-center justify-start pt-2 text-[#22C55E] font-bold text-xs md:text-sm">
            <span className="opacity-50">||</span>
            <span>{data.colTargets[col]}</span>
          </div>
        );
      } else {
        elements.push(<div key={`empty-${r}-${c}`} className="w-1 h-1" />);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full overflow-auto p-4">
       <div className="flex justify-around w-full px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[#FF7A00] font-mono text-xl mb-4">
          <span>∑</span>
          <span className="text-xs opacity-50 uppercase tracking-widest self-center text-[#EAEAEA]">Arithmetic Latin Square</span>
          <span>∏</span>
        </div>
       <motion.div 
         drag={size > 6}
         dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
         dragElastic={0.1}
         className={`grid items-center justify-center outline-none focus:ring-2 focus:ring-[#FF7A00]/50 ${size > 6 ? 'cursor-grab active:cursor-grabbing' : ''}`}
         tabIndex={0}
         onKeyDown={onKeyDown}
         style={{
           gridTemplateColumns: `repeat(${size - 1}, auto auto) auto auto`,
           gridTemplateRows: `repeat(${size - 1}, auto auto) auto auto`,
         }}
       >
         {elements}
       </motion.div>
    </div>
  );
};

const renderNonogram = (
  rows: number, 
  cols: number, 
  data: any, 
  solution: any, 
  isSolved: boolean, 
  isDragging: boolean,
  setIsDragging: (d: boolean) => void,
  dragFillType: number | null,
  setDragFillType: (t: number | null) => void,
  onCellClick?: (r: number, c: number, e?: React.MouseEvent) => void
) => {
  const { userGrid, clues } = data;
  const { rowClues, colClues } = clues;
  const displayGrid = isSolved ? solution : userGrid;
  
  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (isSolved) return;
    setIsDragging(true);
    const currentVal = userGrid[r][c];
    // If left click, cycle 0 -> 1 -> 0
    // If right click, cycle 0 -> -1 -> 0
    let nextVal = 0;
    if (e.button === 0) {
      nextVal = currentVal === 1 ? 0 : 1;
    } else if (e.button === 2) {
      nextVal = currentVal === -1 ? 0 : -1;
    }
    setDragFillType(nextVal);
    onCellClick?.(r, c, e);
  };

  const handleMouseEnter = (r: number, c: number, e: React.MouseEvent) => {
    if (isDragging && dragFillType !== null) {
      if (userGrid[r][c] !== dragFillType) {
        (onCellClick as any)?.(r, c, e, dragFillType);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragFillType(null);
  };

  return (
    <div 
      className="relative select-none" 
      style={{ width: 'fit-content', height: 'fit-content' }}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      <div className="flex sticky top-0 z-30 bg-[#2A2A2A]">
        {/* Corner spacer */}
        <div className="w-16 md:w-24 shrink-0 sticky left-0 z-40 bg-[#2A2A2A]" />
        {/* Column Clues */}
        <div className="flex" style={{ width: 'fit-content' }}>
          {colClues.map((clue: number[], i: number) => (
            <div key={i} className="w-6 md:w-8 flex flex-col justify-end items-center border-x border-white/10 bg-white/5 py-1">
              {clue.map((c, j) => (
                <span key={j} className="text-[8px] md:text-[10px] font-bold leading-tight text-[#EAEAEA]">{c}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex">
        {/* Row Clues */}
        <div className="flex flex-col shrink-0 sticky left-0 z-20 bg-[#2A2A2A]">
          {rowClues.map((clue: number[], i: number) => (
            <div key={i} className="h-6 md:h-8 flex justify-end items-center border-y border-white/10 bg-white/5 px-2 w-16 md:w-24">
              {clue.map((c, j) => (
                <span key={j} className="text-[8px] md:text-[10px] font-bold mx-0.5 text-[#EAEAEA]">{c}</span>
              ))}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div 
          className="grid border border-white/10"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            width: cols * (window.innerWidth < 768 ? 24 : 32) + 'px',
          }}
        >
          {Array.from({ length: rows * cols }).map((_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const val = displayGrid[r][c];
            let cellClass = "w-6 h-6 md:w-8 md:h-8 border border-white/10 flex items-center justify-center cursor-pointer transition-all";
            
            if (val === 1) cellClass += " bg-[#FF7A00]";
            else if (val === -1) cellClass += " bg-[#FF4C4C]/20";
            else cellClass += " hover:bg-white/5";
            
            return (
              <div 
                key={`${r}-${c}`} 
                className={cellClass}
                onMouseDown={(e) => handleMouseDown(r, c, e)}
                onMouseEnter={(e) => handleMouseEnter(r, c, e)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {val === -1 && <span className="text-[#FF4C4C] text-xs">×</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const renderDOMGrid = (
  type: PuzzleType, 
  size: number, 
  rows: number,
  cols: number,
  data: any, 
  solution: any, 
  isSolved: boolean, 
  isDragging: boolean,
  setIsDragging: (d: boolean) => void,
  dragFillType: number | null,
  setDragFillType: (t: number | null) => void,
  onCellClick?: (r: number, c: number, e?: React.MouseEvent) => void,
  selectedCell?: { r: number; c: number } | null,
  validation?: ValidationResult
) => {
  const cells = [];
  let displayData = data;
  if (isSolved && solution) {
    if (type === 'sliding-puzzle') {
      // solution is number[][] (the path). We want the last state.
      // If it's already a flat grid (number[]), use it.
      if (Array.isArray(solution) && solution.length > 0 && solution[0]) {
        if (Array.isArray(solution[0])) {
          // It's a path (array of grids)
          displayData = solution[solution.length - 1];
        } else {
          // It's a single grid
          displayData = solution;
        }
      }
    } else if (type === 'maze') {
      displayData = data;
    } else {
      displayData = solution;
    }
  }
  const conflicts = validation?.conflicts || [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let content: React.ReactNode = null;
      let cellClass = "border border-white/10 flex items-center justify-center text-xs font-mono transition-all duration-300 select-none text-[#EAEAEA] relative";
      
      const isSelected = selectedCell?.r === r && selectedCell?.c === c;
      const isConflict = conflicts.some(conf => conf.r === r && conf.c === c);

      if (isSelected) cellClass += " ring-2 ring-[#FF7A00] z-20 bg-[#FF7A00]/10";
      if (isConflict) cellClass += " bg-[#FF4C4C]/30 border-[#FF4C4C]/50";

      if (type === 'sudoku') {
        const val = Array.isArray(displayData) ? displayData[r]?.[c] : displayData?.grid?.[r]?.[c];
        content = val !== 0 ? val : '';
        if (val === 0 && !isSelected && !isConflict) cellClass += " bg-white/5";
        
        const n = Math.sqrt(size);
        if (Number.isInteger(n)) {
          if ((c + 1) % n === 0 && c !== size - 1) cellClass += " border-r-2 border-r-white/30";
          if ((r + 1) % n === 0 && r !== size - 1) cellClass += " border-b-2 border-b-white/30";
        }
      } else if (type === 'maze') {
        const isWall = data?.grid?.[r]?.[c] === 1;
        const isStart = data?.start?.r === r && data?.start?.c === c;
        const isEnd = data?.end?.r === r && data?.end?.c === c;
        const onPath = isSolved && solution && Array.isArray(solution) && solution.some((p: any) => p.r === r && p.c === c);
        const isVisited = data?.currentVisited?.some((v: any) => v.r === r && v.c === c);
        const isFrontier = data?.currentFrontier?.some((f: any) => f.r === r && f.c === c);

        if (isWall) cellClass += " bg-[#111]";
        else cellClass += " cursor-pointer hover:bg-white/5";

        if (onPath) cellClass += " bg-[#FF7A00]/50 shadow-[0_0_10px_rgba(255,122,0,0.5)] z-10";
        else if (isVisited) cellClass += " bg-[#FF7A00]/30";
        else if (isFrontier) cellClass += " bg-[#22C55E]/50";

        if (isStart) {
          content = (
            <div className="w-full h-full flex items-center justify-center bg-[#22C55E]/20">
              <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.9)] flex items-center justify-center text-[8px] font-bold text-white">S</div>
            </div>
          );
        } else if (isEnd) {
          content = (
            <div className="w-full h-full flex items-center justify-center bg-[#FF4C4C]/20">
              <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FF4C4C] shadow-[0_0_12px_rgba(255,76,76,0.9)] flex items-center justify-center text-[8px] font-bold text-white">E</div>
            </div>
          );
        }
      } else if (type === 'n-queens') {
        const queenRow = displayData?.[c];
        if (queenRow === r) content = '♛';
        if ((r + c) % 2 === 0) cellClass += " bg-white/5";
      } else if (type === 'minesweeper') {
        const val = data?.grid?.[r]?.[c];
        const revealed = isSolved || (data?.revealed && data.revealed[r]?.[c]);
        const flagged = data?.flagged && data.flagged[r]?.[c];
        
        if (revealed) {
          if (val === -1) content = '💣';
          else if (val > 0) content = val;
          cellClass += " bg-white/10";
        } else {
          cellClass += " bg-neutral-700 hover:bg-neutral-600 cursor-pointer";
          if (flagged) content = '🚩';
        }
      } else if (type === 'sliding-puzzle') {
        const grid = Array.isArray(displayData) ? displayData : displayData?.grid;
        const val = (grid && grid[r * cols + c] !== undefined) ? grid[r * cols + c] : 0;
        const emptyIdx = data?.emptyIdx ?? 0;
        const emptyR = Math.floor(emptyIdx / cols);
        const emptyC = emptyIdx % cols;
        const isMovable = (r === emptyR || c === emptyC) && (r !== emptyR || c !== emptyC);

        if (val !== 0) {
          content = val;
          cellClass += " bg-[#FF7A00]/20 border-[#FF7A00]/30 rounded-sm m-[1px] cursor-pointer hover:bg-[#FF7A00]/40";
          if (isMovable) cellClass += " ring-1 ring-[#22C55E]/50";
        } else {
          cellClass += " bg-transparent border-none";
        }

        const dragDirection = isMovable ? (r === emptyR ? "x" : "y") : false;

        cells.push(
          <motion.div 
            layout={rows * cols <= 400}
            drag={dragDirection}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (isMovable) {
                const threshold = 20;
                const { x, y } = info.offset;
                const isHorizontal = r === emptyR;
                const isVertical = c === emptyC;
                
                let shouldMove = false;
                if (isHorizontal) {
                  const direction = c < emptyC ? 1 : -1; // Dragging towards empty cell
                  if (direction === 1 && x > threshold) shouldMove = true;
                  if (direction === -1 && x < -threshold) shouldMove = true;
                } else if (isVertical) {
                  const direction = r < emptyR ? 1 : -1;
                  if (direction === 1 && y > threshold) shouldMove = true;
                  if (direction === -1 && y < -threshold) shouldMove = true;
                }

                if (shouldMove) {
                  onCellClick?.(r, c);
                }
              }
            }}
            key={val === 0 ? `empty-${r}-${c}` : `tile-${val}`} 
            className={cellClass}
            onClick={(e) => onCellClick?.(r, c, e)}
            whileHover={val !== 0 ? { scale: 1.02, backgroundColor: 'rgba(255, 122, 0, 0.4)' } : {}}
            whileTap={val !== 0 ? { scale: 0.95, opacity: 0.9 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            {content}
          </motion.div>
        );
        continue;
      } else if (type === 'kenken') {
        const grid = isSolved ? solution : data?.grid;
        const val = grid?.[r]?.[c] ?? 0;
        content = val !== 0 ? val : '';
        
        const cage = data?.cages?.find((cg: any) => cg.cells?.some((cell: any) => cell.r === r && cell.c === c));
        const isCageStart = cage?.cells?.[0]?.r === r && cage?.cells?.[0]?.c === c;
        
        // Cage borders
        if (cage && cage.cells) {
          const inCage = (nr: number, nc: number) => cage.cells.some((cell: any) => cell.r === nr && cell.c === nc);
          if (!inCage(r - 1, c)) cellClass += " border-t-2 border-t-white/40";
          if (!inCage(r + 1, c)) cellClass += " border-b-2 border-b-white/40";
          if (!inCage(r, c - 1)) cellClass += " border-l-2 border-l-white/40";
          if (!inCage(r, c + 1)) cellClass += " border-r-2 border-r-white/40";
        }

        if (isCageStart && cage) {
          content = (
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="absolute top-0 left-0 text-[7px] md:text-[9px] font-bold opacity-80 p-0.5 leading-none">
                {cage.target}{cage.op !== 'none' ? cage.op : ''}
              </span>
              {val !== 0 && <span className="text-sm md:text-base">{val}</span>}
            </div>
          );
        } else {
          content = val !== 0 ? <span className="text-sm md:text-base">{val}</span> : '';
        }
      }

      cells.push(
        <div 
          key={`${r}-${c}`} 
          className={cellClass}
          onClick={(e) => onCellClick?.(r, c, e)}
          onContextMenu={(e) => {
            e.preventDefault();
            onCellClick?.(r, c, e);
          }}
        >
          {content && typeof content === 'number' ? (
            <span className={content.toString().length > 4 ? 'text-[8px]' : content.toString().length > 2 ? 'text-[10px]' : 'text-sm md:text-base'}>
              {content}
            </span>
          ) : content}
        </div>
      );
    }
  }
  return cells;
};

import { useEffect, useRef } from 'react';
import { useTetris } from '../hooks/useTetris';
import { TetrisBoard } from '../components/tetris/TetrisBoard';
import { PiecePreview, NextPieces } from '../components/tetris/PiecePreview';
import { Button } from '@/components/ui/button';
import { getGhostPos } from '@/lib/tetrisHelpers';

export function TetrisPage() {
  const {
    board,
    player,
    nextPieces,
    holdPiece,
    score,
    rows,
    level,
    gameOver,
    isPaused,
    startGame,
    pauseGame,
    rotate,
    hardDrop,
    hold,
    handleKeyDown: gameHandleKeyDown,
    handleKeyUp: gameHandleKeyUp,
  } = useTetris();

  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gameRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver && score === 0) return; 
    if (gameOver) return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Shift"].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyP' || e.code === 'Escape') {
      pauseGame();
      return;
    }

    if (isPaused) return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
      if (!e.repeat) gameHandleKeyDown(e.code);
      return;
    }

    if (!e.repeat) {
      switch (e.code) {
        case 'ArrowUp':
          rotate(1);
          break;
        case 'KeyZ':
          rotate(-1);
          break;
        case 'Space':
          hardDrop();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyC':
          hold();
          break;
      }
    }
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
      gameHandleKeyUp(e.code);
    }
  };

  const ghostY = getGhostPos(player, board);

  return (
    <div className="flex absolute inset-0 z-50 h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%),#ffffff] text-slate-900 p-3 overflow-hidden">
      <div className="flex-1 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col items-center justify-center relative">
        <div 
          className="bg-slate-900 rounded-3xl p-8 shadow-2xl flex flex-wrap justify-center gap-8 items-start relative outline-none focus:ring-4 focus:ring-blue-500/20 transition-all max-w-full overflow-y-auto"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          ref={gameRef}
        >
          {/* Left Column: Hold Piece & Stats */}
          <div className="flex flex-col gap-6 w-[120px] shrink-0">
            <PiecePreview piece={holdPiece} title="Hold" />
            
            <div className="flex flex-col gap-3">
              <div className="bg-slate-800 p-3 rounded-xl border-2 border-slate-700 shadow-lg flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                <span className="text-xl font-bold text-white tracking-wider">{score}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border-2 border-slate-700 shadow-lg flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level</span>
                <span className="text-xl font-bold text-white">{level}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border-2 border-slate-700 shadow-lg flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lines</span>
                <span className="text-xl font-bold text-white">{rows}</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Board */}
          <div className="relative shrink-0 w-[300px]">
            <TetrisBoard board={board} player={player} ghostY={ghostY} />
            
            {/* Overlays */}
            {gameOver && score > 0 && (
              <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center gap-4 z-10 backdrop-blur-sm">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Game Over</h2>
                <span className="text-xl text-blue-400 font-bold">Score: {score}</span>
                <Button onClick={() => { startGame(); gameRef.current?.focus(); }} className="mt-4 bg-blue-600 hover:bg-blue-700 font-bold px-8">
                  Play Again
                </Button>
              </div>
            )}

            {!gameOver && isPaused && (
              <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center gap-4 z-10 backdrop-blur-sm">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Paused</h2>
                <Button onClick={() => { pauseGame(); gameRef.current?.focus(); }} className="mt-4 bg-blue-600 hover:bg-blue-700 font-bold px-8">
                  Resume
                </Button>
              </div>
            )}

            {/* Start Overlay */}
            {gameOver && score === 0 && rows === 0 && (
              <div className="absolute inset-0 bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-4 z-20">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-widest uppercase mb-4">Tetris</h2>
                <Button onClick={() => { startGame(); gameRef.current?.focus(); }} size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold px-10 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  Start Game
                </Button>
                <div className="text-slate-400 text-xs mt-8 flex flex-col items-center gap-1 text-center">
                  <span><strong className="text-white">Arrows:</strong> Move & Rotate</span>
                  <span><strong className="text-white">Space:</strong> Hard Drop</span>
                  <span><strong className="text-white">Shift / C:</strong> Hold</span>
                  <span><strong className="text-white">P / Esc:</strong> Pause</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Next Pieces */}
          <div className="flex flex-col gap-6 w-[120px] shrink-0">
            <NextPieces pieces={nextPieces} />
          </div>
        </div>
      </div>
    </div>
  );
}

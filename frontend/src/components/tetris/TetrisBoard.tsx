import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/tetrisHelpers';

type TetrisBoardProps = {
  board: any[][];
  player: { pos: { x: number; y: number }; tetromino: number[][] };
  ghostY: number;
};

export function TetrisBoard({ board, player, ghostY }: TetrisBoardProps) {
  const displayBoard = board.map(row => [...row]);

  player.tetromino.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        if (displayBoard[y + ghostY] && displayBoard[y + ghostY][x + player.pos.x]) {
          if (displayBoard[y + ghostY][x + player.pos.x][0] === 0) {
            displayBoard[y + ghostY][x + player.pos.x] = [value, 'ghost'];
          }
        }
      }
    });
  });

  player.tetromino.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        if (displayBoard[y + player.pos.y] && displayBoard[y + player.pos.y][x + player.pos.x]) {
          displayBoard[y + player.pos.y][x + player.pos.x] = [value, 'active'];
        }
      }
    });
  });

  return (
    <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] grid-cols-[repeat(10,minmax(0,1fr))] gap-[1px] bg-slate-800 border-4 border-slate-700 w-full max-w-[320px] aspect-[1/2] p-1 rounded-xl shadow-2xl mx-auto">
      {displayBoard.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={cn(
              "w-full h-full rounded-[2px]",
              cell[0] === 0 ? "bg-slate-900/80" : COLORS[cell[0]],
              cell[1] === 'ghost' ? "opacity-25 border border-white/50" : "opacity-100 border border-black/20"
            )}
          />
        ))
      )}
    </div>
  );
}

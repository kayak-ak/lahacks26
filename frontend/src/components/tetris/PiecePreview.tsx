import { TETROMINOES, COLORS, type TetrominoType } from '@/lib/tetrisHelpers';
import { cn } from '@/lib/utils';

type PiecePreviewProps = {
  piece: TetrominoType | null;
  title: string;
};

export function PiecePreview({ piece, title }: PiecePreviewProps) {
  const shape = piece ? TETROMINOES[piece].shape : null;
  let colorValue = 0;
  if (shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          colorValue = shape[y][x];
          break;
        }
      }
      if (colorValue !== 0) break;
    }
  }

  const colorClass = colorValue !== 0 ? COLORS[colorValue] : 'bg-transparent';

  return (
    <div className="flex flex-col items-center bg-slate-800 p-3 rounded-xl border-2 border-slate-700 shadow-lg min-w-[90px]">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex items-center justify-center w-16 h-16">
        <div 
          className="grid gap-[1px]" 
          style={{ 
            gridTemplateRows: `repeat(${shape ? shape.length : 4}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${shape ? shape[0].length : 4}, minmax(0, 1fr))`,
            width: shape ? `${shape[0].length * 12}px` : '48px',
            height: shape ? `${shape.length * 12}px` : '48px',
          }}
        >
          {shape ? (
            shape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={cn(
                    "w-full h-full rounded-[1px]",
                    cell === 0 ? "bg-transparent" : colorClass,
                    cell !== 0 && "border border-black/20"
                  )}
                />
              ))
            )
          ) : (
            Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-full h-full bg-transparent" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type NextPiecesProps = {
  pieces: TetrominoType[];
};

export function NextPieces({ pieces }: NextPiecesProps) {
  return (
    <div className="flex flex-col gap-3">
      {pieces.map((piece, i) => (
        <PiecePreview key={i} piece={piece} title={i === 0 ? "Next" : `Upcoming`} />
      ))}
    </div>
  );
}

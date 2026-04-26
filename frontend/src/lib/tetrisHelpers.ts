export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export type Tetromino = {
  shape: number[][];
  color: string;
};

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'bg-cyan-500',
  },
  J: {
    shape: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0]
    ],
    color: 'bg-blue-600',
  },
  L: {
    shape: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0]
    ],
    color: 'bg-orange-500',
  },
  O: {
    shape: [
      [4, 4],
      [4, 4]
    ],
    color: 'bg-yellow-400',
  },
  S: {
    shape: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0]
    ],
    color: 'bg-green-500',
  },
  T: {
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0]
    ],
    color: 'bg-purple-500',
  },
  Z: {
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0]
    ],
    color: 'bg-red-500',
  }
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// 7-Bag Randomizer generator
export function* createTetrisBagGenerator(): Generator<TetrominoType, void, unknown> {
  while (true) {
    const bag = [...TETROMINO_TYPES];
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    for (const piece of bag) {
      yield piece;
    }
  }
}

export const createBoard = () =>
  Array.from(Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill([0, 'clear']));

export const checkCollision = (
  player: { pos: { x: number; y: number }; tetromino: number[][] },
  board: any[][],
  { x: moveX, y: moveY }: { x: number; y: number }
) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      if (player.tetromino[y][x] !== 0) {
        if (
          !board[y + player.pos.y + moveY] ||
          !board[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          board[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

// SRS Kick Tables (y-coordinates are inverted since our board has y=0 at top)
// format: [fromState_toState]: [[x, y], [x, y], ...]
type KickTable = Record<string, [number, number][]>;

const KICK_TABLE_STANDARD: KickTable = {
  '0_1': [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]],
  '1_0': [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]],
  '1_2': [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]],
  '2_1': [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]],
  '2_3': [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],
  '3_2': [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],
  '3_0': [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],
  '0_3': [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],
};

const KICK_TABLE_I: KickTable = {
  '0_1': [[0, 0], [-2, 0], [+1, 0], [-2, +1], [+1, -2]],
  '1_0': [[0, 0], [+2, 0], [-1, 0], [+2, -1], [-1, +2]],
  '1_2': [[0, 0], [-1, 0], [+2, 0], [-1, -2], [+2, +1]],
  '2_1': [[0, 0], [+1, 0], [-2, 0], [+1, +2], [-2, -1]],
  '2_3': [[0, 0], [+2, 0], [-1, 0], [+2, -1], [-1, +2]],
  '3_2': [[0, 0], [-2, 0], [+1, 0], [-2, +1], [+1, -2]],
  '3_0': [[0, 0], [+1, 0], [-2, 0], [+1, +2], [-2, -1]],
  '0_3': [[0, 0], [-1, 0], [+2, 0], [-1, -2], [+2, +1]],
};

export const rotateMatrix = (matrix: number[][], dir: number) => {
  const rotatedObj = matrix.map((_, index) =>
    matrix.map((col) => col[index])
  );
  if (dir > 0) return rotatedObj.map((row) => row.reverse());
  return rotatedObj.reverse();
};

export const attemptRotation = (
  player: { pos: { x: number; y: number }; tetromino: number[][]; type: TetrominoType; rot: number },
  board: any[][],
  dir: number
): { success: boolean; newPos?: { x: number; y: number }; newTetromino?: number[][]; newRot?: number } => {
  if (player.type === 'O') return { success: true, newPos: player.pos, newTetromino: player.tetromino, newRot: player.rot }; // O doesn't rotate

  const rotated = rotateMatrix(player.tetromino, dir);
  const fromState = player.rot;
  const toState = (player.rot + dir + 4) % 4; // 0, 1, 2, 3
  const kickKey = `${fromState}_${toState}`;
  
  const kickTable = player.type === 'I' ? KICK_TABLE_I : KICK_TABLE_STANDARD;
  const tests = kickTable[kickKey] || [[0, 0]]; // default to no kick if somehow not found

  for (let i = 0; i < tests.length; i++) {
    const [kickX, kickY] = tests[i];
    const testPos = { x: player.pos.x + kickX, y: player.pos.y + kickY };
    
    if (!checkCollision({ pos: testPos, tetromino: rotated }, board, { x: 0, y: 0 })) {
      return { success: true, newPos: testPos, newTetromino: rotated, newRot: toState };
    }
  }

  return { success: false };
};

export const getGhostPos = (player: { pos: { x: number; y: number }; tetromino: number[][] }, board: any[][]) => {
  let ghostY = player.pos.y;
  while (!checkCollision({ ...player, pos: { x: player.pos.x, y: ghostY } }, board, { x: 0, y: 1 })) {
    ghostY += 1;
  }
  return ghostY;
};

export const COLORS: Record<number | string, string> = {
  0: 'bg-slate-900', // Empty
  1: 'bg-cyan-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  2: 'bg-blue-600 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  3: 'bg-orange-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  4: 'bg-yellow-400 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  5: 'bg-green-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  6: 'bg-purple-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
  7: 'bg-red-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]',
};

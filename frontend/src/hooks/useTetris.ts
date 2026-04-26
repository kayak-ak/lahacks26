import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createBoard,
  createTetrisBagGenerator,
  TETROMINOES,
  checkCollision,
  attemptRotation,
  type TetrominoType
} from '../lib/tetrisHelpers';

const DAS_DELAY = 167; // ms
const ARR_DELAY = 33; // ms
const SOFT_DROP_DELAY = 33; // ms
const MAX_LOCK_RESETS = 15;
const LOCK_DELAY = 500; // ms

export const useTetris = () => {
  const [board, setBoard] = useState(createBoard());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES['I'].shape,
    type: 'I' as TetrominoType,
    rot: 0, // 0, 1, 2, 3
    collided: false,
  });
  const [nextPieces, setNextPieces] = useState<TetrominoType[]>([]);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const fallAccumulatorRef = useRef<number>(0);
  
  const bagGenRef = useRef<Generator<TetrominoType, void, unknown> | null>(null);

  // Lock delay tracking
  const lockTimerRef = useRef<number>(0);
  const lockResetsRef = useRef<number>(0);
  const isLockingRef = useRef<boolean>(false);

  // Input tracking
  const inputRef = useRef({
    left: { down: false, das: 0, arr: 0 },
    right: { down: false, das: 0, arr: 0 },
    down: { down: false, arr: 0 },
  });

  const getNextPieces = useCallback((count: number, currentQueue: TetrominoType[]) => {
    if (!bagGenRef.current) bagGenRef.current = createTetrisBagGenerator();
    const newQueue = [...currentQueue];
    while (newQueue.length < count) {
      const next = bagGenRef.current.next().value;
      if (next) newQueue.push(next);
    }
    return newQueue;
  }, []);

  const resetPlayer = useCallback((newType?: TetrominoType) => {
    setNextPieces((prevQueue) => {
      let queue = prevQueue;
      let nextType = newType;
      if (!nextType) {
        if (queue.length === 0) queue = getNextPieces(5, []); // init
        nextType = queue[0];
        queue = getNextPieces(5, queue.slice(1));
      }
      
      const tetro = TETROMINOES[nextType];
      const spawnX = Math.floor(10 / 2) - Math.floor(tetro.shape[0].length / 2);
      const spawnY = nextType === 'I' ? -1 : 0; // I piece spawns one row higher due to 4x4 matrix
      
      setPlayer({
        pos: { x: spawnX, y: spawnY },
        tetromino: tetro.shape,
        type: nextType,
        rot: 0,
        collided: false,
      });

      return queue;
    });

    setCanHold(true);
    lockTimerRef.current = 0;
    lockResetsRef.current = 0;
    isLockingRef.current = false;
  }, [getNextPieces]);

  const startGame = useCallback(() => {
    setBoard(createBoard());
    setDropTime(1000);
    bagGenRef.current = createTetrisBagGenerator();
    setNextPieces(getNextPieces(5, []));
    setScore(0);
    setRows(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setHoldPiece(null);
    lastUpdateTimeRef.current = performance.now();
    fallAccumulatorRef.current = 0;
    
    // reset inputs
    inputRef.current = {
      left: { down: false, das: 0, arr: 0 },
      right: { down: false, das: 0, arr: 0 },
      down: { down: false, arr: 0 },
    };

    resetPlayer();
  }, [getNextPieces, resetPlayer]);

  const pauseGame = useCallback(() => {
    if (gameOver) return;
    setIsPaused(prev => {
      const nextPaused = !prev;
      if (!nextPaused) {
         lastUpdateTimeRef.current = performance.now();
      }
      return nextPaused;
    });
  }, [gameOver]);


  const movePlayer = useCallback((dir: number) => {
    setPlayer((prev) => {
      if (!checkCollision(prev, board, { x: dir, y: 0 })) {
        if (isLockingRef.current && lockResetsRef.current < MAX_LOCK_RESETS) {
          lockTimerRef.current = 0;
          lockResetsRef.current += 1;
        }
        return { ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } };
      }
      return prev;
    });
  }, [board]);

  const drop = useCallback(() => {
    if (rows > (level + 1) * 10) {
      setLevel((prev) => {
        const newLevel = prev + 1;
        setDropTime(Math.max(100, 1000 - (newLevel * 50)));
        return newLevel;
      });
    }

    setPlayer((prev) => {
      if (!checkCollision(prev, board, { x: 0, y: 1 })) {
        isLockingRef.current = false;
        lockTimerRef.current = 0;
        return { ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } };
      } else {
        // Hit bottom, start lock delay
        if (!isLockingRef.current) {
          isLockingRef.current = true;
          lockTimerRef.current = 0;
        }
        return prev;
      }
    });
  }, [board, rows, level]);

  const dropPlayer = useCallback(() => {
    setPlayer((prev) => {
      if (!checkCollision(prev, board, { x: 0, y: 1 })) {
        isLockingRef.current = false;
        lockTimerRef.current = 0;
        // score for soft drop (1 per cell)
        setScore(s => s + 1);
        return { ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } };
      }
      return prev;
    });
  }, [board]);

  const hardDrop = useCallback(() => {
    setPlayer((prev) => {
      let newY = prev.pos.y;
      let dropDistance = 0;
      while (!checkCollision({ ...prev, pos: { x: prev.pos.x, y: newY } }, board, { x: 0, y: 1 })) {
        newY += 1;
        dropDistance += 1;
      }
      // score for hard drop (2 per cell)
      setScore(s => s + (dropDistance * 2));
      return { ...prev, pos: { x: prev.pos.x, y: newY }, collided: true };
    });
  }, [board]);

  const hold = useCallback(() => {
    if (!canHold) return;
    setPlayer((prev) => {
      const currentType = prev.type;
      if (holdPiece === null) {
        setHoldPiece(currentType);
        resetPlayer();
      } else {
        const next = holdPiece;
        setHoldPiece(currentType);
        resetPlayer(next);
      }
      setCanHold(false);
      return prev; // resetPlayer will overwrite this asynchronously, but that's fine
    });
  }, [canHold, holdPiece, resetPlayer]);

  const rotate = useCallback((dir: number) => {
    setPlayer((prev) => {
      const { success, newPos, newTetromino, newRot } = attemptRotation(prev, board, dir);
      if (success && newPos && newTetromino && newRot !== undefined) {
        if (isLockingRef.current && lockResetsRef.current < MAX_LOCK_RESETS) {
          lockTimerRef.current = 0;
          lockResetsRef.current += 1;
        }
        return {
          ...prev,
          pos: newPos,
          tetromino: newTetromino,
          rot: newRot,
        };
      }
      return prev;
    });
  }, [board]);

  useEffect(() => {
    if (!player.collided) return;

    if (player.pos.y <= 0) {
      setGameOver(true);
      setDropTime(null);
      return;
    }

    const mergedBoard = board.map((row) => [...row]);
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (mergedBoard[y + player.pos.y] && mergedBoard[y + player.pos.y][x + player.pos.x]) {
             mergedBoard[y + player.pos.y][x + player.pos.x] = [value, 'merged'];
          }
        }
      });
    });

    let linesCleared = 0;
    const clearedBoard = mergedBoard.reduce((acc, row) => {
      if (row.findIndex((cell) => cell[0] === 0) === -1) {
        linesCleared += 1;
        acc.unshift(new Array(10).fill([0, 'clear']));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as typeof mergedBoard);

    if (linesCleared > 0) {
      setBoard(clearedBoard);
      setRows(prev => prev + linesCleared);
      const linePoints = [0, 100, 300, 500, 800];
      setScore(prev => prev + linePoints[linesCleared] * level);
    } else {
      setBoard(mergedBoard);
    }

    resetPlayer();

  }, [player.collided, board, player.pos.x, player.pos.y, player.tetromino, resetPlayer, level]);

  const updateGame = useCallback((time: number) => {
    if (gameOver || isPaused) {
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    const deltaTime = time - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = time;

    // Handle Input
    const inputs = inputRef.current;
    
    // Left/Right DAS & ARR
    if (inputs.left.down && !inputs.right.down) {
      if (inputs.left.das === 0) {
        movePlayer(-1);
        inputs.left.das += deltaTime;
      } else if (inputs.left.das < DAS_DELAY) {
        inputs.left.das += deltaTime;
      } else {
        inputs.left.arr += deltaTime;
        while (inputs.left.arr >= ARR_DELAY) {
          movePlayer(-1);
          inputs.left.arr -= ARR_DELAY;
        }
      }
    } else {
      inputs.left.das = 0;
      inputs.left.arr = 0;
    }

    if (inputs.right.down && !inputs.left.down) {
      if (inputs.right.das === 0) {
        movePlayer(1);
        inputs.right.das += deltaTime;
      } else if (inputs.right.das < DAS_DELAY) {
        inputs.right.das += deltaTime;
      } else {
        inputs.right.arr += deltaTime;
        while (inputs.right.arr >= ARR_DELAY) {
          movePlayer(1);
          inputs.right.arr -= ARR_DELAY;
        }
      }
    } else {
      inputs.right.das = 0;
      inputs.right.arr = 0;
    }

    // Down Soft Drop
    if (inputs.down.down) {
      inputs.down.arr += deltaTime;
      while (inputs.down.arr >= SOFT_DROP_DELAY) {
        dropPlayer();
        inputs.down.arr -= SOFT_DROP_DELAY;
      }
    } else {
      inputs.down.arr = 0;
    }

    // Gravity
    if (dropTime && !inputs.down.down) {
      fallAccumulatorRef.current += deltaTime;
      if (fallAccumulatorRef.current > dropTime) {
        drop();
        fallAccumulatorRef.current = 0;
      }
    }

    // Lock Delay
    if (isLockingRef.current) {
      lockTimerRef.current += deltaTime;
      if (lockTimerRef.current >= LOCK_DELAY) {
        setPlayer(prev => ({ ...prev, collided: true }));
      }
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [dropTime, gameOver, isPaused, drop, movePlayer, dropPlayer]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      lastUpdateTimeRef.current = performance.now();
    }
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateGame, gameOver, isPaused]);

  // Expose input handlers
  const handleKeyDown = useCallback((code: string) => {
    if (code === 'ArrowLeft') inputRef.current.left.down = true;
    if (code === 'ArrowRight') inputRef.current.right.down = true;
    if (code === 'ArrowDown') inputRef.current.down.down = true;
  }, []);

  const handleKeyUp = useCallback((code: string) => {
    if (code === 'ArrowLeft') inputRef.current.left.down = false;
    if (code === 'ArrowRight') inputRef.current.right.down = false;
    if (code === 'ArrowDown') inputRef.current.down.down = false;
  }, []);

  return {
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
    handleKeyDown,
    handleKeyUp,
  };
};

import { ConnectFourState, MoveResult } from "./types";

export const ROWS = 6;
export const COLS = 7;

export function createInitialConnectFourState(): ConnectFourState {
  return {
    grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    winningCells: null,
    movesCount: 0,
    lastDrop: null,
  };
}

export function makeConnectFourMove(
  state: ConnectFourState,
  col: number,
  playerId: string
): MoveResult<ConnectFourState> {
  if (col < 0 || col >= COLS) {
    return {
      isValid: false,
      error: "Column index out of range",
      newState: state,
      isWon: false,
      isDraw: false,
    };
  }

  // Find lowest available row in column
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.grid[r][col] === null) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) {
    return {
      isValid: false,
      error: "Column is full",
      newState: state,
      isWon: false,
      isDraw: false,
    };
  }

  // Clone grid
  const newGrid = state.grid.map((row) => [...row]);
  newGrid[targetRow][col] = playerId;

  // Check 4-in-a-row
  const winningCells = checkConnectFourWin(newGrid, targetRow, col, playerId);
  const isWon = Boolean(winningCells && winningCells.length >= 4);
  const movesCount = state.movesCount + 1;
  const isDraw = !isWon && movesCount >= ROWS * COLS;

  const newState: ConnectFourState = {
    grid: newGrid,
    winningCells: isWon ? winningCells : null,
    movesCount,
    lastDrop: { row: targetRow, col, player: playerId },
  };

  return {
    isValid: true,
    newState,
    isWon,
    isDraw,
    winnerId: isWon ? playerId : null,
  };
}

function checkConnectFourWin(
  grid: (string | null)[][],
  r: number,
  c: number,
  playerId: string
): [number, number][] | null {
  const directions: [number, number][] = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal down-right
    [1, -1], // Diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    const matchedCells: [number, number][] = [[r, c]];

    // Look forward
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === playerId) {
        matchedCells.push([nr, nc]);
        step++;
      } else {
        break;
      }
    }

    // Look backward
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === playerId) {
        matchedCells.push([nr, nc]);
        step++;
      } else {
        break;
      }
    }

    if (matchedCells.length >= 4) {
      return matchedCells;
    }
  }

  return null;
}

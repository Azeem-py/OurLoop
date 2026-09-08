import { TicTacToeState, MoveResult } from "./types";

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

export function createInitialTicTacToeState(): TicTacToeState {
  return {
    board: Array(9).fill(null),
    winningLine: null,
    movesCount: 0,
  };
}

export function makeTicTacToeMove(
  state: TicTacToeState,
  cellIndex: number,
  playerId: string
): MoveResult<TicTacToeState> {
  if (cellIndex < 0 || cellIndex > 8) {
    return {
      isValid: false,
      error: "Invalid board index",
      newState: state,
      isWon: false,
      isDraw: false,
    };
  }

  if (state.board[cellIndex] !== null) {
    return {
      isValid: false,
      error: "Cell is already taken",
      newState: state,
      isWon: false,
      isDraw: false,
    };
  }

  const newBoard = [...state.board];
  newBoard[cellIndex] = playerId;

  let winningLine: number[] | null = null;
  let isWon = false;

  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (
      newBoard[a] === playerId &&
      newBoard[b] === playerId &&
      newBoard[c] === playerId
    ) {
      winningLine = combo;
      isWon = true;
      break;
    }
  }

  const movesCount = state.movesCount + 1;
  const isDraw = !isWon && movesCount >= 9;

  const newState: TicTacToeState = {
    board: newBoard,
    winningLine,
    movesCount,
  };

  return {
    isValid: true,
    newState,
    isWon,
    isDraw,
    winnerId: isWon ? playerId : null,
  };
}

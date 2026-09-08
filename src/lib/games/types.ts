export type GameType = "TIC_TAC_TOE" | "CONNECT_FOUR";

export type GameStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface TicTacToeState {
  board: (string | null)[]; // 9 cells (indices 0-8)
  winningLine?: number[] | null;
  movesCount: number;
  pieceHistory?: { index: number; player: string }[];
}

export interface ConnectFourState {
  // 6 rows x 7 cols: null or userId
  // grid[row][col] where row 0 is top and row 5 is bottom
  grid: (string | null)[][];
  winningCells?: [number, number][] | null; // [[r, c], ...]
  movesCount: number;
  lastDrop?: { row: number; col: number; player: string } | null;
}

export interface MoveResult<T> {
  isValid: boolean;
  error?: string;
  newState: T;
  isWon: boolean;
  isDraw: boolean;
  winnerId?: string | null;
}

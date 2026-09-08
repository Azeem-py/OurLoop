export type GameType = "TIC_TAC_TOE" | "CONNECT_FOUR" | "WORDLE" | "WHOS_MOST_LIKELY";

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

export type WordleLetterStatus = "correct" | "present" | "absent";

export interface WordleGuess {
  word: string;
  evaluation: WordleLetterStatus[];
}

export interface WordleState {
  targetWord: string;
  hint?: string | null;
  guesserId: string;
  guesses: WordleGuess[];
  maxGuesses: number;
  solved: boolean;
}

export interface WhosMostLikelyQuestion {
  id: number;
  prompt: string;
}

export interface WhosMostLikelyState {
  questions: WhosMostLikelyQuestion[];
  currentQuestionIndex: number;
  votes: Record<number, Record<string, string>>;
  revealedQuestions: number[];
  agreementCount: number;
  isComplete: boolean;
}

export interface MoveResult<T> {
  isValid: boolean;
  error?: string;
  newState: T;
  isWon: boolean;
  isDraw: boolean;
  winnerId?: string | null;
}

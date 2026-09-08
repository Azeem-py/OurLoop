import { WordleState, WordleGuess, WordleLetterStatus, MoveResult } from "./types";

export function evaluateWordleGuess(guess: string, target: string): WordleLetterStatus[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const result: WordleLetterStatus[] = new Array(5).fill("absent");

  const targetLetterCounts: Record<string, number> = {};
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
  }

  // First pass: exact matches (green)
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = "correct";
      targetLetterCounts[g[i]] -= 1;
    }
  }

  // Second pass: present in word (yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct") {
      const char = g[i];
      if (targetLetterCounts[char] && targetLetterCounts[char] > 0) {
        result[i] = "present";
        targetLetterCounts[char] -= 1;
      }
    }
  }

  return result;
}

export function createInitialWordleState(params: {
  targetWord: string;
  hint?: string | null;
  guesserId: string;
}): WordleState {
  const sanitizedWord = (params.targetWord || "HEART")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5)
    .padEnd(5, "A");

  return {
    targetWord: sanitizedWord,
    hint: params.hint?.trim() || null,
    guesserId: params.guesserId,
    guesses: [],
    maxGuesses: 6,
    solved: false,
  };
}

export function makeWordleMove(
  currentState: WordleState,
  guess: string,
  userId: string,
  initiatorId: string
): MoveResult<WordleState> {
  if (userId !== currentState.guesserId) {
    return {
      isValid: false,
      error: "Only the guesser can make guesses in this match.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  if (currentState.solved || currentState.guesses.length >= currentState.maxGuesses) {
    return {
      isValid: false,
      error: "This Wordle match is already finished.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  const cleanGuess = guess.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (cleanGuess.length !== 5) {
    return {
      isValid: false,
      error: "Guess must be exactly 5 letters.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  const evaluation = evaluateWordleGuess(cleanGuess, currentState.targetWord);
  const newGuessObj: WordleGuess = {
    word: cleanGuess,
    evaluation,
  };

  const isMatched = cleanGuess === currentState.targetWord;
  const newGuesses = [...currentState.guesses, newGuessObj];
  const isOutOfGuesses = newGuesses.length >= currentState.maxGuesses;

  const newState: WordleState = {
    ...currentState,
    guesses: newGuesses,
    solved: isMatched,
  };

  if (isMatched) {
    return {
      isValid: true,
      newState,
      isWon: true,
      isDraw: false,
      winnerId: currentState.guesserId,
    };
  }

  if (isOutOfGuesses) {
    // Creator won if guesser ran out of attempts without solving
    return {
      isValid: true,
      newState,
      isWon: true,
      isDraw: false,
      winnerId: initiatorId,
    };
  }

  return {
    isValid: true,
    newState,
    isWon: false,
    isDraw: false,
  };
}

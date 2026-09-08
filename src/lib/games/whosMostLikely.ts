import { WhosMostLikelyState, WhosMostLikelyQuestion, MoveResult } from "./types";

export const QUESTION_BANK: string[] = [
  "Who takes longer to get ready before leaving the house?",
  "Who is most likely to fall asleep 10 minutes into a movie?",
  "Who says 'I love you' more often throughout the day?",
  "Who is the more dramatic one when they get a slight cold?",
  "Who is most likely to buy something unnecessary on impulse?",
  "Who is the better driver when navigating traffic?",
  "Who initiates hugs and cuddles the most?",
  "Who is more stubborn during a silly disagreement?",
  "Who is most likely to cry during a romantic or sad movie?",
  "Who plans the best surprise dates or thoughtful gifts?",
  "Who gets 'hangry' the fastest when dinner is late?",
  "Who spends more time scrolling on their phone in bed?",
  "Who said 'I love you' first in the relationship?",
  "Who is the better chef when whipping up a meal?",
  "Who is more organized with clothes and living spaces?",
  "Who is most likely to make friends with strangers or pets?",
  "Who apologizes first after a silly misunderstanding?",
  "Who gives the best comforting back rubs or massages?",
  "Who is most likely to get lost even with GPS on?",
  "Who is the bigger romantic dreamer at heart?",
];

export function createInitialWhosMostLikelyState(): WhosMostLikelyState {
  // Shuffle and pick 5 distinct questions
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  const selectedQuestions: WhosMostLikelyQuestion[] = shuffled.slice(0, 5).map((prompt, idx) => ({
    id: idx + 1,
    prompt,
  }));

  return {
    questions: selectedQuestions,
    currentQuestionIndex: 0,
    votes: {},
    revealedQuestions: [],
    agreementCount: 0,
    isComplete: false,
  };
}

export function submitWhosMostLikelyVote(
  currentState: WhosMostLikelyState,
  questionIndex: number,
  votedUserId: string,
  currentUserId: string,
  partnerId: string
): MoveResult<WhosMostLikelyState> {
  if (currentState.isComplete) {
    return {
      isValid: false,
      error: "This quiz match has already finished.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  if (questionIndex < 0 || questionIndex >= currentState.questions.length) {
    return {
      isValid: false,
      error: "Invalid question index.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  const existingVotesForQuestion = currentState.votes[questionIndex] || {};
  if (existingVotesForQuestion[currentUserId]) {
    return {
      isValid: false,
      error: "You have already voted on this question. Waiting for partner.",
      newState: currentState,
      isWon: false,
      isDraw: false,
    };
  }

  const updatedVotesForQuestion = {
    ...existingVotesForQuestion,
    [currentUserId]: votedUserId,
  };

  const updatedVotes = {
    ...currentState.votes,
    [questionIndex]: updatedVotesForQuestion,
  };

  const hasPartnerVoted = Boolean(updatedVotesForQuestion[partnerId]);
  let newRevealed = [...currentState.revealedQuestions];
  let newAgreementCount = currentState.agreementCount;
  let nextQuestionIndex = currentState.currentQuestionIndex;
  let isComplete = false;

  // Both have now voted on this question!
  if (hasPartnerVoted) {
    if (!newRevealed.includes(questionIndex)) {
      newRevealed.push(questionIndex);
    }
    const myVote = updatedVotesForQuestion[currentUserId];
    const partnerVote = updatedVotesForQuestion[partnerId];
    if (myVote === partnerVote) {
      newAgreementCount += 1;
    }

    if (questionIndex < currentState.questions.length - 1) {
      nextQuestionIndex = questionIndex + 1;
    } else {
      isComplete = true;
    }
  }

  const newState: WhosMostLikelyState = {
    ...currentState,
    votes: updatedVotes,
    revealedQuestions: newRevealed,
    agreementCount: newAgreementCount,
    currentQuestionIndex: nextQuestionIndex,
    isComplete,
  };

  if (isComplete) {
    return {
      isValid: true,
      newState,
      isWon: false,
      isDraw: true, // Cooperative celebration
    };
  }

  return {
    isValid: true,
    newState,
    isWon: false,
    isDraw: false,
  };
}

export type WordResult = {
  word: string;
  attempts: number;
  correct: boolean;
};

export type SessionState = {
  words: string[];
  currentIndex: number;
  attemptsByWord: number[];
  completed: boolean[];
  totalAttempts: number;
  shuffle: boolean;
};

export type SessionResults = {
  words: string[];
  attemptsByWord: number[];
  completed: boolean[];
  totalAttempts: number;
  totalWords: number;
  numberCorrect: number;
  accuracy: number;
  perWord: WordResult[];
};

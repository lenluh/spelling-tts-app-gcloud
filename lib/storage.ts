import { SessionResults, SessionState } from "./types";

export const STORAGE_KEYS = {
  words: "spelling.words",
  session: "spelling.session",
  results: "spelling.results",
};

export const DEFAULT_WORDS = [
  "cat",
  "dog",
  "sun",
  "tree",
  "book",
  "school",
  "friend",
  "planet",
  "music",
  "garden",
];

export function parseWords(raw: string): string[] {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const maybeCsv = rows.some((line) => line.includes(","));

  let words = rows.map((line, index) => {
    if (!maybeCsv) return line;

    const first = line.split(",")[0]?.trim() ?? "";
    if (index === 0) {
      const normalized = first.toLowerCase();
      if (normalized === "word" || normalized === "words") {
        return "";
      }
    }
    return first;
  });

  words = words.map((w) => w.trim()).filter(Boolean);

  const deduped = Array.from(new Set(words));
  return deduped.slice(0, 500);
}

export function buildFreshSession(words: string[], shuffle: boolean): SessionState {
  const prepared = shuffle ? [...words].sort(() => Math.random() - 0.5) : [...words];
  return {
    words: prepared,
    currentIndex: 0,
    attemptsByWord: new Array(prepared.length).fill(0),
    completed: new Array(prepared.length).fill(false),
    totalAttempts: 0,
    shuffle,
  };
}

export function makeResults(session: SessionState): SessionResults {
  const totalWords = session.words.length;
  const numberCorrect = session.completed.filter(Boolean).length;
  const totalAttempts = session.totalAttempts;
  const accuracy = totalAttempts > 0 ? numberCorrect / totalAttempts : 0;

  return {
    words: session.words,
    attemptsByWord: session.attemptsByWord,
    completed: session.completed,
    totalAttempts,
    totalWords,
    numberCorrect,
    accuracy,
    perWord: session.words.map((word, i) => ({
      word,
      attempts: session.attemptsByWord[i],
      correct: session.completed[i],
    })),
  };
}

export function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadJSON<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

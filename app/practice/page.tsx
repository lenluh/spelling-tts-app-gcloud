"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, makeResults, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { SessionState } from "@/lib/types";
import { chooseBestUSVoice, speakWord } from "@/lib/tts";

export default function PracticePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "wrong" | null>(null);
  const [showWordHint, setShowWordHint] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const storedWords = loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;
    const storedSession = loadJSON<SessionState>(STORAGE_KEYS.session);

    if (storedSession && storedSession.words.length > 0 && storedSession.currentIndex < storedSession.words.length) {
      setSession(storedSession);
    } else {
      const newSession = buildFreshSession(storedWords, false);
      setSession(newSession);
      saveJSON(STORAGE_KEYS.session, newSession);
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const refreshVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setVoice(chooseBestUSVoice(voices));
    };

    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
    };
  }, [mounted]);

  const currentWord = useMemo(() => {
    if (!session) return "";
    return session.words[session.currentIndex] ?? "";
  }, [session]);

  useEffect(() => {
    if (currentWord) {
      speakWord(currentWord, voice);
      inputRef.current?.focus();
    }
  }, [currentWord, voice]);

  const persistSession = (updated: SessionState) => {
    setSession(updated);
    saveJSON(STORAGE_KEYS.session, updated);
  };

  const handleCheck = (e: FormEvent) => {
    e.preventDefault();
    if (!session || !currentWord) return;

    const cleaned = answer.trim().toLowerCase();
    const expected = currentWord.trim().toLowerCase();

    const updated: SessionState = {
      ...session,
      attemptsByWord: [...session.attemptsByWord],
      completed: [...session.completed],
      totalAttempts: session.totalAttempts + 1,
    };

    updated.attemptsByWord[session.currentIndex] += 1;

    if (cleaned === expected) {
      updated.completed[session.currentIndex] = true;
      setFeedback("ok");
      setShowWordHint(false);
      setAnswer("");

      const isLast = session.currentIndex === session.words.length - 1;
      if (isLast) {
        persistSession(updated);
        const results = makeResults(updated);
        saveJSON(STORAGE_KEYS.results, results);
        setTimeout(() => router.push("/results"), 800);
        return;
      }

      updated.currentIndex += 1;
      persistSession(updated);
      setTimeout(() => setFeedback(null), 800);
    } else {
      setFeedback("wrong");
      const triesForWord = updated.attemptsByWord[session.currentIndex] ?? 0;
      if (triesForWord >= 3) {
        setShowWordHint(true);
      }
      persistSession(updated);
      inputRef.current?.focus();
    }
  };

  const restartPractice = () => {
    if (!session) return;
    const fresh = buildFreshSession(session.words, session.shuffle ?? false);
    setFeedback(null);
    setShowWordHint(false);
    setAnswer("");
    persistSession(fresh);
    saveJSON(STORAGE_KEYS.results, makeResults(fresh));
  };

  if (!mounted || !session) {
    return <main className="page"><p className="card">Loading…</p></main>;
  }

  return (
    <main className="page">
      <section className="card" aria-live="polite" aria-label="Spelling activity">
        <h1>Spelling Practice</h1>
        <p className="progress">Word {session.currentIndex + 1} of {session.words.length}</p>

        <div className="controls">
          <button className="btn btnPlay" type="button" onClick={() => speakWord(currentWord, voice)} aria-label="Play word again">
            🔊 Play Again
          </button>
          <button className="btn btnRestart" type="button" onClick={restartPractice} aria-label="Restart practice">
            Restart
          </button>
        </div>

        <form onSubmit={handleCheck} className="answerForm">
          <label htmlFor="answerInput">Type the word:</label>
          <input
            id="answerInput"
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type your spelling answer"
          />
          <button className="btn btnCheck" type="submit" aria-label="Check spelling answer">
            Check
          </button>
        </form>

        {feedback === "ok" && <p className="feedback ok">✅ OK!</p>}
        {feedback === "wrong" && <p className="feedback wrong">❌ Try again</p>}
        {showWordHint && <p className="feedback wrong">The word is: {currentWord}</p>}
      </section>
    </main>
  );
}

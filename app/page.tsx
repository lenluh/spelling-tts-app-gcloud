"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, makeResults, parseWords, saveJSON, STORAGE_KEYS } from "@/lib/storage";

export default function TitlePage() {
  const router = useRouter();
  const [pastedWords, setPastedWords] = useState("");
  const [msg, setMsg] = useState("");
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    const existingWords = loadJSON<string[]>(STORAGE_KEYS.words);
    if (!existingWords || existingWords.length === 0) {
      saveJSON(STORAGE_KEYS.words, DEFAULT_WORDS);
    }
  }, []);

  const startPractice = () => {
    const fromPaste = parseWords(pastedWords);
    const words = fromPaste.length > 0 ? fromPaste : loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;

    if (!words.length) {
      setMsg("Please paste at least one word.");
      return;
    }

    saveJSON(STORAGE_KEYS.words, words);
    const session = buildFreshSession(words, shuffle);
    saveJSON(STORAGE_KEYS.session, session);
    saveJSON(STORAGE_KEYS.results, makeResults(session));
    router.push("/practice");
  };

  return (
    <main className="page">
      <section className="card" aria-label="Spelling app title and setup">
        <h1>Spelling Practice</h1>
        <p className="instruction">Step 1: Paste words. Step 2: Practice. Step 3: See results.</p>

        <div className="uploadBox">
          <h2>Paste Word List</h2>
          <label htmlFor="pasteWords">Paste words (one per line)</label>
          <textarea
            id="pasteWords"
            value={pastedWords}
            onChange={(e) => setPastedWords(e.target.value)}
            rows={10}
            placeholder={`apple\ntrain\nplanet`}
            aria-label="Paste words one per line"
          />

          <label className="toggle">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              aria-label="Shuffle words before starting"
            />
            Shuffle words
          </label>

          <button className="btn" type="button" onClick={startPractice} aria-label="Start spelling practice">
            Start Practice
          </button>
          {msg && <p className="uploadMsg">{msg}</p>}
        </div>
      </section>
    </main>
  );
}

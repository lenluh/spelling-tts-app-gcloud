"use client";

export function chooseBestUSVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const usVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en-us"));

  if (!usVoices.length) return null;

  const preferredNames = [
    "samantha",
    "ava",
    "allison",
    "jenny",
    "guy",
    "microsoft",
    "google us english",
  ];

  const scored = usVoices
    .map((voice) => {
      const name = voice.name.toLowerCase();
      const score = preferredNames.reduce((acc, pref, index) => {
        return name.includes(pref) ? acc + (preferredNames.length - index) : acc;
      }, 0);
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? usVoices[0];
}

export function speakWord(word: string, voice: SpeechSynthesisVoice | null): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

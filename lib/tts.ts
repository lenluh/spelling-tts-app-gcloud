"use client";

let currentAudio: HTMLAudioElement | null = null;
let speakRequestId = 0;

function stopCurrentAudio() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

async function playCloudAudio(text: string, requestId: number): Promise<boolean> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) return false;

  if (requestId !== speakRequestId) return false;

  stopCurrentAudio();
  const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
  currentAudio = audio;
  await audio.play();

  if (requestId !== speakRequestId) {
    stopCurrentAudio();
    return false;
  }

  return true;
}

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

export async function speakText(text: string, voice: SpeechSynthesisVoice | null): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  speakRequestId += 1;
  const requestId = speakRequestId;

  window.speechSynthesis.cancel();
  stopCurrentAudio();

  const cloudWorked = await playCloudAudio(text, requestId).catch(() => false);
  if (cloudWorked || requestId !== speakRequestId) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export async function speakWord(word: string, voice: SpeechSynthesisVoice | null): Promise<void> {
  await speakText(word, voice);
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = {
  audioContent: string;
  createdAt: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeWordInput(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_CACHE_ENTRIES = 1000;
const ttsCache = new Map<string, CacheEntry>();

function makeCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

function pruneCache(now: number) {
  for (const [key, value] of ttsCache.entries()) {
    if (now - value.createdAt > CACHE_TTL_MS) {
      ttsCache.delete(key);
    }
  }

  if (ttsCache.size <= MAX_CACHE_ENTRIES) return;

  const sorted = [...ttsCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const toRemove = sorted.slice(0, ttsCache.size - MAX_CACHE_ENTRIES);
  for (const [key] of toRemove) ttsCache.delete(key);
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_TTS_API_KEY is not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { text?: string };
    const text = normalizeWordInput(body.text ?? "");

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (text.length > 80) {
      return NextResponse.json({ error: "text too long" }, { status: 400 });
    }

    const ssml = `<speak><break time="120ms"/>${escapeXml(text)}<break time="120ms"/></speak>`;

    const now = Date.now();
    pruneCache(now);

    const cacheKey = makeCacheKey(text);
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ audioContent: cached.audioContent, cached: true });
    }

    const googleRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { ssml },
        voice: { languageCode: "en-US", name: "en-US-Neural2-C" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9, pitch: 0 },
      }),
    });

    if (!googleRes.ok) {
      const detail = await googleRes.text();
      return NextResponse.json({ error: "google_tts_failed", detail }, { status: 502 });
    }

    const payload = (await googleRes.json()) as { audioContent?: string };
    const audioContent = payload.audioContent;

    if (!audioContent) {
      return NextResponse.json({ error: "no_audio_content" }, { status: 502 });
    }

    ttsCache.set(cacheKey, { audioContent, createdAt: now });
    return NextResponse.json({ audioContent, cached: false });
  } catch {
    return NextResponse.json({ error: "tts_request_failed" }, { status: 500 });
  }
}

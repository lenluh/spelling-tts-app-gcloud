# Spelling TTS App (Grades 1–4)

Kid-friendly spelling practice app built with Next.js + TypeScript.

## Features

- Title/setup page (`/`) to paste words and start session
- Practice page (`/practice`) with auto-play pronunciation and big controls
- Results page (`/results`) with session summary and per-word stats
- Upload word lists from a paste textbox (one word per line)
- Local persistence using `localStorage`
- Higher-quality Google Cloud Neural TTS (with browser TTS fallback)
- Server-side TTS response cache for repeat words
- Accessibility basics: keyboard-friendly controls, focus states, ARIA labels
- Optional extra included:
  - Shuffle toggle (applies on restart)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build / deploy

```bash
npm run build
```

Deploy on **Vercel** as a normal Next.js app.

> Note: preset loading uses a server API route (`/api/presets`) to fetch remote `.txt` files, so static export hosting is not supported for this feature.

## Preset `.txt` word lists

By default, the app reads presets from:

- `https://spelling.elii.se/words/`

It scans that page for `.txt` links, loads them, and shows one button per file.

- Each file should contain one word per line (CSV first-column also works).
- Button text matches the file name (without `.txt`).
- Newest list loads by default (based on `Last-Modified` header when available).
- Optional: set `WORD_LISTS_URL` to use a different URL.
- On Vercel, add `WORD_LISTS_URL` in Project Settings → Environment Variables if you want to override it.

## Google Cloud TTS setup

1. Create/select a Google Cloud project.
2. Enable **Cloud Text-to-Speech API**.
3. Create an API key.
4. Add env var:

```bash
GOOGLE_TTS_API_KEY=your_key_here
```

For Vercel: Project Settings → Environment Variables → add `GOOGLE_TTS_API_KEY` for Production/Preview/Development.

## Notes

- App tries Google Cloud TTS first, then falls back to browser `speechSynthesis` if API is unavailable.
- TTS audio is cached in server memory for repeated words (reduces API calls).
- Works best in Chrome and modern browsers.
- Data is stored in browser localStorage.

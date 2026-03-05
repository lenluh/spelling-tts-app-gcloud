# Spelling TTS App (Grades 1–4)

Kid-friendly spelling practice app built with Next.js + TypeScript.

## Features

- Title/setup page (`/`) to paste words and start session
- Practice page (`/practice`) with auto-play pronunciation and big controls
- Results page (`/results`) with session summary and per-word stats
- Upload word lists from a paste textbox (one word per line)
- Local persistence using `localStorage`
- US-focused TTS voice selection (`en-US`) with graceful fallback
- Accessibility basics: keyboard-friendly controls, focus states, ARIA labels
- Optional extras included:
  - Shuffle toggle (applies on restart)
  - Hide words toggle on Results page

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build static files (for GoDaddy shared hosting)

```bash
npm run build
```

This creates a static `out/` folder. Upload everything inside `out/` to your hosting `public_html` folder (or a subfolder for a subdomain).

## Notes

- Uses browser Web Speech API (`speechSynthesis`) only (no paid API).
- Works best in Chrome and modern browsers.
- Data is stored in browser localStorage.

# Myanmar AI Recap — Vercel v3

This version is designed for **GitHub + Vercel** rather than a local Express/FFmpeg server.

## Architecture

- Vercel hosts the Gemini UI and server-side API routes.
- `/api/analyze` sends the public YouTube URL directly to Gemini Video Understanding.
- `/api/tts` calls Gemini TTS without exposing `GEMINI_API_KEY` to the browser.
- The browser performs the final visual edit with WebCodecs/MediaRecorder-style client rendering where available.
- The app supports logo overlay, text blur overlay, subtitles, duration presets, and Gemini recap planning.

## Important limitation

Vercel Functions are not a good place to run `yt-dlp` + native FFmpeg on a large YouTube file. This v3 therefore uses Gemini's public YouTube URL input for analysis and does **not** pretend to download a YouTube file on the server.

For a fully automated downloadable MP4 from the YouTube source, connect a separate video worker/storage service (for example a container/queue worker) and have it consume the Gemini scene plan. The UI is already structured around that plan.

## Deploy

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel Project Settings → Environment Variables add:
   - `GEMINI_API_KEY`
   - optional `GEMINI_MODEL`
   - optional `GEMINI_TTS_MODEL`
4. Redeploy.
5. Open the deployed URL.

Gemini currently supports public YouTube URLs directly for video understanding, including agentic/static processing on supported Flash models.

## Local Vercel test

```bash
npm install
npx vercel dev
```

Open the local URL printed by Vercel.

## YouTube/rights

Only process videos you have the right to use. YouTube URL analysis availability, pricing, and limits can change because the direct YouTube feature is preview functionality.

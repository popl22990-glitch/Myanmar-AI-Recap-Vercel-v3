import { GoogleGenAI } from "@google/genai";

function cleanJson(text) {
  const s = String(text || "").trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : s;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel." });

  try {
    const { youtubeUrl, duration = 180, processing = "agentic", language = "Myanmar" } = req.body || {};
    if (!youtubeUrl || !/^https?:\\/\\/(www\\.)?(youtube\\.com|youtu\\.be)\\//i.test(youtubeUrl)) {
      return res.status(400).json({ error: "Valid public YouTube URL is required." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const mode = processing === "static" ? "static" : "agentic";

    const prompt = `
You are a professional Myanmar movie/TV recap editor.
Analyze the supplied YouTube video and create an edit-ready recap plan.
Target recap duration: ${duration} seconds.
Narration language: ${language}.
Use only information actually present in the video. Do not invent plot details.
Return ONLY valid JSON with this exact shape:
{
  "title": "short Myanmar title",
  "summary": "one paragraph",
  "narration": "continuous Myanmar narration for the target duration",
  "scenes": [
    {"start": 0, "end": 12, "narration": "...", "subtitle": "..."}
  ],
  "captions": {
    "youtube": "...",
    "facebook": "...",
    "tiktok": "..."
  }
}
Scene timestamps must be within the source video and cover the strongest story beats.
Keep narration concise enough for the target duration.
`;

    const interaction = await ai.interactions.create({
      model,
      input: [
        { type: "text", text: prompt },
        { type: "video", uri: youtubeUrl, processing: mode }
      ]
    });

    const raw = cleanJson(interaction.output_text);
    let data;
    try { data = JSON.parse(raw); }
    catch {
      return res.status(502).json({ error: "Gemini returned non-JSON output.", raw: raw.slice(0, 12000) });
    }

    res.status(200).json({ ok: true, model, processing: mode, data });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Gemini analysis failed." });
  }
}
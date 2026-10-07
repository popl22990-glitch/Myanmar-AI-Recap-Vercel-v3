import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });

  try {
    const { text, voice = "Kore" } = req.body || {};
    if (!text) return res.status(400).json({ error: "Narration text is required." });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";

    const interaction = await ai.interactions.create({
      model,
      input: [{ type: "text", text }],
      response_modalities: ["AUDIO"],
      generation_config: {
        speech_config: {
          voice_config: { prebuilt_voice_config: { voice_name: voice } }
        }
      }
    });

    let b64 = null;
    const out = interaction?.outputs || [];
    for (const item of out) {
      const c = item?.content || item;
      if (c?.data) { b64 = c.data; break; }
      if (c?.audio?.data) { b64 = c.audio.data; break; }
    }
    if (!b64) {
      return res.status(502).json({ error: "Gemini TTS returned no audio payload.", raw: JSON.stringify(interaction).slice(0, 5000) });
    }
    res.status(200).json({ ok: true, mimeType: "audio/wav", data: b64 });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Gemini TTS failed." });
  }
}
export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    platform: "vercel",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
}
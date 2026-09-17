export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    product: "SHAGHIL",
    version: "0.8.0",
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    api_key_configured: Boolean(process.env.OPENAI_API_KEY)
  });
}

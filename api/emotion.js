// Vercel Serverless Function — Emotion Detection
// Proxies request to Hugging Face, keeping API key server-side

export default async function handler(req, res) {
  // Allow requests from your frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const apiKey = process.env.HF_API_KEY; // ← lives in Vercel dashboard, never in code
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (hfRes.status === 503) {
      const data = await hfRes.json();
      return res.status(503).json({ error: "Model loading", estimated_time: data.estimated_time || 20 });
    }

    if (!hfRes.ok) {
      const err = await hfRes.json().catch(() => ({}));
      return res.status(hfRes.status).json({ error: err.error || "Hugging Face error" });
    }

    const data = await hfRes.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

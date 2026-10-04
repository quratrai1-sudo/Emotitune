// Vercel Serverless Function — Lyrics Generation
// Proxies request to Hugging Face, keeping API key server-side

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, emotion, genre } = req.body;
  if (!text || !emotion) return res.status(400).json({ error: "Missing text or emotion" });

  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const MODELS = [
    "HuggingFaceH4/zephyr-7b-beta",
    "tiiuae/falcon-7b-instruct",
  ];

  const prompt = `<|system|>You are a professional songwriter.</s>
<|user|>Write song lyrics for a ${genre || "pop"} song. The person feels: "${text}". Emotion: ${emotion}.
Include [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus]. Only lyrics, no explanation.</s>
<|assistant|>`;

  for (const model of MODELS) {
    try {
      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.8,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
      });

      if (hfRes.status === 503) {
        const d = await hfRes.json().catch(() => ({}));
        // Wait and retry this model once
        await new Promise(r => setTimeout(r, Math.min((d.estimated_time || 20) * 1000, 15000)));
        continue;
      }

      if (!hfRes.ok) continue;

      const data = await hfRes.json();
      let lyrics = data[0]?.generated_text || data?.generated_text || "";
      lyrics = lyrics
        .replace(/<\|.*?\|>/g, "")
        .replace(/^(Sure|Here are|Of course|Certainly|Here is)[^:\n]*[:\n]/im, "")
        .trim();

      if (lyrics.length > 80) {
        return res.status(200).json({ lyrics });
      }
    } catch (e) {
      console.error(`Model ${model} failed:`, e.message);
    }
  }

  // All models failed — tell frontend to use local fallback
  return res.status(200).json({ lyrics: null, fallback: true });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing SARVAM_API_KEY' });

  try {
    const { text, langCode = 'en-IN', speaker = 'anushka' } = req.body || {};
    const r = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: langCode,
        speaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      })
    });
    const textBody = await r.text();
    return res.status(r.status).send(textBody);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'TTS proxy failed' });
  }
}
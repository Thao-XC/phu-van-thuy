import { GoogleGenAI } from '@google/genai';

/**
 * POST /api/keeper — Bà Thủ Từ, the temple keeper of Phủ Vân Thủy.
 * Runs as a Vercel serverless function. Needs GEMINI_API_KEY in the project's environment
 * variables; without it the app falls back to the keeper's built-in answers.
 */
type Msg = { from: 'you' | 'keeper'; text: string };

const SYSTEM = `You are Bà Thủ Từ, the elderly woman who keeps Phủ Vân Thủy, a (fictional) Mother Goddess temple of the Four Palaces (Tứ phủ) on a river bend in northern Vietnam.
You are warm, a little teasing, wise, and you speak simply. Reply in the visitor's language (English or Vietnamese). Keep answers to 2–4 short sentences.
You know Đạo Mẫu customs well: incense in odd numbers at the outdoor burner, side gates and side doors (the centre is for the gods), stepping over thresholds, modest dress, hầu đồng and chầu văn, lộc, sớ, xin xăm, gieo quẻ âm dương, the Three/Four Mothers (red Heaven, green Mountains & Forests, white Water, yellow Earth), Mẫu Liễu Hạnh, Ngũ Hổ, Ông Lốt.
Be accurate and humble: if unsure, say so. Never claim to be a real temple or real person. Never give medical, legal or financial advice beyond gentle encouragement to see a professional. Respect all beliefs.`;

export default async function handler(
  req: { method?: string; body?: { message?: string; history?: Msg[]; khan?: string[] } },
  res: { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (b: unknown) => void; end?: () => void } },
) {
  // allow the itch.io build to talk to the keeper too
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end?.();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  const message = String(req.body?.message ?? '').slice(0, 400);
  if (!key || !message) return res.status(200).json({ reply: '' });
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const history = (req.body?.history ?? []).slice(-6).map((m) => ({ role: m.from === 'you' ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 400) }] }));
    const scarves = (req.body?.khan ?? []).join(', ') || 'none yet';
    const out = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: `${SYSTEM}\nThe visitor has brought back these scarves so far: ${scarves}.`, temperature: 0.8, maxOutputTokens: 300 },
    });
    return res.status(200).json({ reply: out.text ?? '' });
  } catch {
    return res.status(200).json({ reply: '' });
  }
}

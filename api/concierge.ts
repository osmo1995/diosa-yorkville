import { checkRateLimit } from './_lib/rateLimit';
import { readJson, sendJson, setCors } from './_lib/http';
import { geminiGenerateText, getApiKey, getTextModel, getTimeoutMs, jsonParseOrThrow } from './_lib/gemini';

type ConciergeRequest = {
  message: string;
  context?: {
    goal?: 'extensions' | 'color' | 'unsure';
    timeline?: string;
    budget?: string;
    maintenanceTolerance?: 'low' | 'medium' | 'high';
    hairHistory?: string;
  };
};

type ConciergeResponse = {
  reply: string;
  quickReplies: string[];
  nextSteps: { label: string; action: 'BOOK' | 'SERVICES' | 'STYLE_GENERATOR'; href?: string }[];
};

function clampStr(s: any, max: number) {
  return String(s || '').trim().slice(0, max);
}

function isOneOf<T extends string>(v: any, allowed: readonly T[]): v is T {
  return allowed.includes(v);
}

export default async function handler(req: any, res: any) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const rl = checkRateLimit(req);
  if (rl.ok !== true) {
    return sendJson(res, 429, { error: 'Rate limit exceeded' }, { 'Retry-After': String(rl.retryAfterSec) });
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY' });

    const raw = (await readJson(req)) as ConciergeRequest;
    const message = clampStr(raw.message, 800);
    if (!message) return sendJson(res, 400, { error: 'Missing message' });

    const ctxRaw = raw.context || {};
    const goal = isOneOf(ctxRaw.goal, ['extensions', 'color', 'unsure'] as const) ? ctxRaw.goal : 'unsure';
    const maintenanceTolerance = isOneOf(ctxRaw.maintenanceTolerance, ['low', 'medium', 'high'] as const)
      ? ctxRaw.maintenanceTolerance
      : undefined;

    const ctx = {
      goal,
      timeline: clampStr(ctxRaw.timeline, 60),
      maintenanceTolerance,
      hairHistory: clampStr(ctxRaw.hairHistory, 240),
      // Price ranges are avoided by default (consultation-first). Keep budget but don't output exact pricing.
      budget: clampStr(ctxRaw.budget, 60),
    };

    const system = `You are Diosa Studio Yorkville's AI concierge (Toronto).
Tone: luxury concierge (warm, premium, concise).

Rules:
- Offer ONLY: hair extensions and hair colour.
- Never recommend haircuts or styling services.
- Do not provide medical advice.
- Do not reveal chain-of-thought.
- Do not give exact pricing; direct to consultation for pricing.

Deep-thinking instruction (internal): think carefully, then output polished JSON only.

Output MUST be valid JSON:
{
  "reply": string,
  "quickReplies": string[],
  "nextSteps": [{"label": string, "action": "BOOK"|"SERVICES"|"STYLE_GENERATOR", "href"?: string}]
}`;

    const user = `Client message: ${message}
Context:
- goal: ${ctx.goal}
- timeline: ${ctx.timeline}
- budget: ${ctx.budget}
- maintenanceTolerance: ${ctx.maintenanceTolerance || ''}
- hairHistory: ${ctx.hairHistory}

Return a helpful reply and guide them to booking.`;

    const { text } = await geminiGenerateText({
      cfg: { apiKey, model: getTextModel(), timeoutMs: getTimeoutMs() },
      system,
      user,
      responseMimeType: 'application/json',
    });

    let parsed: ConciergeResponse;
    try {
      parsed = jsonParseOrThrow<ConciergeResponse>(text);
    } catch {
      return sendJson(res, 502, { error: 'AI response parsing failed' });
    }

    parsed.reply = clampStr(parsed.reply, 1200);
    parsed.quickReplies = (parsed.quickReplies || []).map((q) => clampStr(q, 60)).filter(Boolean).slice(0, 6);
    parsed.nextSteps = (parsed.nextSteps || [])
      .slice(0, 3)
      .map((s) => ({
        label: clampStr(s.label, 24),
        action: isOneOf(s.action, ['BOOK', 'SERVICES', 'STYLE_GENERATOR'] as const) ? s.action : 'BOOK',
        href:
          s.action === 'SERVICES'
            ? s.href || '/services'
            : s.action === 'STYLE_GENERATOR'
              ? s.href || '/style-generator'
              : s.href || '/booking',
      }));

    return sendJson(res, 200, parsed);
  } catch (e: any) {
    const status = e?.status || 500;
    return sendJson(res, status, { error: e?.message || 'Server error' });
  }
}

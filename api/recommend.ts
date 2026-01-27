import { checkRateLimit } from './_lib/rateLimit';
import { readJson, sendJson, setCors } from './_lib/http';
import { geminiGenerateText, getApiKey, getTextModel, getTimeoutMs, jsonParseOrThrow } from './_lib/gemini';

type RecommendRequest = {
  goal: 'extensions' | 'color';
  desiredLook?: string;
  maintenanceTolerance?: 'low' | 'medium' | 'high';
  timeline?: string;
  hairHistory?: string;
};

type RecommendResponse = {
  summary: string;
  recommendations: { title: string; why: string; maintenance: string }[];
  prepChecklist: string[];
  questionsToAsk: string[];
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

    const raw = (await readJson(req)) as RecommendRequest;
    const goal = raw.goal;
    if (goal !== 'extensions' && goal !== 'color') return sendJson(res, 400, { error: 'Invalid goal' });

    const desiredLook = clampStr(raw.desiredLook, 800);
    const timeline = clampStr(raw.timeline, 60);
    const hairHistory = clampStr(raw.hairHistory, 240);
    const maintenanceTolerance = isOneOf(raw.maintenanceTolerance, ['low', 'medium', 'high'] as const)
      ? raw.maintenanceTolerance
      : undefined;

    const system = `You are an expert salon intake assistant for a luxury studio in Toronto.

You must recommend ONLY within:
- hair extensions
- hair colour
Never recommend haircuts.
Do not reveal chain-of-thought.
Do not give exact pricing.

Deep-thinking instruction (internal): reason carefully, then output concise JSON only.

Output MUST be valid JSON:
{
  "summary": string,
  "recommendations": [{"title": string, "why": string, "maintenance": string}],
  "prepChecklist": string[],
  "questionsToAsk": string[]
}`;

    const user = `Goal: ${goal}
Desired look: ${desiredLook}
Maintenance tolerance: ${maintenanceTolerance || ''}
Timeline: ${timeline}
Hair history: ${hairHistory}

Return 2-3 recommendations and a prep checklist. Keep it realistic and integrity-first.`;

    const { text } = await geminiGenerateText({
      cfg: { apiKey, model: getTextModel(), timeoutMs: getTimeoutMs() },
      system,
      user,
      responseMimeType: 'application/json',
    });

    let parsed: RecommendResponse;
    try {
      parsed = jsonParseOrThrow<RecommendResponse>(text);
    } catch {
      return sendJson(res, 502, { error: 'AI response parsing failed' });
    }

    parsed.summary = clampStr(parsed.summary, 1200);
    parsed.recommendations = (parsed.recommendations || []).slice(0, 3).map((r) => ({
      title: clampStr(r.title, 40),
      why: clampStr(r.why, 500),
      maintenance: clampStr(r.maintenance, 120),
    }));
    parsed.prepChecklist = (parsed.prepChecklist || []).map((i) => clampStr(i, 120)).filter(Boolean).slice(0, 12);
    parsed.questionsToAsk = (parsed.questionsToAsk || []).map((i) => clampStr(i, 120)).filter(Boolean).slice(0, 10);

    return sendJson(res, 200, parsed);
  } catch (e: any) {
    const status = e?.status || 500;
    return sendJson(res, status, { error: e?.message || 'Server error' });
  }
}

type GeminiError = { status?: number; message: string; details?: string };

export type GeminiTextModelConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
};

export function getTextModel() {
  // Keep generic; set GEMINI_TEXT_MODEL to a Gemini 3.x text model if desired.
  // Default chosen for fast concierge-style responses.
  return process.env.GEMINI_TEXT_MODEL || 'models/gemini-2.0-flash';
}

export function getTimeoutMs() {
  return Number(process.env.GEMINI_TIMEOUT_MS || 45_000);
}

export function getApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

export async function geminiGenerateText(params: {
  cfg: GeminiTextModelConfig;
  system: string;
  user: string;
  responseMimeType?: 'application/json' | 'text/plain';
}): Promise<{ text: string; raw: any }> {
  const { cfg, system, user, responseMimeType } = params;
  const url = `https://generativelanguage.googleapis.com/v1beta/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.timeoutMs);

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `SYSTEM:\n${system}\n\nUSER:\n${user}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseModalities: ['TEXT'],
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err: GeminiError = { status: res.status, message: 'Gemini request failed', details: text };
      throw err;
    }

    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();

    if (!text) throw { status: 500, message: 'No text returned by Gemini' } satisfies GeminiError;

    return { text, raw: json };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw { status: 504, message: 'Gemini request timed out' } satisfies GeminiError;
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export function jsonParseOrThrow<T>(raw: string): T {
  // Strip code fences if the model returns them.
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

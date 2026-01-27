import formidable from 'formidable';
import fs from 'node:fs';

/**
 * Serverless function for Vercel.
 *
 * Behavior:
 * - Accepts multipart/form-data with field `image`.
 * - Step 1 (optional, default on): background removal -> PNG cutout.
 * - Step 2: generate either an EXTENSIONS preview or a COLOUR preview.
 *
 * IMPORTANT: We keep services separate:
 * - Extensions presets primarily change length/density/finish.
 * - Extensions may optionally apply a realistic colour match on the added hair (root shadow blend) when requested.
 * - Colour presets do NOT add length/density beyond natural hair.
 */

type Category = 'extensions' | 'color';

type StylePreset = { name: string; prompt: string; category: Category };

type GeminiInlineImage = { mimeType: string; data: string };

type GeminiError = {
  status?: number;
  message: string;
  details?: string;
};

const DEFAULT_MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB
const MAX_FILE_BYTES = Number(process.env.MAX_UPLOAD_BYTES || DEFAULT_MAX_FILE_BYTES);

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// EXTENSIONS controls (whitelisted)
const EXT_LENGTH = new Set(['subtle', 'medium', 'major']); // legacy
const EXT_INCHES = new Set(['14', '18', '22', '24']);
const EXT_DENSITY = new Set(['natural', 'full', 'glam']);
const EXT_FINISH = new Set(['straight', 'soft-waves', 'glam-waves']);

// Named-only shade IDs (must match data/brandInsights.ts)
const EXT_COLOR_IDS = new Set([
  'keep-natural',
  'platinum-icy',
  'champagne',
  'beige',
  'ash',
  'old-money',
  'creme-brulee',
  'honey',
  'caramel',
  'bronde',
  'espresso',
  'expensive-brunette',
  'copper',
  'soft-black',
]);

// COLOUR controls (whitelisted)
const COLOR_TONE = new Set(['cool', 'neutral', 'warm']);
const COLOR_BRIGHTNESS = new Set(['minimal', 'moderate']);
const COLOR_DIMENSION = new Set(['subtle', 'medium', 'bold']);
const COLOR_ROOT = new Set(['keep-natural', 'root-melt']);

const PRESETS: Record<string, StylePreset> = {
  // EXTENSIONS
  'extensions-natural-blend': {
    category: 'extensions',
    name: 'Natural Blend',
    prompt:
      'Add seamless hair extensions with an undetectable blend. Preserve the person’s natural hair color exactly. Focus on clean blending at the perimeter and hairline. Photorealistic.',
  },
  'extensions-volume-set': {
    category: 'extensions',
    name: 'Volume Set',
    prompt:
      'Add hair extensions primarily to increase density/volume (not extreme length). Preserve the person’s natural hair color exactly. Keep the result soft, premium, and believable.',
  },
  'extensions-length-set': {
    category: 'extensions',
    name: 'Length Set',
    prompt:
      'Add hair extensions to increase length with a seamless blend. Preserve the person’s natural hair color exactly. Keep ends healthy and realistic (no stringy tips).',
  },
  'extensions-glam-density': {
    category: 'extensions',
    name: 'Glam Density',
    prompt:
      'Add high-density extensions for a glamorous, camera-ready result while still photorealistic. Preserve natural hair color exactly. Avoid a wig-like look; keep believable hairline and part.',
  },
  'extensions-sleek-straight': {
    category: 'extensions',
    name: 'Sleek Straight Extensions',
    prompt:
      'Add seamless extensions and style the hair into a sleek straight finish with glossy health. Preserve natural color exactly. Keep texture realistic and avoid over-smoothing.',
  },
  'extensions-soft-waves': {
    category: 'extensions',
    name: 'Soft Waves + Extensions',
    prompt:
      'Add seamless extensions and style into soft S-waves with movement. Preserve natural color unless a colour match is explicitly requested. Keep volume realistic and blend consistent.',
  },
  'extensions-glam-waves': {
    category: 'extensions',
    name: 'Glam Waves + Extensions',
    prompt:
      'Add seamless extensions and style into defined, glamorous waves with a luxury finish. Preserve natural color unless a colour match is explicitly requested. Keep the result photorealistic and avoid an artificial wig-like look.',
  },
  'extensions-bouncy-blowout': {
    category: 'extensions',
    name: 'Bouncy Blowout + Extensions',
    prompt:
      'Add seamless extensions and style into a voluminous bouncy blowout with soft bend and premium shine. Preserve natural color unless a colour match is explicitly requested. Keep the hairline and part believable.',
  },

  // COLOUR
  'color-neutral-gloss': {
    category: 'color',
    name: 'Neutral Gloss',
    prompt:
      'Refine and gloss the existing hair color for a healthier, more polished look. Do NOT add length or density beyond natural hair. Photorealistic salon finish.',
  },
  'color-caramel-bronde': {
    category: 'color',
    name: 'Caramel Bronde',
    prompt:
      'Apply salon-realistic caramel bronde dimension (highlights/lowlights) with a natural blend. Do NOT add length/density beyond natural hair. Keep the look refined and believable.',
  },
  'color-cool-ash-brunette': {
    category: 'color',
    name: 'Cool Ash Brunette',
    prompt:
      'Shift hair color to a cool-toned ash brunette with a glossy finish and subtle dimension. Do NOT add length/density beyond natural hair. Avoid gray/green casts.',
  },
  'color-champagne-balayage': {
    category: 'color',
    name: 'Champagne Balayage',
    prompt:
      'Apply salon-realistic champagne balayage with a natural root and dimension. Do NOT add length/density beyond natural hair. Keep highlights believable and not over-bleached.',
  },
  'color-copper-glow': {
    category: 'color',
    name: 'Copper Glow',
    prompt:
      'Shift hair color to a rich copper glow with realistic dimension and shine. Do NOT add length/density beyond natural hair. Keep the result photorealistic (no fantasy saturation).',
  },
  'color-espresso-depth': {
    category: 'color',
    name: 'Espresso Depth',
    prompt:
      'Deepen the hair to an espresso brunette with mirror gloss and soft dimension. Do NOT add length/density beyond natural hair. Preserve facial identity and background.',
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function truthyEnv(value: string | undefined, defaultValue: boolean) {
  if (value == null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function getGeminiImageModel() {
  return process.env.GEMINI_IMAGE_MODEL || 'models/gemini-3-pro-image-preview';
}

function getBackgroundRemovalModel() {
  return process.env.BACKGROUND_REMOVAL_MODEL || getGeminiImageModel();
}

function sendJson(res: any, status: number, payload: any, extraHeaders?: Record<string, string>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }
  res.end(JSON.stringify(payload));
}

function setCors(req: any, res: any) {
  res.setHeader('Vary', 'Origin');

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = (req.headers?.origin as string | undefined) || undefined;
  const allowOrigin = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function extractInlineImage(json: any): GeminiInlineImage | null {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const inline = parts.find((p: any) => p?.inlineData?.data);
  if (!inline) return null;
  return {
    mimeType: inline.inlineData.mimeType || 'image/png',
    data: inline.inlineData.data,
  };
}

async function geminiGenerateContent(params: { apiKey: string; model: string; body: any; timeoutMs: number }): Promise<any> {
  const { apiKey, model, body, timeoutMs } = params;
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

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

    return await res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      const err: GeminiError = { status: 504, message: 'Gemini request timed out' };
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function removeBackground(params: {
  apiKey: string;
  input: { mimeType: string; data: string };
  timeoutMs: number;
}): Promise<GeminiInlineImage> {
  const model = getBackgroundRemovalModel();

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Remove the background from the provided image. Output a PNG with a transparent background. Keep the entire person and hair intact. Preserve original framing. No text.',
          },
          { inlineData: { mimeType: params.input.mimeType, data: params.input.data } },
        ],
      },
    ],
    generationConfig: { responseModalities: ['IMAGE'], temperature: 0.2 },
  };

  const json = await geminiGenerateContent({ apiKey: params.apiKey, model, body, timeoutMs: params.timeoutMs });
  const cutout = extractInlineImage(json);
  if (!cutout) throw { status: 500, message: 'Background removal produced no image' } satisfies GeminiError;

  return { mimeType: cutout.mimeType || 'image/png', data: cutout.data };
}

const EXT_COLOR_DESCRIPTORS: Record<string, string> = {
  'platinum-icy': 'icy platinum blonde, cool-toned, pearly silver undertone, salon-toned',
  champagne: 'champagne blonde, neutral-beige with soft gold reflect, rooted blend',
  beige: 'beige blonde, neutral lived-in blonde, natural dimension',
  ash: 'ash blonde, cool smoky undertone, soft shadow root',
  'old-money': 'old money blonde, ultra-soft neutral blonde, expensive blend, subtle root melt',
  'creme-brulee': 'crème brûlée blonde, warm-neutral creamy blonde with caramel ribbons, rooted dimension',
  honey: 'honey blonde, warm golden blonde with soft glow, salon finish',
  caramel: 'caramel blonde, deeper golden blonde, rich dimension',
  bronde: 'bronde (brown-blonde blend), seamless rooted transition, lived-in dimension',
  espresso: 'espresso brunette, deep rich brown with glossy finish',
  'expensive-brunette': 'expensive brunette, multi-dimensional chocolate-espresso tones, glassy gloss',
  copper: 'rich salon copper, soft auburn dimension, glossy',
  'soft-black': 'soft natural black, not blue-black, healthy shine',
};

function extensionsOptionsSnippet(params: {
  extLength?: string;
  extInches?: string;
  extColorId?: string;
  extDensity: string;
  extFinish: string;
}): string {
  const length = params.extLength;
  const inches = params.extInches;
  const density = params.extDensity;
  const finish = params.extFinish;
  const colorDesc = params.extColorId && params.extColorId !== 'keep-natural' ? EXT_COLOR_DESCRIPTORS[params.extColorId] : undefined;

  const lengthText =
    inches === '14'
      ? 'Target ~14-inch length (collarbone).'
      : inches === '22'
        ? 'Target ~22-inch length (bottom of ribcage).'
        : inches === '24'
          ? 'Target ~24-inch length (just above hips).'
          : inches === '18'
            ? 'Target ~18-inch length (below bra strap).'
            : length === 'subtle'
              ? 'Add subtle length only (very natural).'
              : length === 'major'
                ? 'Add noticeable length while staying photorealistic and believable.'
                : 'Add moderate length with a seamless blend.';

  const densityText =
    density === 'natural'
      ? 'Keep density natural-looking (no heavy bulk).'
      : density === 'glam'
        ? 'Increase density significantly for a glam look (but avoid wig-like density).'
        : 'Increase density for a fuller look while remaining realistic.';

  const finishText =
    finish === 'straight'
      ? 'Style finish: sleek straight with healthy gloss.'
      : finish === 'glam-waves'
        ? 'Style finish: glam waves (smooth, defined, high-end).'
        : 'Style finish: soft waves with movement.';

  const colorText = colorDesc
    ? `Colour match: ${colorDesc}. Blend extensions into natural hair with a realistic root shadow/root melt so the match is seamless.`
    : 'Colour: keep the person\'s natural hair color unless a colour match is specified.';

  return `${lengthText} ${densityText} ${finishText} ${colorText}`;
}

function colorOptionsSnippet(params: {
  colorTone: string;
  colorBrightness: string;
  colorDimension: string;
  colorRoot: string;
}): string {
  const tone = params.colorTone;
  const brightness = params.colorBrightness;
  const dimension = params.colorDimension;
  const root = params.colorRoot;

  const toneText =
    tone === 'cool'
      ? 'Overall tone direction: cool (no green/gray cast).'
      : tone === 'warm'
        ? 'Overall tone direction: warm (golden/caramel/copper as appropriate, not orange neon).'
        : 'Overall tone direction: neutral (balanced, salon-realistic).';

  const brightnessText =
    brightness === 'moderate'
      ? 'Allow a noticeable but salon-realistic brightness shift (avoid extreme lightening).'
      : 'Keep brightness change minimal (mostly tone/gloss refinement).';

  const dimensionText =
    dimension === 'bold'
      ? 'Dimension level: bold (clear highlights/lowlights while still believable).'
      : dimension === 'subtle'
        ? 'Dimension level: subtle (soft ribbons, low contrast).'
        : 'Dimension level: medium (balanced ribbons, natural contrast).';

  const rootText =
    root === 'root-melt'
      ? 'Root: include a soft root melt/shadow for a seamless blend.'
      : 'Root: keep the natural root/base as-is.';

  return `${toneText} ${brightnessText} ${dimensionText} ${rootText}`;
}

async function generateLook(params: {
  apiKey: string;
  preset: StylePreset;
  intensity: number;
  original: { mimeType: string; data: string };
  cutout?: { mimeType: string; data: string };
  timeoutMs: number;
  category: Category;
  // extensions
  extLength?: string;
  extInches?: string;
  extColorId?: string;
  extDensity?: string;
  extFinish?: string;
  // color
  colorTone?: string;
  colorBrightness?: string;
  colorDimension?: string;
  colorRoot?: string;
}): Promise<GeminiInlineImage> {
  const model = getGeminiImageModel();

  const globalRules = `
Core rules:
- Photorealistic salon result.
- Preserve face identity, skin, makeup, brows, eyes.
- Preserve lighting and background.
- No text/logos.
- Keep changes focused on hair only.
- Intensity: ${params.intensity} (0-1).
`;

  const separationRules =
    params.category === 'extensions'
      ? `
Service separation:
- EXTENSIONS PREVIEW: You MAY add extensions to change length/density/finish.
- Colour behavior: if a colour match is specified, blend the extensions with a realistic rooted shadow so the result looks like a professional match. If no colour is specified, preserve the person’s natural hair color.
`
      : `
Service separation:
- COLOUR PREVIEW: Do NOT add length/density beyond the natural hair.
- You MAY change color/tone/dimension/gloss only.
`;

  const optionRules =
    params.category === 'extensions'
      ? extensionsOptionsSnippet({
          extLength: params.extLength || 'medium',
          extInches: params.extInches,
          extColorId: params.extColorId,
          extDensity: params.extDensity || 'full',
          extFinish: params.extFinish || 'soft-waves',
        })
      : colorOptionsSnippet({
          colorTone: params.colorTone || 'neutral',
          colorBrightness: params.colorBrightness || 'minimal',
          colorDimension: params.colorDimension || 'medium',
          colorRoot: params.colorRoot || 'keep-natural',
        });

  const text = `You are an expert hair colorist and extension specialist.

Goal:
- Edit the person in the image to preview: ${params.preset.name}

Preset instructions:
- ${params.preset.prompt}

User customization:
- ${optionRules}

${separationRules}
${globalRules}

Return a single photorealistic image.`;

  const parts: any[] = [{ text }];
  // Provide original for background/lighting fidelity.
  parts.push({ inlineData: { mimeType: params.original.mimeType, data: params.original.data } });
  // Provide cutout as segmentation guide if present.
  if (params.cutout) parts.push({ inlineData: { mimeType: params.cutout.mimeType, data: params.cutout.data } });

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 0.35,
    },
  };

  return geminiGenerateContent({ apiKey: params.apiKey, model, body, timeoutMs: params.timeoutMs }).then((json) => {
    const out = extractInlineImage(json);
    if (!out) throw { status: 500, message: 'No image returned by Gemini' } satisfies GeminiError;
    return out;
  });
}

// Rate limiting (best-effort, per instance)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 0); // 0 = disabled
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

function getClientIp(req: any): string {
  const xff = (req?.headers?.['x-forwarded-for'] as string | undefined) || undefined;
  const ip = xff?.split(',')?.[0]?.trim();
  return ip || req?.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req: any): { ok: true } | { ok: false; retryAfterSec: number } {
  if (!RATE_LIMIT_MAX || RATE_LIMIT_MAX <= 0) return { ok: true };

  const key = getClientIp(req);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  current.count += 1;
  return { ok: true };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function guessMimeType(filename: string | undefined): string | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

async function parseForm(req: any): Promise<{
  fields: Record<string, string>;
  file: { buffer: Buffer; mimeType: string } | null;
}> {
  const form = formidable({ multiples: false, maxFileSize: MAX_FILE_BYTES });
  const [fieldsRaw, filesRaw] = await form.parse(req);

  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(fieldsRaw)) fields[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');

  const image = (filesRaw as any)?.image;
  const f = Array.isArray(image) ? image[0] : image;
  if (!f) return { fields, file: null };

  const reportedMime = String(f.mimetype || 'application/octet-stream');
  const originalFilename = String(f.originalFilename || '');
  const filepath = String(f.filepath || '');
  if (!filepath) return { fields, file: null };

  const buffer = fs.readFileSync(filepath);
  const inferred = guessMimeType(originalFilename);
  const mimeType = inferred || reportedMime;

  return { fields, file: { buffer, mimeType } };
}

function normalizeCategory(value: string | undefined): Category {
  return value === 'color' ? 'color' : 'extensions';
}

function allowOrDefault(value: string | undefined, allowed: Set<string>, defaultValue: string): string {
  if (!value) return defaultValue;
  const v = value.trim();
  return allowed.has(v) ? v : defaultValue;
}

export default async function handler(req: any, res: any) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const rl = checkRateLimit(req);
  if (rl.ok !== true) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return sendJson(res, 429, { error: 'Rate limit exceeded' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY in environment' });

    const { fields, file } = await parseForm(req);

    const rawStyleId = String(fields.styleId || 'extensions-natural-blend');
    const styleId = rawStyleId.toLowerCase().trim();
    const preset = PRESETS[styleId] || PRESETS['extensions-natural-blend'];

    const category = normalizeCategory(fields.category);

    // Enforce separation at the API level: category must match preset category.
    if (preset.category !== category) {
      return sendJson(res, 400, {
        error: 'Category/preset mismatch. Please choose a preset from the selected category.',
      });
    }

    const rawIntensity = Number(fields.intensity ?? 0.6);
    const intensity = Number.isFinite(rawIntensity) ? clamp(rawIntensity, 0, 1) : 0.6;

    if (!file?.buffer) return sendJson(res, 400, { error: 'Missing image upload (field name: image).' });
    if (!ALLOWED_MIME.has(file.mimeType)) {
      return sendJson(res, 400, { error: 'Unsupported image format. Please upload a JPG/PNG/WebP headshot.' });
    }

    const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 45_000);

    const original = { mimeType: file.mimeType, data: file.buffer.toString('base64') };

    const bgRemovalEnabled = truthyEnv(process.env.BACKGROUND_REMOVAL_ENABLED, true);

    let cutout: GeminiInlineImage | undefined;
    if (bgRemovalEnabled) {
      cutout = await removeBackground({ apiKey, input: original, timeoutMs });
    }

    // Whitelisted options with defaults.
    const extLength = allowOrDefault(fields.extLength, EXT_LENGTH, 'medium'); // legacy
    const extInches = allowOrDefault(fields.extInches, EXT_INCHES, '18');
    const extColorId = allowOrDefault(fields.extColorId, EXT_COLOR_IDS, 'keep-natural');
    const extDensity = allowOrDefault(fields.extDensity, EXT_DENSITY, 'full');
    const extFinish = allowOrDefault(fields.extFinish, EXT_FINISH, 'soft-waves');

    const colorTone = allowOrDefault(fields.colorTone, COLOR_TONE, 'neutral');
    const colorBrightness = allowOrDefault(fields.colorBrightness, COLOR_BRIGHTNESS, 'minimal');
    const colorDimension = allowOrDefault(fields.colorDimension, COLOR_DIMENSION, 'medium');
    const colorRoot = allowOrDefault(fields.colorRoot, COLOR_ROOT, 'keep-natural');

    const out = await generateLook({
      apiKey,
      preset,
      intensity,
      original,
      cutout,
      timeoutMs,
      category,
      extLength,
      extInches,
      extColorId,
      extDensity,
      extFinish,
      colorTone,
      colorBrightness,
      colorDimension,
      colorRoot,
    });

    return sendJson(res, 200, {
      styleId,
      styleName: preset.name,
      mimeType: out.mimeType,
      imageBase64: out.data,
      backgroundRemoved: Boolean(cutout),
      category,
    });
  } catch (e: any) {
    const status = e?.status || e?.statusCode || 500;
    const includeDetails = truthyEnv(process.env.EXPOSE_API_ERRORS, false);

    const payload: any = { error: e?.message || 'Server error' };
    if (includeDetails && e?.details) payload.details = e.details;

    return sendJson(res, status, payload);
  }
}

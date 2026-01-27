/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { buildPrompt } from './_geminiPromptQuality.mjs';

const PROJECT_ROOT = process.cwd();

function loadDotEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvLocal();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const MODEL = args.find((a) => a.startsWith('--model='))?.split('=')[1] || 'models/gemini-3-pro-image-preview';
const FORCE = args.includes('--force');
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const PRESET = args.find((a) => a.startsWith('--preset='))?.split('=')[1] || '';
const DRY_RUN = args.includes('--dry-run');

// Save into public/ so Vite/Vercel can serve directly.
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'generated', 'style-previews');
const MAP_FILE = path.join(PROJECT_ROOT, 'data', 'stylePreviews.ts');

const SIZES = [400, 700, 1000, 2000];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPublicPath(absPath) {
  const rel = path.relative(path.join(PROJECT_ROOT, 'public'), absPath).replace(/\\/g, '/');
  return `/${rel}`;
}

/**
 * Source of truth for preview generation.
 * These are generic photorealistic "sample outcomes" for the UI (not user uploads).
 */
const PRESET_PREVIEWS = [
  // EXTENSIONS
  {
    id: 'extensions-natural-blend',
    category: 'extensions',
    name: 'Natural Blend',
    prompt:
      'Photorealistic studio portrait of a luxury hair extensions result: seamless natural blend, subtle added length and density, healthy shine, premium salon finish. Neutral background, soft lighting. No text, no logos.',
  },
  {
    id: 'extensions-volume-set',
    category: 'extensions',
    name: 'Volume Set',
    prompt:
      'Photorealistic studio portrait showcasing a luxury volume extensions result: noticeably fuller mid-lengths and ends, natural blend, healthy glossy hair, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'extensions-length-set',
    category: 'extensions',
    name: 'Length Set',
    prompt:
      'Photorealistic studio portrait showcasing luxury length extensions: longer hair with seamless blending, healthy ends, soft movement, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'extensions-glam-density',
    category: 'extensions',
    name: 'Glam Density',
    prompt:
      'Photorealistic studio portrait showcasing glam hair extensions density: high density, luxurious shine, premium blowout, still believable hairline and part. Neutral background, soft lighting. No text.',
  },
  {
    id: 'extensions-sleek-straight',
    category: 'extensions',
    name: 'Sleek Straight Extensions',
    prompt:
      'Photorealistic studio portrait with sleek straight hair extensions: ultra-smooth, glossy, seamless blend, high-end salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'extensions-soft-waves',
    category: 'extensions',
    name: 'Soft Waves + Extensions',
    prompt:
      'Photorealistic studio portrait with soft S-waves and luxury hair extensions: blended length and density, natural movement, glossy healthy hair. Neutral background, soft lighting. No text.',
  },

  // COLOR
  {
    id: 'color-neutral-gloss',
    category: 'color',
    name: 'Neutral Gloss',
    prompt:
      'Photorealistic studio portrait showcasing a neutral hair gloss refresh: refined tone, high shine, healthy texture, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'color-caramel-bronde',
    category: 'color',
    name: 'Caramel Bronde',
    prompt:
      'Photorealistic studio portrait showcasing caramel bronde hair color: dimensional highlights and lowlights, soft blend, natural root, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'color-cool-ash-brunette',
    category: 'color',
    name: 'Cool Ash Brunette',
    prompt:
      'Photorealistic studio portrait showcasing cool ash brunette hair color: neutral-cool tones, glossy finish, subtle dimension, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'color-champagne-balayage',
    category: 'color',
    name: 'Champagne Balayage',
    prompt:
      'Photorealistic studio portrait showcasing champagne balayage: bright but salon-realistic blonde tones, dimensional ribbons, natural root melt, glossy finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'color-copper-glow',
    category: 'color',
    name: 'Copper Glow',
    prompt:
      'Photorealistic studio portrait showcasing copper hair color: rich copper glow, dimensional tone, healthy shine, premium salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'color-espresso-depth',
    category: 'color',
    name: 'Espresso Depth',
    prompt:
      'Photorealistic studio portrait showcasing deep espresso brunette hair: rich depth, mirror gloss, subtle dimension, premium salon finish. Neutral background, soft lighting. No text.',
  },
];

async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`generateContent failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const inline = parts.find((p) => p.inlineData?.data);
  if (!inline) {
    throw new Error(`No inlineData returned. Full response: ${JSON.stringify(json, null, 2)}`);
  }

  const mimeType = inline.inlineData.mimeType || 'image/png';
  const buf = Buffer.from(inline.inlineData.data, 'base64');
  return { buf, mimeType };
}

function existingVariants(presetId) {
  // If --force is set, always regenerate.
  if (FORCE) return null;

  const baseDir = path.join(OUT_DIR, presetId);
  const files = SIZES.map((w) => path.join(baseDir, `${w}.webp`));
  const ok = files.every((f) => fs.existsSync(f));
  if (!ok) return null;

  const srcSetEntries = files.map((f, idx) => `${toPublicPath(f)} ${SIZES[idx]}w`);
  const mainSrc = toPublicPath(path.join(baseDir, '1000.webp'));
  return {
    src: mainSrc,
    srcSet: srcSetEntries.join(', '),
    photographer: 'Generated with Google Gemini',
    photographerUrl: '',
    pexelsUrl: '',
    avgColor: '',
  };
}

async function writeVariants({ presetId, prompt }) {
  const cached = existingVariants(presetId);
  if (cached) {
    console.log(`Reusing existing: ${presetId}`);
    return cached;
  }

  if (!FORCE) {
    throw new Error(
      `Missing preview variants for "${presetId}". Re-run with --force to generate (e.g., npm run gemini:style-previews:force).`
    );
  }

  console.log(`Generating preview: ${presetId}`);
  if (DRY_RUN) {
    console.log(`[dry-run] would call Gemini and write variants to ${path.relative(PROJECT_ROOT, path.join(OUT_DIR, presetId))}`);
    // Return a placeholder mapping (no files written)
    return {
      src: toPublicPath(path.join(OUT_DIR, presetId, '1000.webp')),
      srcSet: SIZES.map((w) => `${toPublicPath(path.join(OUT_DIR, presetId, `${w}.webp`))} ${w}w`).join(', '),
      photographer: 'Generated with Google Gemini',
      photographerUrl: '',
      pexelsUrl: '',
      avgColor: '',
    };
  }

  // Retry a few times to get a clean, artifact-free render.
  let lastErr;
  let buf;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      ({ buf } = await generateImage(prompt));
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`Retry ${attempt}/3 failed for ${presetId}: ${e?.message || e}`);
      if (attempt === 3) throw lastErr;
    }
  }

  const baseDir = path.join(OUT_DIR, presetId);
  ensureDir(baseDir);

  // Normalize to consistent square thumbnails (center crop), then output responsive variants.
  // This gives consistent left-side square cards.
  const square = sharp(buf)
    .resize({ width: 1200, height: 1200, fit: 'cover', position: 'centre' })
    .webp({ quality: 84 });

  for (const w of SIZES) {
    const outPath = path.join(baseDir, `${w}.webp`);
    await square.clone().resize({ width: w, height: w, fit: 'cover', position: 'centre' }).toFile(outPath);
  }

  const srcSetEntries = SIZES.map((w) => `${toPublicPath(path.join(baseDir, `${w}.webp`))} ${w}w`);
  return {
    src: toPublicPath(path.join(baseDir, '1000.webp')),
    srcSet: srcSetEntries.join(', '),
    photographer: 'Generated with Google Gemini',
    photographerUrl: '',
    pexelsUrl: '',
    avgColor: '',
  };
}

async function main() {
  ensureDir(OUT_DIR);

  // Decide which presets we are actively generating.
  let list = PRESET_PREVIEWS;
  if (PRESET) {
    list = PRESET_PREVIEWS.filter((p) => p.id === PRESET);
    if (list.length === 0) throw new Error(`Unknown preset id: ${PRESET}`);
  } else if (LIMIT > 0) {
    list = PRESET_PREVIEWS.slice(0, LIMIT);
  }

  // Build a full mapping for all presets by reusing existing files when present.
  // This way the UI can always show all thumbnails that exist, even after partial runs.
  const map = {};

  // First generate requested subset.
  for (const p of list) {
    const prompt = buildPrompt(
      `High-end beauty editorial portrait. ${p.prompt} Ensure the full hairstyle is visible and not cropped. Face centered, hair fully in frame.`,
      'Square thumbnail safety: subject centered, hair fully visible, no cut-off at top/bottom.'
    );
    map[p.id] = await writeVariants({ presetId: p.id, prompt });
  }

  // Then fill in the rest from disk (or leave missing if not yet generated).
  for (const p of PRESET_PREVIEWS) {
    if (map[p.id]) continue;
    const cached = existingVariants(p.id);
    if (cached) map[p.id] = cached;
  }

  const out = `// Generated by scripts/generateStylePreviews.mjs\nimport type { ImageAsset } from '../types';\n\nexport const stylePreviews: Record<string, ImageAsset> = ${JSON.stringify(
    map,
    null,
    2
  )} as const;\n`;

  fs.writeFileSync(MAP_FILE, out, 'utf8');
  console.log(`Wrote mapping: ${path.relative(PROJECT_ROOT, MAP_FILE)}`);
  if (DRY_RUN) console.log('Dry run complete. No images were generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

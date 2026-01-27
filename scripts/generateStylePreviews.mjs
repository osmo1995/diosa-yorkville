/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { buildPrompt } from './_geminiPromptQuality.mjs';
// Extension preview variants are generated for a curated subset of colours/lengths.
// (Keep this list in sync with data/brandInsights.ts)
const EXT_PREVIEW_COLOR_IDS = [
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
];
const EXT_LENGTH_IDS = ['14', '18', '22', '24'];

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
const CATEGORY = args.find((a) => a.startsWith('--category='))?.split('=')[1] || 'all';
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const PRESET = args.find((a) => a.startsWith('--preset='))?.split('=')[1] || '';
const PRESETS = args.find((a) => a.startsWith('--presets='))?.split('=')[1] || '';
const COLORS = args.find((a) => a.startsWith('--colors='))?.split('=')[1] || '';
const LENGTHS = args.find((a) => a.startsWith('--lengths='))?.split('=')[1] || '';
const DRY_RUN = args.includes('--dry-run');

function parseCsvFlag(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const FILTER_PRESET_IDS = PRESETS ? new Set(parseCsvFlag(PRESETS)) : null;
const FILTER_COLOR_IDS = COLORS ? new Set(parseCsvFlag(COLORS)) : null;
const FILTER_LENGTH_IDS = LENGTHS ? new Set(parseCsvFlag(LENGTHS)) : null;

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
  {
    id: 'extensions-glam-waves',
    category: 'extensions',
    name: 'Glam Waves + Extensions',
    prompt:
      'Photorealistic studio portrait with defined glam waves and luxury hair extensions: premium shine, smooth wave pattern, seamless blend, high-end salon finish. Neutral background, soft lighting. No text.',
  },
  {
    id: 'extensions-bouncy-blowout',
    category: 'extensions',
    name: 'Bouncy Blowout + Extensions',
    prompt:
      'Photorealistic studio portrait with a bouncy blowout and luxury hair extensions: voluminous movement, soft bend, glossy finish, seamless blend. Neutral background, soft lighting. No text.',
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

async function writeVariants({ presetId, prompt, outKey = presetId }) {
  const cached = existingVariants(outKey);
  if (cached) {
    console.log(`Reusing existing: ${presetId}`);
    return cached;
  }

  if (!FORCE) {
    throw new Error(
      `Missing preview variants for "${outKey}". Re-run with --force to generate (e.g., npm run gemini:style-previews:force).`
    );
  }

  console.log(`Generating preview: ${outKey}`);
  if (DRY_RUN) {
    console.log(`[dry-run] would call Gemini and write variants to ${path.relative(PROJECT_ROOT, path.join(OUT_DIR, outKey))}`);
    // Return a placeholder mapping (no files written)
    return {
      src: toPublicPath(path.join(OUT_DIR, outKey, '1000.webp')),
      srcSet: SIZES.map((w) => `${toPublicPath(path.join(OUT_DIR, outKey, `${w}.webp`))} ${w}w`).join(', '),
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

  const baseDir = path.join(OUT_DIR, outKey);
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
  if (CATEGORY === 'extensions') list = list.filter((p) => p.category === 'extensions');
  if (CATEGORY === 'color') list = list.filter((p) => p.category === 'color');

  // Back-compat: --preset=<id> still supported.
  if (PRESET) {
    list = list.filter((p) => p.id === PRESET);
    if (list.length === 0) throw new Error(`Unknown preset id: ${PRESET}`);
  }

  // New: --presets=<id1,id2,...>
  if (FILTER_PRESET_IDS) {
    list = list.filter((p) => FILTER_PRESET_IDS.has(p.id));
    if (list.length === 0) {
      throw new Error(`No presets matched --presets=${Array.from(FILTER_PRESET_IDS).join(',')}`);
    }
  } else if (!PRESET && LIMIT > 0) {
    list = list.slice(0, LIMIT);
  }

  // Build a full mapping for all presets by reusing existing files when present.
  // This way the UI can always show all thumbnails that exist, even after partial runs.
  const map = {};
  const extensionStylePreviews = {};

  // First generate requested subset.
  for (const p of list) {
    // For extension presets, optionally generate colour×length variants under a dedicated subfolder.
    if (CATEGORY === 'extensions' && p.category === 'extensions') {
      const colorIds = FILTER_COLOR_IDS ? EXT_PREVIEW_COLOR_IDS.filter((c) => FILTER_COLOR_IDS.has(c)) : EXT_PREVIEW_COLOR_IDS;
      const lengthIds = FILTER_LENGTH_IDS ? EXT_LENGTH_IDS.filter((l) => FILTER_LENGTH_IDS.has(l)) : EXT_LENGTH_IDS;

      if (FILTER_COLOR_IDS && colorIds.length === 0) {
        throw new Error(`No extension colors matched --colors=${Array.from(FILTER_COLOR_IDS).join(',')}`);
      }
      if (FILTER_LENGTH_IDS && lengthIds.length === 0) {
        throw new Error(`No extension lengths matched --lengths=${Array.from(FILTER_LENGTH_IDS).join(',')}`);
      }

      for (const colorId of colorIds) {
        for (const lenId of lengthIds) {
          const variantKey = `extensions/${p.id}/${colorId}/${lenId}`;
          const prompt = buildPrompt(
            `High-end beauty editorial portrait. ${p.prompt} Colour match: ${colorId}. Target length: ${lenId} inches. Rooted blend / root shadow for realism. Ensure full hairstyle is visible and not cropped. Face centered, hair fully in frame.`,
            'Square thumbnail safety: subject centered, hair fully visible, no cut-off at top/bottom.'
          );
          const asset = await writeVariants({ presetId: p.id, prompt, outKey: variantKey });
          extensionStylePreviews[p.id] ||= {};
          extensionStylePreviews[p.id][colorId] ||= {};
          extensionStylePreviews[p.id][colorId][lenId] = asset;
        }
      }

      // Also ensure a base thumbnail exists for the preset itself.
      const basePrompt = buildPrompt(
        `High-end beauty editorial portrait. ${p.prompt} Ensure the full hairstyle is visible and not cropped. Face centered, hair fully in frame.`,
        'Square thumbnail safety: subject centered, hair fully visible, no cut-off at top/bottom.'
      );
      map[p.id] = await writeVariants({ presetId: p.id, prompt: basePrompt, outKey: p.id });
    } else {
      const prompt = buildPrompt(
        `High-end beauty editorial portrait. ${p.prompt} Ensure the full hairstyle is visible and not cropped. Face centered, hair fully in frame.`,
        'Square thumbnail safety: subject centered, hair fully visible, no cut-off at top/bottom.'
      );
      map[p.id] = await writeVariants({ presetId: p.id, prompt, outKey: p.id });
    }
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
  )} as const;\n\nexport const extensionStylePreviews: Record<string, Record<string, Record<string, ImageAsset>>> = ${JSON.stringify(
    extensionStylePreviews,
    null,
    2
  )};\n`;

  fs.writeFileSync(MAP_FILE, out, 'utf8');
  console.log(`Wrote mapping: ${path.relative(PROJECT_ROOT, MAP_FILE)}`);
  if (CATEGORY === 'extensions') {
    console.log('Note: extensions variants written under /generated/style-previews/extensions/<presetId>/<colorId>/<lengthId>/');
  }
  if (DRY_RUN) console.log('Dry run complete. No images were generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

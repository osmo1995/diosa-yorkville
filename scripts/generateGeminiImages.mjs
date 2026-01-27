/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

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

// Alternate image-capable models surfaced by AI Studio (try if the default doesn't return inline images)
const FALLBACK_MODELS = ['models/gemini-2.5-flash-image', 'models/gemini-2.0-flash-exp-image-generation'];
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'generated');
const MAP_FILE = path.join(PROJECT_ROOT, 'data', 'generatedImages.ts');

const SIZES = [400, 700, 1000, 2000];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPublicPath(absPath) {
  const rel = path.relative(path.join(PROJECT_ROOT, 'public'), absPath).replace(/\\/g, '/');
  return `/${rel}`;
}

async function generateImage(prompt) {
  const tryModels = [MODEL, ...FALLBACK_MODELS];

  let lastErr;
  for (const model of tryModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    // For image-capable Gemini models, request IMAGE output explicitly.
    generationConfig: {
      temperature: 0.9,
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
      lastErr = new Error(`generateContent failed ${res.status}: ${text}`);
      continue;
    }

    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];

    const inline = parts.find((p) => p.inlineData?.data);
    if (!inline) {
      lastErr = new Error(
        `No inlineData returned for model ${model}. Full response: ${JSON.stringify(json, null, 2)}`
      );
      continue;
    }

    const mimeType = inline.inlineData.mimeType || 'image/png';
    const buf = Buffer.from(inline.inlineData.data, 'base64');
    return { buf, mimeType, model };
  }

  throw lastErr || new Error('Image generation failed for all attempted models.');
}

function existingVariants(key) {
  const baseDir = path.join(OUT_DIR, key);
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

async function writeVariants({ key, prompt }) {
  const cached = existingVariants(key);
  if (cached) {
    console.log(`Reusing existing: ${key}`);
    return cached;
  }

  if (!FORCE) {
    throw new Error(
      `Missing generated image variants for "${key}". To generate new images, re-run with --force (e.g., npm run gemini:images:force).`
    );
  }

  console.log(`Generating: ${key}`);

  const { buf } = await generateImage(prompt);

  const baseDir = path.join(OUT_DIR, key);
  ensureDir(baseDir);

  // Use sharp to normalize + output multiple webp widths.
  const srcSetEntries = [];
  let mainSrc = '';

  for (const w of SIZES) {
    const outPath = path.join(baseDir, `${w}.webp`);
    await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(outPath);

    const publicPath = toPublicPath(outPath);
    srcSetEntries.push(`${publicPath} ${w}w`);

    if (w === 1000) mainSrc = publicPath;
  }

  if (!mainSrc) mainSrc = toPublicPath(path.join(baseDir, `${SIZES[SIZES.length - 1]}.webp`));

  return {
    src: mainSrc,
    srcSet: srcSetEntries.join(', '),
    photographer: 'Generated with Google Gemini',
    photographerUrl: '',
    pexelsUrl: '',
    avgColor: '',
  };
}

async function main() {
  ensureDir(OUT_DIR);

  // Photorealistic, luxury Yorkville hair extension brand prompts.
  const baseStyle = `photorealistic, high-end luxury editorial, warm champagne and gold tones, soft natural light, ultra-detailed, realistic hair texture, no text, no logos, 35mm photography look`;

  const plan = {
    hero: {
      key: 'hero',
      prompt: `Luxury Toronto Yorkville hair extension salon interior, elegant minimalist design, marble, brass accents, warm beige palette, ${baseStyle}`,
    },
    cta: {
      key: 'cta',
      prompt: `Back view of a woman with long glossy hair extensions, subtle waves, luxury salon vibe, ${baseStyle}`,
    },
    quiz: {
      key: 'quiz',
      prompt: `Hair extension consultation in a luxury salon, stylist hands analyzing hair, premium experience, ${baseStyle}`,
    },
    services: {
      'tape-in': {
        key: 'services/tape-in',
        prompt: `Close-up photorealistic tape-in hair extensions being applied by a professional stylist, clean premium salon environment, ${baseStyle}`,
      },
      'keratin-bond': {
        key: 'services/keratin-bond',
        prompt: `Close-up photorealistic keratin bond (k-tip) hair extensions application, precise sectioning, premium salon, ${baseStyle}`,
      },
      'hand-tied': {
        key: 'services/hand-tied',
        prompt: `Close-up photorealistic hand-tied weft hair extension installation with beads, luxury salon, ${baseStyle}`,
      },
      'sew-in': {
        key: 'services/sew-in',
        prompt: `Close-up photorealistic sew-in hair extension technique, stylist hands sewing weft, luxury salon, ${baseStyle}`,
      },
    },
    transformations: {
      t1_before: {
        key: 'transformations/t1_before',
        prompt: `Back view natural medium-length brunette hair, before hair extension transformation, luxury salon lighting, ${baseStyle}`,
      },
      t1_after: {
        key: 'transformations/t1_after',
        prompt: `Back view long glossy brunette hair extensions result, after transformation, luxury salon lighting, ${baseStyle}`,
      },
      t2_before: {
        key: 'transformations/t2_before',
        prompt: `Back view shoulder-length hair before balayage and extensions, subtle, luxury salon, ${baseStyle}`,
      },
      t2_after: {
        key: 'transformations/t2_after',
        prompt: `Back view long champagne blonde balayage hair extensions result, after transformation, luxury salon, ${baseStyle}`,
      },
    },
    gallery: {
      Blonde: [
        { key: 'gallery/blonde_1', prompt: `Back view icy platinum blonde hair extensions, seamless blend, luxury editorial, ${baseStyle}` },
        { key: 'gallery/blonde_2', prompt: `Back view champagne blonde balayage hair extensions, luxury salon, ${baseStyle}` },
        { key: 'gallery/blonde_3', prompt: `Back view warm honey blonde hair extensions, soft waves, ${baseStyle}` },
      ],
      Volume: [
        { key: 'gallery/volume_1', prompt: `Back view voluminous hair extensions, thick waves, luxury editorial, ${baseStyle}` },
        { key: 'gallery/volume_2', prompt: `Back view blowout volume hair extensions, glossy texture, ${baseStyle}` },
        { key: 'gallery/volume_3', prompt: `Back view dense hair extensions, editorial waves, ${baseStyle}` },
      ],
      Length: [
        { key: 'gallery/length_1', prompt: `Back view extra long hair extensions, sleek glossy finish, ${baseStyle}` },
        { key: 'gallery/length_2', prompt: `Back view very long hair extensions with soft curls, ${baseStyle}` },
        { key: 'gallery/length_3', prompt: `Back view mermaid length hair extensions, luxury salon lighting, ${baseStyle}` },
      ],
    },
  };

  // Always try to produce a mapping file, even if some generations fail.
  /** @type {any} */
  const hero = await writeVariants(plan.hero);
  /** @type {any} */
  const cta = await writeVariants(plan.cta);
  /** @type {any} */
  const quiz = await writeVariants(plan.quiz);

  const services = {};
  for (const [id, cfg] of Object.entries(plan.services)) {
    try {
      services[id] = await writeVariants(cfg);
    } catch (e) {
      console.error(`Failed to generate service ${id}:`, e);
      services[id] = existingVariants(cfg.key) || { src: '', srcSet: '', photographer: 'Generated with Google Gemini', photographerUrl: '', pexelsUrl: '', avgColor: '' };
    }
  }

  const transformations = {};
  for (const [id, cfg] of Object.entries(plan.transformations)) {
    try {
      transformations[id] = await writeVariants(cfg);
    } catch (e) {
      console.error(`Failed to generate transformation ${id}:`, e);
      transformations[id] = existingVariants(cfg.key) || { src: '', srcSet: '', photographer: 'Generated with Google Gemini', photographerUrl: '', pexelsUrl: '', avgColor: '' };
    }
  }

  const gallery = { Blonde: [], Volume: [], Length: [] };
  for (const cat of Object.keys(plan.gallery)) {
    for (const cfg of plan.gallery[cat]) {
      try {
        gallery[cat].push(await writeVariants(cfg));
      } catch (e) {
        console.error(`Failed to generate gallery ${cat} ${cfg.key}:`, e);
        const fallback = existingVariants(cfg.key);
        if (fallback) gallery[cat].push(fallback);
      }
    }
  }

  const out = `// Generated by scripts/generateGeminiImages.mjs\nimport type { PexelsImageMap } from '../types';\n\nexport const generatedImages: PexelsImageMap = ${JSON.stringify(
    { hero, cta, quiz, services, transformations, gallery },
    null,
    2
  )} as const;\n`;

  fs.writeFileSync(MAP_FILE, out, 'utf8');
  console.log(`Wrote ${path.relative(PROJECT_ROOT, MAP_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

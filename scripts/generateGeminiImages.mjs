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
      // Lower temperature improves realism/consistency.
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
  // If --force is set, always regenerate.
  if (FORCE) return null;

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

  // Retry a few times to get a clean, artifact-free render.
  let lastErr;
  let buf;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      ({ buf } = await generateImage(prompt));
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`Retry ${attempt}/3 failed for ${key}: ${e?.message || e}`);
      if (attempt === 3) throw lastErr;
    }
  }

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

  // High-fidelity prompt wrapper (8K photorealistic) + strict negative constraints.
  // NOTE: final outputs are web-optimized sizes; we target "8K" quality through prompt specificity.
  const wrap = (p, extras = '') => buildPrompt(p, extras);

  // For interiors, prefer a wider lens reference.
  const interiorExtras = 'Interior shot: 24–35mm lens look, clean geometry, premium materials, realistic reflections. Real salon tools present (sectioning clips, combs, brushes) with subtle DIOSA branding only.';
  const portraitExtras = 'Portrait shot: 85mm lens look, flattering perspective, natural skin texture, hair fully visible. Real salon accessories present (sectioning clips, tail comb) with subtle DIOSA branding only.';
  const macroExtras = 'Macro shot: 90–105mm macro look, crisp detail, shallow depth of field. Real tools visible (tail comb, sectioning clips, extension pliers/heat tool as appropriate) with subtle DIOSA branding only.';

  const plan = {
    hero: {
      key: 'hero',
      prompt: wrap('Luxury Toronto Yorkville hair extension salon interior, elegant minimalist design, marble, brass accents, warm beige palette. No people.', interiorExtras),
    },
    cta: {
      key: 'cta',
      prompt: wrap('Back view beauty editorial portrait of a woman with long glossy hair extensions, subtle soft waves, seamless blend, healthy ends, premium salon finish. Neutral background.', portraitExtras),
    },
    quiz: {
      key: 'quiz',
      prompt: wrap('Luxury hair consultation moment: stylist hands analyzing hair sections in a high-end salon. Clean background. No visible branding, no text.', portraitExtras),
    },
    services: {
      'tape-in': {
        key: 'services/tape-in',
        prompt: wrap('Close-up macro photo of tape-in hair extensions being applied by a professional stylist. Clean sectioning, realistic strands, premium salon background blur. Include real tape-in tabs, sectioning clips, tail comb, and a professional brush. Subtle DIOSA branding only on a tool bag or clip case.', macroExtras),
      },
      'keratin-bond': {
        key: 'services/keratin-bond',
        prompt: wrap('Close-up macro photo of keratin bond (k-tip) hair extensions application. Precise sectioning, realistic bonds, premium salon background blur. Include a keratin heat tool, sectioning clips, tail comb. Subtle DIOSA branding only on equipment.', macroExtras),
      },
      'hand-tied': {
        key: 'services/hand-tied',
        prompt: wrap('Close-up macro photo of hand-tied weft hair extensions installation with beads. Clean parting, realistic strands, luxury salon background blur. Include beads, thread/needle tools, sectioning clips, tail comb. Subtle DIOSA branding only on a tool bag or clip case.', macroExtras),
      },
      'sew-in': {
        key: 'services/sew-in',
        prompt: wrap('Close-up macro photo of sew-in hair extension technique: stylist hands sewing weft with needle/thread. Clean parting, realistic strands, luxury salon background blur. Include curved needle, thread, sectioning clips, tail comb. Subtle DIOSA branding only on equipment.', macroExtras),
      },
    },
    transformations: {
      t1_before: {
        key: 'transformations/t1_before',
        prompt: wrap('Back view portrait of natural medium-length brunette hair BEFORE extension transformation. Neutral background, salon lighting, realistic hair texture.', portraitExtras),
      },
      t1_after: {
        key: 'transformations/t1_after',
        prompt: wrap('Back view portrait of long glossy brunette hair extensions AFTER transformation. Seamless blend, healthy ends, premium shine. Neutral background.', portraitExtras),
      },
      t2_before: {
        key: 'transformations/t2_before',
        prompt: wrap('Back view portrait of shoulder-length hair BEFORE subtle balayage and extensions. Neutral background, realistic hair texture.', portraitExtras),
      },
      t2_after: {
        key: 'transformations/t2_after',
        prompt: wrap('Back view portrait of long champagne blonde balayage + extensions AFTER transformation. Dimensional ribbons, root melt, seamless blend, healthy shine. Neutral background.', portraitExtras),
      },
    },
    gallery: {
      Blonde: [
        { key: 'gallery/blonde_1', prompt: wrap('Back view portrait: icy platinum blonde hair extensions, seamless blend, premium shine, soft movement. Neutral background.', portraitExtras) },
        { key: 'gallery/blonde_2', prompt: wrap('Back view portrait: champagne blonde balayage hair extensions, dimensional ribbons, natural root melt, premium shine. Neutral background.', portraitExtras) },
        { key: 'gallery/blonde_3', prompt: wrap('Back view portrait: warm honey blonde hair extensions, soft waves, seamless blend, premium shine. Neutral background.', portraitExtras) },
      ],
      Volume: [
        { key: 'gallery/volume_1', prompt: wrap('Back view portrait: voluminous hair extensions, thick luxury waves, high density but believable hairline, premium shine. Neutral background.', portraitExtras) },
        { key: 'gallery/volume_2', prompt: wrap('Back view portrait: blowout volume hair extensions, glossy texture, smooth movement, premium finish. Neutral background.', portraitExtras) },
        { key: 'gallery/volume_3', prompt: wrap('Back view portrait: dense hair extensions with editorial waves, seamless blend, premium shine. Neutral background.', portraitExtras) },
      ],
      Length: [
        { key: 'gallery/length_1', prompt: wrap('Back view portrait: extra long hair extensions, sleek glossy finish, seamless blend, healthy ends. Neutral background.', portraitExtras) },
        { key: 'gallery/length_2', prompt: wrap('Back view portrait: very long hair extensions with soft curls, seamless blend, premium shine. Neutral background.', portraitExtras) },
        { key: 'gallery/length_3', prompt: wrap('Back view portrait: mermaid length hair extensions, luxury salon lighting, seamless blend, premium shine. Neutral background.', portraitExtras) },
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

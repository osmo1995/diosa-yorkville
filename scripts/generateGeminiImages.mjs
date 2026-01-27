/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { buildPrompt } from './_geminiPromptQuality.mjs';
import { overlayDiosaWordmark } from './_diosaLogoOverlay.mjs';

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
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1] || null;
console.log(`[mode] ONLY=${ONLY || 'none'} FORCE=${FORCE} MODEL=${MODEL}`);

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
  return readExistingVariants(key);
}

// Read existing variants even if --force is enabled (used for --only modes).
function readExistingVariants(key) {
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

async function writeVariants({ key, prompt, overlayDiosa = false }) {
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

    if (overlayDiosa) {
      // Windows-safe: write a temp file, then overlay into the final output path.
      const tmpPath = path.join(baseDir, `${w}.tmp.webp`);
      await sharp(buf)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toFile(tmpPath);

      await overlayDiosaWordmark({
        inputPath: tmpPath,
        outputPath: outPath,
        logoPath: path.join(PROJECT_ROOT, 'public', 'brand', 'diosa-wordmark.svg'),
        opacity: 0.86,
        scale: 0.14,
        pad: 26,
        gravity: 'southeast',
      });

      // Windows can keep the file handle locked briefly; cleanup is best-effort.
      // Do NOT fail the whole generation if deletion is temporarily blocked.
      // Best-effort cleanup; never throw (Windows can hold locks briefly).
      try {
        for (let attempt = 1; attempt <= 10; attempt++) {
          try {
            fs.unlinkSync(tmpPath);
            break;
          } catch {
            await new Promise((r) => setTimeout(r, 150 * attempt));
          }
        }
      } catch {
        // ignore
      }
    } else {
      await sharp(buf)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toFile(outPath);
    }

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
  const interiorExtras = 'Interior shot: 24–35mm lens look, clean geometry, premium materials, realistic reflections. No readable text.';
  const portraitExtras = 'Portrait shot: 85mm lens look, flattering perspective, natural skin texture, hair fully visible. No tools visible in-frame unless explicitly requested. No readable text.';
  const macroExtras = 'Macro shot: 90–105mm macro look, crisp detail, shallow depth of field. Tools must be method-accurate as specified. No readable text.';

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
        prompt: wrap('Close-up macro photo of tape-in hair extensions being applied by a professional stylist. Clean sectioning, realistic strands, premium salon background blur. Tools MUST be accurate for tape-ins: visible tape-in adhesive tabs, tail comb, sectioning clips, and a flat extension-safe brush. Absolutely NO heat tool, NO keratin bonds, NO beads/micro rings, NO needle/thread.', macroExtras),
        overlayDiosa: true,
      },
      'keratin-bond': {
        key: 'services/keratin-bond',
        prompt: wrap('Close-up macro photo of keratin bond (k-tip) hair extensions application. Precise sectioning, realistic individual keratin bonds. Tools MUST be accurate for keratin bonds: visible keratin heat tool + protective finger shield, sectioning clips, tail comb. Absolutely NO tape tabs, NO beads/micro rings, NO needle/thread.', macroExtras),
        overlayDiosa: true,
      },
      'hand-tied': {
        key: 'services/hand-tied',
        prompt: wrap('Close-up macro photo of hand-tied weft hair extensions installation with beads. Clean parting, realistic strand direction. Tools MUST be accurate for hand-tied wefts: silicone-lined beads/microbeads, curved needle + thread, sectioning clips, tail comb. Absolutely NO tape tabs, NO keratin heat tool.', macroExtras),
        overlayDiosa: true,
      },
      'sew-in': {
        key: 'services/sew-in',
        prompt: wrap('Close-up macro photo of sew-in hair extension technique: stylist hands sewing weft with needle/thread onto a braided foundation. Clean parting, realistic strands, luxury salon background blur. Tools MUST be accurate for sew-in: visible braided track/base, curved needle + thread, weft, sectioning clips, tail comb. Absolutely NO tape tabs, NO keratin heat tool, NO beads/micro rings.', macroExtras),
        overlayDiosa: true,
      },
    },
    transformations: {
      // Highly consistent Results pairs (same scene, clothing, background; only hair changes).
      // These IDs map to data/salonContent.ts transformations r1..r10.
      ...(() => {
        const sceneLock = `SCENE LOCK (must match exactly between BEFORE and AFTER):\n- One adult woman, back-of-head view only (no face).\n- Same salon background: warm beige seamless backdrop, soft shadow falloff, no decor text/logos.\n- Same clothing: matte black silk blouse, simple neckline, no patterns.\n- Same accessories: small gold hoop earrings only.\n- Same camera/framing: 85mm lens look, f/2.8, mid-back crop, centered composition, identical pose.\n- Same lighting: soft key from camera-left, subtle rim light from camera-right.\n- No text, no logos, no watermark.`;

        const baseBefore = (desc) =>
          wrap(
            `Back view salon portrait BEFORE transformation. ${desc}\n\n${sceneLock}\n\nIMPORTANT: Do not change the model identity, clothing, background, lighting, or framing.`,
            portraitExtras
          );

        const baseAfter = (desc) =>
          wrap(
            `Back view salon portrait AFTER transformation. ${desc}\n\n${sceneLock}\n\nIMPORTANT: This is the SAME exact person, pose, background, clothing, lighting, and camera framing as the BEFORE image. Only the hair should change.`,
            portraitExtras
          );

        return {
          r1_before: { key: 'transformations/r1_before', prompt: baseBefore('Natural medium-length brunette hair, slightly thin at ends.') },
          r1_after: { key: 'transformations/r1_after', prompt: baseAfter('Hand-tied extensions: 22-inch length, champagne blonde rooted blend, seamless density, healthy shine, soft waves.') },

          r2_before: { key: 'transformations/r2_before', prompt: baseBefore('Natural shoulder-length dark blonde/light brown hair, fine texture.') },
          r2_after: { key: 'transformations/r2_after', prompt: baseAfter('Tape-in extensions: 18-inch length, beige blonde match with subtle root shadow, silky smooth finish.') },

          r3_before: { key: 'transformations/r3_before', prompt: baseBefore('Natural collarbone-length brunette hair, low density.') },
          r3_after: { key: 'transformations/r3_after', prompt: baseAfter('Keratin bond extensions: 22-inch length, espresso brunette gloss with dimensional lowlights, sleek glossy finish.') },

          r4_before: { key: 'transformations/r4_before', prompt: baseBefore('Natural mid-length warm blonde hair, uneven ends.') },
          r4_after: { key: 'transformations/r4_after', prompt: baseAfter('Invisible sew-in extensions: 24-inch length, warm honey blonde, soft blowout waves, thick but believable.') },

          r5_before: { key: 'transformations/r5_before', prompt: baseBefore('Natural medium-length brunette hair, slightly grown-out roots.') },
          r5_after: { key: 'transformations/r5_after', prompt: baseAfter('Hand-tied extensions: 18-inch length, bronde babylights with root melt, natural lived-in dimension, glossy.') },

          r6_before: { key: 'transformations/r6_before', prompt: baseBefore('Natural dark blonde/light brown hair with slight brassiness.') },
          r6_after: { key: 'transformations/r6_after', prompt: baseAfter('Old money blonde balayage: neutral champagne-beige ribbons, rooted shadow, ultra soft blend, healthy shine.') },

          r7_before: { key: 'transformations/r7_before', prompt: baseBefore('Natural medium brown hair with dull tone and uneven shine.') },
          r7_after: { key: 'transformations/r7_after', prompt: baseAfter('Expensive brunette: glossy multi-dimensional espresso/chocolate tones, subtle highlights, glass-like shine.') },

          r8_before: { key: 'transformations/r8_before', prompt: baseBefore('Natural dark blonde hair with yellow/brassy undertone.') },
          r8_after: { key: 'transformations/r8_after', prompt: baseAfter('Icy platinum blonde (toned): cool silver-pearlescent finish, rooted shadow, salon-smooth texture.') },

          r9_before: { key: 'transformations/r9_before', prompt: baseBefore('Natural light brown hair with warm/orange undertone.') },
          r9_after: { key: 'transformations/r9_after', prompt: baseAfter('Crème brûlée blonde: warm-neutral creamy highlights with caramel ribbons, rooted blend, soft waves.') },

          r10_before: { key: 'transformations/r10_before', prompt: baseBefore('Natural medium brown hair, slightly faded colour.') },
          r10_after: { key: 'transformations/r10_after', prompt: baseAfter('Copper glow: rich salon copper with subtle auburn dimension, glossy finish, healthy texture.') },
        };
      })(),

      // Legacy transformations (kept for backwards compatibility / optional use)
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
  const hero = ONLY ? readExistingVariants(plan.hero.key) : await writeVariants(plan.hero);
  /** @type {any} */
  const cta = ONLY ? readExistingVariants(plan.cta.key) : await writeVariants(plan.cta);
  /** @type {any} */
  const quiz = ONLY ? readExistingVariants(plan.quiz.key) : await writeVariants(plan.quiz);

  const services = {};
  for (const [id, cfg] of Object.entries(plan.services)) {
    try {
      services[id] = ONLY && ONLY !== 'services' ? readExistingVariants(cfg.key) : await writeVariants(cfg);
    } catch (e) {
      console.error(`Failed to generate service ${id}:`, e);
      services[id] = existingVariants(cfg.key) || { src: '', srcSet: '', photographer: 'Generated with Google Gemini', photographerUrl: '', pexelsUrl: '', avgColor: '' };
    }
  }

  const transformations = {};
  for (const [id, cfg] of Object.entries(plan.transformations)) {
    try {
      transformations[id] = ONLY && ONLY !== 'transformations' ? readExistingVariants(cfg.key) : await writeVariants(cfg);
    } catch (e) {
      console.error(`Failed to generate transformation ${id}:`, e);
      transformations[id] = existingVariants(cfg.key) || { src: '', srcSet: '', photographer: 'Generated with Google Gemini', photographerUrl: '', pexelsUrl: '', avgColor: '' };
    }
  }

  const gallery = { Blonde: [], Volume: [], Length: [] };
  for (const cat of Object.keys(plan.gallery)) {
    for (const cfg of plan.gallery[cat]) {
      try {
        gallery[cat].push(ONLY ? readExistingVariants(cfg.key) : await writeVariants(cfg));
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

  // Best-effort cleanup sweep for any lingering temp artifacts.
  try {
    const sweep = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) sweep(p);
        else if (p.endsWith('.tmp.webp') || p.endsWith('.tmp_overlay')) {
          try {
            fs.unlinkSync(p);
          } catch {
            // ignore
          }
        }
      }
    };
    sweep(OUT_DIR);
  } catch {
    // ignore
  }

  fs.writeFileSync(MAP_FILE, out, 'utf8');
  console.log(`Wrote ${path.relative(PROJECT_ROOT, MAP_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

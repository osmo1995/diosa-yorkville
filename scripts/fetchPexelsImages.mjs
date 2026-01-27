/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const OUT_FILE = path.join(PROJECT_ROOT, 'data', 'pexelsImages.ts');

function loadDotEnvLocal() {
  // Lightweight .env.local loader (no dependency) for build-time scripts.
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

const API_KEY = process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY;

const args = new Set(process.argv.slice(2));
const FORCE_REFRESH = args.has('--refresh');

if (!API_KEY) {
  console.error('Missing PEXELS_API_KEY (recommended) or VITE_PEXELS_API_KEY in env (and not found in .env.local).');
  process.exit(1);
}

// Prevent confusing 401s + Windows undici/libuv issues when placeholder values are used.
if (API_KEY.includes('YOUR_PEXELS_API_KEY')) {
  console.error('PEXELS_API_KEY is set to a placeholder. Please set a valid key in .env.local and re-run.');
  process.exit(1);
}

/**
 * @typedef {{
 *  id: number;
 *  width: number;
 *  height: number;
 *  url: string;
 *  photographer: string;
 *  photographer_url: string;
 *  avg_color: string;
 *  src: {
 *    original: string;
 *    large2x: string;
 *    large: string;
 *    medium: string;
 *    small: string;
 *    portrait: string;
 *    landscape: string;
 *    tiny: string;
 *  }
 * }} PexelsPhoto
 */

/**
 * @param {string} q
 * @param {{ orientation?: 'landscape'|'portrait'|'square', perPage?: number }} opts
 */
const CACHE_DIR = path.join(PROJECT_ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'pexels-search-cache.json');

/** @type {Record<string, any>} */
let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {
  cache = {};
}

function cacheKey(q, opts) {
  return JSON.stringify({ q, ...opts });
}

async function fetchWithRetry(url, init, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      if (attempt === retries) return res;
      const wait = 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
}

async function searchPexels(q, opts = {}) {
  const key = cacheKey(q, opts);
  if (cache[key]) return cache[key];

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', q);
  url.searchParams.set('per_page', String(opts.perPage ?? 8));
  if (opts.orientation) url.searchParams.set('orientation', opts.orientation);

  const res = await fetchWithRetry(url.toString(), {
    headers: {
      Authorization: API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pexels API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const photos = /** @type {{ photos: PexelsPhoto[] }} */ (json).photos || [];

  cache[key] = photos;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  return photos;
}

async function getPhotoById(photoId) {
  const key = `photo:${photoId}`;
  if (cache[key]) return cache[key];

  const res = await fetchWithRetry(`https://api.pexels.com/v1/photos/${photoId}`, {
    headers: {
      Authorization: API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pexels API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  cache[key] = json;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  return json;
}

/**
 * Create a conservative srcSet from Pexels provided sizes.
 * Pexels URLs already encode a size; we still declare widths for browser selection.
 * @param {PexelsPhoto} p
 */
function toImageAsset(p) {
  // Heuristic widths for Pexels variants. Not perfect, but good enough for responsive selection.
  const srcSet = [
    `${p.src.small} 400w`,
    `${p.src.medium} 700w`,
    `${p.src.large} 1000w`,
    `${p.src.large2x} 2000w`,
  ].join(', ');

  return {
    photoId: p.id,
    src: p.src.large,
    srcSet,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    pexelsUrl: p.url,
    avgColor: p.avg_color,
  };
}

function extractPhotoIdFromPexelsUrl(pexelsUrl) {
  const m = /-(\d+)\/?$/.exec(pexelsUrl || '');
  return m ? Number(m[1]) : undefined;
}

async function loadExistingSelections() {
  if (!fs.existsSync(OUT_FILE)) return null;
  try {
    // Dynamic import of generated TS module works under Node ESM.
    const mod = await import(`file://${OUT_FILE.replace(/\\/g, '/')}`);
    return mod?.pexelsImages || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} hex
 */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/**
 * @param {{r:number,g:number,b:number}} rgb
 */
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

/**
 * @param {{r:number,g:number,b:number}} a
 * @param {{r:number,g:number,b:number}} b
 */
function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

const LUXURY_PALETTE = ['#C9A861', '#F4EBE6', '#FAF8F5', '#2B2B2B'].map(hexToRgb);

/**
 * Score a candidate photo for a given intent.
 * @param {PexelsPhoto & { alt?: string }} p
 * @param {'hero'|'cta'|'quiz'|'service'|'result'} intent
 */
function scorePhoto(p, intent) {
  const avg = hexToRgb(p.avg_color || '#000000');
  const nearest = Math.min(...LUXURY_PALETTE.map((c) => colorDistance(avg, c)));

  const { s } = rgbToHsl(avg);

  // Lower distance to palette is better; lower saturation tends to read more "luxury".
  let score = 100;
  score -= nearest / 6; // typical range ~0-150 => subtract up to ~25
  score -= s * 35; // reduce very saturated imagery

  // Prefer higher resolution.
  score += Math.min(p.width, p.height) / 500;

  const text = `${p.alt || ''} ${p.url || ''}`.toLowerCase();

  if (intent === 'result') {
    // Prefer back-view hair result shots.
    if (text.includes('back')) score += 10;
    if (text.includes('behind')) score += 6;
    if (text.includes('hair')) score += 4;
    if (text.includes('extensions')) score += 4;
    if (text.includes('salon')) score += 2;
    if (text.includes('portrait')) score -= 3;
    if (text.includes('face')) score -= 6;
  }

  if (intent === 'hero' || intent === 'cta') {
    if (text.includes('salon')) score += 8;
    if (text.includes('interior')) score += 6;
    if (text.includes('luxury')) score += 4;
  }

  if (intent === 'quiz' || intent === 'service') {
    if (text.includes('stylist') || text.includes('hairdresser')) score += 6;
    if (text.includes('hands')) score += 4;
    if (text.includes('close')) score += 2;
  }

  return score;
}

/**
 * @param {PexelsPhoto[]} photos
 * @param {'hero'|'cta'|'quiz'|'service'|'result'} intent
 */
function pickBest(photos, intent) {
  let best = null;
  let bestScore = -Infinity;

  for (const p of photos) {
    const s = scorePhoto(p, intent);
    if (s > bestScore) {
      best = p;
      bestScore = s;
    }
  }

  return best;
}

async function searchBest(queries, opts, intent) {
  /** @type {PexelsPhoto[]} */
  const all = [];
  for (const q of queries) {
    const photos = await searchPexels(q, opts);
    all.push(...photos);
  }
  return pickBest(all, intent);
}

const queries = {
  hero: {
    queries: [
      'luxury hair salon interior gold beige elegant',
      'high end salon interior warm neutral',
      'luxury beauty studio interior champagne gold',
    ],
    orientation: 'landscape',
    intent: 'hero',
  },
  cta: {
    queries: [
      'luxury hair salon styling glamorous woman back view',
      'long hair glossy back view luxury',
      'beauty editorial hair back view warm tones',
    ],
    orientation: 'landscape',
    intent: 'cta',
  },
  quiz: {
    queries: [
      'hair extensions consultation stylist hands luxury',
      'salon consultation hair extensions',
      'hairdresser consultation premium salon',
    ],
    orientation: 'landscape',
    intent: 'quiz',
  },
  services: {
    'tape-in': {
      queries: [
        'tape in hair extensions close up hair stylist',
        'tape-in hair extension installation',
        'hair extensions seamless blend salon',
      ],
      orientation: 'portrait',
      intent: 'service',
    },
    'keratin-bond': {
      queries: [
        'keratin bond hair extensions k tips close up',
        'k tip hair extensions installation',
        'fusion hair extensions stylist',
      ],
      orientation: 'portrait',
      intent: 'service',
    },
    'hand-tied': {
      queries: [
        'hand tied weft hair extensions salon stylist',
        'weft hair extensions beads installation',
        'hand-tied weft hair extension',
      ],
      orientation: 'portrait',
      intent: 'service',
    },
    'sew-in': {
      queries: [
        'sew in hair extensions stylist weaving hair',
        'weave hair extensions salon',
        'weft hair extensions sewn in',
      ],
      orientation: 'portrait',
      intent: 'service',
    },
  },
  transformations: {
    t1_before: {
      queries: ['natural hair back view brunette medium length', 'brunette hair back view natural'],
      orientation: 'square',
      intent: 'result',
    },
    t1_after: {
      queries: ['long hair extensions back view glossy brunette', 'hair extensions results back view brunette'],
      orientation: 'square',
      intent: 'result',
    },
    t2_before: {
      queries: ['hair before balayage back view', 'hair before color back view'],
      orientation: 'square',
      intent: 'result',
    },
    t2_after: {
      queries: ['balayage blonde long hair extensions back view', 'blonde hair extensions results back view'],
      orientation: 'square',
      intent: 'result',
    },
  },
  gallery: {
    Blonde: {
      queries: ['balayage blonde long hair luxury salon', 'platinum blonde long hair back view', 'champagne blonde hair extensions'],
      orientation: 'portrait',
      intent: 'result',
    },
    Volume: {
      queries: ['voluminous hair extensions waves back view', 'thick hair waves back view', 'blowout volume hair back view'],
      orientation: 'portrait',
      intent: 'result',
    },
    Length: {
      queries: ['very long hair extensions glossy', 'extra long hair back view glossy', 'long hair extensions results back view'],
      orientation: 'portrait',
      intent: 'result',
    },
  },
};

async function main() {
  console.log(`Fetching curated Pexels images… ${FORCE_REFRESH ? '(refresh)' : '(stable)'}`);

  const existing = FORCE_REFRESH ? null : await loadExistingSelections();

  async function resolveOrSearch(existingAsset, searchQueries, opts, intent) {
    const photoId = existingAsset?.photoId || extractPhotoIdFromPexelsUrl(existingAsset?.pexelsUrl);
    if (!FORCE_REFRESH && photoId) {
      try {
        const p = await getPhotoById(photoId);
        return p;
      } catch {
        // fall through to search
      }
    }
    return await searchBest(searchQueries, opts, intent);
  }

  const hero = await resolveOrSearch(existing?.hero, queries.hero.queries, { orientation: queries.hero.orientation, perPage: 18 }, queries.hero.intent);
  const cta = await resolveOrSearch(existing?.cta, queries.cta.queries, { orientation: queries.cta.orientation, perPage: 18 }, queries.cta.intent);
  const quiz = await resolveOrSearch(existing?.quiz, queries.quiz.queries, { orientation: queries.quiz.orientation, perPage: 18 }, queries.quiz.intent);

  if (!hero || !cta || !quiz) throw new Error('Failed to find hero/cta/quiz images. Try adjusting queries.');

  const services = {};
  for (const [id, q] of Object.entries(queries.services)) {
    const existingAsset = existing?.services?.[id];
    const best = await resolveOrSearch(existingAsset, q.queries, { orientation: q.orientation, perPage: 18 }, q.intent);
    if (!best) throw new Error(`Failed to find service image for ${id}`);
    services[id] = toImageAsset(best);
  }

  const transformations = {};
  for (const [key, q] of Object.entries(queries.transformations)) {
    const existingAsset = existing?.transformations?.[key];
    const best = await resolveOrSearch(existingAsset, q.queries, { orientation: q.orientation, perPage: 18 }, q.intent);
    if (!best) throw new Error(`Failed to find transformation image for ${key}`);
    transformations[key] = toImageAsset(best);
  }

  // For each category, pull a small set for the gallery.
  const gallery = {};
  for (const [cat, q] of Object.entries(queries.gallery)) {
    const existingCat = existing?.gallery?.[cat] || [];

    // Reuse existing picks first (stable), then fill with top scored candidates.
    const reused = [];
    const seen = new Set();

    if (!FORCE_REFRESH) {
      for (const a of existingCat) {
        const photoId = a?.photoId || extractPhotoIdFromPexelsUrl(a?.pexelsUrl);
        if (!photoId || seen.has(photoId)) continue;
        try {
          const p = await getPhotoById(photoId);
          reused.push(p);
          seen.add(photoId);
        } catch {
          // ignore and refill from search
        }
        if (reused.length >= 9) break;
      }
    }

    /** @type {PexelsPhoto[]} */
    const all = [];
    for (const query of q.queries) {
      const photos = await searchPexels(query, { orientation: q.orientation, perPage: 24 });
      all.push(...photos);
    }
    if (!all.length && reused.length === 0) throw new Error(`Failed to find gallery images for ${cat}`);

    const sorted = all
      .filter((p) => !seen.has(p.id))
      .map((p) => ({ p, s: scorePhoto(p, q.intent) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);

    const filled = [...reused];
    for (const p of sorted) {
      if (filled.length >= 9) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      filled.push(p);
    }

    gallery[cat] = filled.map(toImageAsset);
  }

  const out = `// This file is generated by scripts/fetchPexelsImages.mjs
// Do not edit manually.

import type { ImageAsset, PexelsImageMap } from '../types';

export const pexelsImages: PexelsImageMap = ${JSON.stringify(
    {
      hero: toImageAsset(hero),
      cta: toImageAsset(cta),
      quiz: toImageAsset(quiz),
      services,
      transformations,
      gallery,
    },
    null,
    2
  )} as const;

export type { ImageAsset };
`;

  fs.writeFileSync(OUT_FILE, out, 'utf8');
  console.log(`Wrote ${path.relative(PROJECT_ROOT, OUT_FILE)}`);
}

main().catch((e) => {
  // On Windows/Node+undici, immediate process.exit after a failed fetch can occasionally
  // trigger a libuv assertion. Give the event loop a tick to settle.
  console.error(e);
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 25);
});

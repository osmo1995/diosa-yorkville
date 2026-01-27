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

const OUT_PATH = path.join(PROJECT_ROOT, 'public', 'brand', 'diosa-wordmark.png');

async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
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
  if (!inline) throw new Error('No inlineData returned');

  return Buffer.from(inline.inlineData.data, 'base64');
}

async function main() {
  if (fs.existsSync(OUT_PATH) && !FORCE) {
    console.log(`Logo exists (use --force to regenerate): ${path.relative(PROJECT_ROOT, OUT_PATH)}`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  // We use the quality wrapper but override with ultra-strict typography constraints.
  const wordmarkPrompt = buildPrompt(
    'Generate a clean luxury wordmark logo that reads exactly: DIOSA. All caps. No other words. Transparent background. Elegant high-fashion serif wordmark, premium kerning, crisp edges, perfectly centered. Color: metallic gold #C9A861. Flat (no bevel), no gradients, no shadows. No watermark. No extra marks.',
    'Logo design: vector-like, crisp typography, high resolution, transparent background, no additional text.'
  );

  let buf;
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Generating DIOSA logo (attempt ${attempt}/5)…`);
      buf = await generateImage(wordmarkPrompt);
      break;
    } catch (e) {
      lastErr = e;
      if (attempt === 5) throw lastErr;
    }
  }

  // Normalize: trim, ensure alpha, upscale to high-res, save as PNG.
  const png = await sharp(buf)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .resize({ width: 4000, withoutEnlargement: false })
    .png()
    .toBuffer();

  fs.writeFileSync(OUT_PATH, png);
  console.log(`Wrote: ${path.relative(PROJECT_ROOT, OUT_PATH)}`);
  console.log('Manual QA: open the PNG and verify DIOSA is spelled correctly and background is transparent.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

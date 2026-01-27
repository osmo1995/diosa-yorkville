/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

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
if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

async function main() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Model list failed ${res.status}: ${text}`);
  }
  const json = await res.json();
  const models = json.models || [];

  const simplified = models.map((m) => ({
    name: m.name,
    displayName: m.displayName,
    description: m.description,
    supportedGenerationMethods: m.supportedGenerationMethods,
    inputTokenLimit: m.inputTokenLimit,
    outputTokenLimit: m.outputTokenLimit,
  }));

  // Show likely image-capable models
  const imageish = simplified.filter((m) => {
    const n = (m.name || '').toLowerCase();
    const d = (m.displayName || '').toLowerCase();
    return n.includes('imagen') || d.includes('imagen') || n.includes('image') || d.includes('image');
  });

  console.log('--- Image-related models (heuristic) ---');
  console.log(JSON.stringify(imageish, null, 2));

  if (process.argv.includes('--all')) {
    console.log('--- All models ---');
    console.log(JSON.stringify(simplified, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

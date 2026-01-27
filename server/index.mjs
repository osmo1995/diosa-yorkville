/* eslint-disable no-console */
import express from 'express';
import formidable from 'formidable';

// Local dev-only API server. Keeps GEMINI_API_KEY off the client.
// Vite proxies /api -> http://localhost:8787.

const app = express();

// Basic CORS allowlist (optional). Set ALLOWED_ORIGINS to comma-separated list.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function requireKey() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in environment (.env.local)');
  }
}

function getModel() {
  return process.env.GEMINI_IMAGE_MODEL || 'models/gemini-3-pro-image-preview';
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

async function parseMultipart(req) {
  const form = formidable({ multiples: false, maxFileSize: 6 * 1024 * 1024 });
  const [fieldsRaw, filesRaw] = await form.parse(req);

  const fields = {};
  for (const [k, v] of Object.entries(fieldsRaw)) {
    fields[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
  }

  const image = filesRaw?.image;
  const f = Array.isArray(image) ? image[0] : image;

  if (!f?.filepath) return { fields, file: null };

  return {
    fields,
    file: {
      buffer: await import('node:fs').then((fs) => fs.readFileSync(f.filepath)),
      mimetype: String(f.mimetype || 'application/octet-stream'),
      originalFilename: String(f.originalFilename || ''),
    },
  };
}

function guessMime(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

app.post('/api/style', async (req, res) => {
  try {
    requireKey();

    const { fields, file } = await parseMultipart(req);

    const styleId = String(fields.styleId || 'signature-blowout');
    const intensity = Number(fields.intensity || 0.6);

    if (!file?.buffer) {
      return res.status(400).json({ error: 'Missing image upload (field name: image).' });
    }

    const inferred = guessMime(file.originalFilename);
    const mime = inferred || file.mimetype;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      return res.status(400).json({ error: 'Unsupported image format. Please upload a JPG/PNG/WebP headshot.' });
    }

    const presets = {
      'signature-blowout': {
        name: 'Signature Blowout',
        prompt:
          "Maintain the subject's identity. Apply a premium Yorkville salon finish: clean blowout with soft movement, glossy healthy shine, natural volume at roots. No makeup changes. No background changes.",
      },
    };

    const preset = presets[styleId] || presets['signature-blowout'];

    const model = getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an expert hair stylist and retoucher. Edit the uploaded headshot to preview this hairstyle. ${preset.prompt}\n\nConstraints:\n- Photorealistic.\n- Preserve face identity.\n- Preserve lighting and background.\n- No text or logos.\n- Keep changes focused on hair only.\n- Intensity: ${intensity} (0-1).`,
            },
            {
              inlineData: {
                mimeType: mime,
                data: file.buffer.toString('base64'),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.4,
      },
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({ error: `Gemini error: ${text}` });
    }

    const json = await apiRes.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const inline = parts.find((p) => p.inlineData?.data);

    if (!inline) {
      return res.status(500).json({ error: 'No image returned by Gemini.' });
    }

    const outMime = inline.inlineData.mimeType || 'image/png';
    const base64 = inline.inlineData.data;

    res.json({ styleId, styleName: preset.name, mimeType: outMime, imageBase64: base64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Server error' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[dev-api] Style API listening on http://localhost:${port}`);
});

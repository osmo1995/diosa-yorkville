import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

export async function overlayDiosaWordmark(params) {
  const {
    inputPath,
    outputPath = inputPath,
    logoPath,
    width,
    height,
    opacity = 0.78,
    // bottom-right default
    gravity = 'southeast',
    pad = 24,
    scale = 0.16,
  } = params;

  // Prefer a deterministic PNG wordmark if present to avoid font rendering differences.
  const pngFallback = logoPath?.endsWith('.svg')
    ? logoPath.replace(/\.svg$/i, '.png')
    : null;

  const resolvedLogo =
    (pngFallback && fs.existsSync(pngFallback) ? pngFallback : null) ||
    (logoPath && fs.existsSync(logoPath) ? logoPath : null);

  if (!resolvedLogo) {
    throw new Error(`Logo file not found: ${logoPath}`);
  }

  const base = sharp(inputPath);
  const meta = await base.metadata();

  const w = width || meta.width || 1000;
  const h = height || meta.height || 1000;

  const logoTargetW = Math.round(w * scale);

  const logoBuf = await sharp(resolvedLogo)
    .resize({ width: logoTargetW })
    .png()
    .toBuffer();

  // Apply opacity by alpha channel multiplication.
  const logoWithAlpha = await sharp(logoBuf)
    .ensureAlpha()
    .linear(1, 0)
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns='http://www.w3.org/2000/svg' width='${logoTargetW}' height='${Math.round(logoTargetW * 0.35)}'>
            <rect width='100%' height='100%' fill='rgba(0,0,0,${1 - opacity})'/>
          </svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  // Place logo with padding: we create a transparent canvas and composite with gravity.
  const paddedLogo = await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: logoWithAlpha,
        gravity,
        top: gravity.includes('north') ? pad : undefined,
        left: gravity.includes('west') ? pad : undefined,
      },
    ])
    .png()
    .toBuffer();

  const samePath = path.resolve(outputPath) === path.resolve(inputPath);
  const tmpOut = samePath ? `${outputPath}.tmp_overlay` : outputPath;

  await sharp(inputPath)
    .composite([
      {
        input: paddedLogo,
        blend: 'over',
      },
    ])
    .webp({ quality: 84 })
    .toFile(tmpOut);

  if (samePath) {
    // Windows can block rename-over-existing; copy+unlink is more reliable.
    // Overwrite the destination in-place.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        fs.copyFileSync(tmpOut, outputPath);
        fs.unlinkSync(tmpOut);
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        // brief backoff
        await new Promise((r) => setTimeout(r, 50 * attempt));
      }
    }
  }
}

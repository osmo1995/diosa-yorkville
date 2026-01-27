export const QUALITY_PREFIX = `
8K ultra-photorealistic, high-end luxury editorial photography.
Camera: full-frame DSLR, 85mm portrait lens (or 35mm for interiors), f/2.0, ISO 100, shallow depth of field.
Lighting: soft diffused studio lighting, natural skin tones, realistic highlights, no harsh shadows.
Hair: ultra-realistic hair strands, natural flyaways, believable shine, no plastic/wig look.
Composition: clean premium framing, subject centered, no cropping of hair, no warped anatomy.
Color grade: warm champagne + gold tones, premium Yorkville/Toronto luxury aesthetic.
Output constraints: photorealistic only.
`;

export const NEGATIVE_PROMPT = `
Avoid: text, captions, watermarks, logos, UI, frames.
Exception: allow only the single word "DIOSA" as subtle equipment branding (e.g., on a brush, mirror, hair clip case, or tool bag). No other text.
Avoid: cartoon, CGI, 3D render, illustration, anime.
Avoid: distorted faces, deformed hands, extra fingers, warped anatomy.
Avoid: unnatural skin texture, over-smoothed skin, plastic skin.
Avoid: blurry focus, low-res, compression artifacts, banding.
Avoid: odd hairlines, melted hair, duplicated hair, hair tangles that look fake.
Avoid: background glitches, duplicated objects, floating elements.
`;

export function buildPrompt(userPrompt, extras = '') {
  return `${QUALITY_PREFIX}\n${extras}\nPROMPT:\n${userPrompt}\n\nNEGATIVE:\n${NEGATIVE_PROMPT}`.trim();
}

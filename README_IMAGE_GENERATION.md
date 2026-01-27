# Image Generation Guide

## Current Status

- **Site improvements**: ✅ Deployed to production (https://diosa-yorkville.vercel.app)
- **Popular-only preview generation**: ⏳ Blocked by API quota limits
  - Target: 72 images (4 presets × 6 colors × 3 lengths)
  - Generated: 11/72 (champagne, beige, ash at 18/22/24 lengths for Natural Blend)
  - Remaining: 61 images

## Why Generation is Blocked

1. **Gemini API**: Daily quota exhausted (limit: 0 requests/day for image generation)
2. **HuggingFace Inference API**: Completely deprecated (returns 410)

## How to Complete Generation

### Option 1: Wait for Gemini Quota Reset (Free)

Wait ~24 hours for the daily quota to reset, then run:

```bash
node scripts/generateStylePreviews.mjs --category=extensions --force \
  --presets=extensions-natural-blend,extensions-volume-set,extensions-length-set,extensions-soft-waves \
  --colors=old-money,champagne,beige,ash,honey,espresso \
  --lengths=18,22,24
```

### Option 2: Enable Gemini Billing (Immediate)

1. Visit https://aistudio.google.com/app/apikey
2. Check the project associated with your `GEMINI_API_KEY`
3. Enable billing or increase quota for image generation
4. Run the command from Option 1

Cost estimate: ~$7-20 for 72 images (depends on your per-image rate)

### Option 3: Use HuggingFace (When Available)

If you have access to HuggingFace's paid Inference Endpoints or Serverless API:

```bash
export HF_TOKEN=your_token_here
node scripts/generateStylePreviews.mjs --provider=hf --category=extensions --force \
  --presets=extensions-natural-blend,extensions-volume-set,extensions-length-set,extensions-soft-waves \
  --colors=old-money,champagne,beige,ash,honey,espresso \
  --lengths=18,22,24
```

**Note**: The free HF Inference API has been deprecated. You'll need a paid endpoint.

## After Generation Completes

1. Verify images were created:
   ```bash
   ls -R public/generated/style-previews/extensions
   ```

2. Commit the generated assets:
   ```bash
   git add public/generated/style-previews data/stylePreviews.ts
   git commit -m "Add popular-only style preview variants (72 images)"
   git push origin main
   ```

3. Deploy to Vercel:
   ```bash
   vercel deploy --prod
   ```

## CLI Reference

```bash
# Generate with Gemini (default)
node scripts/generateStylePreviews.mjs --category=extensions --force \
  --presets=<preset1,preset2,...> \
  --colors=<color1,color2,...> \
  --lengths=<14,18,22,24>

# Generate with HuggingFace
node scripts/generateStylePreviews.mjs --provider=hf --category=extensions --force \
  --model=black-forest-labs/FLUX.1-dev \
  --presets=<preset1,preset2,...> \
  --colors=<color1,color2,...> \
  --lengths=<14,18,22,24>

# Dry run (no API calls, just shows what would be generated)
node scripts/generateStylePreviews.mjs --dry-run --category=extensions \
  --presets=extensions-natural-blend \
  --colors=champagne,beige \
  --lengths=18,22
```

## What's Already Done

✅ All site content/copy improvements deployed  
✅ CLI filters working (--presets/--colors/--lengths)  
✅ HuggingFace provider support added  
✅ Git commit + Vercel production deploy completed  
✅ 11 preview variants generated (partial set)

📋 **Next step**: Enable Gemini quota or wait 24h, then complete the remaining 61 images.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

## Deploy on Vercel (Vite + Secure Gemini API)

This project is configured to deploy to Vercel as:
- a **static Vite site** (`dist/`)
- plus **Serverless Functions** for the Gemini proxy under `/api/*`

### Vercel Project Settings
- Build Command: `npm run build`
- Output Directory: `dist`

### Environment Variables (Vercel)
Set these in **Vercel → Project → Settings → Environment Variables**:
- `GEMINI_API_KEY` (required)
- `GEMINI_IMAGE_MODEL` (optional; defaults to `models/gemini-3-pro-image-preview`)
- `GEMINI_TEXT_MODEL` (optional; defaults to `models/gemini-2.0-flash`) — used by `/api/concierge` and `/api/recommend` (set to a Gemini 3.x text model if available)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — required for `/api/lead`
- `LEAD_TO` (required), `LEAD_FROM` (optional) — destination + sender for `/api/lead`
- `BACKGROUND_REMOVAL_ENABLED` (optional; defaults to `true`) — removes background before hairstyle generation
- `BACKGROUND_REMOVAL_MODEL` (optional; defaults to `GEMINI_IMAGE_MODEL`) — model override for background removal step
- `GEMINI_TIMEOUT_MS` (optional; defaults to `45000`) — per-request timeout for Gemini calls
- `MAX_UPLOAD_BYTES` (optional; defaults to `6291456`) — upload cap
- `ALLOWED_ORIGINS` (optional; comma-separated allowlist for CORS)
- `EXPOSE_API_ERRORS` (optional; defaults to `false`) — include upstream error details in responses (debug only)
- `RATE_LIMIT_MAX` (optional; default `0` disabled) — best-effort per-instance rate limit max requests/window (applies to AI endpoints)
- `RATE_LIMIT_WINDOW_MS` (optional; default `60000`) — rate limit window duration

### Endpoints
- `GET /api/health` → `{ ok: true }`
- `POST /api/style` → multipart/form-data with field `image` (JPG/PNG/WebP)
- `POST /api/concierge` → JSON `{ message, context? }` → returns `{ reply, quickReplies, nextSteps }`
- `POST /api/recommend` → JSON `{ goal, desiredLook?, maintenanceTolerance?, timeline?, hairHistory? }` → returns structured consult notes
- `POST /api/lead` → JSON `{ name, email, phone, message?, context?, consent:true }` → emails your team (requires SMTP env vars)

### Analytics placeholder events
This app emits a browser event you can wire to GA4/Segment/PostHog later:
- Event name: `diosa_analytics`
- Payload: `{ name: string, ts: number, props?: object }`

Example listener:
```js
window.addEventListener('diosa_analytics', (e) => console.log(e.detail));
```

### AI Concierge Widget (site-wide)
A floating AI concierge widget appears site-wide (lazy-loaded after idle) to help visitors choose between extensions vs colour, understand maintenance, and route to booking. Conversation state is stored locally in the browser (localStorage) and is not sent anywhere except the message you submit to `/api/concierge`.

  Required fields:
  - `styleId`
  - `category` (`extensions` | `color`)
  - `intensity` (0–1)

  Extensions-only optional fields (used when `category=extensions`):
  - `extLength` (`subtle` | `medium` | `major`)
  - `extDensity` (`natural` | `full` | `glam`)
  - `extFinish` (`straight` | `soft-waves` | `glam-waves`)

  Colour-only optional fields (used when `category=color`):
  - `colorTone` (`cool` | `neutral` | `warm`)
  - `colorBrightness` (`minimal` | `moderate`)
  - `colorDimension` (`subtle` | `medium` | `bold`)
  - `colorRoot` (`keep-natural` | `root-melt`)

  Note: Categories are enforced server-side. Extensions presets do not change colour; colour presets do not add length/density.

### Background removal (server-side)
Before generating the hairstyle, the API first creates a transparent-background cutout of the subject (no storage; in-memory only) and uses it as a segmentation guide. This typically improves hair isolation and reduces background artifacts.

Note: This is a **two-call** Gemini pipeline, so it increases latency/cost versus a single generation step.

Security notes:
- Do **not** expose `GEMINI_API_KEY` in Vite config or client code.
- Keep uploads in-memory only (current behavior). Avoid logging request bodies.
- Consider adding rate limiting in production (per-IP) and keep the upload size cap.

Local dev note:
- You can still run the Express API locally via `npm run dev:api` (listens on `8787`) and the Vite app via `npm run dev`.
- On Vercel, the Express server is not used; `/api/*` is handled by the functions in `api/`.


**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Recommended) Generate photorealistic brand imagery with Google AI Studio (Gemini Image Generation):
   - Ensure `GEMINI_API_KEY` is set in `.env.local`
   - Run: `npm run gemini:images`
   This writes images into `public/generated/` and a mapping file `data/generatedImages.ts`.

3. Generate Style Generator preset thumbnails (Gemini 3 Pro Image):
   These are **photorealistic example outcomes** used as thumbnails in the preset list (not user photos).

   - Ensure `GEMINI_API_KEY` is set in `.env.local`
   - Run (full generation):
     `npm run gemini:style-previews:3pro:force`

   Output:
   - Images: `public/generated/style-previews/<presetId>/{400,700,1000,2000}.webp`
   - Mapping: `data/stylePreviews.ts`

   Useful flags:
   - `--preset=<id>` generate only one preset
   - `--limit=<n>` generate only first N presets
   - `--dry-run` show what would be generated

   Workflow (recommended):
   - Run generation locally
   - Commit the generated images + `data/stylePreviews.ts` so Vercel serves thumbnails instantly

   Note: thumbnails are generated as centered square crops for consistent left-side preset cards.

   UX pattern rationale (common in virtual try-on tools):
   - Upload photo → choose a look from thumbnail presets → generate preview → save/share and bring to your stylist

4. Run the app:
   `npm run dev`

   To inspect available image-capable models for your key:
   `npm run gemini:models`

   **Security note:** Never commit real API keys. Keep `.env.local` local-only (this repo ignores `*.local`).
4. Run the app:
   `npm run dev`

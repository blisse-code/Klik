<div align="center">

# Klik

**AI camera that transforms your photos through a configurable chain of image models — with a WebGL filter pipeline so it never goes dark, even without an API key.**

</div>

Klik is a mobile-first web app that captures (or uploads) a photo and re-renders it in the style of your choice — picking from style mode, aesthetic, color grade, camera simulation, texture, ambience, and resolution. Instead of locking you to a single vendor, Klik walks a user-defined **provider chain** (foundation models first, open-source next, local filters last), so generation degrades gracefully when keys run out or quotas hit.

## Provider chain

Each user configures any combination of providers in Settings and sets their priority. On every generation, the server walks the chain top-to-bottom and returns the first success.

| Tier | Provider | Notes |
|------|----------|-------|
| Foundation | **Google Gemini** | Tries `gemini-2.5-flash-image-preview` (free) first, then `gemini-3-pro-image-preview` (paid) inside the adapter |
| Foundation | **OpenAI gpt-image-1** | Image-to-image via `/v1/images/edits`, paid tier |
| Foundation | **xAI Grok** (`grok-2-image`) | Text-to-image — the captured photo informs the prompt but isn't directly transformed |
| Open source | **fal.ai Flux** | `flux/dev/image-to-image`, pay-per-second |
| Local | **WebGL filter pipeline** | Runs in the browser. No key, no network, no AI — always available as the floor of the chain |

Failures classified as retryable (auth, quota, 5xx, network) fall through; bad-request errors stop the chain. If every API provider fails, the client runs the WebGL pipeline so the user still gets an image.

## Features

- Capture from device camera (front/back) or upload
- 7-axis style controls: style mode, aesthetic, color grade, camera sim, texture, ambience, resolution
- Configurable provider chain with drag-to-reorder priority and per-provider key storage
- Always-available WebGL filter fallback — works with **zero API keys**
- Output shows which provider rendered the result
- Before/after slider, one-tap download
- Email + password auth via Supabase, per-user encrypted key storage

## Tech stack

- React 19 + TypeScript + Vite, Tailwind CSS 4, Motion, Lucide
- Express dev server + Vercel serverless function (`/api/transform`) — same chain logic on both
- Supabase (auth + Postgres + RLS); keys stored in a `profiles.provider_keys` jsonb column
- WebGL2 (two-pass shader pipeline) + Canvas2D (frame overlays) for the local fallback
- Provider SDKs: `@google/genai`, plus raw `fetch` for OpenAI / xAI / fal.ai

## Setup

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In **Authentication → Providers**, enable **Email**. (Disable "Confirm email" for the fastest dev experience, or keep it on for production.)
3. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `profiles` table (with `provider_keys` jsonb and `provider_order` jsonb), the auto-insert trigger on signup, RLS policies, and the explicit grants that keep each user's data private to them. Safe to re-run on existing projects — the migration block backfills any legacy `gemini_api_key` column into the new structure.
4. In **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client)

### 2. Configure environment

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-public-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Klik does **not** use a global provider key — each registered user pastes their own keys in Settings. Per-provider key sources:

- Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- xAI: [console.x.ai](https://console.x.ai)
- fal.ai: [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)

If a user adds no keys at all, the local WebGL pipeline still runs — sign-up still works, capture still works, the editor still works.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. User signs up / signs in (Supabase email auth).
2. A row is auto-created in `public.profiles` via trigger, with an empty `provider_keys` object and the default chain order.
3. User opens Settings, pastes one or more provider keys, and reorders the chain. Both `provider_keys` and `provider_order` are saved to their `profiles` row (RLS allows only the owner to read/write).
4. On generate, the client POSTs to `/api/transform` with the Supabase JWT in `Authorization: Bearer …`.
5. The server verifies the JWT with the service-role client, loads the user's chain config, and walks it top-to-bottom. First adapter that returns an image wins; the response includes `provider: "<id>"` so the client can show which provider rendered the output.
6. If every server-side provider fails (or the user has no keys at all), the response includes `shouldFallbackLocal: true` and the client runs the WebGL pipeline on the captured photo in the browser.

## Local filter pipeline

The fallback is **not** a generic Instagram filter — it's a 7-axis interpretation of the same `ImageParams` the prompt builder produces. Lookup tables in [`src/lib/filters/mapping.ts`](src/lib/filters/mapping.ts) translate each option (colour grade, ambience, aesthetic, filter texture, camera type) into numeric shader uniforms, then [`pipeline.ts`](src/lib/filters/pipeline.ts) runs:

1. **Tone shader** — exposure, contrast, saturation, white balance, split-toning, monochrome blend
2. **Texture shader** — halation bloom, radial vignette, film grain
3. **Frame overlay** (Canvas2D) — polaroid border, 35mm sprocket strip, or disposable-camera date stamp depending on selected camera type

So "Teal and orange + Cinematic + 35mm film camera + Golden hour" produces a noticeably warm split-tone with vignette, grain, and sprocket-strip framing — without ever hitting the network.

Adding a new option is one line in the lookup table. Adding a new effect is one shader file + one uniform.

## Adding a provider

1. Implement a `(input) => output` adapter in [`api/providers.ts`](api/providers.ts). Throw `ProviderError(message, status, retryable)` so the chain executor knows whether to fall through.
2. Add the provider's metadata to `PROVIDERS` in [`src/lib/providers.ts`](src/lib/providers.ts) and its id to `ProviderId`.
3. Add the id to `DEFAULT_PROVIDER_ORDER`.

Settings UI picks up the new provider automatically.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Express + Vite dev server on `:3000` |
| `npm run build` | Build client and bundle server to `dist/` |
| `npm start` | Run the production bundle |
| `npm run lint` | TypeScript no-emit type-check |

## Deployment

Klik deploys to Vercel out of the box. Push to `main`, set the three env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in Project Settings → Environment Variables for both Production and Preview, and you're done. The `/api/transform` chain executor runs as a serverless function; the rest is a static Vite build.

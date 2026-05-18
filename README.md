<div align="center">

# Klik

**AI camera that transforms your photos into cinematic styles with Gemini.**

</div>

Klik is a mobile-first web app that captures (or uploads) a photo and re-renders it in the style of your choice — picking from style mode, aesthetic, color grade, camera simulation, texture, ambience, and resolution — and routes the generation through Google's Gemini image models.

Each user registers with their own account, brings their own Gemini API key, and picks which model to use (defaults to **Nano Banana 2**, with **Gemini 3.1 Pro** also available).

## Features

- Capture from device camera (front/back) or upload
- 7-axis style controls: style mode, aesthetic, color grade, camera sim, texture, ambience, resolution
- Before/after slider on the output, one-tap download
- Email + password registration via Supabase
- Per-user Gemini API key stored encrypted, never shared across accounts
- Swappable model picker (Nano Banana 2 / Gemini 3.1 Pro), one config file to update IDs

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4, Motion, Lucide
- Express backend (single `/api/transform` endpoint)
- Supabase (auth + Postgres + RLS)
- `@google/genai` SDK

## Setup

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In **Authentication → Providers**, make sure **Email** is enabled. (Disable "Confirm email" for the fastest dev experience, or keep it on for production.)
3. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `profiles` table, the auto-insert trigger on signup, and the RLS policies that keep each user's API key private.
4. In **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client)

### 2. Configure environment

Copy the template and fill in the values from step 1:

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-public-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Klik does **not** use a global Gemini key — each registered user pastes their own key in Settings after signing up. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. User signs up / signs in (Supabase email auth).
2. A row is auto-created in `public.profiles` via trigger.
3. User opens Settings, pastes their Gemini API key, picks a default model. Both are saved to their `profiles` row (RLS allows only the owner to read/write).
4. On generate, the client POSTs to `/api/transform` with the Supabase JWT in `Authorization: Bearer …`.
5. The server verifies the JWT with the service-role client, fetches that user's API key from `profiles`, and calls Gemini with the chosen model.

## Adjusting models

Model IDs live in one place: [`src/lib/models.ts`](src/lib/models.ts). If the actual Gemini API IDs differ from the defaults (`gemini-3-pro-image-preview`, `gemini-3-pro-preview`), update them there and both the client picker and the server call pick up the change.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Express + Vite dev server on `:3000` |
| `npm run build` | Build client and bundle server to `dist/` |
| `npm start` | Run the production bundle |
| `npm run lint` | TypeScript no-emit type-check |

# Pandora — Portfolio Theme

A cinematic, Avatar/Pandora-inspired portfolio site for **T. M. Saiful Islam** (full-stack
developer, WordPress/Shopify, Meta ads & conversion tracking). Dark, atmospheric, fully
hand-drawn SVG/CSS environments — no stock photography, no fabricated client work.

**Everything the site shows comes from the backend API in this repo**: projects, articles,
services, skills, process steps, settings (avatar/capabilities) and images. The API is
plain HTTP (curl-able) and the same codebase is meant to be deployed so it is available
online.

## Stack

- **Next.js 16.4** (App Router) with `cacheComponents` + Partial Prefetching + React Compiler
- **TypeScript**, **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`)
- **zod** for API validation; **JSON file stores** in `data/` back every collection;
  uploads go to `data/media/`
- **motion** (`motion/react`) for entrance/layout animation, **lucide-react** for icons
- Fonts via `next/font/google`: Space Grotesk (display), Inter (body), Newsreader (editorial)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Quality gates:

```bash
npm run lint       # eslint (0 warnings allowed)
npx tsc --noEmit   # typecheck (next build runs it too)
```

## Environment configuration

Copy `.env.example` to `.env.local`. All variables are optional; the site builds and runs
without any of them.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap, OG image, JSON-LD | `http://localhost:3000` |
| `ADMIN_API_TOKEN` | Bearer token authorising **all** write endpoints (`POST`/`PATCH`/`PUT`/`DELETE`) including media uploads | unset → writes answer `503 admin_disabled` |
| `RESEND_API_KEY` | Enables real contact-form delivery via the Resend HTTP API (server-side only — never prefix with `NEXT_PUBLIC_`) | unset → form reports `unconfigured` |
| `CONTACT_TO_EMAIL` | Inquiry delivery address | `saifulislamnyt@gmail.com` |
| `CONTACT_FROM_EMAIL` | Sender identity | `Portfolio Website <onboarding@resend.dev>` |
| `CONTACT_REPLY_TO` | Fixed reply-to header | visitor's own email |

Set `NEXT_PUBLIC_SITE_URL` to the real production origin before deploying so canonical
links and the sitemap are correct.

## Contact form (honest by design)

- **No backend key → no fake success.** Without `RESEND_API_KEY` the form returns status
  `unconfigured`, states plainly that nothing was sent, and offers the mailto + WhatsApp
  fallbacks (`src/lib/contact.ts`, `src/lib/email.ts`, `src/app/contact/actions.ts`).
- Server-side validation with typed field errors, honeypot field `company_website`,
  minimum 3-second completion time, and an in-memory sliding-window rate limit
  (3 per 10 minutes, keyed by IP and email — per server instance, resets on restart).
- Client: `useActionState`, focus moved to first error / status region, `aria-busy` submit,
  values preserved on validation failure (`src/components/contact/ContactForm.tsx`).

## Backend API

One backend serves the whole site: route handlers over JSON file stores, with zod
validation, typed error envelopes (`{ error: { code, message, details? } }`) and a
timing-safe Bearer guard on every write.

**Stores** (`data/*.json`, atomic writes + mtime-cached reads via `src/server/store.ts`):
`projects`, `articles`, `services`, `skills`, `process`, `settings`. **Services** in
`src/server/*.ts` hold the schemas and business rules.

### Endpoints

| Method | URL | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/projects?category=&page=&limit=` | public | `{ items, pagination }`; `category` ∈ known ids or `all` (else `400 invalid_category`), `limit` 1–50 |
| GET | `/api/projects/:slug` | public | `{ project }` or `404 not_found` |
| POST | `/api/projects` | Bearer | `201` + `location`; slug derived from title when omitted, `index` auto-assigned |
| PATCH/DELETE | `/api/projects/:slug` | Bearer | `200 { project }` / `204`; slug immutable (`400 slug_immutable`) |
| GET | `/api/articles?category=&search=&page=&limit=` | public | full-text-ish filter over title/summary/category |
| GET | `/api/articles/:slug` | public | `{ article }` |
| POST | `/api/articles` | Bearer | `201`; `publishedAt` must be `YYYY-MM-DD` |
| PATCH/DELETE | `/api/articles/:slug` | Bearer | `200` / `204` |
| GET | `/api/services` | public | `{ items, pagination }` |
| GET | `/api/services/:slug` | public | `{ service }` |
| POST | `/api/services` | Bearer | `201` |
| PATCH/DELETE | `/api/services/:slug` | Bearer | `200` / `204` |
| GET | `/api/skills` | public | `{ groups }` (map coordinates in %) |
| PUT | `/api/skills` | Bearer | whole-collection replace; accepts raw array or `{ groups }` |
| GET | `/api/process` | public | `{ steps }` |
| PUT | `/api/process` | Bearer | whole-collection replace; accepts raw array or `{ steps }` |
| GET | `/api/settings` | public | `{ settings: { avatar, aboutCapabilities } }` |
| PUT | `/api/settings` | Bearer | partial merge (e.g. `{ "avatar": "/media/x.png" }` or `null` to clear) |
| GET | `/api/media` | public | `{ items: [{ url, filename, size, contentType, uploadedAt }] }` |
| POST | `/api/media` | Bearer | multipart `file=` field; jpeg/png/webp/avif/gif/svg, ≤ 5 MB → `201 { media }` |
| DELETE | `/api/media/:file` | Bearer | `204` |
| GET | `/media/:file` | public | serves `data/media/` with `nosniff` + `CSP: sandbox` + long cache |

Error envelope: `503 admin_disabled` (no `ADMIN_API_TOKEN`), `401 unauthorized`,
`400 invalid_json` / `invalid_category` / `slug_immutable` / `invalid_filename`,
`404 not_found`, `409 slug_exists` / `duplicate_id`, `413 file_too_large`,
`415 unsupported_media_type`, `422 validation_failed` + `details: [{ path, message }]`,
`503 storage_readonly` (upload on a read-only filesystem).

```bash
export ADMIN_API_TOKEN=$(grep ADMIN_API_TOKEN .env.local | cut -d= -f2)

# read
curl "localhost:3000/api/projects?category=shopify"
curl "localhost:3000/api/articles?search=tracking"

# media → then attach the returned /media/… url to a record
curl -X POST localhost:3000/api/media \
  -H "authorization: Bearer $ADMIN_API_TOKEN" \
  -F "file=@screenshot.png;type=image/png"
curl -X PATCH localhost:3000/api/projects/premium-ecommerce-storefront \
  -H "authorization: Bearer $ADMIN_API_TOKEN" -H "content-type: application/json" \
  -d '{"image":"/media/screenshot-ab12cd34.png"}'
curl -X PUT localhost:3000/api/settings \
  -H "authorization: Bearer $ADMIN_API_TOKEN" -H "content-type: application/json" \
  -d '{"avatar":"/media/portrait-1a2b3c4d.png"}'
```

**How pages consume it:** server components never self-fetch their own API — during
`next build` there would be no server to call. They use the `"use cache"` accessors in
`src/server/projects-cache.ts` and `src/server/content-cache.ts`, which wrap the same
services the API exposes (`stale: 60 s`, `revalidate: 5 min`, `expire: 24 h`). So:

- API writes are visible over HTTP immediately; rendered pages pick them up within the
  5-minute revalidation window or on the next build.
- All writes (JSON stores **and** uploads into `data/media/`) need a deployment with a
  writable filesystem — a normal Node host. On read-only/serverless filesystems reads
  work, but write endpoints answer an honest `503`/error instead of pretending.
- Uploaded media is served by `src/app/media/[file]/route.ts` (not `public/`) because
  `next start` does not pick up files added to `public/` at runtime.

## Editing content

| File | Contents |
| --- | --- |
| `src/lib/site.ts` | Identity, role, location, email, phone, exact WhatsApp deep link |
| `data/projects.json` | Case studies (image field optional) |
| `data/articles.json` | Articles (cover field optional) |
| `data/services.json` | Services + deliverables |
| `data/skills.json` | Skill groups + map coordinates (`x`/`y` %) |
| `data/process.json` | Process steps |
| `data/settings.json` | `avatar` (image URL or `null`) + `aboutCapabilities` |
| `data/media/` | Uploaded images served at `/media/<file>` |
| `src/data/projects.ts` | Filter taxonomy (category ids + labels) only |
| `src/types/index.ts` | Shared types |

Edit the JSON directly (commit + redeploy) or through the API at runtime — both hit the
same files. Content rules: no invented clients, awards, testimonials, revenue numbers or
dates. `results` is `null` until real outcome numbers exist — the case-study page then
shows an honest "results not published yet" note instead of metrics, and fills them in as
soon as you send them through the API (`"results": "..."`).

**Images:** upload via `POST /api/media`, then reference the returned `/media/…` URL in
`project.image`, `article.cover` or `settings.avatar`. Fields left `null`/absent fall
back to the generated SVG artwork and portrait placeholder, so the site never shows a
broken image.

**CV:** no PDF is hosted yet. `src/components/contact/DownloadCv.tsx` shows an honest
"request it by email" note instead of a dead link. To ship a real CV, drop the file in
`public/cv/` and swap the button for a plain `<Link href="/cv/…">`.

## Routes

```
/                     Home (hero, about, skills map, services, work, process, insights, CTA)
/about                Full bio + avatar (from settings) + values
/services             Service catalog + process (from API)
/work                 Filterable project explorer (client-side category filter)
/work/[slug]          Case-study pages (build-time prerendered, on-demand 404 for bad slugs)
/insights             Article index (from API)
/insights/[slug]      Article pages with table of contents
/contact              Contact form + direct channels + WhatsApp
/media/[file]         Uploaded media (runtime data/media/)
/api/projects · /api/articles · /api/services · /api/skills · /api/process · /api/settings · /api/media
/sitemap.xml · /robots.txt · /opengraph-image · not-found
```

**404 note:** `dynamicParams` is unavailable under `cacheComponents`, and streaming
`notFound()` would emit status 200 (soft 404). Both `[slug]` routes therefore export
`ensureStatic = "navigation"` — known slugs prerender at build time, unknown slugs are
generated at request time and return a real **404** status with the themed
`src/components/errors/NotFoundContent.tsx` body.

## Design & theming

- Tokens and all utilities (`.panel`, `.eyebrow`, `.btn-primary`, `.btn-ghost`,
  `.text-gradient`, `.shell`, `.anim-*`, `.sheen`, `.scroll-progress`) live in
  `src/app/globals.css`.
- Dark is the default. `src/app/layout.tsx` runs an inline script before paint that reads
  `localStorage.theme` (or system preference) into `html[data-theme]`; light overrides are
  in the `[data-theme="light"]` block. Toggle: `src/components/layout/ThemeToggle.tsx`
  (`useSyncExternalStore` — no state sync inside effects) — switching themes plays a
  View Transitions cross-fade (`::view-transition-*` in `globals.css`) where supported.
- **Light mood = living daylight:** the light theme has its own atmosphere — a breathing
  sun bloom (`.scene-sun`), warm sun shafts (`.anim-beam` re-keyed by day), golden pollen
  particles instead of bioluminescent spores, sunrise sky washes, and landscape art that
  stays saturated instead of washed out. All of it fades smoothly when the theme toggles
  (`.scene-art` transitions).
- Scene artwork: `src/components/environment/` — `Scene` composes `Parallax`, `Particles`,
  `MistLayer`, `LightRays`, `FloatingMountains`, `AlienFlora`; variants `arrival` (home),
  `quiet` (404/lighter pages), `gateway` (contact). Light theme swaps sky/aurora via CSS
  custom properties.

## Animation & reduced motion

- Client entrance/layout animation uses `motion/react`; scroll-linked effects use a tiny
  rAF-throttled `Parallax` layer.
- Scroll-triggered entrances are centralised in `src/components/animations/Reveal.tsx`
  (`Reveal`, `Stagger`, `StaggerItem`) and used across all sections.
- A shimmering reading-progress hairline (`src/components/animations/ScrollProgress.tsx`)
  sits above the navbar; headings shimmer (`.text-gradient`), CTA buttons and cards sweep
  a light glint on hover (`.sheen`), and small badges gently bob (`.anim-bob`).
- **Game-feel layer** (`src/components/game/`, `src/lib/game.ts`):
  - `SparkBurst` — arcade hit-sparks fly off links/buttons on press
  - `DialogueTicker` — RPG-style status box under the hero types rotating flavour lines
  - `CountUp` — stats count up like XP when they scroll into view
  - `AchievementToast` — "Achievement unlocked" popups (footer reached, theme switched,
    and a Konami-code easter egg); each shown once via `localStorage`, `aria-live="polite"`
  - `CursorWisp` — a trailing glow orb that swells over interactive targets (fine
    pointers only, native cursor kept intact)
  - `Reveal`/`Stagger` entrances use spring physics for a bouncy, game-menu pop
- `prefers-reduced-motion` is honored everywhere: `src/lib/hooks.ts`
  (`useReducedMotion`, `useMediaQuery`) disables parallax, layout animation, and non-essential
  transitions; CSS ambient loops are gated in `globals.css` (shimmer, sheen, sun-bloom,
  sparks, wisp, caret). Game effects are decorative-only: no sparks, no wisp, a static
  dialogue line, static counters, and `ThemeToggle` skips `startViewTransition`.
- Purely decorative motion classes (`.anim-drift`, `.anim-float`, `.anim-pulse`,
  `.anim-beam`) are CSS-only and low-cost.

## Accessibility & SEO

- Skip link, landmark structure (header/nav/main/footer), visible focus styles, focus
  trapping + `Escape` in the mobile menu, `aria-pressed` filter buttons, labelled fields
  with `aria-invalid`/`aria-describedby`, focus management after form submit.
- Per-page `generateMetadata`, sitemap, robots, `ImageResponse` OG image, `Person` JSON-LD
  in the root layout.
- `public/` contains no leftover scaffold assets; favicon is `src/app/favicon.ico`.

## Performance notes

- Cache Components + Partial Prefetching: static shell prerendered at build, so the app
  "just runs" with `next start` and unknown slugs resolve correctly (see 404 note).
- The footer copyright year is computed in a `"use cache"` function
  (`src/components/layout/Footer.tsx`) — a bare `new Date()` would break prerendering.
- `next/image` handles `/media/…` uploads (local SVGs allowed with the docs-recommended
  CSP in `next.config.ts`, which also hardens `/media/*` responses).

## Deploy

Standard Next.js deployment on a **host with a writable filesystem** (Railway, Fly.io,
Render, a VPS/Docker, or any Node server) so API writes and media uploads work at
runtime. Set `NEXT_PUBLIC_SITE_URL` and (optionally) `RESEND_API_KEY`, `CONTACT_*` and
`ADMIN_API_TOKEN` in the host's environment.

- Without `ADMIN_API_TOKEN` the API is read-only (503 on writes).
- On read-only hosts (e.g. serverless static) the site and all GET endpoints work, but
  writes answer honestly instead of pretending; update `data/*.json` in the repo and
  redeploy to publish changes.
- Keep `data/` (content stores) in version control — it is the content source of truth.

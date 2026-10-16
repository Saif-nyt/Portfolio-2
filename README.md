# Pandora — Portfolio Theme

A cinematic, Avatar/Pandora-inspired portfolio site for **T. M. Saiful Islam** (full-stack
developer, WordPress/Shopify, Meta ads & conversion tracking). Dark, atmospheric, fully
hand-drawn SVG/CSS environments — no stock photography, no fabricated client work.

## Stack

- **Next.js 16.4** (App Router) with `cacheComponents` + Partial Prefetching + React Compiler
- **TypeScript**, **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`)
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

## Editing content (all honest, no fabricated claims)

| File | Contents |
| --- | --- |
| `src/lib/site.ts` | Identity, role, location, email, phone, exact WhatsApp deep link |
| `src/data/projects.ts` | 6 case studies — all marked `isConcept: true`, `results: null` |
| `src/data/services.ts` | Services + deliverables |
| `src/data/skills.ts` | Skill groups + map coordinates (`x`/`y` % positions) |
| `src/data/articles.ts` | 7 full articles (markdown body, headings, TOC) |
| `src/data/process.ts` | Process steps |
| `src/types/index.ts` | Shared types |

Content rules baked into the data: no invented clients, awards, testimonials, revenue
numbers or dates. `results` stays `null` and metric rows are hidden when absent. Replace
the concept studies with real work (flip `isConcept: false`, add results) as it exists.

**CV:** no PDF is hosted yet. `src/components/contact/DownloadCv.tsx` shows an honest
"request it by email" note instead of a dead link. To ship a real CV, drop the file in
`public/cv/` and swap the button for a plain `<Link href="/cv/…">`.

## Routes

```
/                     Home (hero, about, skills map, services, work, process, insights, CTA)
/about                Full bio + values + principles
/services             Service catalog + process
/work                 Filterable project explorer (client-side category filter)
/work/[slug]          Case-study pages (build-time prerendered, on-demand 404 for bad slugs)
/insights             Article index with tags/search
/insights/[slug]      Article pages with table of contents
/contact              Contact form + direct channels + WhatsApp
/sitemap.xml · /robots.txt · /opengraph-image · not-found
```

**404 note:** `dynamicParams` is unavailable under `cacheComponents`, and streaming
`notFound()` would emit status 200 (soft 404). Both `[slug]` routes therefore export
`ensureStatic = "navigation"` — known slugs prerender at build time, unknown slugs are
generated at request time and return a real **404** status with the themed
`src/components/errors/NotFoundContent.tsx` body.

## Design & theming

- Tokens and all utilities (`.panel`, `.eyebrow`, `.btn-primary`, `.btn-ghost`,
  `.text-gradient`, `.shell`, `.anim-*`) live in `src/app/globals.css`.
- Dark is the default. `src/app/layout.tsx` runs an inline script before paint that reads
  `localStorage.theme` (or system preference) into `html[data-theme]`; light overrides are
  in the `[data-theme="light"]` block. Toggle: `src/components/layout/ThemeToggle.tsx`
  (`useSyncExternalStore` — no state sync inside effects).
- Scene artwork: `src/components/environment/` — `Scene` composes `Parallax`, `Particles`,
  `MistLayer`, `LightRays`, `FloatingMountains`, `AlienFlora`; variants `arrival` (home),
  `quiet` (404/lighter pages), `gateway` (contact). Light theme swaps sky/aurora via CSS
  custom properties.

## Animation & reduced motion

- Client entrance/layout animation uses `motion/react`; scroll-linked effects use a tiny
  rAF-throttled `Parallax` layer.
- `prefers-reduced-motion` is honored everywhere: `src/lib/hooks.ts`
  (`useReducedMotion`, `useMediaQuery`) disables parallax, layout animation, and non-essential
  transitions; CSS ambient loops are gated in `globals.css`.
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
- All content data is local; there are no runtime `fetch` calls.

## Deploy

Standard Next.js deployment (e.g. Vercel, or `npm run build && npm run start` behind a
Node host). Set `NEXT_PUBLIC_SITE_URL` and (optionally) `RESEND_API_KEY` +
`CONTACT_*` variables in the host's environment. Without Resend, the contact form still
works as a validated lead-capture UI and hands visitors to email/WhatsApp honestly.
# Portfolio-2

# NEBULA — Asset Inventory

As of the world rebuild, every interactive location is built from **procedural
Three.js geometry** — no external GLB/HDR/texture files are loaded at runtime.
This keeps the initial asset payload at ~0 MB beyond the JavaScript bundle and
removes all third-party asset hosting concerns.

## Current assets

| Asset | Source | License | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | All scenes use in-code primitives: boxes, cylinders, spheres, tori, cones, octahedra and planes, tinted and emissive-shaded at runtime. |

## Design rationale

The previous build loaded ~9 MB of models and textures up front (a rigged
character, 15 nature GLBs, 11 sci-fi structures, an HDR sky and ground
textures). That payload was the single largest cause of slow first
interaction. The rebuild replaced all of it with lightweight procedural
geometry:

- **Temple, Observatory, Forge, Vault, Sanctuary, Nexus, Arrival Valley** —
  stone pillars, doors, floating crystals, workbenches, data tablets and
  communication terminals are all built from Three.js primitives.
- **Lighting** — ambient + hemisphere + two directional lights; no HDR
  environment map, no shadow-casting lights by default.
- **Atmosphere** — exponential fog + emissive materials for the bioluminescent
  look, at a fraction of the cost of real-time IBL.

## If external models are added later

When a fitting CC0 asset is introduced, record it here with: name, source URL,
author, license, local path under `public/`, and which location uses it. Prefer
locally stored, compressed assets (draco/meshopt GLB, KTX2 textures) and load
them only for the location that needs them via `next/dynamic`.

Good CC0 sources:

- [Poly Haven](https://polyhaven.com/) — HDRIs, textures, models
- [Kenney](https://kenney.nl/assets) — low-poly game asset packs
- [KayKit](https://kaylousberg.itch.io/) — sci-fi / modular structure packs

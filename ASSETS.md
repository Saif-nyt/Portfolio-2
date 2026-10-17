# NEBULA — Asset Inventory

Every file in `public/nature/`, `public/models/` and `public/textures/` was
downloaded and verified in this repository. Nothing here loads from a remote
URL at runtime.

## Explorer character

| File | Source | Author | License | Notes |
| --- | --- | --- | --- | --- |
| `public/models/soldier.glb` | [three.js examples — Soldier.glb](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb) | three.js project (model originally authored in Mixamo) | Model: Mixamo asset distributed with the MIT-licensed three.js repository. Adobe's Mixamo license permits royalty-free use in games and commercial projects. | Rigged humanoid with animation clips **Idle**, **Walk**, **Run**, **TPose**. 2.1 MB. Used as the explorer; materials are re-tinted at runtime toward the NEBULA palette. |

If a fully original cloaked-explorer GLB with idle/walk clips is later added,
swap the path in `ExplorerCharacter.tsx` — the component contract stays the same.

## Nature kit (vegetation, rocks, cliffs)

| Files | Source | Author | License | Notes |
| --- | --- | --- | --- | --- |
| `public/nature/*.glb` (26 files) | [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) | Kenney ([kenney.nl](https://kenney.nl)) | **CC0 1.0** (public domain) | Low-poly stylized trees (dark variants), large/small rocks, mushrooms, bushes, grass tufts, flowers, logs, stumps and cliff blocks. GLB format, 3–31 KB each. Re-tinted at runtime toward deep teal / bioluminescent cyan. |

## Sci-fi structures (outposts, pads, containers, alien rocks)

| Files | Source | Author | License | Notes |
| --- | --- | --- | --- | --- |
| `public/models/kaykit/*.gltf` + `*.bin` + `spacebits_texture.png` | [KayKit — Space Base Bits](https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0) | Kay Lousberg (KayKit) | **CC0 1.0** (public domain) | Modular sci-fi pieces: base modules, landing pad, lander, cargo containers/depot, drill structure, lights, plus rock formations. GLTF + external BIN + one 25 KB atlas texture (26–81 KB per piece). |

## Environment (sky + lighting)

| File | Source | Author | License | Notes |
| --- | --- | --- | --- | --- |
| `public/environments/night_sky_1k.hdr` | [Poly Haven — Dikhololo Night](https://polyhaven.com/a/dikhololo_night) | Poly Haven | **CC0 1.0** | 1K HDR panorama: natural night sky with stars. Used as scene environment/background and image-based lighting. 1.7 MB. |

## Terrain textures

| File | Source | Author | License | Notes |
| --- | --- | --- | --- | --- |
| `public/textures/ground_diffuse.jpg`<br>`public/textures/ground_normal.jpg` | [Poly Haven — Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock) | Poly Haven | **CC0 1.0** | Mossy grass-and-rock ground (1K JPG, ~0.7/0.9 MB). |
| `public/textures/forest_diffuse.jpg`<br>`public/textures/forest_normal.jpg` | [Poly Haven — Brown Mud Rocks 01](https://polyhaven.com/a/brown_mud_rocks_01) | Poly Haven | **CC0 1.0** | Forest-floor mud and stones (1K JPG, ~0.9/1.4 MB). |

## Runtime asset policy

- All GLB/GLTF/HDR/JPG files are served from `public/` by this app — no
  third-party hosts at runtime.
- Procedural geometry (crystal nodes, portal rings, particles) is used only
  for small supporting details where no fitting CC0 asset exists; it is built
  from Three.js primitives inside the components, not from external files.
- No Avatar movie assets were used. The bioluminescent look is an original
  combination of the CC0 packs above with runtime material tinting.

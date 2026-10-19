import type { ProjectSummary } from "@/lib/world/content-hooks";

/**
 * Artifact taxonomy for the discovery game. Artifacts are the catalogue of
 * case studies shown in the Vault — every field here is derived from real
 * project data, never invented. Rarity is a game-layer tier that scales the
 * collect reward and orders the vault; it is decided by the discipline an
 * artifact encodes, not assigned per item at random.
 */

export type ArtifactRarity = "shard" | "artifact" | "relic";

export interface RarityMeta {
  id: ArtifactRarity;
  label: string;
  /** XP granted when the artifact is collected. */
  xp: number;
  /** Sort/order weight — higher is rarer. */
  tier: number;
  accent: string;
}

export const RARITY: Record<ArtifactRarity, RarityMeta> = {
  shard: { id: "shard", label: "Shard", xp: 20, tier: 1, accent: "#8fd8ff" },
  artifact: { id: "artifact", label: "Artifact", xp: 45, tier: 2, accent: "#b39dff" },
  relic: { id: "relic", label: "Relic", xp: 90, tier: 3, accent: "#ffd36b" },
};

export const RARITY_ORDER: ArtifactRarity[] = ["relic", "artifact", "shard"];

interface CategoryMeta {
  classLabel: string;
  rarity: ArtifactRarity;
}

/**
 * Project category (from the content API) → artifact class + rarity. Kept
 * intentionally narrow: unknown categories fall back to a shard so new work
 * is still collectable the moment it is published.
 */
const CATEGORY_META: Record<string, CategoryMeta> = {
  wordpress: { classLabel: "Commerce Engine", rarity: "relic" },
  shopify: { classLabel: "Commerce Surface", rarity: "artifact" },
  tracking: { classLabel: "Instrumentation", rarity: "artifact" },
  "web-development": { classLabel: "Interface Craft", rarity: "shard" },
  "creative-development": { classLabel: "Creative Systems", rarity: "shard" },
};

const FALLBACK_META: CategoryMeta = { classLabel: "Recovered Artifact", rarity: "shard" };

/** Named accents from the project schema → vault crystal colours. */
const ACCENT_BY_NAME: Record<string, string> = {
  cyan: "#6bffd0",
  turquoise: "#8fd8ff",
  mist: "#b39dff",
};

const PROJECT_ACCENTS = ["#6bffd0", "#8fd8ff", "#b39dff", "#ffd36b", "#ffb36b", "#ff8fb3"];

export interface Artifact {
  id: string;
  index: number;
  /** Stable catalogue reference, e.g. ART-03. */
  reference: string;
  title: string;
  category: string;
  categoryLabel: string;
  classLabel: string;
  rarity: ArtifactRarity;
  accent: string;
}

/** Map a published project to its artifact record (stable by array order). */
export function artifactFrom(project: ProjectSummary, index: number): Artifact {
  const meta = CATEGORY_META[project.category] ?? FALLBACK_META;
  const accent =
    (project.accent && ACCENT_BY_NAME[project.accent]) ||
    PROJECT_ACCENTS[index % PROJECT_ACCENTS.length];
  return {
    id: project.slug,
    index,
    reference: `ART-${String(index + 1).padStart(2, "0")}`,
    title: project.title,
    category: project.category,
    categoryLabel: project.categoryLabel ?? project.category,
    classLabel: meta.classLabel,
    rarity: meta.rarity,
    accent,
  };
}

/** Same list the Vault scene renders — the discovery catalogue for a run. */
export function artifactCatalog(projects: ProjectSummary[], limit = 6): Artifact[] {
  return projects.slice(0, limit).map((project, index) => artifactFrom(project, index));
}

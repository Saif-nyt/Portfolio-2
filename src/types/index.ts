export type ProjectCategory =
  | "web-development"
  | "wordpress"
  | "shopify"
  | "marketing"
  | "tracking";

/** Runtime list mirroring ProjectCategory — used by API validation. */
export const PROJECT_CATEGORY_IDS = [
  "web-development",
  "wordpress",
  "shopify",
  "marketing",
  "tracking",
] as const satisfies readonly ProjectCategory[];

export interface ProjectSection {
  label: string;
  body: string[];
}

/** How honest framing of a project: real client work, concept, or demo. */
export type ProjectKind = "actual" | "concept" | "demo";

/** Runtime list mirroring ProjectKind — used by API validation. */
export const PROJECT_KIND_IDS = ["actual", "concept", "demo"] as const satisfies readonly ProjectKind[];

export interface Project {
  slug: string;
  index: string;
  title: string;
  category: ProjectCategory;
  alsoIn?: ProjectCategory[];
  categoryLabel: string;
  /** Distinguishes actual work from concept projects and demos. Defaults to "concept". */
  kind?: ProjectKind;
  stack: string[];
  summary: string;
  /** Optional cover image URL (served from /media/) — falls back to generated artwork. */
  image?: string | null;
  accent: "cyan" | "turquoise" | "mist";
  overview: string;
  problem: string;
  audience: string;
  role: string;
  services: string[];
  tools: string[];
  designDecisions: string[];
  implementation: string[];
  sections: ProjectSection[];
  deliverables: string[];
  results: string | null;
  lessons: string[];
  related: string[];
}

export interface ServiceDeliverable {
  title: string;
  items: string[];
}

export interface Service {
  slug: string;
  number: string;
  title: string;
  short: string;
  description: string;
  deliverables: ServiceDeliverable[];
  accent: "cyan" | "turquoise" | "mist";
}

export interface SkillItem {
  name: string;
  note?: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  blurb: string;
  items: SkillItem[];
  x: number;
  y: number;
}

export interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  readingTime: string;
  author: string;
  /** Optional cover image URL (served from /media/). */
  cover?: string | null;
  sections: ArticleSection[];
  related: string[];
}

export interface Settings {
  /** Avatar image URL (served from /media/) shown on the about pages. */
  avatar: string | null;
  aboutCapabilities: string[];
}

export interface MediaItem {
  url: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

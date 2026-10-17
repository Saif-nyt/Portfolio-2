/** Category taxonomy used by the project filter UI. */
export const projectCategories = [
  { id: "all", label: "All Projects" },
  { id: "web-development", label: "Web Development" },
  { id: "wordpress", label: "WordPress" },
  { id: "shopify", label: "Shopify" },
  { id: "marketing", label: "Marketing" },
  { id: "tracking", label: "Tracking & Analytics" },
] as const;

/** Display labels for project honesty framing. */
export const PROJECT_KIND_LABELS = {
  actual: "Actual Work",
  concept: "Concept Project",
  demo: "Demo",
} as const;

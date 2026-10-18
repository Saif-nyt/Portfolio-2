export type LocationId =
  | "arrival"
  | "temple"
  | "observatory"
  | "forge"
  | "vault"
  | "sanctuary"
  | "nexus";

export interface WorldLocation {
  id: LocationId;
  number: string;
  title: string;
  subtitle: string;
  href: string;
  /** 0–1 horizontal position on the world map. */
  mapX: number;
  mapY: number;
  accent: string;
}

export const LOCATIONS: WorldLocation[] = [
  {
    id: "arrival",
    number: "01",
    title: "Arrival Valley",
    subtitle: "Home — the frontier overview",
    href: "/",
    mapX: 0.1,
    mapY: 0.62,
    accent: "#63f5e7",
  },
  {
    id: "temple",
    number: "02",
    title: "Ancient Temple",
    subtitle: "About — identity & philosophy",
    href: "/about",
    mapX: 0.26,
    mapY: 0.38,
    accent: "#8fd8ff",
  },
  {
    id: "observatory",
    number: "03",
    title: "Holographic Observatory",
    subtitle: "Skills — the capability constellation",
    href: "/skills",
    mapX: 0.42,
    mapY: 0.58,
    accent: "#b39dff",
  },
  {
    id: "forge",
    number: "04",
    title: "Technology Forge",
    subtitle: "Services — what I can build for you",
    href: "/services",
    mapX: 0.56,
    mapY: 0.32,
    accent: "#ffb36b",
  },
  {
    id: "vault",
    number: "05",
    title: "Artifact Vault",
    subtitle: "Projects — case studies & work",
    href: "/work",
    mapX: 0.7,
    mapY: 0.55,
    accent: "#6bffd0",
  },
  {
    id: "sanctuary",
    number: "06",
    title: "Knowledge Sanctuary",
    subtitle: "Insights — articles & field notes",
    href: "/insights",
    mapX: 0.84,
    mapY: 0.36,
    accent: "#ffd36b",
  },
  {
    id: "nexus",
    number: "07",
    title: "Communication Nexus",
    subtitle: "Contact — open a channel",
    href: "/contact",
    mapX: 0.94,
    mapY: 0.62,
    accent: "#ff8fb3",
  },
];

export const LOCATION_BY_ID = Object.fromEntries(
  LOCATIONS.map((location) => [location.id, location]),
) as Record<LocationId, WorldLocation>;

export function locationByPathname(pathname: string): WorldLocation {
  if (pathname.startsWith("/about")) return LOCATION_BY_ID.temple;
  if (pathname.startsWith("/skills")) return LOCATION_BY_ID.observatory;
  if (pathname.startsWith("/services")) return LOCATION_BY_ID.forge;
  if (pathname.startsWith("/work")) return LOCATION_BY_ID.vault;
  if (pathname.startsWith("/insights")) return LOCATION_BY_ID.sanctuary;
  if (pathname.startsWith("/contact")) return LOCATION_BY_ID.nexus;
  return LOCATION_BY_ID.arrival;
}

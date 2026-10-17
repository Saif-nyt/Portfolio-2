export const WORLD_WIDTH = 5200;
export const SPAWN_X = 380;
export const INTERACT_RANGE = 150;

export type ZoneIcon = "home" | "archive" | "skills" | "outpost" | "vault" | "nexus" | "library";

export interface Zone {
  id: string;
  number: string | null;
  title: string;
  subtitle: string;
  href: string;
  x: number;
  icon: ZoneIcon;
  /** Library is a bonus location — not one of the six mission zones. */
  bonus?: boolean;
}

export const ZONES: Zone[] = [
  {
    id: "landing",
    number: "01",
    title: "Landing Zone",
    subtitle: "Arrival valley — professional value & stats",
    href: "/",
    x: 380,
    icon: "home",
  },
  {
    id: "archives",
    number: "02",
    title: "Origin Archives",
    subtitle: "The story behind the work",
    href: "/about",
    x: 1150,
    icon: "archive",
  },
  {
    id: "skills",
    number: "03",
    title: "Skill Constellation",
    subtitle: "Connected nodes of capability",
    href: "/about#capabilities",
    x: 1950,
    icon: "skills",
  },
  {
    id: "outpost",
    number: "04",
    title: "Service Outpost",
    subtitle: "Six service terminals",
    href: "/services",
    x: 2800,
    icon: "outpost",
  },
  {
    id: "vault",
    number: "05",
    title: "Artifact Vault",
    subtitle: "Projects & case studies",
    href: "/work",
    x: 3650,
    icon: "vault",
  },
  {
    id: "library",
    number: null,
    title: "Research Library",
    subtitle: "Insights & field notes",
    href: "/insights",
    x: 4300,
    icon: "library",
    bonus: true,
  },
  {
    id: "nexus",
    number: "06",
    title: "Communication Nexus",
    subtitle: "Open a channel — start a project",
    href: "/contact",
    x: 4950,
    icon: "nexus",
  },
];

export const MISSION_ZONES = ZONES.filter((zone) => !zone.bonus);

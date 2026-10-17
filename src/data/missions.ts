export interface Mission {
  id: string;
  number: string;
  title: string;
  detail: string;
  /** Zone whose entry completes the mission; null = completed by arriving. */
  zoneId: string | null;
}

export const MISSIONS: Mission[] = [
  {
    id: "m01",
    number: "01",
    title: "Establish Contact with the Planet",
    detail: "Touch down on Nebula and boot the explorer uplink.",
    zoneId: null,
  },
  {
    id: "m02",
    number: "02",
    title: "Discover the Creator",
    detail: "Visit the Origin Archives to meet the mind behind the work.",
    zoneId: "archives",
  },
  {
    id: "m03",
    number: "03",
    title: "Restore the Skill Constellation",
    detail: "Re-light the capability nodes in the constellation grove.",
    zoneId: "skills",
  },
  {
    id: "m04",
    number: "04",
    title: "Inspect the Service Outpost",
    detail: "Review the six service terminals at the outpost.",
    zoneId: "outpost",
  },
  {
    id: "m05",
    number: "05",
    title: "Recover Project Artifacts",
    detail: "Open the Artifact Vault and recover the case studies.",
    zoneId: "vault",
  },
  {
    id: "m06",
    number: "06",
    title: "Activate the Communications Nexus",
    detail: "Power the nexus and open a channel for new commissions.",
    zoneId: "nexus",
  },
];

export const MISSION_TOTAL = MISSIONS.length;

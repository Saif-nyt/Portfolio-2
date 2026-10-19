// Dependency-free regression checks for the pure game logic (XP maths and the
// artifact taxonomy). Run with `npm run test:game`. Node strips the TypeScript
// types on import, so no build step or test framework is required.
import assert from "node:assert/strict";

const xp = await import("../src/lib/world/xp.ts");
const artifacts = await import("../src/lib/world/artifacts.ts");

const { XP_PER_LEVEL, levelFromXp, levelProgress } = xp;
const { RARITY, artifactFrom, artifactCatalog } = artifacts;

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push(`${name}\n    ${error.message}`);
  }
}

/* ---------- XP / level maths ---------- */
test("level starts at 1", () => {
  assert.equal(levelFromXp(0), 1);
});

test("level advances exactly at the threshold", () => {
  assert.equal(levelFromXp(XP_PER_LEVEL - 1), 1);
  assert.equal(levelFromXp(XP_PER_LEVEL), 2);
  assert.equal(levelFromXp(XP_PER_LEVEL * 2), 3);
});

test("negative XP is clamped to level 1", () => {
  assert.equal(levelFromXp(-500), 1);
});

test("level progress is fractional within a level", () => {
  assert.equal(levelProgress(0), 0);
  assert.equal(levelProgress(XP_PER_LEVEL / 2), 0.5);
  assert.equal(levelProgress(XP_PER_LEVEL), 0);
});

/* ---------- Rarity rewards ---------- */
test("rarity XP increases with tier", () => {
  assert.equal(RARITY.shard.xp, 20);
  assert.equal(RARITY.artifact.xp, 45);
  assert.equal(RARITY.relic.xp, 90);
  assert.ok(RARITY.shard.tier < RARITY.artifact.tier);
  assert.ok(RARITY.artifact.tier < RARITY.relic.tier);
});

/* ---------- Artifact taxonomy ---------- */
const project = (over = {}) => ({
  slug: "demo",
  title: "Demo",
  category: "web-development",
  summary: "s",
  ...over,
});

test("wordpress maps to a relic", () => {
  const artifact = artifactFrom(project({ slug: "a", category: "wordpress", accent: "cyan" }), 0);
  assert.equal(artifact.rarity, "relic");
  assert.equal(artifact.reference, "ART-01");
  assert.equal(artifact.accent, "#6bffd0");
});

test("unknown category falls back to a shard", () => {
  const artifact = artifactFrom(project({ category: "quantum-basketry" }), 2);
  assert.equal(artifact.rarity, "shard");
  assert.equal(artifact.reference, "ART-03");
});

test("unknown accent name falls back to the palette", () => {
  const artifact = artifactFrom(project({ accent: "chartreuse" }), 4);
  assert.match(artifact.accent, /^#[0-9a-f]{6}$/i);
});

test("catalogue preserves order and honours the limit", () => {
  const list = Array.from({ length: 10 }, (_, i) => project({ slug: `p${i}` }));
  const catalog = artifactCatalog(list, 6);
  assert.equal(catalog.length, 6);
  assert.equal(catalog[0].id, "p0");
  assert.equal(catalog[5].reference, "ART-06");
});

/* ---------- report ---------- */
if (failures.length > 0) {
  console.error(`\n${failures.length} game check(s) failed:\n`);
  for (const failure of failures) console.error("  ✗ " + failure + "\n");
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}

console.log(`✓ all ${passed} game checks passed`);

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};
const ok = (message) => console.log(`✓ ${message}`);

if (pkg.name === "motera-3d" && !JSON.stringify(pkg).toLowerCase().includes("football")) ok("package metadata matches Motera 3D");
else fail("package metadata is stale");

const required = [
  'id="minimap"',
  'id="nav-section"',
  'id="nav-row"',
  'id="nav-seat"',
  'id="share"',
  "webglcontextlost",
  "navigator.share",
  "restoreFromUrl",
  "boundingSphereFor",
  "railings(",
  "mediaAreas(",
  "buildSeatDetails(",
  "fail3D("
];
for (const marker of required) {
  if (!html.includes(marker)) fail(`missing integration marker: ${marker}`);
}
if (!process.exitCode) ok(`${required.length} interaction/performance/fallback integration markers present`);

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter(Boolean);
try {
  // Compile only; do not execute browser-dependent code.
  new Function(inlineScripts.at(-1));
  ok("inline application JavaScript parses");
} catch (error) {
  fail(`inline application JavaScript syntax error: ${error.message}`);
}

if (html.includes("@media(max-width:800px)") && html.includes("@media(max-height:720px)") && html.includes("env(safe-area-inset-bottom)")) {
  ok("mobile, short-screen, and safe-area CSS guards present");
} else {
  fail("responsive CSS guards are incomplete");
}

const cfg = {
  sections: 48,
  tiers: [
    { id: "L", rows: 35, rx: 86.8, rz: 72.8, depth: 0.86, spacing: 0.47, aisle: 0.031, tunnelRow: 13, tunnelRows: 5, tunnelEvery: 4 },
    { id: "U", rows: 32, rx: 118.7, rz: 104.7, depth: 0.88, spacing: 0.48, aisle: 0.029, tunnelRow: 9, tunnelRows: 4, tunnelEvery: 4 }
  ]
};
const circumference = (a, b) => {
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
};
const blocked = (tier, row, local, section) =>
  Math.min(local, 1 - local) < tier.aisle ||
  (section % tier.tunnelEvery === 1 &&
    row >= tier.tunnelRow &&
    row < tier.tunnelRow + tier.tunnelRows &&
    Math.abs(local - 0.5) < 0.19);

const ids = new Set();
let generated = 0;
const perSection = new Map();
for (const tier of cfg.tiers) {
  for (let section = 0; section < cfg.sections; section += 1) {
    const sectionId = `${tier.id}${String(section + 1).padStart(2, "0")}`;
    let count = 0;
    for (let row = 0; row < tier.rows; row += 1) {
      const rx = tier.rx + row * tier.depth;
      const rz = tier.rz + row * tier.depth;
      const n = Math.max(cfg.sections * 8, Math.round(circumference(rx, rz) / tier.spacing));
      const start = Math.ceil((section * n) / cfg.sections);
      const end = Math.floor(((section + 1) * n) / cfg.sections - 0.000001);
      for (let i = start; i <= end; i += 1) {
        const local = (i / n) * cfg.sections - section;
        if (blocked(tier, row, local, section)) continue;
        const seat = i - start + 1;
        const id = `${sectionId}-R${row + 1}-S${seat}`;
        if (ids.has(id)) fail(`duplicate generated seat ID: ${id}`);
        ids.add(id);
        generated += 1;
        count += 1;
      }
    }
    perSection.set(sectionId, count);
  }
}
if (ids.size === generated && perSection.size === 96 && generated > 80000) {
  ok(`${generated.toLocaleString()} stable unique generated seat IDs across 96 sections`);
} else {
  fail(`procedural seat model invalid: ${generated} seats / ${ids.size} unique / ${perSection.size} sections`);
}

const counts = [...perSection.values()];
if (Math.min(...counts) > 750 && Math.max(...counts) < 1100) ok(`section instance range sane (${Math.min(...counts)}–${Math.max(...counts)})`);
else fail("section instance counts are outside expected bounds");

if (!/football|vite|javascript\.svg|hero\.png|counter\.js/i.test(
  [
    html,
    await readFile(resolve(root, "README.md"), "utf8"),
    JSON.stringify(pkg),
    await readFile(resolve(root, "package-lock.json"), "utf8")
  ].join("\n")
)) ok("obsolete football/Vite starter metadata removed");
else fail("obsolete football/Vite starter metadata remains");

if (process.exitCode) process.exit(process.exitCode);
console.log("All Motera 3D static/procedural checks passed.");

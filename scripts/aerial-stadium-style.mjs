import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Phase-23 aerial stadium style: expected one ${label} marker, found ${count}`);
  }
  html = html.replace(before, after);
}

// Presentation-only treatment based on the supplied aerial reference. These
// replacements intentionally leave all geometry, seat coordinates, IDs,
// Block/Bay mapping, raycasting, camera behavior and responsive UI untouched.
replaceOnce(
  'pal:["#ed6726","#f47b2c","#f18e32","#e95a22","#f2a13a"]',
  'pal:["#d9470d","#e65310","#ef6514","#d23d0a","#f28c22"]',
  'lower-seat palette'
);
replaceOnce(
  'pal:["#1f2f67","#263b7a","#ef6c28","#f6ad35","#f8c451"]',
  'pal:["#19264f","#223565","#e45212","#ef7518","#f2a52b"]',
  'upper-seat palette'
);
replaceOnce('mowA="#267a3c",mowB="#297e40"', 'mowA="#184b26",mowB="#205b2e"', 'turf palette');
replaceOnce(
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4',
  'flat(ring(154.5,140.5,123.8,108.5),0xf4f0e6,53.4',
  'roof membrane'
);
replaceOnce('bowl(CFG.tiers[0],0x373a3b)', 'bowl(CFG.tiers[0],0x9b2f12)', 'lower-bowl substrate');
replaceOnce('bowl(CFG.tiers[1],0x30353b)', 'bowl(CFG.tiers[1],0x141f48)', 'upper-bowl substrate');

// The real aerial reads as one dominant orange lower bowl rather than a noisy
// multi-colour checker. Keep subtle tonal variation but reduce visual noise.
replaceOnce(
  'if(t.id==="L"){const band=(sec+Math.floor(row/6))%4,light=Math.sin(a*6.2+row*.16)>.88;return light?t.pal[4]:t.pal[band]}',
  'if(t.id==="L"){const band=(sec+Math.floor(row/10))%4,light=Math.sin(a*5.4+row*.11)>.965;return light?t.pal[4]:t.pal[band]}',
  'lower-bowl seat pattern'
);

// Preserve the existing eight-repeat upper-tier motif geometry, but broaden
// the orange/gold chevrons so the upper band reads closer to the aerial image.
replaceOnce(
  'const repeats=8,phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=.08+y*.34,delta=Math.abs(arm-target);if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/5))&1)?t.pal[0]:t.pal[1]',
  'const repeats=8,phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=.08+y*.34,delta=Math.abs(arm-target);if(delta<.026)return t.pal[4];if(delta<.095)return y>.76?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/6))&1)?t.pal[0]:t.pal[1]',
  'upper-bowl chevron pattern'
);

// Keep surrounding seating clearly visible when a Block/Bay is highlighted;
// this changes tint only and does not alter selection membership.
const dimMarker = 'active?0xffffff:0x505050';
const dimCount = html.split(dimMarker).length - 1;
if (dimCount !== 4) {
  throw new Error(`Phase-23 aerial stadium style: expected four selection-dimming markers, found ${dimCount}`);
}
html = html.split(dimMarker).join('active?0xffffff:0xd0d0d0');

for (const marker of [
  'pal:["#d9470d","#e65310","#ef6514","#d23d0a","#f28c22"]',
  'pal:["#19264f","#223565","#e45212","#ef7518","#f2a52b"]',
  'mowA="#184b26",mowB="#205b2e"',
  'flat(ring(154.5,140.5,123.8,108.5),0xf4f0e6,53.4',
  'bowl(CFG.tiers[0],0x9b2f12)',
  'bowl(CFG.tiers[1],0x141f48)',
  'Math.sin(a*5.4+row*.11)>.965',
  'if(delta<.026)return t.pal[4];if(delta<.095)return y>.76?t.pal[3]:t.pal[2]',
  'active?0xffffff:0xd0d0d0'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-23 aerial stadium style: output marker missing: ${marker}`);
}

for (const forbidden of [
  'active?0xffffff:0x505050',
  'bowl(CFG.tiers[0],0x373a3b)',
  'bowl(CFG.tiers[1],0x30353b)',
  'Math.sin(a*6.2+row*.16)>.88',
  'if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2]'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-23 aerial stadium style: legacy visual marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 23 refined the existing 3D stadium toward the supplied aerial reference using materials and seat-pattern styling only; geometry, seat IDs, camera, mapping, interaction and responsive UI remain unchanged');

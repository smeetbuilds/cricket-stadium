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

replaceOnce(
  'pal:["#ed6726","#f47b2c","#f18e32","#e95a22","#f2a13a"]',
  'pal:["#e9541d","#f16220","#f37325","#e44918","#f28a2a"]',
  'lower-seat palette'
);
replaceOnce(
  'pal:["#1f2f67","#263b7a","#ef6c28","#f6ad35","#f8c451"]',
  'pal:["#1b2c5b","#243a70","#e85a20","#f28c2a","#f4b43c"]',
  'upper-seat palette'
);
replaceOnce('mowA="#267a3c",mowB="#297e40"', 'mowA="#1c5b32",mowB="#24693b"', 'turf palette');
replaceOnce(
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4',
  'flat(ring(154.5,140.5,123.8,108.5),0xeeeae1,53.4',
  'roof membrane'
);
replaceOnce('bowl(CFG.tiers[0],0x373a3b)', 'bowl(CFG.tiers[0],0x8a321b)', 'lower-bowl substrate');
replaceOnce('bowl(CFG.tiers[1],0x30353b)', 'bowl(CFG.tiers[1],0x16294f)', 'upper-bowl substrate');

const dimMarker = 'active?0xffffff:0x505050';
const dimCount = html.split(dimMarker).length - 1;
if (dimCount !== 4) {
  throw new Error(`Phase-23 aerial stadium style: expected four selection-dimming markers, found ${dimCount}`);
}
html = html.split(dimMarker).join('active?0xffffff:0xb8b8b8');

for (const marker of [
  'pal:["#e9541d","#f16220","#f37325","#e44918","#f28a2a"]',
  'pal:["#1b2c5b","#243a70","#e85a20","#f28c2a","#f4b43c"]',
  'mowA="#1c5b32",mowB="#24693b"',
  'flat(ring(154.5,140.5,123.8,108.5),0xeeeae1,53.4',
  'bowl(CFG.tiers[0],0x8a321b)',
  'bowl(CFG.tiers[1],0x16294f)',
  'active?0xffffff:0xb8b8b8'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-23 aerial stadium style: output marker missing: ${marker}`);
}

for (const forbidden of [
  'active?0xffffff:0x505050',
  'bowl(CFG.tiers[0],0x373a3b)',
  'bowl(CFG.tiers[1],0x30353b)'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-23 aerial stadium style: legacy visual marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 23 aligned the existing 3D stadium materials with the aerial reference without changing geometry, seat IDs, camera, mapping, interaction, or responsive UI');

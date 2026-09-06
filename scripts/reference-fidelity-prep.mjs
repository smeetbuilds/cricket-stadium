import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

const helperMarker = '    function architecturalFacadeWall(';
const extrasMarker = '    function extras(){';
const roofMarker = '    function roof(){';
const helperStart = html.indexOf(helperMarker);
const extrasStart = html.indexOf(extrasMarker, helperStart);

if (helperStart < 0 || extrasStart < 0) {
  throw new Error('Phase-27 prep: Phase 26 architectural helper block was not found');
}

const helpers = html.slice(helperStart, extrasStart);
html = html.slice(0, helperStart) + html.slice(extrasStart);

const roofStart = html.indexOf(roofMarker);
if (roofStart < 0) throw new Error('Phase-27 prep: roof function marker was not found');
if (!helpers.includes('function architecturalPavilion(){') || !helpers.includes('function architecturalFidelity(){')) {
  throw new Error('Phase-27 prep: architectural helper block is incomplete');
}

html = html.slice(0, roofStart) + helpers + html.slice(roofStart);
await writeFile(outputPath, html, 'utf8');
console.log('Phase 27 prep moved Phase 26 architectural helpers ahead of roof replacement without changing runtime behavior');

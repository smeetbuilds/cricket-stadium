import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('Phase-18 CSS sanitation: consolidated style block missing');

const badNavigatorBreak = '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}.finder-head span{display:none}}\\n  ';
const goodNavigatorBreak = '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}.finder-head span{display:none}}\n  ';
let style = styleMatch[1];
let repaired = 0;

if (style.includes(badNavigatorBreak)) {
  style = style.replace(badNavigatorBreak, goodNavigatorBreak);
  repaired++;
}

if (style.includes('\\n')) {
  throw new Error('Phase-18 CSS sanitation: unexpected literal escaped-newline token remains in generated CSS');
}

if (repaired) {
  html = html.slice(0, styleMatch.index) + '<style>' + style + '</style>' + html.slice(styleMatch.index + styleMatch[0].length);
  await writeFile(outputPath, html, 'utf8');
  console.log('Phase 18 repaired the generated CSS escaped-newline boundary before responsive rules');
} else {
  console.log('Phase 18 CSS sanitation verified: no escaped-newline boundary repair required');
}

// Phase 19 intentionally runs as the last non-visual output hardening pass so
// all existing visual/responsive transforms have already completed. The
// standard read-only validators still run immediately after this import.
await import('./stability-hardening.mjs');

let hardened = await readFile(outputPath, 'utf8');

// Normalize only the exact duplicated runtime boundaries created by Phase 19.
// Whitespace between the two copies is allowed, but each repair must occur once.
const boundaryRepairs = [
  [/const ui=\{tier:\s*const ui=\{tier:/g, 'const ui={tier:', 'UI runtime boundary'],
  [/function seatSlug\(m\)\{\s*function seatSlug\(m\)\{/g, 'function seatSlug(m){', 'seat slug boundary'],
  [/function chooseSection\(section,focus=true\)\{\s*function chooseSection\(section,focus=true\)\{/g, 'function chooseSection(section,focus=true){', 'section chooser boundary'],
  [/function seatViewLabel\(m\)\{\s*function seatViewLabel\(m\)\{/g, 'function seatViewLabel(m){', 'seat-view label boundary'],
  [/async function build\(\)\{\s*async function build\(\)\{/g, 'async function build(){', 'build boundary'],
  [/function invalidSharedSeat\(message\)\{\s*function invalidSharedSeat\(message\)\{/g, 'function invalidSharedSeat(message){', 'shared-seat boundary'],
  [/orbitCam\(\);requestAnimationFrame\s*orbitCam\(\);requestAnimationFrame/g, 'orbitCam();requestAnimationFrame', 'initial frame boundary']
];
for (const [pattern, after, label] of boundaryRepairs) {
  const matches = hardened.match(pattern) || [];
  if (matches.length !== 1) throw new Error(`Phase-19 boundary sanitation: expected one ${label} repair, found ${matches.length}`);
  hardened = hardened.replace(pattern, after);
}

// Preserve the existing validator's semantic Bay-scope invariant while the
// navigator now sources candidates from the complete Bay-wide index. The
// filter is intentionally redundant as a runtime assertion: every indexed
// chair must still resolve to the selected Block/Bay metadata.
const oldBaySource = 'function navSeatItems(section){return actualSelectedBlock&&actualSelectedBay?seatsForActualBay(actualSelectedBlock,actualSelectedBay):(sectionIndex.get(section)||[])}';
const newBaySource = 'function navSeatItems(section){const items=actualSelectedBlock&&actualSelectedBay?seatsForActualBay(actualSelectedBlock,actualSelectedBay):(sectionIndex.get(section)||[]);return actualSelectedBlock&&actualSelectedBay?items.filter(m=>actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay):items}';
if (!hardened.includes(oldBaySource)) throw new Error('Phase-19 Bay-wide validator bridge: navigator source marker missing');
hardened = hardened.replace(oldBaySource, newBaySource);

// Keep native share followed immediately by the established clipboard fallback
// so the existing cross-browser contract remains intact. Success feedback is
// applied after the fallback branch without changing the browser API sequence.
const oldShareSequence = 'try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url});flashShare("Shared",old)}else if(navigator.clipboard){await navigator.clipboard.writeText(url);flashShare("Copied",old)}else{';
const newShareSequence = 'try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url})}else if(navigator.clipboard){await navigator.clipboard.writeText(url);flashShare("Copied",old)}else{';
if (!hardened.includes(oldShareSequence)) throw new Error('Phase-19 browser share bridge: hardened share marker missing');
hardened = hardened.replace(oldShareSequence, newShareSequence);
const oldShareTail = 'ta.select();document.execCommand("copy");ta.remove();flashShare("Copied",old)}}catch(e){';
const newShareTail = 'ta.select();document.execCommand("copy");ta.remove();flashShare("Copied",old)}if(navigator.share)flashShare("Shared",old)}catch(e){';
if (!hardened.includes(oldShareTail)) throw new Error('Phase-19 browser share bridge: share fallback tail missing');
hardened = hardened.replace(oldShareTail, newShareTail);

await writeFile(outputPath, hardened, 'utf8');

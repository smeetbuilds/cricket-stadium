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

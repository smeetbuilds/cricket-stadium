import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_STAGES, TRANSFORM_STAGES, VALIDATION_STAGES } from './pipeline-stages.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptsDir, '..');
const outputPath = resolve(root, 'dist', 'index.html');
const packagePath = resolve(root, 'package.json');
const html = await readFile(outputPath, 'utf8');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));

function fail(message) {
  throw new Error(`Phase-16 consolidated regression: ${message}`);
}
function count(pattern) {
  return (html.match(pattern) || []).length;
}
function need(pattern, label) {
  if (!pattern.test(html)) fail(`missing shared runtime invariant: ${label}`);
}

const expectedTransforms = [
  'build.mjs',
  'apply-row-map.mjs',
  'fix-seat-orientation.mjs',
  'fix-seat-switch.mjs',
  'fix-ground-rendering.mjs',
  'upgrade-turf-material.mjs',
  'refine-cricket-pitch.mjs',
  'optimize-shadows.mjs',
  'optimize-display.mjs',
  'optimize-render-loop.mjs',
  'optimize-runtime.mjs',
  'optimize-responsive.mjs',
  'harden-browser-runtime.mjs'
];
const expectedValidators = [
  'validate-ui-ux.mjs',
  'validate-responsive.mjs',
  'validate-performance.mjs',
  'validate-browser-runtime.mjs',
  'validate-regression-suite.mjs'
];

if (pkg.scripts?.build !== 'node scripts/build-pipeline.mjs') fail('package build command bypasses the consolidated pipeline');
if (JSON.stringify(TRANSFORM_STAGES) !== JSON.stringify(expectedTransforms)) fail('transform order changed');
if (JSON.stringify(VALIDATION_STAGES) !== JSON.stringify(expectedValidators)) fail('validator order changed');
if (new Set(ALL_STAGES).size !== ALL_STAGES.length) fail('duplicate stage in pipeline manifest');
if (ALL_STAGES.length !== expectedTransforms.length + expectedValidators.length) fail('unexpected pipeline stage count');
for (const stage of ALL_STAGES) {
  if (!existsSync(resolve(scriptsDir, stage))) fail(`pipeline references missing scripts/${stage}`);
}

if (!/^<!--\n\s*Motera 3D/m.test(html)) fail('license/attribution header is no longer first');
if (count(/<!doctype html>/gi) !== 1) fail('expected exactly one doctype');
if (count(/<html\b/gi) !== 1 || count(/<\/html>/gi) !== 1) fail('HTML root structure is malformed');
if (count(/<head\b/gi) !== 1 || count(/<\/head>/gi) !== 1) fail('head structure is malformed');
if (count(/<body\b/gi) !== 1 || count(/<\/body>/gi) !== 1) fail('body structure is malformed');
if (count(/<style>/g) !== 1 || count(/<\/style>/g) !== 1) fail('expected one consolidated style block');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inlineScripts = scripts.map(match => match[1]).filter(code => code.trim());
if (inlineScripts.length !== 1) fail(`expected one inline application script, got ${inlineScripts.length}`);
try {
  new Function(inlineScripts[0]);
} catch (error) {
  fail(`final generated application JavaScript does not compile: ${error.message}`);
}

const sharedRuntime = [
  [/const\s+actualNavDegFromAngle\s*=\s*a\s*=>\s*actualWrapDeg\(THREE\.MathUtils\.radToDeg\(a\)\)/, 'Block/Bay orientation mapping'],
  [/actualSeatMeta\(m\)\.blockId\s*===\s*actualSelectedBlock\s*&&\s*actualSeatMeta\(m\)\.bay\s*===\s*actualSelectedBay/, 'bay-scoped generated seats'],
  [/function\s+moveSeatCameraTo\(m,\s*duration\s*=\s*reduced\s*\?\s*0\s*:\s*\.72\)/, 'live seat camera transition'],
  [/if\s*\(seatMode\)\s*moveSeatCameraTo\(m\)/, 'in-place seat switching'],
  [/ray\.ray\.intersectsSphere\(sphere\)/, 'raycast sphere prefilter'],
  [/renderer\.shadowMap\.autoUpdate\s*=\s*false/, 'static shadow-map policy'],
  [/async\s+function\s+seats\(t\)/, 'chunked asynchronous seat construction'],
  [/function\s+renderPixelRatio\(\)/, 'bounded device DPR policy'],
  [/function\s+requestRender\(\)/, 'dirty WebGL invalidation'],
  [/function\s+requestMinimap\(\)/, 'dirty minimap invalidation'],
  [/document\.addEventListener\("visibilitychange"/, 'hidden-tab recovery'],
  [/addEventListener\("pageshow"/, 'BFCache recovery'],
  [/canvas\.addEventListener\("webglcontextrestored"/, 'WebGL context restoration'],
  [/canvas\.addEventListener\("lostpointercapture"/, 'pointer-capture recovery']
];
for (const [pattern, label] of sharedRuntime) need(pattern, label);

const forbiddenBuildLeakage = [
  ['TEMP INTERNAL', 'temporary commit/debug marker'],
  ['TEMP-DO-NOT-USE', 'temporary deployment marker'],
  ['DO NOT USE', 'temporary deployment marker'],
  ['console.trace(', 'debug trace'],
  ['debugger;', 'debugger statement']
];
for (const [needle, label] of forbiddenBuildLeakage) {
  if (html.includes(needle)) fail(`${label} leaked into production output`);
}

console.log(
  `Phase 16 consolidated regression suite validated: ${TRANSFORM_STAGES.length} ordered transforms, ` +
  `${VALIDATION_STAGES.length} ordered read-only validators, final generated JS syntax, document structure and shared cross-phase runtime invariants`
);

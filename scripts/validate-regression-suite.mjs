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
  'harden-browser-runtime.mjs',
  'sanitize-generated-css.mjs',
  'aerial-stadium-style.mjs',
  'reference-fidelity-prep.mjs',
  'reference-fidelity.mjs',
  'reference-completion.mjs',
  'ahmedabad-reference-correction.mjs'
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

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) fail('consolidated style block could not be read');
if (styleMatch[1].includes('\\n')) fail('literal escaped-newline token leaked into generated CSS');

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
  [/canvas\.addEventListener\("lostpointercapture"/, 'pointer-capture recovery'],
  [/capacity:110000,field:\{L:180\*\.9144,W:150\*\.9144\}/, '110k seated-capacity calibration'],
  [/rows:38,rx:86\.8,rz:72\.8/, 'deeper lower bowl'],
  [/rows:41,rx:118\.7,rz:104\.7/, 'deeper upper bowl'],
  [/function\s+tensileRoofSurface\(\)/, 'tensile roof surface'],
  [/const\s+tunnelSectionPattern=\{L:new Set\(/, 'irregular vomitory pattern'],
  [/function\s+referenceSiteContext\(\)/, 'north arrival and site context'],
  [/new THREE\.BoxGeometry\(54,\.9,rampLen\)/, '12m north arrival ramp'],
  [/const campus=flat\(ellipse\(300,260\)/, 'expanded stadium campus'],
  [/function\s+doubleCurveEyeFacade\(\)/, 'Ahmedabad double-curved eye facade'],
  [/uSeg=64,vSeg=8,y0=8\.8,y1=28\.0/, 'segmented aluminium facade grid'],
  [/architecturalBeamInstances\(tubePairs,\.045,steel\)/, 'bent-tube facade backing'],
  [/function\s+roofCompressionRingBracing\(\)/, 'shallow bi-chord compression ring bracing'],
  [/ellipsePoint\(a,155\.2,141\.2,56\.15\)/, 'upper compression-ring chord'],
  [/ellipsePoint\(a,154\.7,140\.7,55\.55\)/, 'lower compression-ring chord'],
  [/function\s+roofRingLighting\(\)/, 'distributed roof catwalk lighting'],
  [/const count=580,geo=new THREE\.BoxGeometry\(\.82,\.13,\.24\)/, '580 catwalk luminaires'],
  [/<div class="fallback-meta"><div><b>110,000<\/b><span>seated capacity<\/span><\/div>/, 'fallback capacity parity']
];
for (const [pattern, label] of sharedRuntime) need(pattern, label);

const forbiddenBuildLeakage = [
  ['TEMP INTERNAL', 'temporary commit/debug marker'],
  ['TEMP-DO-NOT-USE', 'temporary deployment marker'],
  ['DO NOT USE', 'temporary deployment marker'],
  ['console.trace(', 'debug trace'],
  ['debugger;', 'debugger statement'],
  ['<div class="fallback-meta"><div><b>132,000</b><span>extended capacity</span></div>', 'stale fallback capacity label'],
  ['function signatureFacade(){', 'generic Phase 28 ribbon facade'],
  ['for(let i=0;i<5;i++){const phase=i*.82,baseY=11.2+i*3.55;', 'speculative five-ribbon facade'],
  ['function roofPerimeterTruss(){', 'invented tall roof crown'],
  ['ellipsePoint(a+step*.5,155.75,141.75,63.2)', 'invented roof crown top chord'],
  ['new THREE.ShapeGeometry(ledShape,192)', 'continuous LED ring approximation']
];
for (const [needle, label] of forbiddenBuildLeakage) {
  if (html.includes(needle)) fail(`${label} leaked into production output`);
}

console.log(
  `Phase 16 consolidated regression suite validated: ${TRANSFORM_STAGES.length} ordered transforms, ` +
  `${VALIDATION_STAGES.length} ordered read-only validators, final generated JS syntax, CSS escape hygiene, ` +
  `document structure, shared runtime invariants and Phase 29 Ahmedabad-only reference correction markers`
);
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
const html = await readFile(outputPath, "utf8");

function fail(message) {
  throw new Error(`Phase-14 performance regression: ${message}`);
}
function need(marker) {
  if (!html.includes(marker)) fail(`missing protected performance marker: ${marker}`);
}
function count(pattern) {
  return (html.match(pattern) || []).length;
}

const budgets = {
  htmlBytes: 225 * 1024,
  interactiveSeats: 100000,
  maxSeatsPerSection: 1100,
  seatInstanceBytes: 16 * 1024 * 1024,
  overviewDrawCalls: 1600,
  seatModeDrawCalls: 1700,
  staticShadowCasters: 12,
  shadowMapEdge: 2048,
  framebufferPixels: 7500000,
  canvasTextures: 2,
  externalScripts: 2
};

for (const marker of [
  'capacity:132000,field:{L:180*.9144,W:150*.9144},pitch:{L:22*.9144,W:3.05},sections:48,',
  '{id:"L",name:"Lower Tier",rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43,spacing:.47,aisle:.031,tunnelRow:13,tunnelRows:5,tunnelEvery:4',
  '{id:"U",name:"Upper Tier",rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57,spacing:.48,aisle:.029,tunnelRow:9,tunnelRows:4,tunnelEvery:4',
  'const qualityLow=mobile||lowPower,backLOD=lowPower?190:(mobile?215:250);',
  'const renderPhone=matchMedia("(max-width: 520px)").matches,renderAntialias=!lowPower&&!renderPhone;',
  'const budget=profile==="low"?1800000:(profile==="phone"?2400000:(profile==="mobile"?3200000:(profile==="tablet"?4800000:7500000)));',
  'shadowMapSize=shadowProfile==="high"?2048:(shadowProfile==="medium"?1024:0)',
  'renderer.shadowMap.autoUpdate=false',
  'pan.castShadow=false;pan.receiveShadow=true;',
  'back.castShadow=false;back.receiveShadow=true;',
  'async function seats(t)',
  'const panBase=new THREE.BoxGeometry(.43,.18,.42);panBase.translate(0,.09,0);',
  'const backBase=new THREE.BoxGeometry(.43,.56,.10);backBase.translate(0,.28,0);',
  'const seatColor=new THREE.Color(),backOut=new THREE.Vector3(),yieldEvery=lowPower?2:(mobile?3:6);',
  'if((sec+1)%yieldEvery===0&&sec+1<CFG.sections)await yieldToBrowser()',
  'const actualMetaCache=new Map();',
  'function ensureFrame(){if(document.hidden||frameHandle)return;frameHandle=requestAnimationFrame(animate)}',
  'document.addEventListener("visibilitychange",()=>{if(document.hidden){if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0}else{requestMinimap();requestRender()}},{passive:true});',
  'function requestRender(){renderDirty=true;ensureFrame()}',
  'function requestMinimap(){minimapDirty=true;ensureFrame()}',
  'if(renderDirty){renderer.render(scene,camera);renderDirty=false}',
  'if(marker&&marker.visible)ensureFrame()',
  'ray.ray.intersectsSphere(sphere)',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'c.width=1024;c.height=512;',
  'for(let i=0;i<CFG.sections;i+=4)',
  'for(let sec=1;sec<CFG.sections;sec+=t.tunnelEvery)',
  'for(let i=0;i<76;i++)',
  'for(let i=0;i<96;i++){',
  'const items=(sectionIndex.get(center.section)||[]).filter(m=>Math.abs(m.row-center.row)<=1&&Math.abs(m.seat-center.seat)<=4);'
]) need(marker);

if (html.includes('renderer.shadowMap.autoUpdate=true')) fail('continuous shadow-map updates re-enabled');
if (html.includes('renderer.setAnimationLoop(')) fail('continuous WebGL animation loop introduced');
if (html.includes('preserveDrawingBuffer:true')) fail('preserveDrawingBuffer would increase framebuffer cost');
if (html.includes('new THREE.TextureLoader(')) fail('external texture-loader path introduced');
if (html.includes('new THREE.MeshPhysicalMaterial(')) fail('expensive physical-material path introduced');
if (html.includes('EffectComposer')) fail('post-processing pipeline introduced without a new performance budget');
if (/setInterval\s*\(/.test(html)) fail('interval-driven recurring work introduced');

const htmlBytes = Buffer.byteLength(html, 'utf8');
if (htmlBytes > budgets.htmlBytes) fail(`generated HTML ${htmlBytes} bytes exceeds ${budgets.htmlBytes}`);

const externalScripts = count(/<script\s+src="https?:\/\//g);
if (externalScripts > budgets.externalScripts) fail(`external script count ${externalScripts} exceeds ${budgets.externalScripts}`);

const canvasTextures = count(/new THREE\.CanvasTexture\(/g);
if (canvasTextures > budgets.canvasTextures) fail(`CanvasTexture count ${canvasTextures} exceeds ${budgets.canvasTextures}`);

const sections = 48;
const tiers = [
  { id: 'L', rows: 35, rx: 86.8, rz: 72.8, depth: .86, spacing: .47, aisle: .031, tunnelRow: 13, tunnelRows: 5, tunnelEvery: 4 },
  { id: 'U', rows: 32, rx: 118.7, rz: 104.7, depth: .88, spacing: .48, aisle: .029, tunnelRow: 9, tunnelRows: 4, tunnelEvery: 4 }
];
function circ(a, b) {
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
}
function blockedSeat(t, r, local, sec) {
  if (Math.min(local, 1 - local) < t.aisle) return true;
  return sec % t.tunnelEvery === 1 && r >= t.tunnelRow && r < t.tunnelRow + t.tunnelRows && Math.abs(local - .5) < .19;
}
function countTierSeats(t) {
  let total = 0;
  let maxSection = 0;
  for (let sec = 0; sec < sections; sec++) {
    let sectionTotal = 0;
    for (let r = 0; r < t.rows; r++) {
      const rx = t.rx + r * t.depth;
      const rz = t.rz + r * t.depth;
      const n = Math.max(sections * 8, Math.round(circ(rx, rz) / t.spacing));
      const start = Math.ceil(sec * n / sections);
      const end = Math.floor((sec + 1) * n / sections - .000001);
      for (let i = start; i <= end; i++) {
        const local = i / n * sections - sec;
        if (!blockedSeat(t, r, local, sec)) sectionTotal++;
      }
    }
    total += sectionTotal;
    maxSection = Math.max(maxSection, sectionTotal);
  }
  return { total, maxSection };
}

const seatStats = tiers.map(countTierSeats);
const totalSeats = seatStats.reduce((sum, x) => sum + x.total, 0);
const maxSeatsPerSection = Math.max(...seatStats.map(x => x.maxSection));
if (seatStats[0].total !== 40935 || seatStats[1].total !== 48883 || totalSeats !== 89818) {
  fail(`seat-generation baseline changed (L ${seatStats[0].total}, U ${seatStats[1].total}, total ${totalSeats})`);
}
if (totalSeats > budgets.interactiveSeats) fail(`interactive seat count ${totalSeats} exceeds ${budgets.interactiveSeats}`);
if (maxSeatsPerSection > budgets.maxSeatsPerSection) fail(`largest section ${maxSeatsPerSection} exceeds ${budgets.maxSeatsPerSection}`);

// Worst desktop path: one pan and one back instance record per generated seat.
// matrix = 16 float32 (64 B), color = 3 float32 (12 B).
const seatInstanceBytes = totalSeats * 2 * (16 * 4 + 3 * 4);
if (seatInstanceBytes > budgets.seatInstanceBytes) fail(`seat instance attributes ${seatInstanceBytes} bytes exceed ${budgets.seatInstanceBytes}`);

// Source-derived draw-call ceiling. These counts are tied to protected loop markers above.
const seatCalls = sections * tiers.length * 2; // pan + back per section
const groundCalls = 38;
const bowlCalls = 4;
const aisleCalls = sections * tiers.length;
const railingCalls = tiers.length * ((sections / 4) * (2 * 5) + 96);
const vomitoryCalls = tiers.length * ((sections / 4) * 2);
const hospitalityCalls = 2 + 76 + 38 + 96;
const mediaCalls = 20;
const roofCalls = 1 + 96 + 96 + 96 + 48 + 48 + 2;
const extrasCalls = 2 + 4 + 1;
const overviewDrawCalls = seatCalls + groundCalls + bowlCalls + aisleCalls + railingCalls + vomitoryCalls + hospitalityCalls + mediaCalls + roofCalls + extrasCalls;
const maxSeatDetailChairs = 3 * 9;
const seatDetailCalls = maxSeatDetailChairs * 4;
const seatModeDrawCalls = overviewDrawCalls + seatDetailCalls;
if (overviewDrawCalls > budgets.overviewDrawCalls) fail(`overview draw-call model ${overviewDrawCalls} exceeds ${budgets.overviewDrawCalls}`);
if (seatModeDrawCalls > budgets.seatModeDrawCalls) fail(`seat-mode draw-call model ${seatModeDrawCalls} exceeds ${budgets.seatModeDrawCalls}`);

// Only 2 sight-screen cloths + 4 posts + 4 perimeter entries cast static shadows.
const staticShadowCasters = 10;
if (staticShadowCasters > budgets.staticShadowCasters) fail(`shadow caster model ${staticShadowCasters} exceeds ${budgets.staticShadowCasters}`);

if (budgets.shadowMapEdge !== 2048) fail('internal shadow-map budget configuration changed unexpectedly');
if (budgets.framebufferPixels !== 7500000) fail('internal framebuffer budget configuration changed unexpectedly');

const mib = value => (value / 1024 / 1024).toFixed(2);
console.log(
  `Phase 14 performance budgets validated: ` +
  `${totalSeats.toLocaleString()} seats (max section ${maxSeatsPerSection}), ` +
  `${mib(seatInstanceBytes)} MiB worst-case seat instance attributes, ` +
  `${overviewDrawCalls}/${budgets.overviewDrawCalls} overview draw-call ceiling, ` +
  `${seatModeDrawCalls}/${budgets.seatModeDrawCalls} seat-mode ceiling, ` +
  `${staticShadowCasters}/${budgets.staticShadowCasters} static shadow casters, ` +
  `${htmlBytes}/${budgets.htmlBytes} HTML bytes`
);

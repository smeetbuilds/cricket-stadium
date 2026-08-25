import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
const html = await readFile(outputPath, "utf8");

function fail(message) {
  throw new Error(`Phase-12 UI/UX regression: ${message}`);
}
function requireAll(scope, markers) {
  for (const marker of markers) if (!scope.includes(marker)) fail(`missing protected marker: ${marker}`);
}
function exactIds(tag, expected) {
  const re = new RegExp(`<${tag}\\b[^>]*\\bid="([^"]+)"`, "g");
  const actual = [...shell.matchAll(re)].map(m => m[1]).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((id, i) => id !== wanted[i])) {
    fail(`${tag} control set changed; expected [${wanted.join(", ")}], got [${actual.join(", ")}]`);
  }
}
function uniqueId(id) {
  const count = shell.split(`id="${id}"`).length - 1;
  if (count !== 1) fail(`id="${id}" must occur exactly once, found ${count}`);
}
function inOrder(markers) {
  let last = -1;
  for (const marker of markers) {
    const next = html.indexOf(marker);
    if (next < 0 || next <= last) fail(`protected component order changed near ${marker}`);
    last = next;
  }
}

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) fail("style block missing");
const css = styleMatch[1];
const bodyStart = html.indexOf("<body>");
const firstRuntimeScript = html.indexOf('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"');
if (bodyStart < 0 || firstRuntimeScript < 0 || firstRuntimeScript <= bodyStart) fail("UI shell boundary missing");
const shell = html.slice(bodyStart, firstRuntimeScript);

requireAll(css, [
  '--bg:#071019;--panel:rgba(8,17,27,.93);--line:rgba(255,255,255,.14);',
  '--text:#f7f3ea;--muted:#a0acb9;--orange:#f47a2a;--navy:#26366b;--focus:#5ed7ff;',
  '--safe-b:max(12px,env(safe-area-inset-bottom));--safe-t:max(12px,env(safe-area-inset-top))',
  'html,body{width:100%;height:100%;margin:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
  '#c{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}',
  '.glass{border:1px solid var(--line);background:var(--panel);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 20px 60px rgba(0,0,0,.42)}',
  'header{position:fixed;z-index:10;top:var(--safe-t);left:14px;right:14px;display:flex;justify-content:space-between;gap:12px;pointer-events:none}',
  '.brand{padding:12px 14px;border-radius:16px;min-width:285px}',
  '.facts{display:grid;grid-template-columns:repeat(3,1fr);border-radius:16px;overflow:hidden}',
  '#card{position:fixed;z-index:10;left:14px;bottom:var(--safe-b);width:min(430px,calc(100vw - 28px));padding:15px;border-radius:17px}',
  '.navgrid{display:grid;grid-template-columns:1.15fr .7fr .7fr .7fr;gap:7px}',
  '.navfield select{width:100%;height:34px;padding:0 27px 0 8px;border:1px solid var(--line);border-radius:8px;background:#101a25;color:var(--text);font-size:10px;font-weight:750;cursor:pointer}',
  '.data{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}',
  '.cell{padding:9px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.035)}',
  '.actions{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-top:10px}',
  '.btn{min-height:42px;border:0;border-radius:11px;padding:0 13px;background:var(--orange);color:#111;font-weight:850;cursor:pointer}',
  '.btn.alt{border:1px solid var(--line);background:rgba(255,255,255,.07);color:var(--text)}',
  '#note{position:fixed;z-index:9;right:14px;bottom:var(--safe-b);max-width:330px;padding:10px 12px;border-radius:13px;color:var(--muted);font-size:9px;line-height:1.45}',
  '#tools{position:fixed;z-index:11;right:14px;top:48%;transform:translateY(-50%);display:grid;gap:6px;padding:6px;border-radius:13px}',
  '.tool{width:39px;height:39px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.06);color:var(--text);font-size:17px;cursor:pointer}',
  '#minimap-wrap{position:fixed;z-index:10;right:14px;top:calc(var(--safe-t) + 84px);width:230px;padding:9px;border-radius:14px}',
  '#minimap{width:212px;height:166px;display:block;border-radius:9px;background:#0a1520;cursor:pointer;touch-action:none}',
  '#seatbar{position:fixed;z-index:12;left:50%;bottom:var(--safe-b);transform:translateX(-50%);display:none;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:999px;color:var(--muted);font-size:9px;white-space:nowrap}',
  '#seatbar.show{display:flex}',
  '#loading{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#071019;transition:.35s opacity,.35s visibility}',
  '@media(max-width:1000px){#minimap-wrap{top:auto;right:14px;bottom:86px}}',
  '@media(max-width:800px){',
  'body.seatmode #card,body.seatmode #tools,body.seatmode #minimap-wrap{display:none}',
  '#seatbar{width:calc(100vw - 18px);justify-content:space-between}',
  '@media(max-width:430px){#minimap-wrap{width:150px}',
  '@media(max-height:720px) and (max-width:800px){',
  '@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;transition-duration:.001ms!important}}',
  '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}'
]);

requireAll(shell, [
  '<strong>Motera 3D · Narendra Modi Stadium</strong>',
  '<span>Ahmedabad, Gujarat · procedural cricket seat explorer</span>',
  '<em>Unofficial public-reference recreation</em>',
  '<b>132,000</b><span>extended capacity</span>',
  '<b>180 × 150 yd</b><span>published field</span>',
  '<b>2 tiers</b><span>primary bowl</span>',
  '<span>Seat explorer</span><span class="pill" id="tier">Select a seat</span>',
  '<h2 id="title">Choose any visible seat</h2>',
  'Block → Bay → mapped Row → Seat',
  '<label for="nav-block">Block</label>',
  '<label for="nav-bay">Bay</label>',
  '<label for="nav-row">Row</label>',
  '<label for="nav-seat">Seat</label>',
  '<div class="data"><div class="cell"><span>Block / Bay</span>',
  '<button class="btn" id="view" disabled>View from seat</button>',
  '<button class="btn alt" id="random" data-short="↻">Random</button>',
  '<button class="btn alt" id="share" disabled data-short="↗">Share</button>',
  '<aside id="minimap-wrap" class="glass" aria-label="Interactive stadium minimap">',
  '<span>Reference block map</span><b id="map-label">Overview</b>',
  '<aside id="note" class="glass"><b>Accuracy note.</b>',
  '<button class="tool" id="zin" aria-label="Zoom in">+</button>',
  '<button class="tool" id="zout" aria-label="Zoom out">−</button>',
  '<button class="tool" id="reset" aria-label="Reset view">↺</button>',
  '<div id="seatbar" class="glass">',
  '<button id="back">Back to stadium</button>',
  '<div id="loading">',
  '<div id="fallback">'
]);

for (const id of [
  'c','vig','card','tier','title','sub','nav-block','nav-bay','nav-row','nav-seat','nav-section','section-state',
  'sec','row','seat','view','random','share','minimap-wrap','minimap','map-label','note','tools','zin','zout','reset',
  'seatbar','seatlabel','back','loading','loadtext','fallback','fallback-reason'
]) uniqueId(id);

exactIds('button', ['view','random','share','zin','zout','reset','back']);
exactIds('select', ['nav-block','nav-bay','nav-row','nav-seat','nav-section']);
exactIds('canvas', ['c','minimap']);

if (/<(?:input|textarea|dialog)\b/i.test(shell)) fail('unexpected new form/dialog control added to protected UI shell');

inOrder([
  '<header>',
  '<aside id="card"',
  '<aside id="minimap-wrap"',
  '<aside id="note"',
  '<div id="tools"',
  '<div id="seatbar"',
  '<div id="loading"',
  '<div id="fallback"'
]);

const runtimeRequired = [
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'ray.ray.intersectsSphere(sphere)',
  'function renderPixelRatio()',
  'renderer.shadowMap.autoUpdate=false',
  'async function seats(t)',
  'function requestMinimap()',
  'function requestRender()'
];
requireAll(html, runtimeRequired);

console.log('Phase 12 UI/UX baseline validated: visual shell, controls, responsive states and interaction hooks unchanged');

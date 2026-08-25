import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
const html = await readFile(outputPath, "utf8");
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('Phase-13 responsive validation: style block missing');
const css = styleMatch[1];

function fail(message) {
  throw new Error(`Phase-13 responsive regression: ${message}`);
}
function need(marker) {
  if (!css.includes(marker) && !html.includes(marker)) fail(`missing ${marker}`);
}

for (const marker of [
  '/* Phase 13 responsive matrix */',
  '@media(max-height:720px) and (max-width:800px){#minimap-wrap{display:none}}',
  '@media(orientation:landscape) and (max-height:700px) and (max-width:1180px){',
  '.brand{width:auto;min-width:0;max-width:calc(100vw - 78px);padding:8px 10px}',
  '#card{left:9px;right:auto;bottom:max(9px,env(safe-area-inset-bottom));width:min(430px,calc(100vw - 78px));padding:9px;max-height:calc(100vh - 58px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}',
  '#tools{right:9px;top:50%}',
  '@media(orientation:landscape) and (max-height:700px) and (min-width:1181px){#tools{right:258px}}',
  '@media(max-width:800px){',
  '@media(max-width:430px){#minimap-wrap{width:150px}',
  '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}',
  'body.seatmode #card,body.seatmode #tools,body.seatmode #minimap-wrap{display:none}',
  'function renderPixelRatio()',
  'renderer.setPixelRatio(renderPixelRatio())'
]) need(marker);

function dprPolicy(width, height, dpr, lowPower = false) {
  const compact = width <= 520;
  const mobile = width <= 820;
  const medium = width <= 1180;
  const profile = lowPower ? 'low' : compact ? 'phone' : mobile ? 'mobile' : medium ? 'tablet' : 'desktop';
  const cap = profile === 'low' ? 1 : profile === 'phone' ? 1.4 : profile === 'mobile' ? 1.5 : profile === 'tablet' ? 1.6 : 1.75;
  const budget = profile === 'low' ? 1800000 : profile === 'phone' ? 2400000 : profile === 'mobile' ? 3200000 : profile === 'tablet' ? 4800000 : 7500000;
  const byBudget = Math.sqrt(budget / Math.max(1, width * height));
  return { profile, cap, budget, ratio: Math.max(1, Math.min(Math.max(1, dpr || 1), cap, byBudget)) };
}

function layout(width, height) {
  const landscape = width > height;
  const mobileUi = width <= 800;
  const shortMobile = mobileUi && height <= 720;
  const compactLandscape = landscape && height <= 700 && width <= 1180;
  const wideShortLandscape = landscape && height <= 700 && width >= 1181;
  const cardLeft = compactLandscape || mobileUi ? 9 : 14;
  const cardWidth = compactLandscape ? Math.min(430, width - 78) : mobileUi ? width - 18 : Math.min(430, width - 28);
  const toolRight = compactLandscape ? 9 : wideShortLandscape ? 258 : mobileUi ? 9 : 14;
  const toolOuterWidth = 51;
  const toolLeft = width - toolRight - toolOuterWidth;
  const minimapVisible = !(shortMobile || compactLandscape);
  const minimapWidth = width <= 430 ? 150 : width <= 800 ? 180 : 230;
  const minimapRight = width <= 800 ? 9 : 14;
  const navColumns = width <= 520 ? 2 : 4;
  return {
    landscape, mobileUi, shortMobile, compactLandscape, wideShortLandscape,
    cardLeft, cardWidth, cardRight: cardLeft + cardWidth,
    toolRight, toolLeft, minimapVisible, minimapWidth, minimapRight, navColumns
  };
}

const matrix = [
  {name:'small phone portrait',w:320,h:568,dpr:2,expect:{shortMobile:true,compactLandscape:false,minimapVisible:false,navColumns:2}},
  {name:'phone portrait',w:390,h:844,dpr:3,expect:{shortMobile:false,compactLandscape:false,minimapVisible:true,navColumns:2}},
  {name:'large phone portrait',w:430,h:932,dpr:3,expect:{minimapVisible:true,navColumns:2}},
  {name:'phone landscape small',w:568,h:320,dpr:2,expect:{compactLandscape:true,minimapVisible:false,navColumns:4}},
  {name:'phone landscape classic',w:667,h:375,dpr:2,expect:{compactLandscape:true,minimapVisible:false,navColumns:4}},
  {name:'phone landscape modern',w:844,h:390,dpr:3,expect:{compactLandscape:true,minimapVisible:false,navColumns:4}},
  {name:'phone landscape large',w:932,h:430,dpr:3,expect:{compactLandscape:true,minimapVisible:false,navColumns:4}},
  {name:'short tablet landscape',w:1024,h:600,dpr:2,expect:{compactLandscape:true,minimapVisible:false,navColumns:4}},
  {name:'tablet portrait',w:768,h:1024,dpr:2,expect:{mobileUi:true,minimapVisible:true,navColumns:4}},
  {name:'mobile breakpoint exact',w:800,h:1280,dpr:2,expect:{mobileUi:true,minimapVisible:true,navColumns:4}},
  {name:'desktop css boundary',w:801,h:1280,dpr:2,expect:{mobileUi:false,minimapVisible:true,navColumns:4}},
  {name:'tablet landscape',w:1024,h:768,dpr:2,expect:{compactLandscape:false,minimapVisible:true,navColumns:4}},
  {name:'wide short laptop',w:1366,h:650,dpr:1.5,expect:{wideShortLandscape:true,minimapVisible:true,navColumns:4}},
  {name:'laptop',w:1366,h:768,dpr:1.5,expect:{wideShortLandscape:false,minimapVisible:true,navColumns:4}},
  {name:'retina laptop',w:1512,h:982,dpr:2,expect:{minimapVisible:true,navColumns:4}},
  {name:'desktop 1080p',w:1920,h:1080,dpr:1,expect:{minimapVisible:true,navColumns:4}},
  {name:'1440p hidpi',w:2560,h:1440,dpr:2,expect:{minimapVisible:true,navColumns:4}},
  {name:'4k hidpi',w:3840,h:2160,dpr:2,expect:{minimapVisible:true,navColumns:4}}
];

for (const c of matrix) {
  const l = layout(c.w, c.h);
  for (const [key, value] of Object.entries(c.expect)) {
    if (l[key] !== value) fail(`${c.name}: expected ${key}=${value}, got ${l[key]}`);
  }
  if (l.cardWidth <= 0 || l.cardRight > c.w) fail(`${c.name}: card escapes viewport (${l.cardRight}/${c.w})`);
  if (l.compactLandscape) {
    const gap = l.toolLeft - l.cardRight;
    if (gap < 8) fail(`${c.name}: compact landscape card/tool rail gap ${gap}px < 8px`);
  }
  if (l.minimapVisible && l.minimapWidth + l.minimapRight > c.w) {
    fail(`${c.name}: minimap escapes viewport`);
  }
  if (l.wideShortLandscape) {
    const minimapLeft = c.w - 14 - 230;
    const toolRightEdge = c.w - 258;
    if (minimapLeft - toolRightEdge < 12) fail(`${c.name}: relocated tools collide with minimap`);
  }
  const p = dprPolicy(c.w, c.h, c.dpr);
  if (p.ratio < 1 || p.ratio > p.cap + 1e-9 || p.ratio > c.dpr + 1e-9) {
    fail(`${c.name}: DPR ${p.ratio.toFixed(3)} violates profile ${p.profile}`);
  }
  const framebufferPixels = c.w * c.h * p.ratio * p.ratio;
  if (p.ratio > 1.000001 && framebufferPixels > p.budget * 1.001) {
    fail(`${c.name}: framebuffer ${Math.round(framebufferPixels)} exceeds ${p.profile} budget ${p.budget}`);
  }
}

const lowPower = dprPolicy(430, 932, 3, true);
if (lowPower.profile !== 'low' || lowPower.ratio !== 1) fail('low-power phone must stay at DPR 1');

for (const marker of [
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'ray.ray.intersectsSphere(sphere)',
  'async function seats(t)',
  'renderer.shadowMap.autoUpdate=false',
  'function requestRender()',
  'function requestMinimap()'
]) if (!html.includes(marker)) fail(`runtime invariant missing: ${marker}`);

console.log(`Phase 13 responsive matrix validated across ${matrix.length} viewport/DPR profiles`);

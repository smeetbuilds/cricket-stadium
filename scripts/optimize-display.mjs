import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) throw new Error(`Phase-9 patch target missing (${label}): ${before.slice(0, 180)}…`);
  html = html.replace(before, after);
}
function replaceAllExact(before, after, expected, label) {
  const count = html.split(before).length - 1;
  if (count !== expected) throw new Error(`Phase-9 patch target count mismatch (${label}): expected ${expected}, found ${count}`);
  html = html.split(before).join(after);
}

const protectedRequired = [
  'rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43',
  'rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57',
  'field:{L:180*.9144,W:150*.9144}',
  'pitch:{L:22*.9144,W:3.05}',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'activePitchMat=new THREE.MeshStandardMaterial({color:0xcab27a',
  'const circleDashCount=48',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'ray.ray.intersectsSphere(sphere)',
  'function drawMinimap()',
  'canvas.addEventListener("pointermove"',
  'if(pinchStart>8)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)',
  'renderer.shadowMap.autoUpdate=false',
  'opacity:.26,roughness:.26,metalness:.05,depthWrite:false,dithering:true',
  'new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false})',
  '<button class="btn" id="view" disabled>View from seat</button>',
  '<button id="back">Back to stadium</button>'
];
for (const required of protectedRequired) {
  if (!html.includes(required)) throw new Error(`Phase-9 protected invariant missing: ${required}`);
}

replaceExact(
`    const qualityLow=mobile||lowPower,backLOD=lowPower?190:(mobile?215:250);`,
`    const qualityLow=mobile||lowPower,backLOD=lowPower?190:(mobile?215:250);\n    const renderPhone=matchMedia("(max-width: 520px)").matches,renderAntialias=!lowPower&&!renderPhone;\n    function renderPixelRatio(){\n      const dpr=Math.max(1,window.devicePixelRatio||1),compact=matchMedia("(max-width: 520px)").matches,currentMobile=matchMedia("(max-width: 820px)").matches,medium=matchMedia("(max-width: 1180px)").matches;\n      const profile=lowPower?"low":(compact?"phone":(currentMobile?"mobile":(medium?"tablet":"desktop")));\n      const cap=profile==="low"?1:(profile==="phone"?1.4:(profile==="mobile"?1.5:(profile==="tablet"?1.6:1.75)));\n      const budget=profile==="low"?1800000:(profile==="phone"?2400000:(profile==="mobile"?3200000:(profile==="tablet"?4800000:7500000)));\n      const byBudget=Math.sqrt(budget/Math.max(1,innerWidth*innerHeight));\n      return Math.max(1,Math.min(dpr,cap,byBudget))\n    }`,
  'device-tier render resolution policy'
);

replaceExact(
  'new THREE.WebGLRenderer({canvas,antialias:!qualityLow,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false})',
  'new THREE.WebGLRenderer({canvas,antialias:renderAntialias,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false})',
  'renderer antialias policy'
);

replaceAllExact(
  'renderer.setPixelRatio(Math.min(devicePixelRatio||1,qualityLow?1.15:1.75))',
  'renderer.setPixelRatio(renderPixelRatio())',
  2,
  'initial and resize pixel ratio policy'
);

const required = [
  'const renderPhone=matchMedia("(max-width: 520px)").matches,renderAntialias=!lowPower&&!renderPhone',
  'function renderPixelRatio()',
  'const profile=lowPower?"low":(compact?"phone":(currentMobile?"mobile":(medium?"tablet":"desktop")))',
  'profile==="phone"?1.4',
  'profile==="mobile"?1.5',
  'profile==="tablet"?1.6',
  'profile==="low"?1800000',
  'profile==="phone"?2400000',
  'profile==="mobile"?3200000',
  'profile==="tablet"?4800000',
  '7500000',
  'antialias:renderAntialias',
  'renderer.setPixelRatio(renderPixelRatio())',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'renderer.shadowMap.autoUpdate=false',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  '@media(max-width:800px)',
  '@media(max-width:430px)'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Phase-9 invariant missing: ${marker}`);
}
for (const forbidden of [
  'antialias:!qualityLow',
  'renderer.setPixelRatio(Math.min(devicePixelRatio||1,qualityLow?1.15:1.75))',
  'renderer.setPixelRatio(devicePixelRatio||1)',
  'renderer.setPixelRatio(window.devicePixelRatio||1)'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-9 legacy/regression marker still present: ${forbidden}`);
}

validatePolicy();
await writeFile(outputPath, html, "utf8");
console.log('Optimized anti-aliasing and bounded device-tier pixel density without changing stadium UX');

function policyRatio(width, height, dpr, lowPower=false) {
  const compact=width<=520,currentMobile=width<=820,medium=width<=1180;
  const profile=lowPower?"low":(compact?"phone":(currentMobile?"mobile":(medium?"tablet":"desktop")));
  const cap=profile==="low"?1:(profile==="phone"?1.4:(profile==="mobile"?1.5:(profile==="tablet"?1.6:1.75)));
  const budget=profile==="low"?1800000:(profile==="phone"?2400000:(profile==="mobile"?3200000:(profile==="tablet"?4800000:7500000)));
  return Math.max(1,Math.min(Math.max(1,dpr||1),cap,Math.sqrt(budget/Math.max(1,width*height))));
}
function validatePolicy() {
  const cases=[
    ['low-power phone',390,844,3,true,1,1],
    ['high-DPI phone',430,932,3,false,1.39,1.401],
    ['tablet portrait',1024,1366,2,false,1.59,1.601],
    ['1080p Retina desktop',1920,1080,2,false,1.74,1.751],
    ['1440p high-DPI desktop',2560,1440,2,false,1.42,1.44],
    ['4K desktop',3840,2160,2,false,1,1.01]
  ];
  for(const [name,w,h,dpr,low,min,max] of cases){
    const value=policyRatio(w,h,dpr,low);
    if(value<min||value>max)throw new Error(`Phase-9 render policy regression (${name}): ${value}`);
  }
}

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Phase-4 turf patch target missing (${label}): ${before.slice(0, 180)}…`);
  }
  html = html.replace(before, after);
}

// ---------------------------------------------------------------------------
// Phase 4 baseline: this pass is turf rendering only.
// ---------------------------------------------------------------------------
// The stadium geometry, seating metadata, camera destinations, interaction
// system and responsive DOM/CSS are immutable. These guards intentionally
// duplicate the critical Phase 0-3 invariants so a turf refactor cannot ship if
// an unrelated system was accidentally removed upstream.
const protectedRequired = [
  'rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43',
  'rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57',
  'field:{L:180*.9144,W:150*.9144}',
  'pitch:{L:22*.9144,W:3.05}',
  'm.position.set(s*84.3,4.1,0)',
  'new THREE.PerspectiveCamera(45,innerWidth/innerHeight,2,700)',
  'camera.near=.05;camera.far=700;camera.fov=58;camera.updateProjectionMatrix()',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'ray.ray.intersectsSphere(sphere)',
  'function drawMinimap()',
  'ui.navSeat.addEventListener("change"',
  'canvas.addEventListener("pointermove"',
  'if(pinchStart>8)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)',
  '<button class="btn" id="view" disabled>View from seat</button>',
  '<button id="back">Back to stadium</button>'
];
for (const required of protectedRequired) {
  if (!html.includes(required)) throw new Error(`Phase-4 protected invariant missing: ${required}`);
}

// ---------------------------------------------------------------------------
// Phase 4.1-4.3: one deterministic turf surface + one turf material.
// ---------------------------------------------------------------------------
// Replace the old green ellipse plus eight transparent mowing-stripe planes with
// a single ellipse using a deterministic CanvasTexture. The visible field shape
// and y=.045 position remain identical. Alternating bands approximate the old
// mowing contrast, but are now baked into the material so there is no separate
// depth/sorting surface to flicker or shimmer.
const oldTurf = `      flat(ellipse(87,72),0x111a21,.01);flat(ellipse(CFG.field.L/2,CFG.field.W/2),0x267a3c,.045);
      const stripeMat=new THREE.MeshBasicMaterial({color:0x2f8748,transparent:true,opacity:.27,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),a=CFG.field.L/2,b=CFG.field.W/2;
      for(let i=-7;i<=7;i+=2){const x=i*10.4,n=clamp(x/a,-.999,.999),hh=b*Math.sqrt(1-n*n)*.97,m=new THREE.Mesh(new THREE.PlaneGeometry(9.4,hh*2),stripeMat);m.rotation.x=-Math.PI/2;m.position.set(x,.066,0);scene.add(m)}`;

const newTurf = `      flat(ellipse(87,72),0x111a21,.01);
      const turfW=qualityLow?512:1024,turfH=qualityLow?256:512,turfCanvas=document.createElement("canvas");turfCanvas.width=turfW;turfCanvas.height=turfH;
      const turfCtx=turfCanvas.getContext("2d"),mow=turfCtx.createLinearGradient(0,0,turfW,0),mowA="#267a3c",mowB="#297e40",mowBands=16,feather=.0018;
      mow.addColorStop(0,mowA);for(let i=1;i<mowBands;i++){const p=i/mowBands,prev=(i-1)%2?mowB:mowA,next=i%2?mowB:mowA;mow.addColorStop(Math.max(0,p-feather),prev);mow.addColorStop(Math.min(1,p+feather),next)}mow.addColorStop(1,(mowBands-1)%2?mowB:mowA);turfCtx.fillStyle=mow;turfCtx.fillRect(0,0,turfW,turfH);
      let turfSeed=0x4d4f5445;const turfRand=()=>((turfSeed=(Math.imul(turfSeed,1664525)+1013904223)>>>0)/4294967296),cellW=turfW/48,cellH=turfH/24;
      for(let gy=0;gy<24;gy++)for(let gx=0;gx<48;gx++){const n=turfRand(),a=.003+Math.abs(n-.5)*.012;turfCtx.fillStyle=n>.5?"rgba(255,255,255,"+a.toFixed(4)+")":"rgba(0,0,0,"+a.toFixed(4)+")";turfCtx.fillRect(gx*cellW,gy*cellH,cellW+1,cellH+1)}
      const turfTex=new THREE.CanvasTexture(turfCanvas),maxAniso=renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1;turfTex.generateMipmaps=true;turfTex.minFilter=THREE.LinearMipMapLinearFilter||THREE.LinearMipmapLinearFilter||THREE.LinearFilter;turfTex.magFilter=THREE.LinearFilter;turfTex.anisotropy=Math.max(1,Math.min(maxAniso,qualityLow?4:12));
      const turfGeo=new THREE.ShapeGeometry(ellipse(CFG.field.L/2,CFG.field.W/2),192),turfPos=turfGeo.getAttribute("position"),turfUv=new Float32Array(turfPos.count*2);for(let i=0;i<turfPos.count;i++){turfUv[i*2]=(turfPos.getX(i)+CFG.field.L/2)/CFG.field.L;turfUv[i*2+1]=(turfPos.getY(i)+CFG.field.W/2)/CFG.field.W}turfGeo.setAttribute("uv",new THREE.BufferAttribute(turfUv,2));
      const turf=new THREE.Mesh(turfGeo,new THREE.MeshStandardMaterial({map:turfTex,color:0xffffff,roughness:.96,metalness:0,side:THREE.DoubleSide}));turf.rotation.x=-Math.PI/2;turf.position.y=.045;turf.receiveShadow=true;scene.add(turf)`;

replaceExact(oldTurf, newTurf, "single-surface mowing turf");

// ---------------------------------------------------------------------------
// Phase 4 acceptance guards.
// ---------------------------------------------------------------------------
const turfRequired = [
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'mowA="#267a3c",mowB="#297e40",mowBands=16',
  'let turfSeed=0x4d4f5445',
  'new THREE.CanvasTexture(turfCanvas)',
  'turfTex.generateMipmaps=true',
  'renderer.capabilities.getMaxAnisotropy',
  'qualityLow?4:12',
  'turfTex.magFilter=THREE.LinearFilter',
  'new THREE.ShapeGeometry(ellipse(CFG.field.L/2,CFG.field.W/2),192)',
  'turfGeo.setAttribute("uv",new THREE.BufferAttribute(turfUv,2))',
  'turf.position.y=.045;turf.receiveShadow=true;scene.add(turf)',
  'polygonOffsetFactor:-2,polygonOffsetUnits:-2',
  'polygonOffsetFactor:-3,polygonOffsetUnits:-3',
  'polygonOffsetFactor:-4,polygonOffsetUnits:-4',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'ray.ray.intersectsSphere(sphere)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)'
];
for (const required of turfRequired) {
  if (!html.includes(required)) throw new Error(`Phase-4 turf invariant missing: ${required}`);
}

const forbidden = [
  'const stripeMat=',
  'new THREE.PlaneGeometry(9.4,hh*2)',
  'flat(ellipse(CFG.field.L/2,CFG.field.W/2),0x267a3c,.045)',
  'polygonOffsetFactor:-1,polygonOffsetUnits:-1',
  'pan.castShadow=!qualityLow',
  'back.castShadow=!qualityLow',
  'if(!selected||seatMode)return;'
];
for (const bad of forbidden) {
  if (html.includes(bad)) throw new Error(`Phase-4 legacy/regression marker still present: ${bad}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Upgraded mowing turf to one deterministic filtered surface without changing stadium geometry or UX");

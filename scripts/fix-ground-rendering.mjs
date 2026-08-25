import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Ground-rendering patch target missing (${label}): ${before.slice(0, 180)}…`);
  }
  html = html.replace(before, after);
}

// ---------------------------------------------------------------------------
// Phase 0: regression baseline guards.
// ---------------------------------------------------------------------------
// Graphics work is not allowed to alter the current stadium geometry, seating
// metadata, seat picking, seat camera, live seat switching, minimap/navigation,
// or responsive UI. Fail the production build if those anchors disappear.
const baselineRequired = [
  'rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43',
  'rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57',
  'field:{L:180*.9144,W:150*.9144}',
  'pitch:{L:22*.9144,W:3.05}',
  'm.position.set(s*84.3,4.1,0)',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'function pick(x,y)',
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
for (const required of baselineRequired) {
  if (!html.includes(required)) throw new Error(`Graphics baseline invariant missing: ${required}`);
}

// ---------------------------------------------------------------------------
// Phase 1 finding A: pathological procedural-seat shadow casting.
// ---------------------------------------------------------------------------
// Tens of thousands of tiny seat pans/backs were all casting into a single
// directional shadow map. At stadium scale that aliases into the large stepped
// slate blocks and horizontal comb patterns seen across the outfield while the
// camera moves. Keep all seat geometry/materials/receiving behaviour unchanged;
// only stop the procedural seat instances from acting as shadow casters.
replaceExact(
  'pan.instanceMatrix.setUsage(THREE.StaticDrawUsage);pan.castShadow=!qualityLow;pan.receiveShadow=true;',
  'pan.instanceMatrix.setUsage(THREE.StaticDrawUsage);pan.castShadow=false;pan.receiveShadow=true;',
  'seat-pan shadow casting'
);
replaceExact(
  'back.instanceMatrix.setUsage(THREE.StaticDrawUsage);back.castShadow=!qualityLow;back.receiveShadow=true;',
  'back.instanceMatrix.setUsage(THREE.StaticDrawUsage);back.castShadow=false;back.receiveShadow=true;',
  'seat-back shadow casting'
);

// ---------------------------------------------------------------------------
// Phase 1 finding B / Phase 2 fix: depth precision.
// ---------------------------------------------------------------------------
// The overview camera never approaches geometry closely enough to justify a
// 0.1-unit near plane. Raising it to 2.0 improves depth precision roughly 20x at
// stadium distances while preserving the same FOV, far plane, orbit limits and
// camera positions. Seat mode explicitly restores a close 0.05 near plane so
// chair/rail geometry remains visible from first-person positions.
replaceExact(
  'const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,700);',
  'const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,2,700);',
  'overview camera depth precision'
);
replaceExact(
  'if(seatMode)return;orbit.p=clamp(orbit.p,.3,1.43);orbit.r=clamp(orbit.r,140,350);',
  'if(seatMode)return;if(camera.near!==2){camera.near=2;camera.far=700;camera.updateProjectionMatrix()}orbit.p=clamp(orbit.p,.3,1.43);orbit.r=clamp(orbit.r,140,350);',
  'orbit projection mode'
);
replaceExact(
  'camera.fov=58;camera.updateProjectionMatrix();',
  'camera.near=.05;camera.far=700;camera.fov=58;camera.updateProjectionMatrix();',
  'seat-view projection mode'
);
replaceExact(
  'if(!seatMode)return;seatMode=false;clearSeatDetails();document.body.classList.remove("seatmode");canvas.classList.remove("seatmode");ui.bar.classList.remove("show");if(marker&&selected)marker.visible=true;camera.fov=45;camera.updateProjectionMatrix();',
  'if(!seatMode)return;seatMode=false;clearSeatDetails();document.body.classList.remove("seatmode");canvas.classList.remove("seatmode");ui.bar.classList.remove("show");if(marker&&selected)marker.visible=true;camera.near=2;camera.far=700;camera.fov=45;camera.updateProjectionMatrix();',
  'restore overview projection when leaving seat view'
);

// ---------------------------------------------------------------------------
// Phase 2: deterministic field overlay depth hierarchy.
// ---------------------------------------------------------------------------
// Keep the existing visible Y positions/colors/opacity exactly as-is. Polygon
// offsets only stabilize the depth ordering of the almost-coplanar turf overlay,
// square, pitch strips and crease planes; they do not move or redesign them.
replaceExact(
  'const stripeMat=new THREE.MeshBasicMaterial({color:0x2f8748,transparent:true,opacity:.27,depthWrite:false}),a=CFG.field.L/2,b=CFG.field.W/2;',
  'const stripeMat=new THREE.MeshBasicMaterial({color:0x2f8748,transparent:true,opacity:.27,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),a=CFG.field.L/2,b=CFG.field.W/2;',
  'mowing-stripe depth ordering'
);
replaceExact(
  'const square=new THREE.Mesh(new THREE.PlaneGeometry(28,14),new THREE.MeshStandardMaterial({color:0xb49b68,roughness:1}));',
  'const square=new THREE.Mesh(new THREE.PlaneGeometry(28,14),new THREE.MeshStandardMaterial({color:0xb49b68,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));',
  'cricket-square depth ordering'
);
replaceExact(
  'new THREE.MeshStandardMaterial({color:i===0?0xc8a96e:0xbda476,roughness:1})',
  'new THREE.MeshStandardMaterial({color:i===0?0xc8a96e:0xbda476,roughness:1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3})',
  'pitch-strip depth ordering'
);
replaceExact(
  'const white=new THREE.MeshBasicMaterial({color:0xf5f2e9});',
  'const white=new THREE.MeshBasicMaterial({color:0xf5f2e9,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});',
  'crease depth ordering'
);

// ---------------------------------------------------------------------------
// Phase 3: post-patch regression assertions.
// ---------------------------------------------------------------------------
const finalRequired = [
  'new THREE.PerspectiveCamera(45,innerWidth/innerHeight,2,700)',
  'if(camera.near!==2){camera.near=2;camera.far=700;camera.updateProjectionMatrix()}',
  'camera.near=.05;camera.far=700;camera.fov=58;camera.updateProjectionMatrix()',
  'camera.near=2;camera.far=700;camera.fov=45;camera.updateProjectionMatrix()',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true',
  'polygonOffsetFactor:-1,polygonOffsetUnits:-1',
  'polygonOffsetFactor:-2,polygonOffsetUnits:-2',
  'polygonOffsetFactor:-3,polygonOffsetUnits:-3',
  'polygonOffsetFactor:-4,polygonOffsetUnits:-4',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'ray.ray.intersectsSphere(sphere)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)'
];
for (const required of finalRequired) {
  if (!html.includes(required)) throw new Error(`Ground-rendering invariant missing: ${required}`);
}
for (const forbidden of [
  'pan.castShadow=!qualityLow',
  'back.castShadow=!qualityLow',
  'new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,700)',
  'if(!selected||seatMode)return;'
]) {
  if (html.includes(forbidden)) throw new Error(`Ground-rendering regression still present: ${forbidden}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Stabilized stadium ground rendering without changing geometry, seating, features, or UI/UX");

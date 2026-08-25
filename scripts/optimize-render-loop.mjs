import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) throw new Error(`Phase-10 patch target missing (${label}): ${before.slice(0, 180)}…`);
  html = html.replace(before, after);
}

const protectedRequired = [
  'rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43',
  'rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57',
  'field:{L:180*.9144,W:150*.9144}',
  'pitch:{L:22*.9144,W:3.05}',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'ray.ray.intersectsSphere(sphere)',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'activePitchMat=new THREE.MeshStandardMaterial({color:0xcab27a',
  'renderer.shadowMap.autoUpdate=false',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true',
  'opacity:.26,roughness:.26,metalness:.05,depthWrite:false,dithering:true',
  'new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false})',
  'function renderPixelRatio()',
  'antialias:renderAntialias',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)',
  'canvas.addEventListener("pointermove"',
  'if(pinchStart>8)',
  '<button class="btn" id="view" disabled>View from seat</button>',
  '<button id="back">Back to stadium</button>'
];
for (const required of protectedRequired) {
  if (!html.includes(required)) throw new Error(`Phase-10 protected invariant missing: ${required}`);
}

replaceExact(
  '    const seatLook={yaw:0,pitch:-.06},pointers=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();',
`    const seatLook={yaw:0,pitch:-.06},pointers=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const seatLookDir=new THREE.Vector3(),seatLookTarget=new THREE.Vector3();
    let frameHandle=0,renderDirty=true,minimapDirty=true,backsVisible=null,backVisibilityCount=-1;
    function ensureFrame(){if(!frameHandle)frameHandle=requestAnimationFrame(animate)}
    function requestRender(){renderDirty=true;ensureFrame()}
    function requestMinimap(){minimapDirty=true;ensureFrame()}`,
  'dirty-frame scheduler state'
);

replaceExact(
`    function orbitCam(){
      if(seatMode)return;if(camera.near!==2){camera.near=2;camera.far=700;camera.updateProjectionMatrix()}orbit.p=clamp(orbit.p,.3,1.43);orbit.r=clamp(orbit.r,140,350);
      const s=Math.sin(orbit.p);camera.position.set(orbit.target.x+orbit.r*s*Math.sin(orbit.t),orbit.target.y+orbit.r*Math.cos(orbit.p),orbit.target.z+orbit.r*s*Math.cos(orbit.t));camera.lookAt(orbit.target);updateLOD();drawMinimap()
    }`,
`    function orbitCam(){
      if(seatMode)return;if(camera.near!==2){camera.near=2;camera.far=700;camera.updateProjectionMatrix()}orbit.p=clamp(orbit.p,.3,1.43);orbit.r=clamp(orbit.r,140,350);
      const s=Math.sin(orbit.p);camera.position.set(orbit.target.x+orbit.r*s*Math.sin(orbit.t),orbit.target.y+orbit.r*Math.cos(orbit.p),orbit.target.z+orbit.r*s*Math.cos(orbit.t));camera.lookAt(orbit.target);updateLOD();requestMinimap();requestRender()
    }`,
  'overview camera invalidation'
);

replaceExact(
`    function seatCam(){
      if(!seatMode)return;const d=new THREE.Vector3(Math.sin(seatLook.yaw)*Math.cos(seatLook.pitch),Math.sin(seatLook.pitch),Math.cos(seatLook.yaw)*Math.cos(seatLook.pitch));camera.lookAt(camera.position.clone().add(d));drawMinimap()
    }`,
`    function seatCam(){
      if(!seatMode)return;seatLookDir.set(Math.sin(seatLook.yaw)*Math.cos(seatLook.pitch),Math.sin(seatLook.pitch),Math.cos(seatLook.yaw)*Math.cos(seatLook.pitch));seatLookTarget.copy(camera.position).add(seatLookDir);camera.lookAt(seatLookTarget);requestMinimap();requestRender()
    }`,
  'allocation-free seat camera update'
);

replaceExact(
  '    function updateLOD(){const showBacks=seatMode||orbit.r<backLOD;for(const m of backMeshes)m.visible=showBacks}',
  '    function updateLOD(){const showBacks=seatMode||orbit.r<backLOD;if(showBacks===backsVisible&&backVisibilityCount===backMeshes.length)return;backsVisible=showBacks;backVisibilityCount=backMeshes.length;for(const m of backMeshes)m.visible=showBacks;requestRender()}',
  'cached seat-back LOD state'
);

replaceExact(
  '      highlightedSection=section||"";if(!section){resetSectionAppearance();ui.sectionState.textContent="Choose a Block and Bay to highlight it in 3D";ui.mapLabel.textContent="Overview";drawMinimap();return}',
  '      highlightedSection=section||"";if(!section){resetSectionAppearance();ui.sectionState.textContent="Choose a Block and Bay to highlight it in 3D";ui.mapLabel.textContent="Overview";requestMinimap();requestRender();return}',
  'section reset invalidation'
);

replaceExact(
  '      ui.sectionState.textContent=`${section} highlighted · ${targets.length.toLocaleString()} rendered seats`;ui.mapLabel.textContent=section;',
  '      ui.sectionState.textContent=`${section} highlighted · ${targets.length.toLocaleString()} rendered seats`;ui.mapLabel.textContent=section;requestRender();',
  'section material invalidation'
);

replaceExact(
  '      if(focus&&!seatMode){let avg=new THREE.Vector3(),sa=0;for(const m of targets){avg.add(m.position);sa+=m.angle}avg.multiplyScalar(1/targets.length);const a=sa/targets.length;orbit.target.set(avg.x*.13,avg.y*.72,avg.z*.13);orbit.t=Math.PI/2-a;orbit.p=1.03;orbit.r=section[0]==="U"?225:205;orbitCam()}else drawMinimap()',
  '      if(focus&&!seatMode){let avg=new THREE.Vector3(),sa=0;for(const m of targets){avg.add(m.position);sa+=m.angle}avg.multiplyScalar(1/targets.length);const a=sa/targets.length;orbit.target.set(avg.x*.13,avg.y*.72,avg.z*.13);orbit.t=Math.PI/2-a;orbit.p=1.03;orbit.r=section[0]==="U"?225:205;orbitCam()}else requestMinimap()',
  'section minimap invalidation'
);

replaceExact(
  '      if(marker){marker.visible=true;marker.position.copy(m.position);marker.position.y+=.68}',
  '      if(marker){marker.visible=true;marker.position.copy(m.position);marker.position.y+=.68;requestRender()}',
  'selected marker invalidation'
);

replaceExact(
  '      if(updateUrl)syncUrl(m);drawMinimap();if(seatMode)moveSeatCameraTo(m)',
  '      if(updateUrl)syncUrl(m);requestMinimap();if(seatMode)moveSeatCameraTo(m)',
  'selection minimap invalidation'
);

replaceExact(
  '    function drawMinimap(){\n      const c=ui.map,x=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h*.46,rx=w*.43,ry=h*.40;',
  '    function drawMinimap(){\n      minimapDirty=false;const c=ui.map,x=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h*.46,rx=w*.43,ry=h*.40;',
  'minimap dirty-state clear'
);

replaceExact(
  '      loadtext.textContent="Building concourse, media and hospitality bands…";hospitality();mediaAreas();loadtext.textContent="Calibrating blue upper bowl…";bowl(CFG.tiers[1],0x30353b);const b=seats(CFG.tiers[1]);aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();drawMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;loadtext.textContent=`Ready · ${(a+b).toLocaleString()} interactive seat instances`;setTimeout(()=>loading.classList.add("done"),140)',
  '      loadtext.textContent="Building concourse, media and hospitality bands…";hospitality();mediaAreas();loadtext.textContent="Calibrating blue upper bowl…";bowl(CFG.tiers[1],0x30353b);const b=seats(CFG.tiers[1]);aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();requestMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;requestRender();loadtext.textContent=`Ready · ${(a+b).toLocaleString()} interactive seat instances`;setTimeout(()=>loading.classList.add("done"),140)',
  'post-build frame invalidation'
);

replaceExact(
  '      gsap.killTweensOf(camera.position);gsap.to(camera.position,{x:d.x,y:d.y,z:d.z,duration:reduced?0:.85,ease:"power2.inOut",overwrite:true,onUpdate:()=>camera.lookAt(orbit.target),onComplete:()=>{orbitCam();updateLOD()}})',
  '      gsap.killTweensOf(camera.position);gsap.to(camera.position,{x:d.x,y:d.y,z:d.z,duration:reduced?0:.85,ease:"power2.inOut",overwrite:true,onUpdate:()=>{camera.lookAt(orbit.target);requestRender()},onComplete:()=>{orbitCam();updateLOD()}})',
  'return-camera render invalidation'
);

replaceExact(
  '    addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());drawMinimap()});',
  '    addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()});',
  'resize coalescing'
);

replaceExact(
`    let last=0;function animate(t){requestAnimationFrame(animate);if(marker&&marker.visible){const p=1+Math.sin(t*.006)*.12;marker.scale.setScalar(p)}if(t-last>33){drawMinimap();last=t}renderer.render(scene,camera)}
    orbitCam();animate(0);requestAnimationFrame(()=>setTimeout(build,20));`,
`    function animate(t){
      frameHandle=0;
      if(marker&&marker.visible){const p=1+Math.sin(t*.006)*.12;marker.scale.setScalar(p);renderDirty=true}
      if(minimapDirty)drawMinimap();
      if(renderDirty){renderer.render(scene,camera);renderDirty=false}
      if(marker&&marker.visible)ensureFrame()
    }
    orbitCam();requestAnimationFrame(()=>setTimeout(build,20));`,
  'on-demand render loop'
);

const required = [
  'const seatLookDir=new THREE.Vector3(),seatLookTarget=new THREE.Vector3()',
  'let frameHandle=0,renderDirty=true,minimapDirty=true,backsVisible=null,backVisibilityCount=-1',
  'function ensureFrame(){if(!frameHandle)frameHandle=requestAnimationFrame(animate)}',
  'function requestRender(){renderDirty=true;ensureFrame()}',
  'function requestMinimap(){minimapDirty=true;ensureFrame()}',
  'seatLookTarget.copy(camera.position).add(seatLookDir)',
  'showBacks===backsVisible&&backVisibilityCount===backMeshes.length',
  'minimapDirty=false;const c=ui.map',
  'if(minimapDirty)drawMinimap()',
  'if(renderDirty){renderer.render(scene,camera);renderDirty=false}',
  'if(marker&&marker.visible)ensureFrame()',
  'onUpdate:()=>{camera.lookAt(orbit.target);requestRender()}',
  'renderer.setPixelRatio(renderPixelRatio())',
  'renderer.shadowMap.autoUpdate=false',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Phase-10 invariant missing: ${marker}`);
}
for (const forbidden of [
  'let last=0;function animate(t){requestAnimationFrame(animate)',
  'if(t-last>33){drawMinimap();last=t}',
  'renderer.render(scene,camera)}\n    orbitCam();animate(0)',
  'const d=new THREE.Vector3(Math.sin(seatLook.yaw)',
  'camera.lookAt(camera.position.clone().add(d))',
  'function updateLOD(){const showBacks=seatMode||orbit.r<backLOD;for(const m of backMeshes)m.visible=showBacks}'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-10 legacy/regression marker still present: ${forbidden}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Optimized render-loop invalidation, minimap redraws, seat-camera allocations and LOD churn without changing stadium UX");

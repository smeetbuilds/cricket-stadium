import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Phase-6/7/8 patch target missing (${label}): ${before.slice(0, 180)}…`);
  }
  html = html.replace(before, after);
}

const protectedRequired = [
  'rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43',
  'rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57',
  'field:{L:180*.9144,W:150*.9144}',
  'pitch:{L:22*.9144,W:3.05}',
  'm.position.set(s*84.3,4.1,0)',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'new THREE.CanvasTexture(turfCanvas)',
  'turf.position.y=.045;turf.receiveShadow=true;scene.add(turf)',
  'color:0xad986d,roughness:.98',
  'activePitchMat=new THREE.MeshStandardMaterial({color:0xcab27a',
  'const circleDashCount=48',
  'new THREE.ShapeGeometry(ring(boundaryRx+.045,boundaryRz+.045,boundaryRx-.045,boundaryRz-.045),256)',
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
  if (!html.includes(required)) throw new Error(`Phase-6/7/8 protected invariant missing: ${required}`);
}

// Phase 6: static, device-tiered structural shadows.
replaceExact(
`    const mobile=matchMedia("(max-width: 820px)").matches;
    const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
    const qualityLow=mobile||lowPower,backLOD=lowPower?190:(mobile?215:250);`,
`    const mobile=matchMedia("(max-width: 820px)").matches;
    const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
    const shadowCompact=matchMedia("(max-width: 520px)").matches,shadowMedium=matchMedia("(max-width: 1180px)").matches;
    const shadowProfile=lowPower||shadowCompact?"off":(shadowMedium?"medium":"high"),shadowMapSize=shadowProfile==="high"?2048:(shadowProfile==="medium"?1024:0);
    const qualityLow=mobile||lowPower,backLOD=lowPower?190:(mobile?215:250);`,
"shadow device profiles"
);

replaceExact(
`      renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,qualityLow?1.15:1.75));renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=!qualityLow;`,
`      renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,qualityLow?1.15:1.75));renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=shadowProfile!=="off";renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;`,
"renderer shadow policy"
);

replaceExact(
`    const sun=new THREE.DirectionalLight(0xfff1d2,2.05);sun.position.set(-90,150,65);sun.castShadow=!qualityLow;scene.add(sun);`,
`    const sun=new THREE.DirectionalLight(0xfff1d2,2.05);sun.position.set(-90,150,65);sun.castShadow=shadowProfile!=="off";if(sun.castShadow){sun.shadow.mapSize.set(shadowMapSize,shadowMapSize);sun.shadow.camera.left=-205;sun.shadow.camera.right=205;sun.shadow.camera.top=185;sun.shadow.camera.bottom=-185;sun.shadow.camera.near=25;sun.shadow.camera.far=360;sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.shadow.radius=shadowProfile==="high"?2:1;sun.shadow.camera.updateProjectionMatrix()}scene.add(sun);`,
"directional shadow camera"
);

replaceExact(
`      [-1,1].forEach(s=>{const frame=new THREE.MeshStandardMaterial({color:0x303940,roughness:.7}),cloth=new THREE.MeshStandardMaterial({color:0xe8e7de,roughness:.9});const m=new THREE.Mesh(new THREE.BoxGeometry(.35,8.2,18),cloth);m.position.set(s*84.3,4.1,0);scene.add(m);for(const z of [-9.3,9.3]){const post=new THREE.Mesh(new THREE.BoxGeometry(.22,9,.22),frame);post.position.set(s*84.3,4.5,z);scene.add(post)}});`,
`      [-1,1].forEach(s=>{const frame=new THREE.MeshStandardMaterial({color:0x303940,roughness:.7}),cloth=new THREE.MeshStandardMaterial({color:0xe8e7de,roughness:.9});const m=new THREE.Mesh(new THREE.BoxGeometry(.35,8.2,18),cloth);m.position.set(s*84.3,4.1,0);m.castShadow=shadowProfile!=="off";m.receiveShadow=true;scene.add(m);for(const z of [-9.3,9.3]){const post=new THREE.Mesh(new THREE.BoxGeometry(.22,9,.22),frame);post.position.set(s*84.3,4.5,z);post.castShadow=shadowProfile!=="off";post.receiveShadow=true;scene.add(post)}});`,
"sight-screen casters"
);

replaceExact(
`      const entryMat=new THREE.MeshStandardMaterial({color:0x273541,roughness:.8});for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const m=new THREE.Mesh(new THREE.BoxGeometry(18,5.1,4.4),entryMat);m.position.set(Math.cos(a)*156.2,2.55,Math.sin(a)*141.2);m.rotation.y=-a;scene.add(m)}`,
`      const entryMat=new THREE.MeshStandardMaterial({color:0x273541,roughness:.8});for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const m=new THREE.Mesh(new THREE.BoxGeometry(18,5.1,4.4),entryMat);m.position.set(Math.cos(a)*156.2,2.55,Math.sin(a)*141.2);m.rotation.y=-a;m.castShadow=shadowProfile!=="off";m.receiveShadow=true;scene.add(m)}`,
"perimeter entry casters"
);

replaceExact(
`      loadtext.textContent="Building concourse, media and hospitality bands…";hospitality();mediaAreas();loadtext.textContent="Calibrating blue upper bowl…";bowl(CFG.tiers[1],0x30353b);const b=seats(CFG.tiers[1]);aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();drawMinimap();loadtext.textContent=\`Ready · \${(a+b).toLocaleString()} interactive seat instances\`;setTimeout(()=>loading.classList.add("done"),140)`,
`      loadtext.textContent="Building concourse, media and hospitality bands…";hospitality();mediaAreas();loadtext.textContent="Calibrating blue upper bowl…";bowl(CFG.tiers[1],0x30353b);const b=seats(CFG.tiers[1]);aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();drawMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;loadtext.textContent=\`Ready · \${(a+b).toLocaleString()} interactive seat instances\`;setTimeout(()=>loading.classList.add("done"),140)`,
"single static shadow-map refresh"
);

// Phase 7: preserve seat identity and transforms while improving material response
// and eliminating repeated geometry/material allocation during seat-to-seat transitions.
replaceExact(
  'const panMat=new THREE.MeshStandardMaterial({roughness:.68,metalness:.02,vertexColors:true}),pan=new THREE.InstancedMesh(panGeo,panMat,items.length),dummy=new THREE.Object3D(),col=new THREE.Color();',
  'const panMat=new THREE.MeshStandardMaterial({roughness:.6,metalness:.01,vertexColors:true,dithering:true}),pan=new THREE.InstancedMesh(panGeo,panMat,items.length),dummy=new THREE.Object3D(),col=new THREE.Color();',
  'global seat finish'
);

replaceExact(
`    const seatDetailGroup=new THREE.Group();scene.add(seatDetailGroup);`,
`    const seatDetailGroup=new THREE.Group();scene.add(seatDetailGroup);
    const seatDetailAssets={
      pan:new THREE.BoxGeometry(.45,.17,.43),
      back:new THREE.BoxGeometry(.45,.57,.09),
      arm:new THREE.BoxGeometry(.055,.12,.35),
      materials:new Map()
    };
    function seatDetailMaterial(color){
      let mat=seatDetailAssets.materials.get(color);
      if(!mat){mat=new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.01,dithering:true});seatDetailAssets.materials.set(color,mat)}
      return mat
    }`,
  'shared close-range seat assets'
);

replaceExact(
`    function clearSeatDetails(){while(seatDetailGroup.children.length){const g=seatDetailGroup.children[0],geos=new Set(),mats=new Set();g.traverse?.(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material)});seatDetailGroup.remove(g);for(const geo of geos)geo.dispose?.();for(const mat of mats)mat.dispose?.()}}
    function buildSeatDetails(center){
      clearSeatDetails();const items=(sectionIndex.get(center.section)||[]).filter(m=>Math.abs(m.row-center.row)<=1&&Math.abs(m.seat-center.seat)<=4);
      for(const m of items){
        const chair=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:m.baseColor,roughness:.64,metalness:.025});
        const pan=new THREE.Mesh(new THREE.BoxGeometry(.45,.17,.43),mat),back=new THREE.Mesh(new THREE.BoxGeometry(.45,.57,.09),mat),armGeo=new THREE.BoxGeometry(.055,.12,.35);
        pan.position.y=.09;back.position.set(0,.38,-.18);const left=new THREE.Mesh(armGeo,mat),right=new THREE.Mesh(armGeo,mat);left.position.set(-.245,.24,-.02);right.position.set(.245,.24,-.02);
        chair.add(pan,back,left,right);chair.position.copy(m.position);chair.rotation.y=Math.atan2(-m.position.x,-m.position.z);seatDetailGroup.add(chair)
      }
    }`,
`    function clearSeatDetails(){while(seatDetailGroup.children.length)seatDetailGroup.remove(seatDetailGroup.children[0])}
    function buildSeatDetails(center){
      clearSeatDetails();const items=(sectionIndex.get(center.section)||[]).filter(m=>Math.abs(m.row-center.row)<=1&&Math.abs(m.seat-center.seat)<=4);
      for(const m of items){
        const chair=new THREE.Group(),mat=seatDetailMaterial(m.baseColor),pan=new THREE.Mesh(seatDetailAssets.pan,mat),back=new THREE.Mesh(seatDetailAssets.back,mat),left=new THREE.Mesh(seatDetailAssets.arm,mat),right=new THREE.Mesh(seatDetailAssets.arm,mat);
        pan.position.y=.09;back.position.set(0,.38,-.18);left.position.set(-.245,.24,-.02);right.position.set(.245,.24,-.02);
        chair.add(pan,back,left,right);chair.position.copy(m.position);chair.rotation.y=Math.atan2(-m.position.x,-m.position.z);seatDetailGroup.add(chair)
      }
    }`,
  'reusable close-range chair geometry/materials'
);

// Phase 8: polish existing stadium surfaces without changing geometry or adding expensive PBR features.
replaceExact(
  'new THREE.MeshStandardMaterial({color,roughness:.94,side:THREE.DoubleSide})',
  'new THREE.MeshStandardMaterial({color,roughness:.86,metalness:.015,side:THREE.DoubleSide,dithering:true})',
  'bowl concrete material'
);
replaceExact(
  'oy-.12,{roughness:.88}',
  'oy-.12,{roughness:.82,metalness:.01}',
  'upper concourse ring material'
);
replaceExact(
  'new THREE.MeshStandardMaterial({color:t.id==="L"?0xbeb8ac:0xaaa99f,roughness:.96})',
  'new THREE.MeshStandardMaterial({color:t.id==="L"?0xbeb8ac:0xaaa99f,roughness:.88,metalness:.01,dithering:true})',
  'aisle concrete material'
);
replaceExact(
  'new THREE.MeshStandardMaterial({color:0xc5c9ca,roughness:.35,metalness:.68})',
  'new THREE.MeshStandardMaterial({color:0xc5c9ca,roughness:.42,metalness:.56,dithering:true})',
  'railing metal material'
);
replaceExact(
  'new THREE.MeshStandardMaterial({color:0x101820,roughness:.95}),edge=new THREE.MeshStandardMaterial({color:0xbdb7aa,roughness:.9})',
  'new THREE.MeshStandardMaterial({color:0x101820,roughness:.88,metalness:.02,dithering:true}),edge=new THREE.MeshStandardMaterial({color:0xbdb7aa,roughness:.78,metalness:.06,dithering:true})',
  'vomitory material balance'
);
replaceExact(
  'flat(ring(120.2,106.4,115.2,101.4),0x222b33,22.65,{roughness:.86});flat(ring(121,107.2,114.8,101),0xd0c8b8,25.35,{roughness:.9});',
  'flat(ring(120.2,106.4,115.2,101.4),0x222b33,22.65,{roughness:.82,metalness:.02});flat(ring(121,107.2,114.8,101),0xd0c8b8,25.35,{roughness:.84,metalness:.015});',
  'hospitality concourse materials'
);
replaceExact(
  'const glass=new THREE.MeshStandardMaterial({color:0x8aa9bf,transparent:true,opacity:.28,roughness:.19,metalness:.15}),frame=new THREE.MeshStandardMaterial({color:0x3b454c,roughness:.55,metalness:.45});',
  'const glass=new THREE.MeshStandardMaterial({color:0x8aa9bf,transparent:true,opacity:.26,roughness:.26,metalness:.05,depthWrite:false,dithering:true}),frame=new THREE.MeshStandardMaterial({color:0x3b454c,roughness:.48,metalness:.38,dithering:true});',
  'hospitality glazing and frames'
);
replaceExact(
  'new THREE.MeshStandardMaterial({color:0xddd4c2,roughness:.82})',
  'new THREE.MeshStandardMaterial({color:0xddd4c2,roughness:.74,metalness:.04,dithering:true})',
  'hospitality trim material'
);
replaceExact(
  'const glass=new THREE.MeshStandardMaterial({color:0x85a8bd,transparent:true,opacity:.32,roughness:.16,metalness:.18}),dark=new THREE.MeshStandardMaterial({color:0x252e35,roughness:.62,metalness:.3});',
  'const glass=new THREE.MeshStandardMaterial({color:0x85a8bd,transparent:true,opacity:.27,roughness:.28,metalness:.05,depthWrite:false,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x252e35,roughness:.55,metalness:.24,dithering:true});',
  'media glazing and structure'
);
replaceExact(
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4,{roughness:.78});',
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4,{roughness:.72,metalness:.03});',
  'roof canopy material'
);
replaceExact(
  'const steel=new THREE.MeshStandardMaterial({color:0xaab2b7,roughness:.35,metalness:.72}),cable=new THREE.MeshStandardMaterial({color:0xc8cdd0,roughness:.45,metalness:.62}),mast=new THREE.MeshStandardMaterial({color:0x929ca2,roughness:.4,metalness:.7}),lamp=new THREE.MeshBasicMaterial({color:0xfff2d2});',
  'const steel=new THREE.MeshStandardMaterial({color:0xaab2b7,roughness:.4,metalness:.58,dithering:true}),cable=new THREE.MeshStandardMaterial({color:0xc8cdd0,roughness:.5,metalness:.48,dithering:true}),mast=new THREE.MeshStandardMaterial({color:0x929ca2,roughness:.44,metalness:.56,dithering:true}),lamp=new THREE.MeshBasicMaterial({color:0xfff2d2,toneMapped:false});',
  'roof steel cable and mast response'
);
replaceExact(
  'new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide})',
  'new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false})',
  'display screen brightness'
);
replaceExact(
  'const frame=new THREE.MeshStandardMaterial({color:0x303940,roughness:.7}),cloth=new THREE.MeshStandardMaterial({color:0xe8e7de,roughness:.9});',
  'const frame=new THREE.MeshStandardMaterial({color:0x303940,roughness:.5,metalness:.34,dithering:true}),cloth=new THREE.MeshStandardMaterial({color:0xe8e7de,roughness:.82,metalness:0,dithering:true});',
  'sight-screen cloth and frame'
);
replaceExact(
  'flat(ring(162,147,149,134),0x18222c,.02);flat(ring(149,134,146.4,131.4),0x28343d,1.45,{roughness:.96});',
  'flat(ring(162,147,149,134),0x18222c,.02,{roughness:.9,metalness:.015});flat(ring(149,134,146.4,131.4),0x28343d,1.45,{roughness:.86,metalness:.02});',
  'perimeter concourse materials'
);
replaceExact(
  'const entryMat=new THREE.MeshStandardMaterial({color:0x273541,roughness:.8})',
  'const entryMat=new THREE.MeshStandardMaterial({color:0x273541,roughness:.7,metalness:.08,dithering:true})',
  'perimeter entry material'
);

const required = [
  'const shadowProfile=lowPower||shadowCompact?"off":(shadowMedium?"medium":"high")',
  'shadowProfile==="high"?2048:(shadowProfile==="medium"?1024:0)',
  'renderer.shadowMap.enabled=shadowProfile!=="off"',
  'renderer.shadowMap.type=THREE.PCFSoftShadowMap',
  'renderer.shadowMap.autoUpdate=false',
  'sun.shadow.mapSize.set(shadowMapSize,shadowMapSize)',
  'sun.shadow.camera.left=-205',
  'sun.shadow.camera.right=205',
  'sun.shadow.camera.top=185',
  'sun.shadow.camera.bottom=-185',
  'sun.shadow.camera.near=25',
  'sun.shadow.camera.far=360',
  'sun.shadow.bias=-.00025',
  'sun.shadow.normalBias=.035',
  'sun.shadow.radius=shadowProfile==="high"?2:1',
  'm.castShadow=shadowProfile!=="off";m.receiveShadow=true',
  'post.castShadow=shadowProfile!=="off";post.receiveShadow=true',
  'if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'const circleDashCount=48',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'ray.ray.intersectsSphere(sphere)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  'roughness:.6,metalness:.01,vertexColors:true,dithering:true',
  'const seatDetailAssets={',
  'pan:new THREE.BoxGeometry(.45,.17,.43)',
  'back:new THREE.BoxGeometry(.45,.57,.09)',
  'arm:new THREE.BoxGeometry(.055,.12,.35)',
  'materials:new Map()',
  'function seatDetailMaterial(color)',
  'roughness:.58,metalness:.01,dithering:true',
  'function clearSeatDetails(){while(seatDetailGroup.children.length)seatDetailGroup.remove(seatDetailGroup.children[0])}',
  'mat=seatDetailMaterial(m.baseColor)',
  'new THREE.Mesh(seatDetailAssets.pan,mat)',
  'new THREE.Mesh(seatDetailAssets.back,mat)',
  'new THREE.Mesh(seatDetailAssets.arm,mat)',
  'const backItems=mobile?items.filter((_,i)=>i%2===0):items',
  'roughness:.86,metalness:.015,side:THREE.DoubleSide,dithering:true',
  'roughness:.88,metalness:.01,dithering:true',
  'roughness:.42,metalness:.56,dithering:true',
  'opacity:.26,roughness:.26,metalness:.05,depthWrite:false,dithering:true',
  'opacity:.27,roughness:.28,metalness:.05,depthWrite:false,dithering:true',
  'roughness:.4,metalness:.58,dithering:true',
  'roughness:.5,metalness:.48,dithering:true',
  'roughness:.44,metalness:.56,dithering:true',
  'toneMapped:false',
  'color:0xe8e7de,roughness:.82,metalness:0,dithering:true',
  'roughness:.9,metalness:.015',
  'roughness:.7,metalness:.08,dithering:true'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Phase-6/7/8 invariant missing: ${marker}`);
}
for (const forbidden of [
  'renderer.shadowMap.enabled=!qualityLow',
  'sun.castShadow=!qualityLow',
  'renderer.shadowMap.autoUpdate=true',
  'pan.castShadow=!qualityLow',
  'back.castShadow=!qualityLow',
  'const stripeMat=',
  'new THREE.LineDashedMaterial({color:0xe6eadf',
  'if(!selected||seatMode)return;',
  'new THREE.MeshStandardMaterial({color:m.baseColor,roughness:.64,metalness:.025})',
  'new THREE.BoxGeometry(.45,.17,.43),mat),back=new THREE.Mesh(new THREE.BoxGeometry(.45,.57,.09)',
  'new THREE.MeshPhysicalMaterial',
  'PMREMGenerator',
  'CubeTextureLoader',
  'envMap:',
  'transmission:',
  'clearcoat:'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-6/7/8 legacy/regression marker still present: ${forbidden}`);
}

await writeFile(outputPath, html, "utf8");
console.log(`Optimized static stadium shadows (${shadowPolicySummary()}) seat rendering reuse, and stadium material polish without changing stadium UX`);

function shadowPolicySummary() {
  return "phones/low-power off, capable tablets 1024, desktop 2048, static sight-screen/entry casters only";
}

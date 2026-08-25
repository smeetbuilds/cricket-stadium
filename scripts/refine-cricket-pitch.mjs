import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Phase-5 pitch patch target missing (${label}): ${before.slice(0, 180)}…`);
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
  if (!html.includes(required)) throw new Error(`Phase-5 protected invariant missing: ${required}`);
}

const oldPitch = `      const square=new THREE.Mesh(new THREE.PlaneGeometry(28,14),new THREE.MeshStandardMaterial({color:0xb49b68,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));square.rotation.x=-Math.PI/2;square.position.y=.072;scene.add(square);
      for(let i=-2;i<=2;i++){const strip=new THREE.Mesh(new THREE.PlaneGeometry(CFG.pitch.L,2.55),new THREE.MeshStandardMaterial({color:i===0?0xc8a96e:0xbda476,roughness:1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));strip.rotation.x=-Math.PI/2;strip.position.set(0,.085,i*2.72);scene.add(strip)}
      const white=new THREE.MeshBasicMaterial({color:0xf5f2e9,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
      const creaseLine=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),white);m.rotation.x=-Math.PI/2;m.position.set(x,.105,z);scene.add(m)};
      [-1,1].forEach(s=>{
        const bx=s*CFG.pitch.L/2,pop=s*(CFG.pitch.L/2-1.22),returnX=s*(CFG.pitch.L/2-2.44);
        creaseLine(pop,0,.05,4.9);creaseLine(returnX,0,.05,4.9);creaseLine((pop+returnX)/2,2.23,2.45,.045);creaseLine((pop+returnX)/2,-2.23,2.45,.045);
        const wm=new THREE.MeshStandardMaterial({color:0xf4e9c6,roughness:.75}),g=new THREE.Group();
        [-.114,0,.114].forEach(z=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.71,7),wm);st.position.set(0,.355,z);g.add(st)});
        [-.057,.057].forEach(z=>{const bail=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.12,6),wm);bail.rotation.x=Math.PI/2;bail.position.set(0,.71,z);g.add(bail)});
        g.position.set(bx,.09,0);scene.add(g)
      });`;

const newPitch = `      const squareMat=new THREE.MeshStandardMaterial({color:0xad986d,roughness:.98,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),square=new THREE.Mesh(new THREE.PlaneGeometry(28,14),squareMat);square.rotation.x=-Math.PI/2;square.position.y=.072;square.receiveShadow=true;scene.add(square);
      const secondaryPitchMat=new THREE.MeshStandardMaterial({color:0xb39d72,roughness:.99,metalness:0,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),activePitchMat=new THREE.MeshStandardMaterial({color:0xcab27a,roughness:.96,metalness:0,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
      for(let i=-2;i<=2;i++){const strip=new THREE.Mesh(new THREE.PlaneGeometry(CFG.pitch.L,i===0?CFG.pitch.W:2.48),i===0?activePitchMat:secondaryPitchMat);strip.rotation.x=-Math.PI/2;strip.position.set(0,.085,i*2.72);strip.receiveShadow=true;scene.add(strip)}
      const pitchEdgeMat=new THREE.MeshBasicMaterial({color:0x9d875e,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),pitchEdge=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pitchEdgeMat);m.rotation.x=-Math.PI/2;m.position.set(x,.094,z);scene.add(m)};
      pitchEdge(0,CFG.pitch.W/2,CFG.pitch.L,.035);pitchEdge(0,-CFG.pitch.W/2,CFG.pitch.L,.035);pitchEdge(CFG.pitch.L/2,0,.035,CFG.pitch.W);pitchEdge(-CFG.pitch.L/2,0,.035,CFG.pitch.W);
      const creaseMat=new THREE.MeshBasicMaterial({color:0xf7f4eb,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-5}),creaseLine=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),creaseMat);m.rotation.x=-Math.PI/2;m.position.set(x,.105,z);scene.add(m)};
      [-1,1].forEach(s=>{
        const bx=s*CFG.pitch.L/2,pop=s*(CFG.pitch.L/2-1.22),returnX=s*(CFG.pitch.L/2-2.44);
        creaseLine(pop,0,.055,4.9);creaseLine(returnX,0,.055,4.9);creaseLine((pop+returnX)/2,2.23,2.45,.05);creaseLine((pop+returnX)/2,-2.23,2.45,.05);
        const wm=new THREE.MeshStandardMaterial({color:0xf2dfb3,roughness:.64,metalness:0}),g=new THREE.Group();
        [-.114,0,.114].forEach(z=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(.019,.019,.71,10),wm);st.position.set(0,.355,z);g.add(st)});
        [-.057,.057].forEach(z=>{const bail=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.118,8),wm);bail.rotation.x=Math.PI/2;bail.position.set(0,.71,z);g.add(bail)});
        g.position.set(bx,.09,0);scene.add(g)
      });`;
replaceExact(oldPitch, newPitch, "square, pitch, creases and wickets");

const oldBoundary = `      const boundary=[];for(let i=0;i<=256;i++){const t=i/256*Math.PI*2;boundary.push(new THREE.Vector3(Math.cos(t)*(CFG.field.L/2-2.2),.12,Math.sin(t)*(CFG.field.W/2-2.2)))}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundary),new THREE.LineBasicMaterial({color:0xf5f1e8})));`;
const newBoundary = `      const boundaryRx=CFG.field.L/2-2.2,boundaryRz=CFG.field.W/2-2.2,boundaryGeo=new THREE.ShapeGeometry(ring(boundaryRx+.045,boundaryRz+.045,boundaryRx-.045,boundaryRz-.045),256),boundaryMesh=new THREE.Mesh(boundaryGeo,new THREE.MeshBasicMaterial({color:0xf6f3eb,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));boundaryMesh.rotation.x=-Math.PI/2;boundaryMesh.position.y=.118;scene.add(boundaryMesh);`;
replaceExact(oldBoundary, newBoundary, "smooth boundary ring");

const oldCircle = `      const circleMat=new THREE.LineDashedMaterial({color:0xe6eadf,dashSize:2,gapSize:1.6,transparent:true,opacity:.75}),inner=[];for(let i=0;i<=128;i++){const t=i/128*Math.PI*2;inner.push(new THREE.Vector3(Math.cos(t)*27.43,.115,Math.sin(t)*27.43))}const circle=new THREE.Line(new THREE.BufferGeometry().setFromPoints(inner),circleMat);circle.computeLineDistances();scene.add(circle);`;
const newCircle = `      const circleDashCount=48,circleDashGeo=new THREE.BoxGeometry(1.35,.018,.055),circleDashMat=new THREE.MeshBasicMaterial({color:0xe8ece3,transparent:true,opacity:.8}),circleDashes=new THREE.InstancedMesh(circleDashGeo,circleDashMat,circleDashCount),circleDummy=new THREE.Object3D();for(let i=0;i<circleDashCount;i++){const t=i/circleDashCount*Math.PI*2;circleDummy.position.set(Math.cos(t)*27.43,.116,Math.sin(t)*27.43);circleDummy.rotation.set(0,-t-Math.PI/2,0);circleDummy.updateMatrix();circleDashes.setMatrixAt(i,circleDummy.matrix)}circleDashes.instanceMatrix.needsUpdate=true;circleDashes.raycast=()=>{};scene.add(circleDashes);`;
replaceExact(oldCircle, newCircle, "stable 30-yard circle dashes");

const required = [
  'color:0xad986d,roughness:.98',
  'activePitchMat=new THREE.MeshStandardMaterial({color:0xcab27a',
  'i===0?CFG.pitch.W:2.48',
  'const pitchEdgeMat=new THREE.MeshBasicMaterial({color:0x9d875e',
  'polygonOffsetFactor:-5,polygonOffsetUnits:-5',
  'new THREE.CylinderGeometry(.019,.019,.71,10)',
  'new THREE.CylinderGeometry(.012,.012,.118,8)',
  'new THREE.ShapeGeometry(ring(boundaryRx+.045,boundaryRz+.045,boundaryRx-.045,boundaryRz-.045),256)',
  'boundaryMesh.position.y=.118',
  'const circleDashCount=48',
  'new THREE.BoxGeometry(1.35,.018,.055)',
  'circleDashes.raycast=()=>{}',
  'const turfW=qualityLow?512:1024,turfH=qualityLow?256:512',
  'turf.position.y=.045;turf.receiveShadow=true;scene.add(turf)',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'ray.ray.intersectsSphere(sphere)',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Phase-5 invariant missing: ${marker}`);
}
for (const forbidden of [
  'new THREE.LineDashedMaterial({color:0xe6eadf',
  'new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundary)',
  'color:i===0?0xc8a96e:0xbda476',
  'new THREE.CylinderGeometry(.018,.018,.71,7)',
  'new THREE.CylinderGeometry(.013,.013,.12,6)',
  'const stripeMat=',
  'pan.castShadow=!qualityLow',
  'back.castShadow=!qualityLow',
  'if(!selected||seatMode)return;'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-5 legacy/regression marker still present: ${forbidden}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Refined cricket square, pitch, creases, wickets, boundary and 30-yard circle without changing stadium UX");

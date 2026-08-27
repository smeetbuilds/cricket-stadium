import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Phase-24 architectural fidelity: expected one ${label} marker, found ${count}`);
  }
  html = html.replace(before, after);
}

// Interior presentation treatment based on the supplied stadium references.
// Geometry, seat coordinates, IDs, Block/Bay mapping, camera behavior and
// responsive UI intentionally remain unchanged.
replaceOnce(
  'pal:["#ed6726","#f47b2c","#f18e32","#e95a22","#f2a13a"]',
  'pal:["#d9470d","#e65310","#ef6514","#d23d0a","#f28c22"]',
  'lower-seat palette'
);
replaceOnce(
  'pal:["#1f2f67","#263b7a","#ef6c28","#f6ad35","#f8c451"]',
  'pal:["#19264f","#223565","#e45212","#ef7518","#f2a52b"]',
  'upper-seat palette'
);
replaceOnce('mowA="#267a3c",mowB="#297e40"', 'mowA="#184b26",mowB="#205b2e"', 'turf palette');
replaceOnce(
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4',
  'flat(ring(154.5,140.5,123.8,108.5),0xf4f0e6,53.4',
  'roof membrane'
);
replaceOnce('bowl(CFG.tiers[0],0x373a3b)', 'bowl(CFG.tiers[0],0x9b2f12)', 'lower-bowl substrate');
replaceOnce('bowl(CFG.tiers[1],0x30353b)', 'bowl(CFG.tiers[1],0x141f48)', 'upper-bowl substrate');

// The lower bowl in the reference reads as one dominant orange tier. Keep only
// restrained tonal variation so aisles, rather than random colours, segment it.
replaceOnce(
  'if(t.id==="L"){const band=(sec+Math.floor(row/6))%4,light=Math.sin(a*6.2+row*.16)>.88;return light?t.pal[4]:t.pal[band]}',
  'if(t.id==="L"){const alt=(sec+Math.floor(row/12))%3===0,light=Math.sin(a*5.2+row*.09)>.982;return light?t.pal[4]:(alt?t.pal[1]:t.pal[0])}',
  'lower-bowl seat pattern'
);

// Broaden the existing procedural upper-tier motif into the large navy,
// orange and gold wave/chevron language visible in the supplied references.
replaceOnce(
  'const repeats=8,phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=.08+y*.34,delta=Math.abs(arm-target);if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/5))&1)?t.pal[0]:t.pal[1]',
  'const repeats=8,phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=.06+y*.39,delta=Math.abs(arm-target);if(delta<.03)return t.pal[4];if(delta<.115)return y>.74?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/7))&1)?t.pal[0]:t.pal[1]',
  'upper-bowl wave pattern'
);

// Add a very subtle concentric mowing cue over the existing longitudinal turf
// texture. This changes only the generated texture, never field geometry.
replaceOnce(
  '      const turfTex=new THREE.CanvasTexture(turfCanvas)',
  `      turfCtx.save();
      turfCtx.translate(turfW/2,turfH/2);
      turfCtx.scale(1,turfH/turfW);
      for(let i=1;i<=5;i++){turfCtx.beginPath();turfCtx.ellipse(0,0,turfW*(.085+i*.055),turfW*(.085+i*.055),0,0,Math.PI*2);turfCtx.strokeStyle=i%2?"rgba(255,255,255,.020)":"rgba(0,0,0,.026)";turfCtx.lineWidth=Math.max(4,turfW*.018);turfCtx.stroke()}
      turfCtx.restore();
      const turfTex=new THREE.CanvasTexture(turfCanvas)`,
  'turf mowing detail'
);

// Existing media/hospitality boxes are decorative. Shift them toward the
// pale pavilion body + blue-grey glazing seen in the interior references.
replaceOnce(
  'const glass=new THREE.MeshStandardMaterial({color:0x85a8bd,transparent:true,opacity:.27,roughness:.28,metalness:.05,depthWrite:false,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x252e35,roughness:.55,metalness:.24,dithering:true});',
  'const glass=new THREE.MeshStandardMaterial({color:0x58758a,transparent:true,opacity:.34,roughness:.24,metalness:.06,depthWrite:false,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0xd8d2c6,roughness:.67,metalness:.08,dithering:true});',
  'pavilion material treatment'
);

// Keep surrounding seating recognisable when a Block/Bay is highlighted.
const dimMarker = 'active?0xffffff:0x505050';
const dimCount = html.split(dimMarker).length - 1;
if (dimCount !== 4) {
  throw new Error(`Phase-24 architectural fidelity: expected four selection-dimming markers, found ${dimCount}`);
}
html = html.split(dimMarker).join('active?0xffffff:0xd0d0d0');

// Non-interactive exterior and roof-detail layer. Every new element is
// decorative: no seat mesh, raycast target, camera, mapping or control path is
// changed. The exterior is deliberately lightweight (few meshes + one
// InstancedMesh) to stay well below the existing draw-call headroom.
const helperMarker = '    function extras(){';
const helperCount = html.split(helperMarker).length - 1;
if (helperCount !== 1) {
  throw new Error(`Phase-24 architectural fidelity: expected one extras helper marker, found ${helperCount}`);
}
const architecturalHelpers = `    function architecturalFacadeWall(rx,rz,y0,y1,mat,start=0,end=Math.PI*2,segments=128){
      const pos=[],idx=[];for(let i=0;i<=segments;i++){const a=start+(end-start)*i/segments,x=Math.cos(a)*rx,z=Math.sin(a)*rz;pos.push(x,y0,z,x,y1,z)}
      for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,d,a,d,c)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.raycast=()=>{};scene.add(m);return m
    }
    function architecturalRibbon(start,end,rx,rz,baseY,amp,width,phase,mat,segments=64){
      const pos=[],idx=[];for(let i=0;i<=segments;i++){const t=i/segments,a=start+(end-start)*t,y=baseY+Math.sin(t*Math.PI*4+phase)*amp,x=Math.cos(a)*rx,z=Math.sin(a)*rz;pos.push(x,y-width*.5,z,x,y+width*.5,z)}
      for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,d,a,d,c)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.raycast=()=>{};scene.add(m);return m
    }
    function architecturalBeamInstances(pairs,radius,mat){
      const geo=new THREE.CylinderGeometry(1,1,1,6),mesh=new THREE.InstancedMesh(geo,mat,pairs.length),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};
      for(let i=0;i<pairs.length;i++){const p=pairs[i],len=dir.subVectors(p[1],p[0]).length();dummy.position.copy(p[0]).add(p[1]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,dir.normalize());dummy.scale.set(radius,len,radius);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
      mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);return mesh
    }
    function architecturalFidelity(){
      const underside=flat(ring(153.7,139.7,124.8,109.5),0xd8ccb8,52.72,{roughness:.9,metalness:.01});underside.raycast=()=>{};
      const innerLip=flat(ring(125.5,110.5,122.7,107.7),0x30343a,51.86,{roughness:.68,metalness:.12});innerLip.raycast=()=>{};
      const apron=flat(ring(177,161,160.5,145.5),0x35393c,.025,{roughness:.96,metalness:.005});apron.raycast=()=>{};

      const white=new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:.78,metalness:.04,dithering:true});
      architecturalFacadeWall(160.2,145.2,2.4,28.5,white);

      const pairs=[],stations=32;
      for(let i=0;i<stations;i++){
        const a=i/stations*Math.PI*2,da=Math.PI*2/stations*.36,base=ellipsePoint(a,164.5,149.5,3.2);
        pairs.push([base.clone(),ellipsePoint(a-da,152.0,138.0,52.4)],[base.clone(),ellipsePoint(a+da,152.0,138.0,52.4)])
      }
      architecturalBeamInstances(pairs,.16,new THREE.MeshStandardMaterial({color:0xf4f2ea,roughness:.48,metalness:.34,dithering:true}));

      const southStart=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),southEnd=THREE.MathUtils.degToRad(SOUTH_PAVILION.end),gold=new THREE.MeshStandardMaterial({color:0xb89250,roughness:.52,metalness:.38,side:THREE.DoubleSide,dithering:true});
      for(let i=0;i<4;i++)architecturalRibbon(southStart,southEnd,160.55,145.55,10.8+i*3.65,1.05,1.28,i*.82,gold);

      const mid=(southStart+southEnd)*.5,p=ellipsePoint(mid,160.9,145.9,6.8),glass=new THREE.MeshStandardMaterial({color:0x263f4c,roughness:.2,metalness:.16,transparent:true,opacity:.78,dithering:true});
      const entrance=new THREE.Mesh(new THREE.BoxGeometry(14.5,8.4,.42),glass);entrance.position.copy(p);entrance.rotation.y=-mid+Math.PI/2;entrance.raycast=()=>{};scene.add(entrance);
      const frame=new THREE.Mesh(new THREE.BoxGeometry(16,9.3,.26),new THREE.MeshStandardMaterial({color:0xe6e2d8,roughness:.72,metalness:.04,dithering:true}));frame.position.copy(p).add(new THREE.Vector3(Math.cos(mid)*-.22,0,Math.sin(mid)*-.22));frame.rotation.y=entrance.rotation.y;frame.raycast=()=>{};scene.add(frame);entrance.renderOrder=2
    }

`;
html = html.replace(helperMarker, architecturalHelpers + helperMarker);

// Call the fidelity layer only after the existing roof and seating have been
// built, keeping the established construction order and interactions intact.
replaceOnce(
  'aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();await yieldToBrowser();',
  'aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();architecturalFidelity();await yieldToBrowser();',
  'architectural fidelity build hook'
);

for (const marker of [
  'pal:["#d9470d","#e65310","#ef6514","#d23d0a","#f28c22"]',
  'pal:["#19264f","#223565","#e45212","#ef7518","#f2a52b"]',
  'mowA="#184b26",mowB="#205b2e"',
  'flat(ring(154.5,140.5,123.8,108.5),0xf4f0e6,53.4',
  'bowl(CFG.tiers[0],0x9b2f12)',
  'bowl(CFG.tiers[1],0x141f48)',
  'Math.sin(a*5.2+row*.09)>.982',
  'if(delta<.03)return t.pal[4];if(delta<.115)return y>.74?t.pal[3]:t.pal[2]',
  'turfCtx.ellipse(0,0,turfW*(.085+i*.055)',
  'color:0xd8d2c6',
  'active?0xffffff:0xd0d0d0',
  'function architecturalFidelity(){',
  'architecturalFacadeWall(160.2,145.2,2.4,28.5,white)',
  'architecturalBeamInstances(pairs,.16',
  'architecturalRibbon(southStart,southEnd',
  'roof();architecturalFidelity();await yieldToBrowser();'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-24 architectural fidelity: output marker missing: ${marker}`);
}

for (const forbidden of [
  'active?0xffffff:0x505050',
  'bowl(CFG.tiers[0],0x373a3b)',
  'bowl(CFG.tiers[1],0x30353b)',
  'Math.sin(a*6.2+row*.16)>.88',
  'if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2]'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-24 architectural fidelity: legacy visual marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 24 added safe architectural fidelity: aerial seating/field treatment, roof underside, lightweight exterior shell, white exoskeleton, gold pavilion wave facade and entrance glazing; seat geometry, IDs, mapping, camera, interactions and responsive UI are unchanged');

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Phase-25 safe visual fidelity: expected one ${label} marker, found ${count}`);
  }
  html = html.replace(before, after);
}

// Keep the existing procedural seating model frozen while moving the visible
// palette toward the supplied Narendra Modi Stadium references.
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
replaceOnce('mowA="#267a3c",mowB="#297e40"', 'mowA="#2b672f",mowB="#397638"', 'turf palette');
replaceOnce(
  'flat(ring(154.5,140.5,123.8,108.5),0xd8d3c7,53.4',
  'flat(ring(154.5,140.5,123.8,108.5),0xf4f0e6,53.4',
  'roof membrane'
);
replaceOnce('bowl(CFG.tiers[0],0x373a3b)', 'bowl(CFG.tiers[0],0x9b2f12)', 'lower-bowl substrate');
replaceOnce('bowl(CFG.tiers[1],0x30353b)', 'bowl(CFG.tiers[1],0x141f48)', 'upper-bowl substrate');

// Lower tier: one dominant orange field, with only restrained tonal variation.
replaceOnce(
  'if(t.id==="L"){const band=(sec+Math.floor(row/6))%4,light=Math.sin(a*6.2+row*.16)>.88;return light?t.pal[4]:t.pal[band]}',
  'if(t.id==="L"){const alt=(sec+Math.floor(row/12))%3===0,light=Math.sin(a*5.2+row*.09)>.982;return light?t.pal[4]:(alt?t.pal[1]:t.pal[0])}',
  'lower-bowl seat pattern'
);

// Upper tier: keep the eight broad motif zones, but deliberately vary their
// horizontal placement and width so the artwork no longer reads as eight
// identical mathematical chevrons.
replaceOnce(
  '    function colorFor(t,a,row,sec){',
  `    const upperMotifShift=[-.032,.014,-.008,.027,-.019,.009,.031,-.014],upperMotifScale=[.94,1.07,.99,1.11,.96,1.04,1.09,.93];
    function colorFor(t,a,row,sec){`,
  'upper motif calibration constants'
);
replaceOnce(
  'const repeats=8,phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=.08+y*.34,delta=Math.abs(arm-target);if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/5))&1)?t.pal[0]:t.pal[1]',
  'const repeats=8,motif=Math.min(repeats-1,Math.floor(u*repeats)),phase=(u*repeats)%1,arm=Math.abs(phase-.5),target=clamp((.055+y*.39)*upperMotifScale[motif]+upperMotifShift[motif]+Math.sin((u*13.5+motif*.17)*Math.PI)*.012,.025,.46),delta=Math.abs(arm-target),goldWidth=.025+(motif%3)*.003,orangeWidth=.102+((motif+1)%4)*.008;if(delta<goldWidth)return t.pal[4];if(delta<orangeWidth)return y>.74?t.pal[3]:t.pal[2];return ((sec+Math.floor(row/7))&1)?t.pal[0]:t.pal[1]',
  'irregular upper-bowl motif'
);

// Daylight presentation is a very high-impact visual correction and does not
// alter a single stadium coordinate or interaction path.
replaceOnce(
  'const scene=new THREE.Scene();scene.background=new THREE.Color(0x071019);scene.fog=new THREE.FogExp2(0x071019,.00185);',
  'const scene=new THREE.Scene();scene.background=new THREE.Color(0xbfd7e6);scene.fog=new THREE.FogExp2(0xc8d9e1,.00072);',
  'daylight scene environment'
);
replaceOnce(
  'scene.add(new THREE.HemisphereLight(0xc6ddff,0x172013,1.35));',
  'scene.add(new THREE.HemisphereLight(0xeaf5ff,0x56634b,1.62));',
  'daylight hemisphere light'
);
replaceOnce(
  'const sun=new THREE.DirectionalLight(0xfff1d2,2.05);',
  'const sun=new THREE.DirectionalLight(0xffefd0,2.35);',
  'daylight sun light'
);
replaceOnce(
  '#vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%,transparent 42%,rgba(0,0,0,.44))}',
  '#vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%,transparent 48%,rgba(0,0,0,.16))}',
  'daylight vignette'
);

// Add a very subtle secondary concentric mowing cue. Longitudinal mowing stays
// dominant so the field does not look over-designed.
replaceOnce(
  '      const turfTex=new THREE.CanvasTexture(turfCanvas)',
  `      turfCtx.save();
      turfCtx.translate(turfW/2,turfH/2);
      turfCtx.scale(1,turfH/turfW);
      for(let i=1;i<=5;i++){turfCtx.beginPath();turfCtx.ellipse(0,0,turfW*(.085+i*.055),turfW*(.085+i*.055),0,0,Math.PI*2);turfCtx.strokeStyle=i%2?"rgba(255,255,255,.010)":"rgba(0,0,0,.014)";turfCtx.lineWidth=Math.max(3,turfW*.014);turfCtx.stroke()}
      turfCtx.restore();
      const turfTex=new THREE.CanvasTexture(turfCanvas)`,
  'subtle turf mowing detail'
);

// Existing repeated media boxes remain as low-contrast background corporate
// elements; the new central pavilion below becomes the dominant architecture.
replaceOnce(
  'const glass=new THREE.MeshStandardMaterial({color:0x85a8bd,transparent:true,opacity:.27,roughness:.28,metalness:.05,depthWrite:false,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x252e35,roughness:.55,metalness:.24,dithering:true});',
  'const glass=new THREE.MeshStandardMaterial({color:0x688091,transparent:true,opacity:.22,roughness:.28,metalness:.05,depthWrite:false,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x596168,roughness:.68,metalness:.08,dithering:true});',
  'background corporate-box treatment'
);

// Nearby seat-view chairs only: overview seating remains the exact same
// InstancedMesh population. Add dark pedestal hardware and a slightly more
// reclined molded-seat silhouette around the selected chair.
replaceOnce(
  `    const seatDetailAssets={
      pan:new THREE.BoxGeometry(.45,.17,.43),
      back:new THREE.BoxGeometry(.45,.57,.09),
      arm:new THREE.BoxGeometry(.055,.12,.35),
      materials:new Map()
    };`,
  `    const seatSupportMaterial=new THREE.MeshStandardMaterial({color:0x2a2e31,roughness:.52,metalness:.22,dithering:true});
    const seatDetailAssets={
      pan:new THREE.BoxGeometry(.47,.13,.44),
      back:new THREE.BoxGeometry(.47,.58,.085),
      arm:new THREE.BoxGeometry(.05,.11,.34),
      stem:new THREE.CylinderGeometry(.045,.055,.42,8),
      foot:new THREE.BoxGeometry(.32,.05,.22),
      materials:new Map()
    };`,
  'nearby chair assets'
);
replaceOnce(
  'const chair=new THREE.Group(),mat=seatDetailMaterial(m.baseColor),pan=new THREE.Mesh(seatDetailAssets.pan,mat),back=new THREE.Mesh(seatDetailAssets.back,mat),left=new THREE.Mesh(seatDetailAssets.arm,mat),right=new THREE.Mesh(seatDetailAssets.arm,mat);',
  'const chair=new THREE.Group(),mat=seatDetailMaterial(m.baseColor),pan=new THREE.Mesh(seatDetailAssets.pan,mat),back=new THREE.Mesh(seatDetailAssets.back,mat),left=new THREE.Mesh(seatDetailAssets.arm,mat),right=new THREE.Mesh(seatDetailAssets.arm,mat),stem=new THREE.Mesh(seatDetailAssets.stem,seatSupportMaterial),foot=new THREE.Mesh(seatDetailAssets.foot,seatSupportMaterial);',
  'nearby chair mesh composition'
);
replaceOnce(
  'pan.position.y=.09;back.position.set(0,.38,-.18);left.position.set(-.245,.24,-.02);right.position.set(.245,.24,-.02);',
  'pan.position.set(0,.12,-.01);pan.rotation.x=-.05;back.position.set(0,.43,-.18);back.rotation.x=-.08;left.position.set(-.245,.25,-.03);right.position.set(.245,.25,-.03);stem.position.set(0,-.13,.05);foot.position.set(0,-.35,.06);',
  'nearby chair positioning'
);
replaceOnce('chair.add(pan,back,left,right);', 'chair.add(pan,back,left,right,stem,foot);', 'nearby chair assembly');

// Generic but stadium-like cricket scoreboard treatment. No sponsor marks are
// copied from the references.
replaceOnce(
  'x.fillStyle="#071019";x.fillRect(0,0,1024,512);x.fillStyle="#f47a2a";x.fillRect(0,0,1024,36);x.fillStyle="#f7f3ea";x.textAlign="center";x.font="800 70px Arial";x.fillText("AHMEDABAD",512,224);x.fillStyle="#aeb9c5";x.font="600 29px Arial";x.fillText("NARENDRA MODI STADIUM · MOTERA 3D",512,290);',
  'x.fillStyle="#09131c";x.fillRect(0,0,1024,512);x.fillStyle="#e35b20";x.fillRect(0,0,1024,44);x.fillStyle="#f5f1e8";x.textAlign="center";x.font="800 42px Arial";x.fillText("CRICKET SCOREBOARD",512,104);x.font="800 86px Arial";x.fillText("286 / 5",512,224);x.fillStyle="#d7e0e5";x.font="700 31px Arial";x.fillText("OVERS 47.2   ·   TARGET 312",512,286);x.fillStyle="#8fa5b2";x.font="600 24px Arial";x.fillText("NARENDRA MODI STADIUM · AHMEDABAD",512,360);',
  'scoreboard graphic'
);

// Keep surrounding seating recognisable when a Block/Bay is highlighted.
const dimMarker = 'active?0xffffff:0x505050';
const dimCount = html.split(dimMarker).length - 1;
if (dimCount !== 4) {
  throw new Error(`Phase-25 safe visual fidelity: expected four selection-dimming markers, found ${dimCount}`);
}
html = html.split(dimMarker).join('active?0xffffff:0xd0d0d0');

// Non-interactive architectural layer. New exterior/pavilion meshes are
// decorative only and excluded from seat picking.
const helperMarker = '    function extras(){';
const helperCount = html.split(helperMarker).length - 1;
if (helperCount !== 1) {
  throw new Error(`Phase-25 safe visual fidelity: expected one extras helper marker, found ${helperCount}`);
}
const architecturalHelpers = `    function architecturalFacadeWall(rx,rz,y0,y1,mat,start=0,end=Math.PI*2,segments=128){
      const pos=[],idx=[];for(let i=0;i<=segments;i++){const a=start+(end-start)*i/segments,x=Math.cos(a)*rx,z=Math.sin(a)*rz;pos.push(x,y0,z,x,y1,z)}
      for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,d,a,d,c)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.raycast=()=>{};scene.add(m);return m
    }
    function architecturalSegmentedFacade(rx,rz,y0,y1,mat,segments=64){
      const pos=[],idx=[];for(let i=0;i<segments;i++){if(i%4===1)continue;const a0=i/segments*Math.PI*2,a1=(i+1)/segments*Math.PI*2,b=pos.length/3;pos.push(Math.cos(a0)*rx,y0,Math.sin(a0)*rz,Math.cos(a0)*rx,y1,Math.sin(a0)*rz,Math.cos(a1)*rx,y0,Math.sin(a1)*rz,Math.cos(a1)*rx,y1,Math.sin(a1)*rz);idx.push(b,b+1,b+3,b,b+3,b+2)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.raycast=()=>{};scene.add(m);return m
    }
    function architecturalRibbon(start,end,rx,rz,baseY,amp,width,phase,mat,segments=72){
      const pos=[],idx=[];for(let i=0;i<=segments;i++){const t=i/segments,a=start+(end-start)*t,y=baseY+Math.sin(t*Math.PI*4+phase)*amp,x=Math.cos(a)*rx,z=Math.sin(a)*rz;pos.push(x,y-width*.5,z,x,y+width*.5,z)}
      for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,d,a,d,c)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.raycast=()=>{};scene.add(m);return m
    }
    function architecturalBeamInstances(pairs,radius,mat){
      const geo=new THREE.CylinderGeometry(1,1,1,7),mesh=new THREE.InstancedMesh(geo,mat,pairs.length),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};
      for(let i=0;i<pairs.length;i++){const p=pairs[i],len=dir.subVectors(p[1],p[0]).length();dummy.position.copy(p[0]).add(p[1]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,dir.normalize());dummy.scale.set(radius,len,radius);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
      mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);return mesh
    }
    function architecturalPavilion(){
      const mid=THREE.MathUtils.degToRad((SOUTH_PAVILION.start+SOUTH_PAVILION.end)*.5),root=new THREE.Group(),white=new THREE.MeshStandardMaterial({color:0xe4e0d6,roughness:.7,metalness:.05,dithering:true}),glass=new THREE.MeshStandardMaterial({color:0x526f80,roughness:.2,metalness:.1,transparent:true,opacity:.58,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x252d34,roughness:.55,metalness:.16,dithering:true});
      root.position.copy(ellipsePoint(mid,116.3,102.2,28.2));root.rotation.y=-mid+Math.PI/2;
      const body=new THREE.Mesh(new THREE.BoxGeometry(37,9.2,4.6),white),deck=new THREE.Mesh(new THREE.BoxGeometry(42,.65,6.1),dark),roofSlab=new THREE.Mesh(new THREE.BoxGeometry(40,.55,5.4),dark),glassLow=new THREE.Mesh(new THREE.BoxGeometry(32,2.25,.18),glass),glassHigh=new THREE.Mesh(new THREE.BoxGeometry(29,2.4,.18),glass),score=new THREE.Mesh(new THREE.BoxGeometry(10.5,3.4,.2),new THREE.MeshStandardMaterial({color:0x11171c,roughness:.42,metalness:.12,dithering:true}));
      deck.position.y=-4.45;roofSlab.position.y=4.8;glassLow.position.set(0,-1.25,-2.36);glassHigh.position.set(0,2.0,-2.36);score.position.set(0,-1.4,-2.48);root.add(body,deck,roofSlab,glassLow,glassHigh,score);root.traverse(o=>{if(o.isMesh){o.raycast=()=>{};o.castShadow=false;o.receiveShadow=true}});scene.add(root)
    }
    function architecturalFidelity(){
      const campus=flat(ellipse(205,188),0x737968,-.04,{roughness:.98,metalness:0});campus.raycast=()=>{};
      const underside=flat(ring(153.7,139.7,124.8,109.5),0xd8ccb8,52.72,{roughness:.9,metalness:.01});underside.raycast=()=>{};
      const innerLip=flat(ring(125.5,110.5,122.7,107.7),0x30343a,51.86,{roughness:.68,metalness:.12});innerLip.raycast=()=>{};
      const apron=flat(ring(184,168,160.5,145.5),0x45494b,.025,{roughness:.96,metalness:.005});apron.raycast=()=>{};

      const white=new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:.78,metalness:.04,dithering:true}),openDark=new THREE.MeshStandardMaterial({color:0x31383d,roughness:.86,metalness:.03,dithering:true});
      architecturalFacadeWall(159.45,144.45,7.0,28.0,openDark);
      architecturalFacadeWall(160.2,145.2,2.4,7.1,white);
      architecturalSegmentedFacade(160.25,145.25,7.0,28.5,white,64);

      const pairs=[],stations=36,top=[];
      for(let i=0;i<stations;i++)top.push(ellipsePoint(i/stations*Math.PI*2,152.0,138.0,52.4));
      for(let i=0;i<stations;i++){
        const a=i/stations*Math.PI*2,da=Math.PI*2/stations*.38,base=ellipsePoint(a,164.5,149.5,3.2);
        pairs.push([base.clone(),ellipsePoint(a-da,152.0,138.0,52.4)],[base.clone(),ellipsePoint(a+da,152.0,138.0,52.4)],[top[i].clone(),top[(i+1)%stations].clone()])
      }
      architecturalBeamInstances(pairs,.30,new THREE.MeshStandardMaterial({color:0xf4f2ea,roughness:.46,metalness:.34,dithering:true}));

      const southStart=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),southEnd=THREE.MathUtils.degToRad(SOUTH_PAVILION.end),gold=new THREE.MeshStandardMaterial({color:0xb89250,roughness:.5,metalness:.4,side:THREE.DoubleSide,dithering:true});
      for(let i=0;i<4;i++)architecturalRibbon(southStart,southEnd,160.65,145.65,11.5+i*4.15,1.55,2.55,i*.74,gold);

      const mid=(southStart+southEnd)*.5,entryRoot=new THREE.Group();entryRoot.position.copy(ellipsePoint(mid,160.95,145.95,7.0));entryRoot.rotation.y=-mid+Math.PI/2;
      const glass=new THREE.MeshStandardMaterial({color:0x263f4c,roughness:.2,metalness:.16,transparent:true,opacity:.78,dithering:true}),frameMat=new THREE.MeshStandardMaterial({color:0xe6e2d8,roughness:.72,metalness:.04,dithering:true}),entryGlass=new THREE.Mesh(new THREE.BoxGeometry(14.5,8.4,.32),glass);entryRoot.add(entryGlass);
      const topF=new THREE.Mesh(new THREE.BoxGeometry(16,.45,.48),frameMat),botF=topF.clone(),leftF=new THREE.Mesh(new THREE.BoxGeometry(.45,8.9,.48),frameMat),rightF=leftF.clone(),canopy=new THREE.Mesh(new THREE.BoxGeometry(18,.4,4.0),frameMat);topF.position.y=4.4;botF.position.y=-4.4;leftF.position.x=-7.75;rightF.position.x=7.75;canopy.position.set(0,4.75,-1.7);entryRoot.add(topF,botF,leftF,rightF,canopy);entryRoot.traverse(o=>{if(o.isMesh){o.raycast=()=>{};o.castShadow=false;o.receiveShadow=true}});scene.add(entryRoot);
      architecturalPavilion()
    }

`;
html = html.replace(helperMarker, architecturalHelpers + helperMarker);

// Build the fidelity layer only after the existing roof and seating have been
// constructed, so the established runtime order is preserved.
replaceOnce(
  'aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();await yieldToBrowser();',
  'aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();architecturalFidelity();await yieldToBrowser();',
  'architectural fidelity build hook'
);

for (const marker of [
  'pal:["#d9470d","#e65310","#ef6514","#d23d0a","#f28c22"]',
  'pal:["#19264f","#223565","#e45212","#ef7518","#f2a52b"]',
  'mowA="#2b672f",mowB="#397638"',
  'scene.background=new THREE.Color(0xbfd7e6)',
  'new THREE.FogExp2(0xc8d9e1,.00072)',
  'Math.sin(a*5.2+row*.09)>.982',
  'upperMotifShift=',
  'goldWidth=.025+',
  'rgba(0,0,0,.16)',
  'turfCtx.ellipse(0,0,turfW*(.085+i*.055)',
  'seatSupportMaterial=',
  'chair.add(pan,back,left,right,stem,foot)',
  'CRICKET SCOREBOARD',
  'active?0xffffff:0xd0d0d0',
  'function architecturalSegmentedFacade(',
  'function architecturalPavilion(){',
  'architecturalBeamInstances(pairs,.30',
  'architecturalRibbon(southStart,southEnd',
  'architecturalFidelity();await yieldToBrowser();'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-25 safe visual fidelity: output marker missing: ${marker}`);
}

for (const forbidden of [
  'active?0xffffff:0x505050',
  'scene.background=new THREE.Color(0x071019)',
  'new THREE.FogExp2(0x071019,.00185)',
  'Math.sin(a*6.2+row*.16)>.88',
  'if(delta<.018)return t.pal[4];if(delta<.062)return y>.78?t.pal[3]:t.pal[2]',
  'x.fillText("AHMEDABAD",512,224)'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-25 safe visual fidelity: legacy visual marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 25 safe visual fidelity applied: daylight environment, irregular upper-tier artwork, central pavilion, segmented exterior, broad gold facade, stronger white exoskeleton, realistic generic scoreboard and upgraded nearby seat-view chairs; seat coordinates, IDs, mapping, camera, raycasting and responsive UI are unchanged');

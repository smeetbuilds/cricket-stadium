import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw new Error(`Phase-27 reference fidelity: expected one ${label} marker, found ${count}`);
  html = html.replace(before, after);
}

function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Phase-27 reference fidelity: missing ${label} segment`);
  html = html.slice(0, start) + replacement + html.slice(end);
}

// Public architectural references consistently describe 110,000 seated capacity,
// with 132,000 used as an extended-capacity figure. Keep chair pitch realistic and
// increase tier depth instead of shrinking chairs just to hit the published number.
replaceOnce('capacity:132000,field:{L:180*.9144,W:150*.9144},pitch:{L:22*.9144,W:3.05},sections:48,',
  'capacity:110000,field:{L:180*.9144,W:150*.9144},pitch:{L:22*.9144,W:3.05},sections:48,',
  'seated capacity');
replaceOnce('rows:35,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43,spacing:.47,aisle:.031,tunnelRow:13,tunnelRows:5,tunnelEvery:4',
  'rows:38,rx:86.8,rz:72.8,depth:.86,y:3.7,rise:.43,spacing:.47,aisle:.031,tunnelRow:13,tunnelRows:5,tunnelEvery:4',
  'lower tier depth');
replaceOnce('rows:32,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57,spacing:.48,aisle:.029,tunnelRow:9,tunnelRows:4,tunnelEvery:4',
  'rows:41,rx:118.7,rz:104.7,depth:.88,y:26.4,rise:.57,spacing:.48,aisle:.029,tunnelRow:9,tunnelRows:4,tunnelEvery:4',
  'upper tier depth');
replaceOnce('<div class="fact"><b>132,000</b><span>extended capacity</span></div>',
  '<div class="fact"><b>110,000</b><span>seated capacity</span></div>',
  'capacity fact');

// Replace mechanically repeated every-four-section vomitories with an intentionally
// irregular but balanced rhythm. The pattern remains approximate because no public
// authoritative vomitory/CAD schedule is available.
replaceOnce(
  '    function blockedSeat(t,r,local,sec){if(Math.min(local,1-local)<t.aisle)return true;return sec%t.tunnelEvery===1&&r>=t.tunnelRow&&r<t.tunnelRow+t.tunnelRows&&Math.abs(local-.5)<.19}',
  `    const tunnelSectionPattern={L:new Set([1,4,8,12,17,21,25,30,34,38,42,46]),U:new Set([0,5,9,13,18,22,27,31,35,39,43,47])};
    function blockedSeat(t,r,local,sec){if(Math.min(local,1-local)<t.aisle)return true;return tunnelSectionPattern[t.id].has(sec)&&r>=t.tunnelRow&&r<t.tunnelRow+t.tunnelRows&&Math.abs(local-.5)<.19}`,
  'irregular tunnel seat mask'
);

const newVomitories = `    function vomitories(t){
      const dark=new THREE.MeshStandardMaterial({color:0x101820,roughness:.95}),edge=new THREE.MeshStandardMaterial({color:0xbdb7aa,roughness:.9});
      for(const sec of tunnelSectionPattern[t.id]){const a=(sec+.5)/CFG.sections*Math.PI*2,r=t.tunnelRow+Math.floor(t.tunnelRows*.45),rx=t.rx+r*t.depth,rz=t.rz+r*t.depth,y=t.y+r*t.rise+1.25,portal=new THREE.Mesh(new THREE.BoxGeometry(5.6,2.85,1.0),dark);portal.position.set(Math.cos(a)*rx,y,Math.sin(a)*rz);portal.rotation.y=-a+Math.PI/2;scene.add(portal);const lintel=new THREE.Mesh(new THREE.BoxGeometry(6.15,.24,1.08),edge);lintel.position.copy(portal.position);lintel.position.y+=1.54;lintel.rotation.y=portal.rotation.y;scene.add(lintel)}
    }
`;
replaceSegment('    function vomitories(t){', '    function hospitality(){', newVomitories, 'vomitory geometry');

// Replace the flat annulus roof with a lightweight cable-supported tensile surface:
// outer compression ring, inner tension ring, radial ridges/valleys, and a catwalk.
const newRoof = `    function tensileRoofSurface(){
      const segs=96,bands=6,innerRx=124.4,innerRz=109.1,outerRx=154.8,outerRz=140.8,pos=[],idx=[];
      for(let i=0;i<=segs;i++){const a=i/segs*Math.PI*2,panelWave=Math.sin(a*24);for(let j=0;j<=bands;j++){const q=j/bands,rx=innerRx+(outerRx-innerRx)*q,rz=innerRz+(outerRz-innerRz)*q,ridge=panelWave*Math.sin(Math.PI*q)*.72,y=53.55+q*2.15+ridge;pos.push(Math.cos(a)*rx,y,Math.sin(a)*rz)}}
      for(let i=0;i<segs;i++)for(let j=0;j<bands;j++){const a=i*(bands+1)+j,b=a+1,c=(i+1)*(bands+1)+j,d=c+1;idx.push(a,c,d,a,d,b)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xf4f0e6,roughness:.72,metalness:.01,transparent:true,opacity:.96,side:THREE.DoubleSide,dithering:true}));m.receiveShadow=true;m.raycast=()=>{};scene.add(m);return m
    }
    function roof(){
      loadtext.textContent="Adding cable-supported tensile roof and stadium displays…";
      tensileRoofSurface();
      const steel=new THREE.MeshStandardMaterial({color:0xaab2b7,roughness:.35,metalness:.72}),cable=new THREE.MeshStandardMaterial({color:0xc8cdd0,roughness:.45,metalness:.62}),lamp=new THREE.MeshBasicMaterial({color:0xfff2d2}),catwalkMat=new THREE.MeshStandardMaterial({color:0x343a3f,roughness:.62,metalness:.28});
      beamRing(155.2,141.2,56.15,96,.19,steel);beamRing(154.7,140.7,55.55,96,.15,steel);beamRing(124.25,108.95,53.35,96,.12,cable);
      const catwalk=flat(ring(126.0,110.5,123.7,108.2),0x343a3f,52.98,{roughness:.62,metalness:.28});catwalk.raycast=()=>{};
      for(let i=0;i<48;i++){const a=i/48*Math.PI*2,offset=i%2===0?.58:-.58,inner=ellipsePoint(a,124.25,108.95,53.35),mid=ellipsePoint(a,139.4,124.8,54.72+offset),outer=ellipsePoint(a,154.95,140.95,55.85);beam(inner,mid,.055,cable,5);beam(mid,outer,.055,cable,5);if(i%2===0){const l=new THREE.Mesh(new THREE.BoxGeometry(2.05,.18,.44),lamp);l.position.copy(ellipsePoint(a,123.0,107.6,52.84));l.rotation.y=-a+Math.PI/2;scene.add(l)}}
      const c=document.createElement("canvas");c.width=1024;c.height=512;const x=c.getContext("2d");x.fillStyle="#09131c";x.fillRect(0,0,1024,512);x.fillStyle="#e35b20";x.fillRect(0,0,1024,44);x.fillStyle="#f5f1e8";x.textAlign="center";x.font="800 42px Arial";x.fillText("CRICKET SCOREBOARD",512,104);x.font="800 86px Arial";x.fillText("286 / 5",512,224);x.fillStyle="#d7e0e5";x.font="700 31px Arial";x.fillText("OVERS 47.2   ·   TARGET 312",512,286);x.fillStyle="#8fa5b2";x.font="600 24px Arial";x.fillText("NARENDRA MODI STADIUM · AHMEDABAD",512,360);const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;
      [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(27,13.5),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(0,30.2,s*108.2);m.rotation.y=s<0?0:Math.PI;scene.add(m)})
    }

`;
replaceSegment('    function roof(){', '    function extras(){', newRoof, 'roof');

// Replace the over-specific invented pavilion massing with a simpler reference-led
// hospitality/pavilion volume. It remains approximate until CAD/BIM is available.
const newPavilion = `    function architecturalPavilion(){
      const mid=THREE.MathUtils.degToRad((SOUTH_PAVILION.start+SOUTH_PAVILION.end)*.5),root=new THREE.Group(),concrete=new THREE.MeshStandardMaterial({color:0xe7e3da,roughness:.76,metalness:.03,dithering:true}),glass=new THREE.MeshStandardMaterial({color:0x526f80,roughness:.22,metalness:.08,transparent:true,opacity:.52,dithering:true}),dark=new THREE.MeshStandardMaterial({color:0x30363b,roughness:.62,metalness:.12,dithering:true}),rail=new THREE.MeshStandardMaterial({color:0xaeb7bb,roughness:.38,metalness:.46,dithering:true});
      root.position.copy(ellipsePoint(mid,119.0,104.8,27.3));root.rotation.y=-mid+Math.PI/2;
      const base=new THREE.Mesh(new THREE.BoxGeometry(46,4.0,6.2),concrete),upper=new THREE.Mesh(new THREE.BoxGeometry(40,3.6,5.7),concrete),deckA=new THREE.Mesh(new THREE.BoxGeometry(49,.5,7.2),dark),deckB=new THREE.Mesh(new THREE.BoxGeometry(43,.46,6.6),dark),glassA=new THREE.Mesh(new THREE.BoxGeometry(42,2.55,.18),glass),glassB=new THREE.Mesh(new THREE.BoxGeometry(36,2.35,.18),glass);base.position.y=-2.2;upper.position.y=2.3;deckA.position.y=-.05;deckB.position.y=4.35;glassA.position.set(0,-2.15,-3.2);glassB.position.set(0,2.3,-2.95);root.add(base,upper,deckA,deckB,glassA,glassB);
      for(let i=-7;i<=7;i++){const mull=new THREE.Mesh(new THREE.BoxGeometry(.1,6.8,.2),rail);mull.position.set(i*2.55,.1,-3.28);root.add(mull)}
      for(const y of [.45,4.72]){const guard=new THREE.Mesh(new THREE.BoxGeometry(47,.12,.12),rail);guard.position.set(0,y,-3.45);root.add(guard)}
      root.traverse(o=>{if(o.isMesh){o.raycast=()=>{};o.castShadow=false;o.receiveShadow=true}});scene.add(root)
    }
`;
replaceSegment('    function architecturalPavilion(){', '    function architecturalFidelity(){', newPavilion, 'pavilion');

// Correct the supporting structure to read as roof-independent V columns rising
// from concourse level rather than from grade, and remove the second flat roof skin.
replaceOnce('const campus=flat(ellipse(205,188),0x737968,-.04', 'const campus=flat(ellipse(300,260),0x737968,-.04', '63-acre-scale campus');
replaceOnce('const underside=flat(ring(153.7,139.7,124.8,109.5),0xd8ccb8,52.72', 'const underside=flat(ring(126.2,111.2,123.9,108.7),0xd8ccb8,52.72', 'inner roof catwalk underside');
replaceOnce('architecturalFacadeWall(154.0,140.0,52.15,53.45,roofEdgeMat);architecturalFacadeWall(124.3,109.0,51.35,52.95,roofShadowMat);',
  'architecturalFacadeWall(155.15,141.15,55.35,56.35,roofEdgeMat);architecturalFacadeWall(124.3,109.0,52.85,53.75,roofShadowMat);',
  'roof ring edge elevations');
replaceOnce('roofPairs.push([ellipsePoint(a,124.9,109.7,52.25),ellipsePoint(a,153.2,139.2,52.55)])',
  'roofPairs.push([ellipsePoint(a,124.9,109.7,53.45),ellipsePoint(a,154.2,140.2,55.75)])',
  'secondary roof ribs');
replaceOnce('top.push(ellipsePoint(a,152.0,138.0,52.4));mid.push(ellipsePoint(a,159.0,144.0,28.3));base.push(ellipsePoint(a,164.5,149.5,3.2))',
  'top.push(ellipsePoint(a,154.2,140.2,55.85));mid.push(ellipsePoint(a,159.0,144.0,28.3));base.push(ellipsePoint(a,161.2,146.2,27.7))',
  'concourse-supported V columns');

// Remove the fantasy wavy gold south facade ribbons. Retain a restrained warm
// accent only at the entry portal, which is much safer than inventing a full facade.
replaceOnce(
  'const southStart=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),southEnd=THREE.MathUtils.degToRad(SOUTH_PAVILION.end),gold=new THREE.MeshStandardMaterial({color:0xb89250,roughness:.5,metalness:.4,side:THREE.DoubleSide,dithering:true}),goldShadow=new THREE.MeshStandardMaterial({color:0x6d5835,roughness:.62,metalness:.22,side:THREE.DoubleSide,dithering:true});for(let i=0;i<5;i++){architecturalRibbon(southStart,southEnd,160.48,145.48,10.8+i*3.65,1.38,3.0,i*.67,goldShadow);architecturalRibbon(southStart,southEnd,160.72,145.72,11.15+i*3.65,1.38,2.55,i*.67,gold)}',
  'const southStart=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),southEnd=THREE.MathUtils.degToRad(SOUTH_PAVILION.end);',
  'south facade de-fictionalization'
);

const siteContext = `    function referenceSiteContext(){
      const concrete=new THREE.MeshStandardMaterial({color:0xd9d5cb,roughness:.88,metalness:.01}),roadMat=new THREE.MeshStandardMaterial({color:0x3c4144,roughness:.96,metalness:.01}),green=new THREE.MeshStandardMaterial({color:0x2f7439,roughness:.98}),white=new THREE.MeshStandardMaterial({color:0xe9e5dc,roughness:.8}),glass=new THREE.MeshStandardMaterial({color:0x536b78,roughness:.28,metalness:.08,transparent:true,opacity:.55});
      const podium=new THREE.Mesh(new THREE.BoxGeometry(92,1.1,48),concrete);podium.position.set(0,11.6,-169);podium.raycast=()=>{};scene.add(podium);
      const rampLen=76,rampRise=12,ramp=new THREE.Mesh(new THREE.BoxGeometry(54,.9,rampLen),concrete);ramp.position.set(0,6.05,-228);ramp.rotation.x=-Math.atan2(rampRise,rampLen);ramp.raycast=()=>{};scene.add(ramp);
      const underpass=new THREE.Mesh(new THREE.BoxGeometry(60,7.5,28),roadMat);underpass.position.set(0,3.7,-170);underpass.raycast=()=>{};scene.add(underpass);
      for(const x of [-27,27]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,1.15,rampLen),white);rail.position.set(x,6.8,-228);rail.rotation.x=ramp.rotation.x;rail.raycast=()=>{};scene.add(rail)}
      const academy=new THREE.Group(),academyBody=new THREE.Mesh(new THREE.BoxGeometry(46,8.5,24),white),academyGlass=new THREE.Mesh(new THREE.BoxGeometry(38,4.2,.24),glass);academy.position.set(-96,4.25,-190);academyGlass.position.set(0,.35,-12.15);academy.add(academyBody,academyGlass);academy.traverse(o=>{if(o.isMesh)o.raycast=()=>{}});scene.add(academy);
      const practiceSpecs=[[220,78,52,38],[228,-48,49,35],[-224,65,50,36]];for(const [x,z,rx,rz] of practiceSpecs){const apron=flat(ellipse(rx+3,rz+3),0xc5bda9,.005,{roughness:.98}),field=flat(ellipse(rx,rz),0x2f7439,.018,{roughness:.98});apron.position.set(x,0,z);field.position.set(x,0,z);apron.raycast=()=>{};field.raycast=()=>{}}
      const serviceRoad=flat(ring(286,246,270,230),0x4a4e50,.006,{roughness:.98});serviceRoad.raycast=()=>{}
    }

`;
replaceOnce('    function extras(){', siteContext + '    function extras(){', 'site context helper');
replaceOnce('roof();architecturalFidelity();await yieldToBrowser();', 'roof();architecturalFidelity();referenceSiteContext();await yieldToBrowser();', 'site context build hook');

replaceOnce(
  'The existing 3D stadium geometry is unchanged. Block/bay names follow the supplied layout; row letters are positional mappings and seat numbers are not claimed as official ticket inventory.',
  'Bowl depth, tensile-roof character and north-arrival/site context are calibrated from public architectural references. Block/bay names follow the supplied layout; row letters and seat numbers remain prototype mappings rather than official ticket inventory.',
  'accuracy note');

for (const marker of [
  'capacity:110000,field:{L:180*.9144,W:150*.9144}',
  'rows:38,rx:86.8,rz:72.8',
  'rows:41,rx:118.7,rz:104.7',
  'const tunnelSectionPattern={L:new Set(',
  'function tensileRoofSurface(){',
  'beamRing(155.2,141.2,56.15',
  'function referenceSiteContext(){',
  'new THREE.BoxGeometry(54,.9,rampLen)',
  'const campus=flat(ellipse(300,260)',
  'base.push(ellipsePoint(a,161.2,146.2,27.7))',
  'referenceSiteContext();await yieldToBrowser();'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-27 reference fidelity: output marker missing: ${marker}`);
}
for (const forbidden of [
  'capacity:132000,field:{L:180*.9144,W:150*.9144}',
  'rows:35,rx:86.8,rz:72.8',
  'rows:32,rx:118.7,rz:104.7',
  'sec%t.tunnelEvery===1',
  'flat(ring(154.5,140.5,123.8,108.5)',
  'base.push(ellipsePoint(a,164.5,149.5,3.2))',
  'for(let i=0;i<5;i++){architecturalRibbon(southStart,southEnd'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-27 reference fidelity: legacy approximation remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 27 reference fidelity applied: ~110k rendered seating target, irregular vomitory rhythm, tensile cable roof, concourse-supported V columns, north arrival ramp/podium, larger site context, three practice grounds and simplified pavilion');

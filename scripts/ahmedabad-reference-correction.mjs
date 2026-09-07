import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw new Error(`Phase-29 Ahmedabad reference correction: expected one ${label} marker, found ${count}`);
  html = html.replace(before, after);
}

function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Phase-29 Ahmedabad reference correction: missing ${label} segment`);
  html = html.slice(0, start) + replacement + html.slice(end);
}

// Phase 28 used generic sinusoidal ribbons and an invented tall perimeter crown after
// ambiguous image matching. Replace those with geometry tied to Ahmedabad-specific
// project documentation: a doubly-curved segmented aluminium facade on bent tube
// backing, Walter P Moore's shallow bi-chord compression ring, and distributed
// catwalk luminaires rather than a continuous glowing ring.
const correctedExterior = `    function doubleCurveEyeFacade(){
      const start=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),end=THREE.MathUtils.degToRad(SOUTH_PAVILION.end),uSeg=64,vSeg=8,y0=8.8,y1=28.0,baseRx=160.45,baseRz=145.45,pos=[],idx=[],aluminium=new THREE.MeshStandardMaterial({color:0xb5aa93,roughness:.5,metalness:.42,side:THREE.DoubleSide,dithering:true}),steel=new THREE.MeshStandardMaterial({color:0x7d8589,roughness:.48,metalness:.5,dithering:true});
      const point=(u,v)=>{const a=start+(end-start)*u,edge=Math.sin(Math.PI*u),vertical=Math.sin(Math.PI*v),bulge=.22+2.15*Math.pow(Math.max(0,edge*vertical),1.22),rx=baseRx+bulge,rz=baseRz+bulge*.9;return new THREE.Vector3(Math.cos(a)*rx,y0+(y1-y0)*v,Math.sin(a)*rz)};
      for(let i=0;i<uSeg;i++)for(let j=0;j<vSeg;j++){const u0=(i+.055)/uSeg,u1=(i+.945)/uSeg,v0=(j+.07)/vSeg,v1=(j+.93)/vSeg,p0=point(u0,v0),p1=point(u0,v1),p2=point(u1,v0),p3=point(u1,v1),b=pos.length/3;pos.push(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z,p2.x,p2.y,p2.z,p3.x,p3.y,p3.z);idx.push(b,b+1,b+3,b,b+3,b+2)}
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const skin=new THREE.Mesh(g,aluminium);skin.raycast=()=>{};skin.castShadow=false;skin.receiveShadow=true;scene.add(skin);
      const tubePairs=[];for(let i=0;i<=16;i++){const u=i/16;for(let j=0;j<vSeg;j++)tubePairs.push([point(u,j/vSeg),point(u,(j+1)/vSeg)])}for(let j=0;j<=4;j++){const v=j/4;for(let i=0;i<16;i++)tubePairs.push([point(i/16,v),point((i+1)/16,v)])}architecturalBeamInstances(tubePairs,.045,steel)
    }
    function roofCompressionRingBracing(){
      const stations=48,pairs=[],steel=new THREE.MeshStandardMaterial({color:0xb7bdc0,roughness:.4,metalness:.58,dithering:true});
      for(let i=0;i<stations;i++){const a=i/stations*Math.PI*2,b=(i+1)/stations*Math.PI*2,upper=ellipsePoint(a,155.2,141.2,56.15),lower=ellipsePoint(a,154.7,140.7,55.55),lowerNext=ellipsePoint(b,154.7,140.7,55.55);pairs.push([upper,lower],[upper,lowerNext])}architecturalBeamInstances(pairs,.06,steel)
    }
    function roofRingLighting(){
      const count=580,geo=new THREE.BoxGeometry(.82,.13,.24),mat=new THREE.MeshBasicMaterial({color:0xfff1d2}),lights=new THREE.InstancedMesh(geo,mat,count),dummy=new THREE.Object3D();lights.instanceMatrix.setUsage(THREE.StaticDrawUsage);lights.raycast=()=>{};
      for(let i=0;i<count;i++){const a=i/count*Math.PI*2,p=ellipsePoint(a,123.0,107.6,52.82);dummy.position.copy(p);dummy.rotation.set(0,-a+Math.PI/2,0);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix)}lights.instanceMatrix.needsUpdate=true;scene.add(lights)
    }
`;
replaceSegment('    function signatureFacade(){', '    function architecturalFidelity(){', correctedExterior, 'Phase 28 speculative facade/roof additions');

replaceOnce(
  'roof();architecturalFidelity();signatureFacade();roofPerimeterTruss();referenceSiteContext();await yieldToBrowser();',
  'roof();architecturalFidelity();doubleCurveEyeFacade();roofCompressionRingBracing();roofRingLighting();referenceSiteContext();await yieldToBrowser();',
  'Ahmedabad-corrected build hook'
);

replaceOnce(
  'Bowl depth, tensile-roof character, signature bronze facade and north-arrival/site context are calibrated from public architectural references. Exact dimensions remain approximate; Block/Bay names follow the supplied layout and row/seat labels remain prototype mappings rather than official ticket inventory.',
  'Bowl depth, tensile-roof character, double-curved segmented aluminium facade treatment and north-arrival/site context are calibrated from Ahmedabad-specific public project references. Facade placement and all exact dimensions remain approximate; Block/Bay names follow the supplied layout and row/seat labels remain prototype mappings rather than official ticket inventory.',
  'Ahmedabad-only accuracy note'
);

for (const marker of [
  'function doubleCurveEyeFacade(){',
  'uSeg=64,vSeg=8,y0=8.8,y1=28.0',
  'Math.pow(Math.max(0,edge*vertical),1.22)',
  'architecturalBeamInstances(tubePairs,.045,steel)',
  'function roofCompressionRingBracing(){',
  'ellipsePoint(a,155.2,141.2,56.15)',
  'ellipsePoint(a,154.7,140.7,55.55)',
  'function roofRingLighting(){',
  'const count=580,geo=new THREE.BoxGeometry(.82,.13,.24)',
  'doubleCurveEyeFacade();roofCompressionRingBracing();roofRingLighting();referenceSiteContext();await yieldToBrowser();'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-29 Ahmedabad reference correction: output marker missing: ${marker}`);
}

for (const forbidden of [
  'function signatureFacade(){',
  'for(let i=0;i<5;i++){const phase=i*.82,baseY=11.2+i*3.55;',
  'function roofPerimeterTruss(){',
  'ellipsePoint(a+step*.5,155.75,141.75,63.2)',
  'new THREE.ShapeGeometry(ledShape,192)'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-29 Ahmedabad reference correction: speculative Phase 28 marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 29 Ahmedabad reference correction applied: segmented doubly-curved aluminium eye facade, bent-tube backing, shallow bi-chord compression-ring bracing and 580 distributed catwalk luminaires');
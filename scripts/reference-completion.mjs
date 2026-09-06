import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

function replaceOnce(before, after, label) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw new Error(`Phase-28 reference completion: expected one ${label} marker, found ${count}`);
  html = html.replace(before, after);
}

function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Phase-28 reference completion: missing ${label} segment`);
  html = html.slice(0, start) + replacement + html.slice(end);
}

// Keep the WebGL-failure fallback aligned with the normal UI. Populous publishes
// 110,000 as the seated capacity while separately discussing 132,000 extended capacity.
replaceOnce(
  '<div class="fallback-meta"><div><b>132,000</b><span>extended capacity</span></div>',
  '<div class="fallback-meta"><div><b>110,000</b><span>seated capacity</span></div>',
  'fallback capacity label'
);

// Replace the restrained Phase-27 placeholder pavilion with a three-level pavilion
// treatment and restore the real stadium's distinctive bronze wave/eye facade over
// the pavilion arc. These remain public-reference approximations rather than CAD.
const pavilionAndFacade = `    function architecturalPavilion(){
      const mid=THREE.MathUtils.degToRad((SOUTH_PAVILION.start+SOUTH_PAVILION.end)*.5),root=new THREE.Group(),concrete=new THREE.MeshStandardMaterial({color:0xe9e5dc,roughness:.76,metalness:.025,dithering:true}),glass=new THREE.MeshStandardMaterial({color:0x426576,roughness:.2,metalness:.08,transparent:true,opacity:.58,dithering:true}),slabMat=new THREE.MeshStandardMaterial({color:0x353b3f,roughness:.62,metalness:.12,dithering:true}),rail=new THREE.MeshStandardMaterial({color:0xb8c0c4,roughness:.4,metalness:.42,dithering:true});
      root.position.copy(ellipsePoint(mid,119.0,104.8,25.8));root.rotation.y=-mid+Math.PI/2;
      const floors=[{y:-4.8,w:52,d:7.8,h:3.3},{y:-.7,w:48,d:7.0,h:3.1},{y:3.25,w:43,d:6.25,h:3.0}];
      for(const f of floors){const body=new THREE.Mesh(new THREE.BoxGeometry(f.w,f.h,f.d),concrete),front=new THREE.Mesh(new THREE.BoxGeometry(f.w-4,f.h-.72,.18),glass),slab=new THREE.Mesh(new THREE.BoxGeometry(f.w+2,.34,f.d+.8),slabMat);body.position.y=f.y;front.position.set(0,f.y,-f.d*.5-.1);slab.position.y=f.y+f.h*.5+.22;root.add(body,front,slab);for(let i=-6;i<=6;i++){const mull=new THREE.Mesh(new THREE.BoxGeometry(.08,f.h-.55,.22),rail);mull.position.set(i*(f.w-5)/12,f.y,-f.d*.5-.16);root.add(mull)}}
      const cap=new THREE.Mesh(new THREE.BoxGeometry(46,.42,7.1),concrete);cap.position.y=5.15;root.add(cap);root.traverse(o=>{if(o.isMesh){o.raycast=()=>{};o.castShadow=false;o.receiveShadow=true}});scene.add(root)
    }
    function signatureFacade(){
      const start=THREE.MathUtils.degToRad(SOUTH_PAVILION.start),end=THREE.MathUtils.degToRad(SOUTH_PAVILION.end),mid=(start+end)*.5,bronze=new THREE.MeshStandardMaterial({color:0xa67736,roughness:.54,metalness:.28,side:THREE.DoubleSide,transparent:true,opacity:.94,dithering:true}),bronzeDark=new THREE.MeshStandardMaterial({color:0x6c4c28,roughness:.64,metalness:.18,side:THREE.DoubleSide,dithering:true}),glass=new THREE.MeshStandardMaterial({color:0x315260,roughness:.18,metalness:.1,transparent:true,opacity:.66,side:THREE.DoubleSide,dithering:true}),white=new THREE.MeshStandardMaterial({color:0xf0ece2,roughness:.72,metalness:.03,side:THREE.DoubleSide,dithering:true});
      architecturalFacadeWall(160.55,145.55,9.0,28.4,bronzeDark,start,end,96);
      for(let i=0;i<5;i++){const phase=i*.82,baseY=11.2+i*3.55;architecturalRibbon(start,end,160.88+i*.035,145.88+i*.035,baseY,1.28,2.65,phase,bronze,96)}
      architecturalFacadeWall(161.08,146.08,1.3,10.7,glass,mid-.14,mid+.14,36);
      architecturalRibbon(mid-.155,mid+.155,161.2,146.2,10.95,.08,.42,0,white,28);
      architecturalRibbon(mid-.155,mid+.155,161.2,146.2,1.15,.08,.32,0,white,28)
    }
    function roofPerimeterTruss(){
      const stations=36,step=Math.PI*2/stations,bottom=[],top=[],pairs=[],steel=new THREE.MeshStandardMaterial({color:0xf0eee7,roughness:.42,metalness:.44,dithering:true});
      for(let i=0;i<stations;i++){const a=i*step;bottom.push(ellipsePoint(a,155.2,141.2,56.05));top.push(ellipsePoint(a+step*.5,155.75,141.75,63.2))}
      for(let i=0;i<stations;i++){pairs.push([top[i],top[(i+1)%stations]],[bottom[i],top[i]],[bottom[(i+1)%stations],top[i]])}
      architecturalBeamInstances(pairs,.16,steel);
      const ledShape=ring(123.35,107.95,122.7,107.3),led=new THREE.Mesh(new THREE.ShapeGeometry(ledShape,192),new THREE.MeshBasicMaterial({color:0xffefd0,side:THREE.DoubleSide}));led.rotation.x=-Math.PI/2;led.position.y=52.72;led.raycast=()=>{};scene.add(led)
    }
`;
replaceSegment('    function architecturalPavilion(){', '    function architecturalFidelity(){', pavilionAndFacade, 'pavilion/facade block');

replaceOnce(
  'roof();architecturalFidelity();referenceSiteContext();await yieldToBrowser();',
  'roof();architecturalFidelity();signatureFacade();roofPerimeterTruss();referenceSiteContext();await yieldToBrowser();',
  'Phase 28 build hook'
);

replaceOnce(
  'Bowl depth, tensile-roof character and north-arrival/site context are calibrated from public architectural references. Block/bay names follow the supplied layout; row letters and seat numbers remain prototype mappings rather than official ticket inventory.',
  'Bowl depth, tensile-roof character, signature bronze facade and north-arrival/site context are calibrated from public architectural references. Exact dimensions remain approximate; Block/Bay names follow the supplied layout and row/seat labels remain prototype mappings rather than official ticket inventory.',
  'accuracy note'
);

for (const marker of [
  '<div class="fallback-meta"><div><b>110,000</b><span>seated capacity</span></div>',
  'function signatureFacade(){',
  'architecturalFacadeWall(160.55,145.55,9.0,28.4,bronzeDark',
  'for(let i=0;i<5;i++){const phase=i*.82,baseY=11.2+i*3.55;',
  'function roofPerimeterTruss(){',
  'ellipsePoint(a+step*.5,155.75,141.75,63.2)',
  'new THREE.ShapeGeometry(ledShape,192)',
  'signatureFacade();roofPerimeterTruss();referenceSiteContext();await yieldToBrowser();'
]) {
  if (!html.includes(marker)) throw new Error(`Phase-28 reference completion: output marker missing: ${marker}`);
}

for (const forbidden of [
  '<div class="fallback-meta"><div><b>132,000</b><span>extended capacity</span></div>',
  'const base=new THREE.Mesh(new THREE.BoxGeometry(46,4.0,6.2),concrete)',
  'remove the fantasy wavy gold south facade ribbons'
]) {
  if (html.includes(forbidden)) throw new Error(`Phase-28 reference completion: legacy/inaccurate marker remains: ${forbidden}`);
}

await writeFile(outputPath, html, 'utf8');
console.log('Phase 28 reference completion applied: three-level pavilion treatment, restored bronze wave facade, visible roof perimeter truss, continuous inner LED ring, and aligned fallback capacity');
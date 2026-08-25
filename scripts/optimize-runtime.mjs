import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) throw new Error(`Phase-11 patch target missing (${label})`);
  html = html.replace(before, after);
}
function replaceRegex(pattern, after, label) {
  if (!pattern.test(html)) throw new Error(`Phase-11 patch target missing (${label})`);
  pattern.lastIndex = 0;
  html = html.replace(pattern, after);
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
  'function renderPixelRatio()',
  'function ensureFrame()',
  'function requestRender()',
  'function requestMinimap()',
  'if(minimapDirty)drawMinimap()',
  'if(renderDirty){renderer.render(scene,camera);renderDirty=false}',
  '@media(max-width:800px)',
  '@media(max-width:430px)',
  '@media(max-height:720px) and (max-width:800px)',
  'canvas.addEventListener("pointermove"',
  'if(pinchStart>8)',
  '<button class="btn" id="view" disabled>View from seat</button>',
  '<button id="back">Back to stadium</button>'
];
for (const marker of protectedRequired) {
  if (!html.includes(marker)) throw new Error(`Phase-11 protected invariant missing: ${marker}`);
}

replaceRegex(
  /    function actualSeatMeta\(m\)\{[\s\S]*?\n    \}\n    function actualEntryById/,
`    const actualMetaCache=new Map();
    function actualSeatMeta(m){
      const deg=actualNavDegFromAngle(m.angle),entry=actualEntryFor(m.tierId,deg);
      if(!entry){const key=m.tierId+":unmapped";let cached=actualMetaCache.get(key);if(!cached){cached={entry:null,blockId:"",name:"Unmapped",short:"Unmapped",bay:0,tierLabel:m.tierName,note:"Generated stadium position; no supplied block mapping covers this angle."};actualMetaCache.set(key,cached)}return cached}
      const bay=actualBayFor(entry,deg),key=m.tierId+":"+entry.id+":"+bay;let cached=actualMetaCache.get(key);if(cached)return cached;
      cached={entry,blockId:entry.id,name:entry.name,short:entry.short,bay,tierLabel:entry.tierLabel,note:entry.pavilion?"South Pavilion reference zone. This generated upper-bowl seat is retained for visual continuity and is not presented as official inventory.":"Block/Bay mapped from the supplied seating layout. Row letter is position-mapped from the supplied sequence; seat number remains generated."};actualMetaCache.set(key,cached);return cached
    }
    function actualEntryById`,
  'Block/Bay metadata cache'
);

replaceExact(
`    function ensureFrame(){if(!frameHandle)frameHandle=requestAnimationFrame(animate)}
    function requestRender(){renderDirty=true;ensureFrame()}
    function requestMinimap(){minimapDirty=true;ensureFrame()}`,
`    function ensureFrame(){if(document.hidden||frameHandle)return;frameHandle=requestAnimationFrame(animate)}
    function requestRender(){renderDirty=true;ensureFrame()}
    function requestMinimap(){minimapDirty=true;ensureFrame()}
    document.addEventListener("visibilitychange",()=>{if(document.hidden){if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0}else{requestMinimap();requestRender()}},{passive:true});
    const yieldToBrowser=()=>new Promise(resolve=>setTimeout(resolve,0));`,
  'visibility-aware scheduler'
);

replaceExact(
`    function seats(t){
      const panBase=new THREE.BoxGeometry(.43,.18,.42);panBase.translate(0,.09,0);
      const backBase=new THREE.BoxGeometry(.43,.56,.10);backBase.translate(0,.28,0);
      let rendered=0;`,
`    async function seats(t){
      const panBase=new THREE.BoxGeometry(.43,.18,.42);panBase.translate(0,.09,0);
      const backBase=new THREE.BoxGeometry(.43,.56,.10);backBase.translate(0,.28,0);
      const seatColor=new THREE.Color(),backOut=new THREE.Vector3(),yieldEvery=lowPower?2:(mobile?3:6);
      let rendered=0;`,
  'async seat construction'
);
replaceExact('baseColor:new THREE.Color(colorFor(t,a,r,sec)).getHex()','baseColor:seatColor.set(colorFor(t,a,r,sec)).getHex()','seat color scratch reuse');
replaceExact('const sphere=boundingSphereFor(items),panGeo=panBase.clone();','const sphere=boundingSphereFor(items),panGeo=panBase;','shared pan geometry');
replaceExact('const backItems=mobile?items.filter((_,i)=>i%2===0):items,backGeo=backBase.clone();','const backItems=mobile?items.filter((_,i)=>i%2===0):items,backGeo=backBase;','shared back geometry');
replaceExact('const m=backItems[k],out=new THREE.Vector3(m.position.x,0,m.position.z).normalize();','const m=backItems[k],out=backOut.set(m.position.x,0,m.position.z).normalize();','back direction scratch reuse');
replaceExact(
`        sectionIndex.set(section,items);sectionObjects.set(section,{pan,back,items,tier:t});rendered+=items.length
      }
      return rendered
    }`,
`        sectionIndex.set(section,items);sectionObjects.set(section,{pan,back,items,tier:t});rendered+=items.length;
        if((sec+1)%yieldEvery===0&&sec+1<CFG.sections)await yieldToBrowser()
      }
      return rendered
    }`,
  'chunked seat generation'
);

replaceRegex(
  /    function build\(\)\{[\s\S]*?\n    \}\n\n    function drawMinimap\(\)\{/,
`    async function build(){
      extras();ground();await yieldToBrowser();
      loadtext.textContent="Calibrating orange lower bowl…";bowl(CFG.tiers[0],0x373a3b);const a=await seats(CFG.tiers[0]);aisles(CFG.tiers[0]);railings(CFG.tiers[0]);vomitories(CFG.tiers[0]);await yieldToBrowser();
      loadtext.textContent="Building concourse, media and hospitality bands…";hospitality();mediaAreas();await yieldToBrowser();
      loadtext.textContent="Calibrating blue upper bowl…";bowl(CFG.tiers[1],0x30353b);const b=await seats(CFG.tiers[1]);aisles(CFG.tiers[1]);railings(CFG.tiers[1]);vomitories(CFG.tiers[1]);roof();await yieldToBrowser();
      populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();requestMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;requestRender();loadtext.textContent=\`Ready · \${(a+b).toLocaleString()} interactive seat instances\`;setTimeout(()=>loading.classList.add("done"),140)
    }

    function drawMinimap(){`,
  'async startup pipeline'
);

replaceExact(
  '    orbitCam();requestAnimationFrame(()=>setTimeout(build,20));',
  '    orbitCam();requestAnimationFrame(()=>setTimeout(()=>{build().catch(err=>{console.error(err);fail3D("The stadium could not finish building on this device.")})},20));',
  'async build error boundary'
);

const required = [
  'const actualMetaCache=new Map()',
  'if(document.hidden||frameHandle)return',
  'document.addEventListener("visibilitychange"',
  'const yieldToBrowser=()=>new Promise(resolve=>setTimeout(resolve,0))',
  'async function seats(t)',
  'const seatColor=new THREE.Color(),backOut=new THREE.Vector3(),yieldEvery=lowPower?2:(mobile?3:6)',
  'baseColor:seatColor.set(colorFor(t,a,r,sec)).getHex()',
  'panGeo=panBase',
  'backGeo=backBase',
  'out=backOut.set(m.position.x,0,m.position.z).normalize()',
  'if((sec+1)%yieldEvery===0&&sec+1<CFG.sections)await yieldToBrowser()',
  'async function build()',
  'const a=await seats(CFG.tiers[0])',
  'const b=await seats(CFG.tiers[1])',
  'build().catch(err=>',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'renderer.setPixelRatio(renderPixelRatio())',
  'renderer.shadowMap.autoUpdate=false',
  'pan.castShadow=false;pan.receiveShadow=true',
  'back.castShadow=false;back.receiveShadow=true'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Phase-11 invariant missing: ${marker}`);
}
const legacyPatterns = [
  /\n    function seats\(t\)\{\n/,
  /panGeo=panBase\.clone\(\)/,
  /backGeo=backBase\.clone\(\)/,
  /baseColor:new THREE\.Color\(colorFor\(t,a,r,sec\)\)\.getHex\(\)/,
  /out=new THREE\.Vector3\(m\.position\.x,0,m\.position\.z\)\.normalize\(\)/,
  /const a=seats\(CFG\.tiers\[0\]\)/,
  /const b=seats\(CFG\.tiers\[1\]\)/
];
for (const pattern of legacyPatterns) {
  if (pattern.test(html)) throw new Error(`Phase-11 legacy/regression marker still present: ${pattern}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Optimized startup chunking, seat resource reuse, metadata churn and hidden-tab rendering without changing stadium UX");

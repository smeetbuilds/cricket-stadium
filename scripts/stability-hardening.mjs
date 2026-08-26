import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function fail(message) {
  throw new Error(`Phase-19 stability hardening: ${message}`);
}
function replaceExact(before, after, label) {
  if (!html.includes(before)) fail(`patch target missing (${label}): ${before.slice(0, 170)}…`);
  html = html.replace(before, after);
}
function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) fail(`segment missing (${label})`);
  html = html.slice(0, start) + replacement + html.slice(end);
}

replaceExact(
  '    *{box-sizing:border-box}',
  '    *{box-sizing:border-box}.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}',
  'screen-reader-only utility'
);
replaceExact(
  '<body>\n  <canvas id="c" aria-label="Interactive 3D recreation of Narendra Modi Stadium"></canvas><div id="vig"></div>',
  '<body>\n  <h1 class="sr-only">Motera 3D — Narendra Modi Stadium Seat Explorer</h1>\n  <p id="minimap-help" class="sr-only">Use the Block and Bay selectors for keyboard-accessible seating-map navigation.</p>\n  <canvas id="c" aria-label="Interactive 3D recreation of Narendra Modi Stadium"></canvas><div id="vig"></div>',
  'semantic heading and minimap help'
);
replaceExact(
  '<canvas id="minimap" width="340" height="264"></canvas>',
  '<canvas id="minimap" width="340" height="264" role="img" aria-describedby="minimap-help"></canvas>',
  'minimap accessible description'
);
replaceExact(
  '@media(max-height:720px) and (max-width:800px){.brand span,#sub{display:none}.brand{padding:8px 10px}#card{padding:9px}.finder{margin-bottom:7px}.actions{margin-top:7px}.btn{min-height:36px}#minimap-wrap{display:block;top:68px;width:112px;padding:5px}#minimap{width:100px;height:78px}.map-caption{display:none}}',
  '@media(max-height:720px) and (max-width:800px){.brand span,#sub{display:none}.brand{padding:8px 10px}#card{padding:9px}.finder{margin-bottom:7px}.actions{margin-top:7px}.btn{min-height:36px}#minimap-wrap{display:none}}',
  'short-screen minimap contradiction'
);

const bayIndexCode = `    const actualBayIndex=new Map(),navigableSeats=[],actualBaySeatNumber=new WeakMap();
    const actualBayKey=(blockId,bay)=>blockId+":"+bay;
    function seatsForActualBay(blockId,bay){return actualBayIndex.get(actualBayKey(blockId,bay))||[]}
    function navSeatItems(section){return actualSelectedBlock&&actualSelectedBay?seatsForActualBay(actualSelectedBlock,actualSelectedBay):(sectionIndex.get(section)||[])}
    function displaySeatNumber(m){return actualBaySeatNumber.get(m)||m.seat}
    function buildActualSeatIndexes(){
      actualBayIndex.clear();navigableSeats.length=0;
      for(const items of sectionIndex.values())for(const m of items){
        const a=actualSeatMeta(m);if(!a.entry||a.entry.pavilion||!a.blockId||!a.bay)continue;
        const key=actualBayKey(a.blockId,a.bay);let list=actualBayIndex.get(key);if(!list){list=[];actualBayIndex.set(key,list)}list.push(m)
      }
      for(const list of actualBayIndex.values()){
        navigableSeats.push(...list);const rows=new Map();
        for(const m of list){let row=rows.get(m.row);if(!row){row=[];rows.set(m.row,row)}row.push(m)}
        for(const row of rows.values()){
          const meta=actualSeatMeta(row[0]),entry=meta.entry,span=((entry.end-entry.start)+360)%360||360,bayEnd=actualWrapDeg(entry.start+span*meta.bay/entry.bays);
          row.sort((a,b)=>actualWrapDeg(bayEnd-actualNavDegFromAngle(a.angle))-actualWrapDeg(bayEnd-actualNavDegFromAngle(b.angle)));
          row.forEach((m,i)=>actualBaySeatNumber.set(m,i+1))
        }
      }
    }
    function highlightActualBay(blockId,bay,focus=true){
      const items=seatsForActualBay(blockId,bay);if(!items.length)return;
      const activeSections=new Set(items.map(m=>m.section));
      for(const [key,o] of sectionObjects){const active=activeSections.has(key);o.pan.material.color.setHex(active?0xffffff:0x505050);o.pan.material.emissive?.set(active?focusColor:tmpColor.setHex(0));o.pan.material.emissiveIntensity=active?.18:0;if(o.back){o.back.material.color.setHex(active?0xffffff:0x505050);o.back.material.emissive?.set(active?focusColor:tmpColor.setHex(0));o.back.material.emissiveIntensity=active?.18:0}}
      const rec=actualEntryById(blockId);ui.sectionState.textContent=rec.entry.name+" · Bay "+bay+" · "+items.length.toLocaleString()+" rendered seats";requestRender();requestMinimap();
      if(focus&&!seatMode){const avg=new THREE.Vector3();for(const m of items)avg.add(m.position);avg.multiplyScalar(1/items.length);const a=THREE.MathUtils.degToRad(actualCenterDeg(rec.entry,bay));orbit.target.set(avg.x*.13,avg.y*.72,avg.z*.13);orbit.t=Math.PI/2-a;orbit.p=1.03;orbit.r=rec.tier==="U"?225:205;orbitCam()}
    }
`;
replaceExact('    function populateActualNavigator(){',bayIndexCode+'\n    function populateActualNavigator(){','Bay-wide seat index');

const focusActualBay = `    function focusActualBay(id,bay){
      const rec=actualEntryById(id),items=seatsForActualBay(id,bay);if(!rec||!bay||!items.length)return;
      actualSelectedBlock=id;actualSelectedBay=bay;selected=null;syncUrl(null);ui.view.disabled=true;ui.share.disabled=true;if(marker){marker.visible=false;requestRender()}
      const section=actualInternalSection(rec.tier,actualCenterDeg(rec.entry,bay));ui.navSection.value=section;populateRows(section);
      ui.navBlock.value=id;populateActualBays(id,bay);ui.navRow.value="";ui.navSeat.innerHTML='<option value="">—</option>';ui.navSeat.disabled=true;
      ui.tier.textContent=rec.entry.tierLabel;ui.title.textContent=rec.entry.name+" · Bay "+bay;
      ui.sub.textContent="Mapped block/bay overlay on the existing 3D bowl. Choose a mapped row and generated bay seat for an approximate sightline.";
      ui.sec.textContent=rec.entry.short+" · B"+String(bay).padStart(2,"0");ui.row.textContent="—";ui.seat.textContent="—";
      ui.mapLabel.textContent=rec.entry.short+" · B"+String(bay).padStart(2,"0");highlightActualBay(id,bay,true)
    }
`;
replaceSegment('    function focusActualBay(id,bay){','    function drawActualMinimapOverlay(x,cx,cy,rx,ry){',focusActualBay,'Bay-wide focus behavior');
replaceSegment('    function drawActualMinimapOverlay(x,cx,cy,rx,ry){','    const ui={tier:','    const ui={tier:','dead minimap overlay');

const navFunctions = `    function populateRows(section,preferred){
      const items=navSeatItems(section),rows=uniqueSorted(items,"row"),tierId=section?.[0]||"";
      ui.navRow.innerHTML='<option value="">Row</option>'+rows.map(v=>\`<option value="\${v}">\${actualRowLabel(tierId,v,actualSelectedBlock)}</option>\`).join("");ui.navRow.disabled=!rows.length;ui.navSeat.innerHTML='<option value="">—</option>';ui.navSeat.disabled=true;
      if(preferred&&rows.includes(preferred)){ui.navRow.value=String(preferred);populateSeats(section,preferred)}
    }
    function populateSeats(section,row,preferred){
      const items=navSeatItems(section).filter(m=>m.row===Number(row)).sort((a,b)=>displaySeatNumber(a)-displaySeatNumber(b));
      ui.navSeat.innerHTML='<option value="">Seat</option>'+items.map(m=>\`<option value="\${seatSlug(m)}">\${String(displaySeatNumber(m)).padStart(2,"0")}</option>\`).join("");ui.navSeat.disabled=!items.length;
      if(preferred){const value=typeof preferred==="object"?seatSlug(preferred):String(preferred);if([...ui.navSeat.options].some(o=>o.value===value))ui.navSeat.value=value}
    }
    function findSeat(section,row,seatValue){
      const items=navSeatItems(section).filter(m=>m.row===Number(row)),raw=String(seatValue||"");
      if(/^[LU]\\d{2}-R\\d+-S\\d+$/i.test(raw))return items.find(m=>seatSlug(m)===raw)||null;
      const n=Number(raw);return items.find(m=>m.seat===n)||null
    }
`;
replaceSegment('    function populateRows(section,preferred){','    function seatSlug(m){',navFunctions+'    function seatSlug(m){','Bay-wide row/seat navigator');
replaceExact('function syncNavigator(m){if(!m)return;syncActualNavigator(m);ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m.seat);ui.navRow.value=String(m.row);ui.navSeat.value=String(m.seat);highlightSection(m.section,false)}','function syncNavigator(m){if(!m)return;syncActualNavigator(m);ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m);ui.navRow.value=String(m.row);ui.navSeat.value=seatSlug(m);if(actualSelectedBlock&&actualSelectedBay)highlightActualBay(actualSelectedBlock,actualSelectedBay,false);else highlightSection(m.section,false)}','direct-click navigator synchronization');

const selectFn = `    function select(m,sync=true,updateUrl=true){
      if(!m)return;selected=m;const actual=actualSeatMeta(m);
      ui.tier.textContent=actual.tierLabel;ui.title.textContent=actual.bay?actual.name+" · Bay "+actual.bay:actual.name;ui.sub.textContent=actual.note;
      ui.sec.textContent=actual.bay?actual.short+" · B"+String(actual.bay).padStart(2,"0"):actual.short;
      ui.row.textContent=actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):String(m.row).padStart(2,"0");ui.seat.textContent=String(displaySeatNumber(m)).padStart(2,"0");
      ui.view.disabled=false;ui.share.disabled=false;if(marker){marker.visible=true;marker.position.copy(m.position);marker.position.y+=.68;pulseMarker();requestRender()}
      if(sync)syncNavigator(m);else syncActualNavigator(m);if(updateUrl)syncUrl(m);requestMinimap();if(seatMode)moveSeatCameraTo(m)
    }
`;
replaceSegment('    function select(m,sync=true,updateUrl=true){','    function chooseSection(section,focus=true){',selectFn+'    function chooseSection(section,focus=true){','selected seat behavior');
replaceExact('    function randomSeat(){const keys=[...sectionIndex.keys()];if(!keys.length)return;const d=sectionIndex.get(keys[Math.floor(Math.random()*keys.length)]);select(d[Math.floor(Math.random()*d.length)])}','    function randomSeat(){if(!navigableSeats.length)return;select(navigableSeats[Math.floor(Math.random()*navigableSeats.length)])}','mapped Random Seat pool');
replaceExact('      populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();requestMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;requestRender();','      buildActualSeatIndexes();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();requestMinimap();if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;requestRender();','actual Bay index initialization');

replaceExact('    let frameHandle=0,renderDirty=true,minimapDirty=true,backsVisible=null,backVisibilityCount=-1;','    let frameHandle=0,renderDirty=true,minimapDirty=true,backsVisible=null,backVisibilityCount=-1,markerPulseUntil=0;','bounded marker animation state');
replaceExact('    function requestMinimap(){minimapDirty=true;ensureFrame()}','    function requestMinimap(){minimapDirty=true;ensureFrame()}\n    function pulseMarker(){markerPulseUntil=performance.now()+1200;if(marker&&marker.visible)ensureFrame()}','marker pulse scheduler');
replaceExact('      return (actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):m.row)+" · Seat "+m.seat','      return (actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):m.row)+" · Seat "+displaySeatNumber(m)','seat-view generated Bay seat number');

const restoreShare = `    function invalidSharedSeat(message){ui.tier.textContent="Seat link";ui.title.textContent="Seat link unavailable";ui.sub.textContent=message;syncUrl(null)}
    function restoreFromUrl(){
      const raw=new URL(location.href).searchParams.get("seat");if(!raw)return;const m=/^([LU]\\d{2})-R(\\d+)-S(\\d+)$/i.exec(raw);if(!m){invalidSharedSeat("This shared generated-seat link is invalid.");return}
      const found=findSeat(m[1].toUpperCase(),Number(m[2]),Number(m[3]));if(found)select(found,true,false);else invalidSharedSeat("This generated seat no longer exists in the current stadium model.")
    }
    let shareBusy=false;
    async function shareSeat(){
      if(!selected||shareBusy)return;shareBusy=true;const actual=actualSeatMeta(selected),url=location.href,old=ui.share.textContent,text=\`Motera 3D · \${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, Row \${actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row}, Seat \${displaySeatNumber(selected)}\`;ui.share.disabled=true;ui.share.textContent="Sharing…";
      try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url});flashShare("Shared",old)}else if(navigator.clipboard){await navigator.clipboard.writeText(url);flashShare("Copied",old)}else{const ta=document.createElement("textarea");ta.value=url;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();flashShare("Copied",old)}}catch(e){if(e?.name!=="AbortError")flashShare("Copy failed",old);else ui.share.textContent=old}finally{shareBusy=false;ui.share.disabled=!selected;if(ui.share.textContent==="Sharing…")ui.share.textContent=old}
    }
    function flashShare(label,restore="Share"){ui.share.textContent=label;setTimeout(()=>{if(!shareBusy)ui.share.textContent=restore},1100)}
`;
replaceSegment('    function restoreFromUrl(){','\n\n    function seatViewLabel(m){',restoreShare+'\n\n    function seatViewLabel(m){','share and URL failure states');
replaceExact('if(marker&&selected)marker.visible=true;camera.near=2;','if(marker&&selected){marker.visible=true;pulseMarker()}camera.near=2;','return-to-stadium marker pulse');

const resetFn = `    function reset(){
      gsap.killTweensOf(camera.position);
      if(seatMode){seatMode=false;clearSeatDetails();document.body.classList.remove("seatmode");canvas.classList.remove("seatmode");ui.bar.classList.remove("show");camera.near=2;camera.far=700;camera.fov=45;camera.updateProjectionMatrix();if(marker&&selected){marker.visible=true;pulseMarker()}}
      orbit.r=defaults.r;orbit.t=defaults.t;orbit.p=defaults.p;orbit.target.copy(defaults.target);orbitCam();
      if(actualSelectedBlock&&actualSelectedBay)highlightActualBay(actualSelectedBlock,actualSelectedBay,false);else if(highlightedSection)highlightSection(highlightedSection,false)
    }
`;
replaceSegment('    function reset(){','    async function build(){',resetFn+'    async function build(){','race-free reset');

const pickFn = `    function pick(x,y){
      if(seatMode||!seatMeshes.length)return null;const r=canvas.getBoundingClientRect();pointer.x=(x-r.left)/r.width*2-1;pointer.y=-(y-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);
      const candidates=seatMeshes.filter(mesh=>{const sphere=mesh.userData.worldSphere;return !sphere||ray.ray.intersectsSphere(sphere)}),h=ray.intersectObjects(candidates,false)[0];
      if(h&&typeof h.instanceId==="number"){const section=h.object.userData.section,d=sectionIndex.get(section),m=d&&d[h.instanceId];if(m){select(m);return m}}return null
    }
`;
replaceSegment('    function pick(x,y){','    function invalidSharedSeat(message){',pickFn+'    function invalidSharedSeat(message){','ray-pick return contract');
replaceExact('    canvas.addEventListener("dblclick",e=>{if(seatMode)return;pick(e.clientX,e.clientY);if(selected)enter()});','    canvas.addEventListener("dblclick",e=>{if(seatMode)return;const hit=pick(e.clientX,e.clientY);if(hit)enter()});','double-click stale selection guard');
replaceExact('    addEventListener("keydown",e=>{if(e.key==="Escape")leave();if(e.key.toLowerCase()==="r")reset();if(e.key==="Enter"&&selected&&!seatMode)enter()});','    addEventListener("keydown",e=>{if(e.target?.closest?.("select,input,textarea,button,[contenteditable=true]"))return;if(e.key==="Escape")leave();else if(e.key.toLowerCase()==="r")reset();else if(e.key==="Enter"&&selected&&!seatMode)enter()});','keyboard shortcut form-control guard');

const animateFn = `    function animate(t){
      frameHandle=0;
      if(marker&&marker.visible&&t<markerPulseUntil){const p=1+Math.sin(t*.012)*.12;marker.scale.setScalar(p);renderDirty=true;ensureFrame()}else if(marker&&marker.visible&&marker.scale.x!==1){marker.scale.setScalar(1);renderDirty=true}
      if(minimapDirty)drawMinimap();if(renderDirty){renderer.render(scene,camera);renderDirty=false}
    }
`;
replaceSegment('    function animate(t){','    orbitCam();requestAnimationFrame',animateFn+'    orbitCam();requestAnimationFrame','bounded marker render loop');

for(const required of [
  'const actualBayIndex=new Map()',
  'function seatsForActualBay(',
  'function buildActualSeatIndexes()',
  'function highlightActualBay(',
  'navigableSeats[Math.floor(Math.random()*navigableSeats.length)]',
  'displaySeatNumber(m)',
  'function pulseMarker()',
  't<markerPulseUntil',
  'const hit=pick(e.clientX,e.clientY);if(hit)enter()',
  'e.target?.closest?.("select,input,textarea,button,[contenteditable=true]")',
  'Seat link unavailable',
  'shareBusy=true',
  '<h1 class="sr-only">Motera 3D — Narendra Modi Stadium Seat Explorer</h1>'
]) if(!html.includes(required)) fail(`required hardening marker missing: ${required}`);
for(const forbidden of [
  'const keys=[...sectionIndex.keys()];if(!keys.length)return;const d=sectionIndex.get(keys[Math.floor(Math.random()*keys.length)])',
  'function drawActualMinimapOverlay(',
  '#minimap-wrap{display:block;top:68px;width:112px'
]) if(html.includes(forbidden)) fail(`legacy behavior remains: ${forbidden}`);

const sections=48;
const tiers=[
  {id:'L',rows:35,rx:86.8,rz:72.8,depth:.86,spacing:.47,aisle:.031,tunnelRow:13,tunnelRows:5,tunnelEvery:4},
  {id:'U',rows:32,rx:118.7,rz:104.7,depth:.88,spacing:.48,aisle:.029,tunnelRow:9,tunnelRows:4,tunnelEvery:4}
];
const layouts={
  L:[['E',5,13,32],['F',6,45,74],['G',7,74,110],['H',5,110,144],['SPE',4,144,169],['SPC',4,169,191],['SPW',4,191,211],['A',5,211,261],['B',7,261,293],['C',6,293,316],['D',5,323,349]],
  U:[['N',6,354.7,31.9],['P',6,31.9,59.9],['Q',8,59.9,113.7],['R',6,113.7,150.3],['J',6,217.7,245.6],['K',8,245.6,299.6],['L',6,299.6,327.7],['M',6,327.7,354.7]]
};
const wrap=v=>((v%360)+360)%360;
const circumference=(a,b)=>{const h=((a-b)**2)/((a+b)**2);return Math.PI*(a+b)*(1+3*h/(10+Math.sqrt(4-3*h)))};
const blocked=(t,r,local,sec)=>Math.min(local,1-local)<t.aisle||(sec%t.tunnelEvery===1&&r>=t.tunnelRow&&r<t.tunnelRow+t.tunnelRows&&Math.abs(local-.5)<.19);
const findEntry=(tier,deg)=>{for(const [id,bays,start,end] of layouts[tier]){if(start<=end?(deg>=start&&deg<end):(deg>=start||deg<end))return{id,bays,start,end}}return null};
const counts=new Map(),renderSections=new Map();let total=0,unmapped=0,pavilion=0;
for(const t of tiers)for(let sec=0;sec<sections;sec++)for(let r=0;r<t.rows;r++){
  const rx=t.rx+r*t.depth,rz=t.rz+r*t.depth,n=Math.max(sections*8,Math.round(circumference(rx,rz)/t.spacing)),start=Math.ceil(sec*n/sections),end=Math.floor((sec+1)*n/sections-.000001);
  for(let i=start;i<=end;i++){const local=i/n*sections-sec;if(blocked(t,r,local,sec))continue;total++;const deg=wrap(i/n*360),entry=findEntry(t.id,deg);if(!entry){if(t.id==='U'&&deg>=150.3&&deg<217.7)pavilion++;else unmapped++;continue}const span=((entry.end-entry.start)+360)%360||360,bay=Math.min(entry.bays,Math.max(1,Math.floor(((deg-entry.start+360)%360)/(span/entry.bays))+1)),key=t.id+':'+entry.id+':'+bay;counts.set(key,(counts.get(key)||0)+1);let set=renderSections.get(key);if(!set){set=new Set();renderSections.set(key,set)}set.add(t.id+String(sec+1).padStart(2,'0'))}
}
if(total!==89818)fail(`procedural seat baseline changed: ${total}`);
if(counts.size!==110)fail(`expected all 110 configured Bays, got ${counts.size}`);
const navigable=[...counts.values()].reduce((a,b)=>a+b,0);
if(navigable!==75655||unmapped!==5009||pavilion!==9154)fail(`mapping baseline changed: navigable ${navigable}, unmapped ${unmapped}, pavilion ${pavilion}`);
if([...counts.values()].some(v=>v<400))fail('a configured Bay has an implausibly small seat set');
if([...renderSections.values()].some(s=>s.size<1||s.size>3))fail('Bay-to-render-section fanout left expected 1–3 section envelope');

await writeFile(outputPath,html,"utf8");
console.log(`Phase 19 stability hardening applied: ${counts.size} Bay-wide indexes, ${navigable.toLocaleString()} mapped seats, bounded marker animation, safer navigation/share/reset/keyboard behavior; visual layout unchanged`);

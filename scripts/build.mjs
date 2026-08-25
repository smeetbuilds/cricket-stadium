import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const sourcePath = resolve(root, "index.html");
const outputPath = resolve(dist, "index.html");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let html = await readFile(sourcePath, "utf8");

function mustReplace(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Build patch target missing (${label}): ${before.slice(0, 100)}…`);
  }
  html = html.replace(before, after);
}

function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`Build segment target missing (${label})`);
  }
  html = html.slice(0, start) + replacement + html.slice(end);
}

// ---------------------------------------------------------------------------
// Three.js r128 seat-picking compatibility fix.
// ---------------------------------------------------------------------------
// InstancedMesh.raycast() delegates to Mesh.raycast() per instance. The source
// historically placed a world-space section sphere into geometry.boundingSphere,
// which Mesh.raycast() then transforms again by the instance matrix. Keep native
// local geometry bounds and store the larger section sphere only as a world-space
// prefilter before the native instance raycast.
const seatPickingReplacements = [
  [
    'const sphere=boundingSphereFor(items),panGeo=panBase.clone();panGeo.boundingSphere=sphere.clone();',
    'const sphere=boundingSphereFor(items),panGeo=panBase.clone();'
  ],
  [
    'pan.instanceMatrix.needsUpdate=true;if(pan.instanceColor)pan.instanceColor.needsUpdate=true;pan.userData.section=section;scene.add(pan);seatMeshes.push(pan);',
    'pan.instanceMatrix.needsUpdate=true;if(pan.instanceColor)pan.instanceColor.needsUpdate=true;pan.userData.section=section;pan.userData.worldSphere=sphere.clone();scene.add(pan);seatMeshes.push(pan);'
  ],
  [
    'const backItems=mobile?items.filter((_,i)=>i%2===0):items,backGeo=backBase.clone();backGeo.boundingSphere=sphere.clone();',
    'const backItems=mobile?items.filter((_,i)=>i%2===0):items,backGeo=backBase.clone();'
  ],
  [
    'back.instanceMatrix.needsUpdate=true;if(back.instanceColor)back.instanceColor.needsUpdate=true;back.raycast=()=>{};back.userData.section=section;scene.add(back);backMeshes.push(back)',
    'back.instanceMatrix.needsUpdate=true;if(back.instanceColor)back.instanceColor.needsUpdate=true;back.raycast=()=>{};back.userData.section=section;back.userData.worldSphere=sphere.clone();scene.add(back);backMeshes.push(back)'
  ],
  [
    'function pick(x,y){if(seatMode||!seatMeshes.length)return;const r=canvas.getBoundingClientRect();pointer.x=(x-r.left)/r.width*2-1;pointer.y=-(y-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const h=ray.intersectObjects(seatMeshes,false)[0];if(h&&typeof h.instanceId==="number"){const section=h.object.userData.section,d=sectionIndex.get(section),m=d&&d[h.instanceId];if(m)select(m)}}',
    'function pick(x,y){if(seatMode||!seatMeshes.length)return;const r=canvas.getBoundingClientRect();pointer.x=(x-r.left)/r.width*2-1;pointer.y=-(y-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const candidates=seatMeshes.filter(mesh=>{const sphere=mesh.userData.worldSphere;return !sphere||ray.ray.intersectsSphere(sphere)}),h=ray.intersectObjects(candidates,false)[0];if(h&&typeof h.instanceId==="number"){const section=h.object.userData.section,d=sectionIndex.get(section),m=d&&d[h.instanceId];if(m)select(m)}}'
  ]
];

for (const [before, after] of seatPickingReplacements) {
  mustReplace(before, after, "seat-picking");
}

// ---------------------------------------------------------------------------
// Real Block + Bay metadata overlay.
// ---------------------------------------------------------------------------
// IMPORTANT: this layer intentionally does not alter bowl geometry, seat XYZ,
// instance IDs, camera math, raycasting, roof, pitch, LOD, or internal URLs.
// The current procedural section IDs remain the stable rendering identifiers.
// Block/Bay names are derived from the user-supplied seating arrangement.
mustReplace(
  '.navgrid{display:grid;grid-template-columns:1.25fr .8fr .8fr;gap:7px}',
  '.navgrid{display:grid;grid-template-columns:1.15fr .7fr .7fr .7fr;gap:7px}.internal-section{display:none!important}.actual-note{margin-top:7px;color:var(--muted);font-size:7px;line-height:1.35}',
  "navigator CSS"
);
mustReplace(
  '</style>',
  '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}.finder-head span{display:none}}\\n  </style>',
  "small-screen navigator CSS"
);
mustReplace(
  '<div class="finder-head"><b>Find a generated seat</b><span>Section → Row → Seat</span></div>',
  '<div class="finder-head"><b>Find a seat</b><span>Block → Bay → generated Row → Seat</span></div>',
  "navigator heading"
);

const oldNav = `      <div class="navgrid">
        <div class="navfield"><label for="nav-section">Section</label><select id="nav-section" aria-label="Section"><option value="">Choose</option></select></div>
        <div class="navfield"><label for="nav-row">Row</label><select id="nav-row" aria-label="Row" disabled><option value="">—</option></select></div>
        <div class="navfield"><label for="nav-seat">Seat</label><select id="nav-seat" aria-label="Seat" disabled><option value="">—</option></select></div>
      </div>`;

const newNav = `      <div class="navgrid">
        <div class="navfield"><label for="nav-block">Block</label><select id="nav-block" aria-label="Actual block"><option value="">Choose</option></select></div>
        <div class="navfield"><label for="nav-bay">Bay</label><select id="nav-bay" aria-label="Actual bay" disabled><option value="">—</option></select></div>
        <div class="navfield"><label for="nav-row">Row</label><select id="nav-row" aria-label="Generated row" disabled><option value="">—</option></select></div>
        <div class="navfield"><label for="nav-seat">Seat</label><select id="nav-seat" aria-label="Generated seat" disabled><option value="">—</option></select></div>
        <select id="nav-section" class="internal-section" aria-hidden="true" tabindex="-1"><option value="">Choose</option></select>
      </div>
      <div class="actual-note">Block and bay names follow the supplied seating layout. Row and seat numbers remain generated prototype identifiers until an authoritative seat manifest is available.</div>`;
mustReplace(oldNav, newNav, "navigator markup");

mustReplace(
  '<div class="data"><div class="cell"><span>Section</span><b id="sec">—</b></div>',
  '<div class="data"><div class="cell"><span>Block / Bay</span><b id="sec">—</b></div>',
  "selected location label"
);
mustReplace(
  '<aside id="note" class="glass"><b>Accuracy note.</b> Two-tier proportions, roof character and seat-colour motifs are calibrated from public architectural references and interior photography. Generated section, row and seat IDs are not the official ticket map.</aside>',
  '<aside id="note" class="glass"><b>Accuracy note.</b> The existing 3D stadium geometry is unchanged. Block and bay names are mapped from the supplied seating arrangement; generated rows/seats are not claimed as official ticket inventory.</aside>',
  "accuracy note"
);

const metadataCode = `
    const ACTUAL_LAYOUT={
      L:[
        {id:"E",name:"Block E",short:"E",bays:5,start:0,end:31.0344827586,tierLabel:"Lower Bowl"},
        {id:"F",name:"Block F",short:"F",bays:6,start:31.0344827586,end:68.275862069,tierLabel:"Lower Bowl"},
        {id:"G",name:"Block G",short:"G",bays:7,start:68.275862069,end:111.724137931,tierLabel:"Lower Bowl"},
        {id:"H",name:"Block H",short:"H",bays:5,start:111.724137931,end:142.75862069,tierLabel:"Lower Bowl"},
        {id:"SPE",name:"South Premium East",short:"SP East",bays:4,start:142.75862069,end:167.586206897,tierLabel:"South Premium"},
        {id:"SPC",name:"South Premium Centre",short:"SP Centre",bays:4,start:167.586206897,end:192.413793103,tierLabel:"South Premium"},
        {id:"SPW",name:"South Premium West",short:"SP West",bays:4,start:192.413793103,end:217.24137931,tierLabel:"South Premium"},
        {id:"A",name:"Block A",short:"A",bays:5,start:217.24137931,end:248.275862069,tierLabel:"Lower Bowl"},
        {id:"B",name:"Block B",short:"B",bays:7,start:248.275862069,end:291.724137931,tierLabel:"Lower Bowl"},
        {id:"C",name:"Block C",short:"C",bays:6,start:291.724137931,end:328.965517241,tierLabel:"Lower Bowl"},
        {id:"D",name:"Block D",short:"D",bays:5,start:328.965517241,end:360,tierLabel:"Lower Bowl"}
      ],
      U:[
        {id:"N",name:"Block N",short:"N",bays:6,start:0,end:35.7692307692,tierLabel:"Upper Bowl"},
        {id:"P",name:"Block P",short:"P",bays:6,start:35.7692307692,end:71.5384615385,tierLabel:"Upper Bowl"},
        {id:"Q",name:"Block Q",short:"Q",bays:8,start:71.5384615385,end:119.230769231,tierLabel:"Upper Bowl"},
        {id:"R",name:"Block R",short:"R",bays:6,start:119.230769231,end:155,tierLabel:"Upper Bowl"},
        {id:"J",name:"Block J",short:"J",bays:6,start:205,end:240.769230769,tierLabel:"Upper Bowl"},
        {id:"K",name:"Block K",short:"K",bays:8,start:240.769230769,end:288.461538462,tierLabel:"Upper Bowl"},
        {id:"L",name:"Block L",short:"L",bays:6,start:288.461538462,end:324.230769231,tierLabel:"Upper Bowl"},
        {id:"M",name:"Block M",short:"M",bays:6,start:324.230769231,end:360,tierLabel:"Upper Bowl"}
      ]
    };
    const SOUTH_PAVILION={id:"SOUTH",name:"South Pavilion",short:"South Pavilion",bays:0,start:155,end:205,tierLabel:"South Pavilion",pavilion:true};
    let actualSelectedBlock="",actualSelectedBay=0;
    const actualWrapDeg=v=>((v%360)+360)%360;
    const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a)+90);
    function actualEntryFor(tier,deg){
      deg=actualWrapDeg(deg);
      const found=(ACTUAL_LAYOUT[tier]||[]).find(e=>deg>=e.start&&deg<e.end);
      if(found)return found;
      if(tier==="U"&&deg>=SOUTH_PAVILION.start&&deg<SOUTH_PAVILION.end)return SOUTH_PAVILION;
      return null
    }
    function actualBayFor(entry,deg){
      if(!entry||!entry.bays)return 0;
      const w=(entry.end-entry.start)/entry.bays;
      return Math.min(entry.bays,Math.max(1,Math.floor((deg-entry.start)/w)+1))
    }
    function actualSeatMeta(m){
      const deg=actualNavDegFromAngle(m.angle),entry=actualEntryFor(m.tierId,deg);
      if(!entry)return{entry:null,blockId:"",name:"Unmapped",short:"Unmapped",bay:0,tierLabel:m.tierName,note:"Generated stadium position; no supplied block mapping covers this angle."};
      const bay=actualBayFor(entry,deg);
      return{
        entry,blockId:entry.id,name:entry.name,short:entry.short,bay,tierLabel:entry.tierLabel,
        note:entry.pavilion
          ?"South Pavilion reference zone. This generated upper-bowl seat is retained for visual continuity and is not presented as official inventory."
          :"Block/Bay mapped from the supplied seating layout. Row and seat remain generated prototype identifiers."
      }
    }
    function actualEntryById(id){
      for(const tier of ["L","U"]){const found=ACTUAL_LAYOUT[tier].find(e=>e.id===id);if(found)return{tier,entry:found}}
      return null
    }
    function populateActualNavigator(){
      if(!ui.navBlock||!ui.navBay)return;
      ui.navBlock.innerHTML='<option value="">Choose</option>';
      const groups=[
        ["Lower Bowl",["A","B","C","D","E","F","G","H"]],
        ["South Premium",["SPW","SPC","SPE"]],
        ["Upper Bowl",["J","K","L","M","N","P","Q","R"]]
      ];
      for(const [label,ids] of groups){
        const g=document.createElement("optgroup");g.label=label;
        for(const id of ids){const rec=actualEntryById(id);if(!rec)continue;const o=document.createElement("option");o.value=id;o.textContent=rec.entry.name;g.appendChild(o)}
        ui.navBlock.appendChild(g)
      }
      ui.navBay.innerHTML='<option value="">—</option>';ui.navBay.disabled=true
    }
    function populateActualBays(id,preferred=0){
      const rec=actualEntryById(id);
      ui.navBay.innerHTML='<option value="">Bay</option>';
      ui.navBay.disabled=!rec;
      if(!rec)return;
      for(let i=1;i<=rec.entry.bays;i++){const o=document.createElement("option");o.value=String(i);o.textContent=String(i).padStart(2,"0");ui.navBay.appendChild(o)}
      if(preferred)ui.navBay.value=String(preferred)
    }
    function actualCenterDeg(entry,bay){const w=(entry.end-entry.start)/entry.bays;return entry.start+(bay-.5)*w}
    function actualInternalSection(tier,deg){
      const a=actualWrapDeg(deg-90),n=Math.floor(a/360*CFG.sections)+1;
      return tier+String(Math.min(CFG.sections,Math.max(1,n))).padStart(2,"0")
    }
    function syncActualNavigator(m){
      if(!ui.navBlock||!ui.navBay||!m)return;
      const a=actualSeatMeta(m);
      if(!a.entry||a.entry.pavilion){
        actualSelectedBlock="";actualSelectedBay=0;ui.navBlock.value="";populateActualBays("");
        ui.sectionState.textContent=a.name;ui.mapLabel.textContent=a.name;return
      }
      actualSelectedBlock=a.blockId;actualSelectedBay=a.bay;
      ui.navBlock.value=a.blockId;populateActualBays(a.blockId,a.bay);
      ui.sectionState.textContent=a.name+" · Bay "+a.bay+" · mapped from supplied seating layout";
      ui.mapLabel.textContent=a.short+" · B"+String(a.bay).padStart(2,"0")
    }
    function focusActualBay(id,bay){
      const rec=actualEntryById(id);if(!rec||!bay)return;
      actualSelectedBlock=id;actualSelectedBay=bay;
      const section=actualInternalSection(rec.tier,actualCenterDeg(rec.entry,bay));
      ui.navSection.value=section;ui.navSection.dispatchEvent(new Event("change",{bubbles:true}));
      ui.navBlock.value=id;populateActualBays(id,bay);
      ui.tier.textContent=rec.entry.tierLabel;ui.title.textContent=rec.entry.name+" · Bay "+bay;
      ui.sub.textContent="Mapped block/bay overlay on the existing 3D bowl. Choose a generated row and seat for an approximate sightline.";
      ui.sec.textContent=rec.entry.short+" · B"+String(bay).padStart(2,"0");
      ui.sectionState.textContent=rec.entry.name+" · Bay "+bay+" · mapped from supplied seating layout";
      ui.mapLabel.textContent=rec.entry.short+" · B"+String(bay).padStart(2,"0");drawMinimap()
    }
    function drawActualMinimapOverlay(x,cx,cy,rx,ry){
      const toA=deg=>THREE.MathUtils.degToRad(deg-90);
      const point=(deg,r)=>[cx+Math.cos(toA(deg))*rx*r,cy+Math.sin(toA(deg))*ry*r];
      const strokeBay=(entry,bay,r0,r1)=>{
        const w=(entry.end-entry.start)/entry.bays,d=entry.start+(bay-1)*w;
        for(const edge of [d,d+w]){const p0=point(edge,r0),p1=point(edge,r1);x.beginPath();x.moveTo(...p0);x.lineTo(...p1);x.strokeStyle="rgba(240,248,255,.38)";x.lineWidth=.7;x.stroke()}
      };
      const fillBay=(entry,bay,r0,r1)=>{
        const w=(entry.end-entry.start)/entry.bays,a0=entry.start+(bay-1)*w,a1=a0+w,n=8;
        x.beginPath();
        for(let i=0;i<=n;i++){const p=point(a0+(a1-a0)*i/n,r1);i?x.lineTo(...p):x.moveTo(...p)}
        for(let i=n;i>=0;i--){const p=point(a0+(a1-a0)*i/n,r0);x.lineTo(...p)}
        x.closePath();x.fillStyle="rgba(94,215,255,.42)";x.fill()
      };
      for(const tier of ["L","U"]){
        const r0=tier==="U"?.77:.55,r1=tier==="U"?1:.76;
        for(const entry of ACTUAL_LAYOUT[tier]){
          if(actualSelectedBlock===entry.id&&actualSelectedBay)fillBay(entry,actualSelectedBay,r0,r1);
          for(let bay=1;bay<=entry.bays;bay++)strokeBay(entry,bay,r0,r1);
          const p=point((entry.start+entry.end)/2,(r0+r1)/2);
          x.font="700 "+Math.max(11,Math.min(15,rx*.095))+"px "+getComputedStyle(document.body).fontFamily;
          x.textAlign="center";x.textBaseline="middle";x.fillStyle="rgba(245,249,252,.9)";x.fillText(entry.short,p[0],p[1])
        }
      }
      const s0=point(SOUTH_PAVILION.start,.77),s1=point(SOUTH_PAVILION.start,1),e0=point(SOUTH_PAVILION.end,.77),e1=point(SOUTH_PAVILION.end,1);
      x.strokeStyle="rgba(244,122,42,.6)";x.lineWidth=1.2;x.beginPath();x.moveTo(...s0);x.lineTo(...s1);x.moveTo(...e0);x.lineTo(...e1);x.stroke()
    }
`;

mustReplace(
  '    const ui={tier:$("tier"),title:$("title"),sub:$("sub"),sec:$("sec"),row:$("row"),seat:$("seat"),view:$("view"),bar:$("seatbar"),label:$("seatlabel"),navSection:$("nav-section"),navRow:$("nav-row"),navSeat:$("nav-seat"),sectionState:$("section-state"),share:$("share"),map:$("minimap"),mapLabel:$("map-label")};',
  metadataCode + '\n    const ui={tier:$("tier"),title:$("title"),sub:$("sub"),sec:$("sec"),row:$("row"),seat:$("seat"),view:$("view"),bar:$("seatbar"),label:$("seatlabel"),navBlock:$("nav-block"),navBay:$("nav-bay"),navSection:$("nav-section"),navRow:$("nav-row"),navSeat:$("nav-seat"),sectionState:$("section-state"),share:$("share"),map:$("minimap"),mapLabel:$("map-label")};',
  "metadata insertion"
);

replaceSegment(
  '    function select(m,sync=true,updateUrl=true){',
  '    function chooseSection(section,focus=true){',
  `    function select(m,sync=true,updateUrl=true){
      if(!m)return;selected=m;const actual=actualSeatMeta(m);
      ui.tier.textContent=actual.tierLabel;
      ui.title.textContent=actual.bay?actual.name+" · Bay "+actual.bay:actual.name;
      ui.sub.textContent=actual.note;
      ui.sec.textContent=actual.bay?actual.short+" · B"+String(actual.bay).padStart(2,"0"):actual.short;
      ui.row.textContent=String(m.row).padStart(2,"0");ui.seat.textContent=String(m.seat).padStart(2,"0");
      ui.view.disabled=false;ui.share.disabled=false;
      if(marker){marker.visible=true;marker.position.copy(m.position);marker.position.y+=.68}
      if(sync)syncNavigator(m);else syncActualNavigator(m);
      if(updateUrl)syncUrl(m);drawMinimap()
    }
`,
  "selected seat display"
);

mustReplace(
  'function syncNavigator(m){if(!m)return;ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m.seat);ui.navRow.value=String(m.row);ui.navSeat.value=String(m.seat);highlightSection(m.section,false)}',
  'function syncNavigator(m){if(!m)return;ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m.seat);ui.navRow.value=String(m.row);ui.navSeat.value=String(m.seat);highlightSection(m.section,false);syncActualNavigator(m)}',
  "navigator sync"
);

mustReplace(
  'roof();populateNavigator();restoreFromUrl();updateLOD();drawMinimap();',
  'roof();populateNavigator();populateActualNavigator();restoreFromUrl();updateLOD();drawMinimap();',
  "actual navigator initialization"
);

mustReplace(
  'ui.label.textContent=`${selected.section} · R${selected.row} · S${selected.seat}`;',
  'const actual=actualSeatMeta(selected);ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · R"+selected.row+" · S"+selected.seat;',
  "seat view label"
);

mustReplace(
  'const url=location.href,text=`Motera 3D · ${selected.section}, Row ${selected.row}, Seat ${selected.seat}`;',
  'const actual=actualSeatMeta(selected),url=location.href,text=`Motera 3D · ${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, generated Row ${selected.row}, Seat ${selected.seat}`;',
  "share text"
);

mustReplace(
  'if(!seatMode){const a=Math.PI/2-orbit.t,p=.98;x.save();x.translate(cx+Math.cos(a)*rx*p,cy+Math.sin(a)*ry*p);x.rotate(a+Math.PI/2);x.beginPath();x.moveTo(0,-8);x.lineTo(6,6);x.lineTo(-6,6);x.closePath();x.fillStyle="#f7f3ea";x.fill();x.restore()}',
  'if(!seatMode){const a=Math.PI/2-orbit.t,p=.98;x.save();x.translate(cx+Math.cos(a)*rx*p,cy+Math.sin(a)*ry*p);x.rotate(a+Math.PI/2);x.beginPath();x.moveTo(0,-8);x.lineTo(6,6);x.lineTo(-6,6);x.closePath();x.fillStyle="#f7f3ea";x.fill();x.restore()}drawActualMinimapOverlay(x,cx,cy,rx,ry)',
  "actual minimap overlay"
);

replaceSegment(
  '    function mapPick(e){',
  '    ui.navSection.addEventListener("change",()=>chooseSection(ui.navSection.value,true));',
  `    function mapPick(e){
      if(seatMode)return;
      const r=ui.map.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*ui.map.width,py=(e.clientY-r.top)/r.height*ui.map.height;
      const cx=ui.map.width/2,cy=ui.map.height/2,rx=ui.map.width*.42,ry=ui.map.height*.4;
      const dx=(px-cx)/rx,dy=(py-cy)/ry,rho=Math.sqrt(dx*dx+dy*dy);if(rho<.54||rho>1.08)return;
      let a=THREE.MathUtils.radToDeg(Math.atan2(dy,dx));if(a<0)a+=360;
      const navDeg=actualWrapDeg(a+90),tier=rho>.76?"U":"L",entry=actualEntryFor(tier,navDeg);
      if(!entry)return;
      if(entry.pavilion){
        actualSelectedBlock="";actualSelectedBay=0;ui.navBlock.value="";populateActualBays("");ui.navSection.value="";chooseSection("",false);
        ui.tier.textContent=entry.tierLabel;ui.title.textContent=entry.name;ui.sub.textContent="Dedicated South Pavilion / hospitality reference zone from the supplied seating layout.";
        ui.sec.textContent=entry.short;ui.sectionState.textContent=entry.name;ui.mapLabel.textContent=entry.name;drawMinimap();return
      }
      const bay=actualBayFor(entry,navDeg);focusActualBay(entry.id,bay)
    }

`,
  "actual minimap picking"
);

mustReplace(
  '    ui.navSection.addEventListener("change",()=>chooseSection(ui.navSection.value,true));',
  `    ui.navBlock.addEventListener("change",()=>{
      const id=ui.navBlock.value;actualSelectedBlock=id;actualSelectedBay=0;populateActualBays(id);
      ui.navSection.value="";chooseSection("",false);
      if(id){const rec=actualEntryById(id);ui.tier.textContent=rec.entry.tierLabel;ui.title.textContent=rec.entry.name;ui.sub.textContent="Choose a bay to map this supplied block onto the existing 3D bowl.";ui.sec.textContent=rec.entry.short;ui.sectionState.textContent=rec.entry.name+" · choose a bay";ui.mapLabel.textContent=rec.entry.short;drawMinimap()}
    });
    ui.navBay.addEventListener("change",()=>{const id=ui.navBlock.value,bay=Number(ui.navBay.value);if(id&&bay)focusActualBay(id,bay)});
    ui.navSection.addEventListener("change",()=>chooseSection(ui.navSection.value,true));`,
  "actual navigator events"
);

// Keep old stable internal seat URLs. If the URL selects a seat, syncNavigator()
// now also fills the visible Block/Bay controls.

if (html.includes("panGeo.boundingSphere=sphere.clone()") || html.includes("backGeo.boundingSphere=sphere.clone()")) {
  throw new Error("Broken world-space InstancedMesh geometry bounds remain after build patch");
}
for (const required of [
  'id="nav-block"',
  'id="nav-bay"',
  "const ACTUAL_LAYOUT=",
  "function actualSeatMeta(",
  "function focusActualBay(",
  "drawActualMinimapOverlay(",
  "syncActualNavigator(m)"
]) {
  if (!html.includes(required)) throw new Error(`Actual seating metadata integration missing: ${required}`);
}
if (!html.includes("ray.ray.intersectsSphere(sphere)")) {
  throw new Error("Seat section raycast prefilter was not installed");
}

await writeFile(outputPath, html, "utf8");
await cp(resolve(root, "public"), dist, { recursive: true });

console.log("Applied Three.js r128 seat-picking compatibility fix");
console.log("Applied non-destructive Block/Bay seating metadata overlay");
console.log(`Built Motera 3D -> ${dist}`);

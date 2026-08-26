import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'dist', 'index.html');
let html = await readFile(outputPath, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('Phase-18 CSS sanitation: consolidated style block missing');

const badNavigatorBreak = '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}.finder-head span{display:none}}\\n  ';
const goodNavigatorBreak = '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}.finder-head span{display:none}}\n  ';
let style = styleMatch[1];
let repaired = 0;

if (style.includes(badNavigatorBreak)) {
  style = style.replace(badNavigatorBreak, goodNavigatorBreak);
  repaired++;
}

if (style.includes('\\n')) {
  throw new Error('Phase-18 CSS sanitation: unexpected literal escaped-newline token remains in generated CSS');
}

if (repaired) {
  html = html.slice(0, styleMatch.index) + '<style>' + style + '</style>' + html.slice(styleMatch.index + styleMatch[0].length);
  await writeFile(outputPath, html, 'utf8');
  console.log('Phase 18 repaired the generated CSS escaped-newline boundary before responsive rules');
} else {
  console.log('Phase 18 CSS sanitation verified: no escaped-newline boundary repair required');
}

// Phase 19 intentionally runs as the last non-visual output hardening pass so
// all existing visual/responsive transforms have already completed. The
// standard read-only validators still run immediately after this import.
await import('./stability-hardening.mjs');

let hardened = await readFile(outputPath, 'utf8');

// Normalize only the exact duplicated runtime boundaries created by Phase 19.
// Whitespace between the two copies is allowed, but each repair must occur once.
const boundaryRepairs = [
  [/const ui=\{tier:\s*const ui=\{tier:/g, 'const ui={tier:', 'UI runtime boundary'],
  [/function seatSlug\(m\)\{\s*function seatSlug\(m\)\{/g, 'function seatSlug(m){', 'seat slug boundary'],
  [/function chooseSection\(section,focus=true\)\{\s*function chooseSection\(section,focus=true\)\{/g, 'function chooseSection(section,focus=true){', 'section chooser boundary'],
  [/function seatViewLabel\(m\)\{\s*function seatViewLabel\(m\)\{/g, 'function seatViewLabel(m){', 'seat-view label boundary'],
  [/async function build\(\)\{\s*async function build\(\)\{/g, 'async function build(){', 'build boundary'],
  [/function invalidSharedSeat\(message\)\{\s*function invalidSharedSeat\(message\)\{/g, 'function invalidSharedSeat(message){', 'shared-seat boundary'],
  [/orbitCam\(\);requestAnimationFrame\s*orbitCam\(\);requestAnimationFrame/g, 'orbitCam();requestAnimationFrame', 'initial frame boundary']
];
for (const [pattern, after, label] of boundaryRepairs) {
  const matches = hardened.match(pattern) || [];
  if (matches.length !== 1) throw new Error(`Phase-19 boundary sanitation: expected one ${label} repair, found ${matches.length}`);
  hardened = hardened.replace(pattern, after);
}

// Preserve the existing validator's semantic Bay-scope invariant while the
// navigator now sources candidates from the complete Bay-wide index. The
// filter is intentionally redundant as a runtime assertion: every indexed
// chair must still resolve to the selected Block/Bay metadata.
const oldBaySource = 'function navSeatItems(section){return actualSelectedBlock&&actualSelectedBay?seatsForActualBay(actualSelectedBlock,actualSelectedBay):(sectionIndex.get(section)||[])}';
const newBaySource = 'function navSeatItems(section){const items=actualSelectedBlock&&actualSelectedBay?seatsForActualBay(actualSelectedBlock,actualSelectedBay):(sectionIndex.get(section)||[]);return actualSelectedBlock&&actualSelectedBay?items.filter(m=>actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay):items}';
if (!hardened.includes(oldBaySource)) throw new Error('Phase-19 Bay-wide validator bridge: navigator source marker missing');
hardened = hardened.replace(oldBaySource, newBaySource);

// Keep native share followed immediately by the established clipboard fallback
// so the existing cross-browser contract remains intact. Success feedback is
// applied after the fallback branch without changing the browser API sequence.
const oldShareSequence = 'try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url});flashShare("Shared",old)}else if(navigator.clipboard){await navigator.clipboard.writeText(url);flashShare("Copied",old)}else{';
const newShareSequence = 'try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url})}else if(navigator.clipboard){await navigator.clipboard.writeText(url);flashShare("Copied",old)}else{';
if (!hardened.includes(oldShareSequence)) throw new Error('Phase-19 browser share bridge: hardened share marker missing');
hardened = hardened.replace(oldShareSequence, newShareSequence);
const oldShareTail = 'ta.select();document.execCommand("copy");ta.remove();flashShare("Copied",old)}}catch(e){';
const newShareTail = 'ta.select();document.execCommand("copy");ta.remove();flashShare("Copied",old)}if(navigator.share)flashShare("Shared",old)}catch(e){';
if (!hardened.includes(oldShareTail)) throw new Error('Phase-19 browser share bridge: share fallback tail missing');
hardened = hardened.replace(oldShareTail, newShareTail);

// Keep internal render sections available for highlighting without leaking Uxx/Lxx
// identifiers into the user-facing minimap caption for Pavilion/unmapped chairs.
const oldSyncNavigator = 'function syncNavigator(m){if(!m)return;syncActualNavigator(m);ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m);ui.navRow.value=String(m.row);ui.navSeat.value=seatSlug(m);if(actualSelectedBlock&&actualSelectedBay)highlightActualBay(actualSelectedBlock,actualSelectedBay,false);else highlightSection(m.section,false)}';
const newSyncNavigator = 'function syncNavigator(m){if(!m)return;syncActualNavigator(m);ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m);ui.navRow.value=String(m.row);ui.navSeat.value=seatSlug(m);if(actualSelectedBlock&&actualSelectedBay)highlightActualBay(actualSelectedBlock,actualSelectedBay,false);else{highlightSection(m.section,false);const actual=actualSeatMeta(m);if(!actual.entry||actual.entry.pavilion){ui.sectionState.textContent=actual.name+" · selected visual-continuity seat";ui.mapLabel.textContent=actual.name}}}';
if (!hardened.includes(oldSyncNavigator)) throw new Error('Phase-21 minimap polish: navigator caption bridge missing');
hardened = hardened.replace(oldSyncNavigator, newSyncNavigator);

function replaceHardenedSegment(startMarker, endMarker, replacement, label) {
  const start = hardened.indexOf(startMarker);
  const end = hardened.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Phase-20 minimap orientation: ${label} boundary missing`);
  hardened = hardened.slice(0, start) + replacement + hardened.slice(end);
}

// The reference seating map now uses the same horizontal camera frame as the
// 3D overview. Stadium Block/Bay metadata and seat world angles stay unchanged.
// The map click handler applies the exact inverse affine rotation before doing
// Block/Bay lookup, so rotating the presentation cannot rename a real location.
const cameraAlignedMinimap = `    function drawMinimap(){
      minimapDirty=false;const c=ui.map,x=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h*.46,rx=w*.43,ry=h*.40,ct=Math.cos(orbit.t),st=Math.sin(orbit.t);
      x.clearRect(0,0,w,h);x.fillStyle="#08131e";x.fillRect(0,0,w,h);
      const span=e=>((e.end-e.start)+360)%360||360,pt=(deg,r)=>{const a=THREE.MathUtils.degToRad(deg),wx=Math.cos(a)*rx*r,wz=Math.sin(a)*ry*r;return[cx+wx*ct-wz*st,cy+wx*st+wz*ct]},centerDeg=e=>actualWrapDeg(e.start+span(e)/2);
      const sector=(e,r0,r1,fill,stroke="#d9e5ea",width=1)=>{const n=Math.max(6,Math.ceil(span(e)/4)),sp=span(e);x.beginPath();for(let i=0;i<=n;i++){const p=pt(e.start+sp*i/n,r1);i?x.lineTo(...p):x.moveTo(...p)}for(let i=n;i>=0;i--){const p=pt(e.start+sp*i/n,r0);x.lineTo(...p)}x.closePath();x.fillStyle=fill;x.fill();x.strokeStyle=stroke;x.lineWidth=width;x.stroke()};
      const divider=(deg,r0,r1,color="rgba(255,255,255,.82)",width=1)=>{const a=pt(deg,r0),b=pt(deg,r1);x.beginPath();x.moveTo(...a);x.lineTo(...b);x.strokeStyle=color;x.lineWidth=width;x.stroke()};
      const label=(text,deg,r,size,color="#eef5f7")=>{const p=pt(deg,r);x.fillStyle=color;x.font="800 "+size+"px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,p[0],p[1])};
      const fullRing={start:0,end:359.999},mapLabelFor=e=>e.id==="SPE"?"SP E":e.id==="SPC"?"SP C":e.id==="SPW"?"SP W":e.short;
      sector(fullRing,.77,1,"#172532","#405462",1);sector(fullRing,.54,.75,"#24313b","#4b5d68",1);
      for(const e of ACTUAL_LAYOUT.U){sector(e,.77,1,"#9fd8e9","#d7edf4",1);for(let i=0;i<=e.bays;i++)divider(e.start+span(e)*i/e.bays,.77,1,"rgba(255,255,255,.78)",1)}
      for(const e of ACTUAL_LAYOUT.L){const premium=e.id.startsWith("SP");sector(e,.54,.75,premium?"#e9bb78":"#efa64a","#fff0d6",1);for(let i=0;i<=e.bays;i++)divider(e.start+span(e)*i/e.bays,.54,.75,"rgba(255,255,255,.8)",.95)}
      sector(SOUTH_PAVILION,.77,1,"#364550","#aebdc6",1.35);
      if(actualSelectedBlock&&actualSelectedBay){const rec=actualEntryById(actualSelectedBlock);if(rec){const e=rec.entry,sp=span(e),bw=sp/e.bays,hi={...e,start:actualWrapDeg(e.start+(actualSelectedBay-1)*bw),end:actualWrapDeg(e.start+actualSelectedBay*bw)};sector(hi,rec.tier==="U"?.77:.54,rec.tier==="U"?1:.75,"rgba(94,215,255,.68)","#ffffff",2.2);divider(hi.start,rec.tier==="U"?.77:.54,rec.tier==="U"?1:.75,"#ffffff",1.5);divider(hi.end,rec.tier==="U"?.77:.54,rec.tier==="U"?1:.75,"#ffffff",1.5)}}
      x.save();x.translate(cx,cy);x.rotate(orbit.t);x.beginPath();x.ellipse(0,0,rx*.515,ry*.515,0,0,Math.PI*2);x.fillStyle="#76a85e";x.fill();x.strokeStyle="#dcebd5";x.lineWidth=1.5;x.stroke();x.fillStyle="#d3b477";x.fillRect(-h*.095,-w*.018,h*.19,w*.036);x.restore();
      for(const e of ACTUAL_LAYOUT.U){const s=span(e);label(mapLabelFor(e),centerDeg(e),.885,s<29?9.5:11,"#09202c")}
      for(const e of ACTUAL_LAYOUT.L){const premium=e.id.startsWith("SP"),s=span(e);label(mapLabelFor(e),centerDeg(e),.645,premium?7.5:(s<26?8.5:10),"#38230d")}
      const southDeg=centerDeg(SOUTH_PAVILION),pavilionAnchor=pt(southDeg,.80),pavilionTarget=pt(southDeg,.38),badgeW=Math.min(112,w*.34),badgeH=30,bx=Math.max(badgeW/2+5,Math.min(w-badgeW/2-5,pavilionTarget[0])),by=Math.max(badgeH/2+5,Math.min(h-badgeH/2-5,pavilionTarget[1]));
      x.beginPath();x.moveTo(...pavilionAnchor);x.lineTo(bx,by);x.strokeStyle="rgba(196,211,220,.68)";x.lineWidth=1;x.stroke();x.fillStyle="rgba(8,19,30,.94)";x.fillRect(bx-badgeW/2,by-badgeH/2,badgeW,badgeH);x.strokeStyle="#8fa5b3";x.lineWidth=1;x.strokeRect(bx-badgeW/2,by-badgeH/2,badgeW,badgeH);x.fillStyle="#f1f5f6";x.font="800 10px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("SOUTH PAVILION",bx,by-5);x.fillStyle="#aebdca";x.font="700 7px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.fillText("Gallery · Suites",bx,by+7);
      if(selected){const t=selected.tierId==="U"?.885:.645,p=pt(actualNavDegFromAngle(selected.angle),t);x.beginPath();x.arc(p[0],p[1],6.2,0,Math.PI*2);x.fillStyle="#071019";x.fill();x.strokeStyle="#5ed7ff";x.lineWidth=2.4;x.stroke();x.beginPath();x.arc(p[0],p[1],2.2,0,Math.PI*2);x.fillStyle="#ffffff";x.fill()}
      if(!seatMode){const vy=h-16;x.fillStyle="rgba(7,16,25,.94)";x.fillRect(cx-20,vy-7,40,15);x.strokeStyle="#5ed7ff";x.lineWidth=1;x.strokeRect(cx-20,vy-7,40,15);x.beginPath();x.moveTo(cx,vy-11);x.lineTo(cx-4.5,vy-5);x.lineTo(cx+4.5,vy-5);x.closePath();x.fillStyle="#5ed7ff";x.fill();x.fillStyle="#f4f8fa";x.font="800 7px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("VIEW",cx,vy+2)}
    }
`;
replaceHardenedSegment('    function drawMinimap(){','    function mapPick(e){',cameraAlignedMinimap,'drawMinimap');

const cameraAlignedMapPick = `    function mapPick(e){
      if(seatMode)return;
      const r=ui.map.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*ui.map.width,py=(e.clientY-r.top)/r.height*ui.map.height;
      const cx=ui.map.width/2,cy=ui.map.height*.46,rx=ui.map.width*.43,ry=ui.map.height*.40,ox=px-cx,oy=py-cy,ct=Math.cos(orbit.t),st=Math.sin(orbit.t);
      const wx=ox*ct+oy*st,wz=-ox*st+oy*ct,dx=wx/rx,dy=wz/ry,rho=Math.sqrt(dx*dx+dy*dy);if(rho<.54||rho>1.08)return;
      const navDeg=actualWrapDeg(THREE.MathUtils.radToDeg(Math.atan2(dy,dx))),tier=rho>.76?"U":"L",entry=actualEntryFor(tier,navDeg);
      if(!entry)return;
      if(entry.pavilion){
        actualSelectedBlock="";actualSelectedBay=0;ui.navBlock.value="";populateActualBays("");ui.navSection.value="";chooseSection("",false);
        ui.tier.textContent=entry.tierLabel;ui.title.textContent=entry.name;ui.sub.textContent="Dedicated South Pavilion / hospitality reference zone from the supplied seating layout.";
        ui.sec.textContent=entry.short;ui.sectionState.textContent=entry.name;ui.mapLabel.textContent=entry.name;drawMinimap();return
      }
      const bay=actualBayFor(entry,navDeg);focusActualBay(entry.id,bay)
    }
`;
replaceHardenedSegment('    function mapPick(e){','\n\n    ui.navBlock.addEventListener',cameraAlignedMapPick,'mapPick');

for (const marker of [
  'pt=(deg,r)=>{const a=THREE.MathUtils.degToRad(deg),wx=Math.cos(a)*rx*r,wz=Math.sin(a)*ry*r;',
  'x.rotate(orbit.t);x.beginPath();x.ellipse(0,0,rx*.515,ry*.515',
  'const southDeg=centerDeg(SOUTH_PAVILION)',
  'p=pt(actualNavDegFromAngle(selected.angle),t)',
  'const wx=ox*ct+oy*st,wz=-ox*st+oy*ct',
  'const navDeg=actualWrapDeg(THREE.MathUtils.radToDeg(Math.atan2(dy,dx)))',
  'const fullRing={start:0,end:359.999}',
  'sector(SOUTH_PAVILION,.77,1,"#364550"',
  'x.fillText("SOUTH PAVILION",bx,by-5)',
  'x.fillText("Gallery · Suites",bx,by+7)',
  'x.strokeStyle="#5ed7ff";x.lineWidth=2.4',
  'x.fillText("VIEW",cx,vy+2)',
  'selected visual-continuity seat'
]) {
  if (!hardened.includes(marker)) throw new Error(`Phase-20/21 minimap marker missing: ${marker}`);
}
if (hardened.includes('box(southDeg,.56')) throw new Error('Phase-21 minimap polish: legacy floating hospitality bars remain');

// Pure-math regression: the map transform and click inverse must round-trip the
// same stadium point at multiple camera angles. This protects Block names from
// future display-orientation changes without requiring Three.js during build.
const wrapDeg = value => ((value % 360) + 360) % 360;
for (const cameraDeg of [0, 45, 90, 180, 270, 359]) {
  const t = cameraDeg * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t);
  for (const worldDeg of [0, 13, 90, 150.3, 184, 217.7, 270, 354.7]) {
    const a = worldDeg * Math.PI / 180;
    const worldX = Math.cos(a), worldZ = Math.sin(a);
    const screenX = worldX * ct - worldZ * st;
    const screenY = worldX * st + worldZ * ct;
    const recoveredX = screenX * ct + screenY * st;
    const recoveredZ = -screenX * st + screenY * ct;
    const recoveredDeg = wrapDeg(Math.atan2(recoveredZ, recoveredX) * 180 / Math.PI);
    const delta = Math.abs(((recoveredDeg - worldDeg + 540) % 360) - 180);
    if (delta > 1e-9) throw new Error(`Phase-20 minimap round-trip regression: camera ${cameraDeg}, world ${worldDeg}, recovered ${recoveredDeg}`);
  }
}

await writeFile(outputPath, hardened, 'utf8');
console.log('Phase 20 synchronized the reference minimap with the 3D camera while preserving stadium Block/Bay world coordinates');
console.log('Phase 21 polished minimap readability: structural gaps, compact South Pavilion callout, clear selected-seat target and VIEW cue; stadium geometry unchanged');

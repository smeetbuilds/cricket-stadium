import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) throw new Error(`Seat-map patch target missing (${label}): ${before.slice(0, 120)}…`);
  html = html.replace(before, after);
}
function replaceSegment(startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Seat-map segment missing (${label})`);
  html = html.slice(0, start) + replacement + html.slice(end);
}

// Presentation/metadata pass only. Never edit stadium geometry, seat XYZ,
// instance IDs, raycasting, camera math, LOD, roof, field, or stable URLs.
replaceExact("Block → Bay → generated Row → Seat","Block → Bay → mapped Row → Seat","navigator heading");
replaceExact('aria-label="Generated row"','aria-label="Mapped row"',"row aria label");
replaceExact(
  "Block and bay names follow the supplied seating layout. Row and seat numbers remain generated prototype identifiers until an authoritative seat manifest is available.",
  "Block and bay names follow the supplied seating layout. Row letters are position-mapped from the supplied front-to-rear sequence; seat numbers remain generated until an authoritative chair manifest is available.",
  "navigator accuracy note"
);
replaceExact(
  "The existing 3D stadium geometry is unchanged. Block and bay names are mapped from the supplied seating arrangement; generated rows/seats are not claimed as official ticket inventory.",
  "The existing 3D stadium geometry is unchanged. Block/bay names follow the supplied layout; row letters are positional mappings and seat numbers are not claimed as official ticket inventory.",
  "global accuracy note"
);
replaceExact(
  "Block/Bay mapped from the supplied seating layout. Row and seat remain generated prototype identifiers.",
  "Block/Bay mapped from the supplied seating layout. Row letter is position-mapped from the supplied sequence; seat number remains generated.",
  "selected-seat accuracy note"
);

const rowMetadata = `
    const ACTUAL_ROW_LABELS=["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","X","Y","Z","AA","BB","CC","DD","EE","FF","GG","HH","JJ","KK","LL","MM","NN","PP","QQ","RR","SS","TT","UU","VV","WW"];
    const ACTUAL_ROW_END={A:"TT",B:"UU",C:"TT",D:"SS",E:"SS",F:"TT",G:"UU",H:"TT",SPW:"PP",SPC:"NN",SPE:"PP",J:"KK",K:"MM",L:"KK",M:"JJ",N:"JJ",P:"KK",Q:"MM",R:"KK"};
    function actualRowLabel(tierId,internalRow,blockId=actualSelectedBlock){
      const end=ACTUAL_ROW_END[blockId],fallback=String(internalRow).padStart(2,"0");if(!end)return fallback;
      const endIndex=ACTUAL_ROW_LABELS.indexOf(end);if(endIndex<0)return fallback;
      const tierRows=CFG.tiers.find(t=>t.id===tierId)?.rows||Number(internalRow)||1;
      const idx=Math.round((Math.max(1,Number(internalRow))-1)*endIndex/Math.max(1,tierRows-1));
      return ACTUAL_ROW_LABELS[Math.max(0,Math.min(endIndex,idx))]||fallback
    }
`;
replaceExact('    let actualSelectedBlock="",actualSelectedBay=0;',rowMetadata+'\n    let actualSelectedBlock="",actualSelectedBay=0;',"row metadata insertion");
replaceExact(
  'function populateRows(section,preferred){const items=sectionIndex.get(section)||[],rows=uniqueSorted(items,"row");ui.navRow.innerHTML=\'<option value="">Row</option>\'+rows.map(v=>`<option value="${v}">${String(v).padStart(2,"0")}</option>`).join("");ui.navRow.disabled=!rows.length;ui.navSeat.innerHTML=\'<option value="">—</option>\';ui.navSeat.disabled=true;if(preferred&&rows.includes(preferred)){ui.navRow.value=String(preferred);populateSeats(section,preferred)}}',
  'function populateRows(section,preferred){const items=sectionIndex.get(section)||[],rows=uniqueSorted(items,"row"),tierId=section?.[0]||"";ui.navRow.innerHTML=\'<option value="">Row</option>\'+rows.map(v=>`<option value="${v}">${actualRowLabel(tierId,v,actualSelectedBlock)}</option>`).join("");ui.navRow.disabled=!rows.length;ui.navSeat.innerHTML=\'<option value="">—</option>\';ui.navSeat.disabled=true;if(preferred&&rows.includes(preferred)){ui.navRow.value=String(preferred);populateSeats(section,preferred)}}',
  "row dropdown labels"
);
replaceExact(
  'function syncNavigator(m){if(!m)return;ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m.seat);ui.navRow.value=String(m.row);ui.navSeat.value=String(m.seat);highlightSection(m.section,false);syncActualNavigator(m)}',
  'function syncNavigator(m){if(!m)return;syncActualNavigator(m);ui.navSection.value=m.section;populateRows(m.section,m.row);populateSeats(m.section,m.row,m.seat);ui.navRow.value=String(m.row);ui.navSeat.value=String(m.seat);highlightSection(m.section,false)}',
  "direct-click row sync"
);
replaceExact('ui.row.textContent=String(m.row).padStart(2,"0");ui.seat.textContent=String(m.seat).padStart(2,"0");','ui.row.textContent=actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):String(m.row).padStart(2,"0");ui.seat.textContent=String(m.seat).padStart(2,"0");',"selected row display");
replaceExact('ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · R"+selected.row+" · S"+selected.seat;','ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row)+" · Seat "+selected.seat;',"seat-view row label");
replaceExact('const actual=actualSeatMeta(selected),url=location.href,text=`Motera 3D · ${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, generated Row ${selected.row}, Seat ${selected.seat}`;','const actual=actualSeatMeta(selected),url=location.href,text=`Motera 3D · ${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, Row ${actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row}, Seat ${selected.seat}`;',"share row label");
replaceExact('ui.row.textContent=row?String(row).padStart(2,"0"):"—";','ui.row.textContent=row?actualRowLabel(section[0],row,actualSelectedBlock):"—";',"row-change display");

// ---------------------------------------------------------------------------
// Uploaded seating-map calibration. Image governs spatial block geometry;
// the MD continues to govern labels/row metadata. This is still presentation
// and lookup metadata only; no 3D stadium geometry is changed.
// ---------------------------------------------------------------------------
const calibratedLayout = `    const ACTUAL_LAYOUT={
      L:[
        {id:"E",name:"Block E",short:"E",bays:5,start:13,end:32,tierLabel:"Lower Bowl"},
        {id:"F",name:"Block F",short:"F",bays:6,start:45,end:74,tierLabel:"Lower Bowl"},
        {id:"G",name:"Block G",short:"G",bays:7,start:74,end:110,tierLabel:"Lower Bowl"},
        {id:"H",name:"Block H",short:"H",bays:5,start:110,end:144,tierLabel:"Lower Bowl"},
        {id:"SPE",name:"South Premium East",short:"SP East",bays:4,start:144,end:169,tierLabel:"South Premium"},
        {id:"SPC",name:"South Premium Centre",short:"SP Centre",bays:4,start:169,end:191,tierLabel:"South Premium"},
        {id:"SPW",name:"South Premium West",short:"SP West",bays:4,start:191,end:211,tierLabel:"South Premium"},
        {id:"A",name:"Block A",short:"A",bays:5,start:211,end:261,tierLabel:"Lower Bowl"},
        {id:"B",name:"Block B",short:"B",bays:7,start:261,end:293,tierLabel:"Lower Bowl"},
        {id:"C",name:"Block C",short:"C",bays:6,start:293,end:316,tierLabel:"Lower Bowl"},
        {id:"D",name:"Block D",short:"D",bays:5,start:323,end:349,tierLabel:"Lower Bowl"}
      ],
      U:[
        {id:"N",name:"Block N",short:"N",bays:6,start:354.7,end:31.9,tierLabel:"Upper Bowl"},
        {id:"P",name:"Block P",short:"P",bays:6,start:31.9,end:59.9,tierLabel:"Upper Bowl"},
        {id:"Q",name:"Block Q",short:"Q",bays:8,start:59.9,end:113.7,tierLabel:"Upper Bowl"},
        {id:"R",name:"Block R",short:"R",bays:6,start:113.7,end:150.3,tierLabel:"Upper Bowl"},
        {id:"J",name:"Block J",short:"J",bays:6,start:217.7,end:245.6,tierLabel:"Upper Bowl"},
        {id:"K",name:"Block K",short:"K",bays:8,start:245.6,end:299.6,tierLabel:"Upper Bowl"},
        {id:"L",name:"Block L",short:"L",bays:6,start:299.6,end:327.7,tierLabel:"Upper Bowl"},
        {id:"M",name:"Block M",short:"M",bays:6,start:327.7,end:354.7,tierLabel:"Upper Bowl"}
      ]
    };
`;
replaceSegment('    const ACTUAL_LAYOUT={','    const SOUTH_PAVILION=',calibratedLayout,"calibrated block layout");
replaceExact('const SOUTH_PAVILION={id:"SOUTH",name:"South Pavilion",short:"South Pavilion",bays:0,start:155,end:205,tierLabel:"South Pavilion",pavilion:true};','const SOUTH_PAVILION={id:"SOUTH",name:"South Pavilion",short:"South Pavilion",bays:0,start:150.3,end:217.7,tierLabel:"South Pavilion",pavilion:true};',"south pavilion boundaries");
replaceExact('const found=(ACTUAL_LAYOUT[tier]||[]).find(e=>deg>=e.start&&deg<e.end);','const found=(ACTUAL_LAYOUT[tier]||[]).find(e=>e.start<=e.end?(deg>=e.start&&deg<e.end):(deg>=e.start||deg<e.end));',"wrap-aware block lookup");
replaceExact('const w=(entry.end-entry.start)/entry.bays;\n      return Math.min(entry.bays,Math.max(1,Math.floor((deg-entry.start)/w)+1))','const span=((entry.end-entry.start)+360)%360||360,w=span/entry.bays,offset=((deg-entry.start)+360)%360;\n      return Math.min(entry.bays,Math.max(1,Math.floor(offset/w)+1))',"wrap-aware bay lookup");
replaceExact('function actualCenterDeg(entry,bay){const w=(entry.end-entry.start)/entry.bays;return entry.start+(bay-.5)*w}','function actualCenterDeg(entry,bay){const span=((entry.end-entry.start)+360)%360||360,w=span/entry.bays;return actualWrapDeg(entry.start+(bay-.5)*w)}',"wrap-aware bay center");

replaceExact('#minimap-wrap{position:fixed;z-index:10;right:14px;top:calc(var(--safe-t) + 84px);width:188px;padding:8px;border-radius:14px}','#minimap-wrap{position:fixed;z-index:10;right:14px;top:calc(var(--safe-t) + 84px);width:230px;padding:9px;border-radius:14px}',"desktop minimap width");
replaceExact('#minimap{width:170px;height:132px;display:block;border-radius:9px;background:#0a1520;cursor:pointer;touch-action:none}','#minimap{width:212px;height:166px;display:block;border-radius:9px;background:#0a1520;cursor:pointer;touch-action:none}',"desktop minimap canvas");
replaceExact('#minimap-wrap{right:9px;top:86px;bottom:auto;width:142px;padding:6px}#minimap{width:128px;height:100px}','#minimap-wrap{right:9px;top:86px;bottom:auto;width:180px;padding:6px}#minimap{width:166px;height:130px}',"tablet minimap");
replaceExact('@media(max-width:430px){#minimap-wrap{width:122px}#minimap{width:108px;height:84px}','@media(max-width:430px){#minimap-wrap{width:150px}#minimap{width:136px;height:106px}',"phone minimap");
replaceExact('@media(max-height:720px) and (max-width:800px){.brand span,#sub{display:none}.brand{padding:8px 10px}#card{padding:9px}.finder{margin-bottom:7px}.actions{margin-top:7px}.btn{min-height:36px}#minimap-wrap{display:none}}','@media(max-height:720px) and (max-width:800px){.brand span,#sub{display:none}.brand{padding:8px 10px}#card{padding:9px}.finder{margin-bottom:7px}.actions{margin-top:7px}.btn{min-height:36px}#minimap-wrap{display:block;top:68px;width:112px;padding:5px}#minimap{width:100px;height:78px}.map-caption{display:none}}',"short-screen minimap");

const newDraw = `    function drawMinimap(){
      const c=ui.map,x=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h*.46,rx=w*.43,ry=h*.40;
      x.clearRect(0,0,w,h);x.fillStyle="#08131e";x.fillRect(0,0,w,h);
      const toA=deg=>THREE.MathUtils.degToRad(deg-90),pt=(deg,r)=>[cx+Math.cos(toA(deg))*rx*r,cy+Math.sin(toA(deg))*ry*r],span=e=>((e.end-e.start)+360)%360||360;
      const sector=(e,r0,r1,fill,stroke="#d9e5ea")=>{const n=Math.max(6,Math.ceil(span(e)/4)),sp=span(e);x.beginPath();for(let i=0;i<=n;i++){const p=pt(e.start+sp*i/n,r1);i?x.lineTo(...p):x.moveTo(...p)}for(let i=n;i>=0;i--){const p=pt(e.start+sp*i/n,r0);x.lineTo(...p)}x.closePath();x.fillStyle=fill;x.fill();x.strokeStyle=stroke;x.lineWidth=1;x.stroke()};
      const divider=(deg,r0,r1,color="rgba(255,255,255,.82)",width=1)=>{const a=pt(deg,r0),b=pt(deg,r1);x.beginPath();x.moveTo(...a);x.lineTo(...b);x.strokeStyle=color;x.lineWidth=width;x.stroke()};
      const label=(text,deg,r,size,color="#eef5f7")=>{const p=pt(deg,r);x.fillStyle=color;x.font="800 "+size+"px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,p[0],p[1])},centerDeg=e=>actualWrapDeg(e.start+span(e)/2);
      for(const e of ACTUAL_LAYOUT.U){sector(e,.77,1,"#9fd8e9","#d7edf4");for(let i=0;i<=e.bays;i++)divider(e.start+span(e)*i/e.bays,.77,1,"rgba(255,255,255,.72)",.85);label(e.short,centerDeg(e),.885,12,"#09202c")}
      for(const e of ACTUAL_LAYOUT.L){const premium=e.id.startsWith("SP");sector(e,.54,.75,premium?"#e9bb78":"#efa64a","#fff0d6");for(let i=0;i<=e.bays;i++)divider(e.start+span(e)*i/e.bays,.54,.75,"rgba(255,255,255,.76)",.8);label(e.short,centerDeg(e),.645,premium?8:10,"#38230d")}
      x.beginPath();x.ellipse(cx,cy,rx*.515,ry*.515,0,0,Math.PI*2);x.fillStyle="#76a85e";x.fill();x.strokeStyle="#dcebd5";x.lineWidth=1.5;x.stroke();x.fillStyle="#d3b477";x.fillRect(cx-w*.018,cy-h*.095,w*.036,h*.19);
      const py=cy+ry*.57,box=(yy,ww,hh,text,fill)=>{x.fillStyle=fill;x.fillRect(cx-ww/2,yy-hh/2,ww,hh);x.strokeStyle="#c8b7a8";x.strokeRect(cx-ww/2,yy-hh/2,ww,hh);x.fillStyle="#332b27";x.font="700 "+Math.max(7,w*.020)+"px Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,cx,yy)};
      box(py,w*.32,h*.045,"PRESIDENT GALLERY","#eadce8");box(py+h*.052,w*.42,h*.038,"PRESIDENTIAL SUITES","#efe9e2");box(py+h*.097,w*.48,h*.038,"PREMIUM SUITES","#eee9df");
      if(actualSelectedBlock&&actualSelectedBay){const rec=actualEntryById(actualSelectedBlock);if(rec){const e=rec.entry,sp=span(e),bw=sp/e.bays,hi={...e,start:actualWrapDeg(e.start+(actualSelectedBay-1)*bw),end:actualWrapDeg(e.start+actualSelectedBay*bw)};sector(hi,rec.tier==="U"?.77:.54,rec.tier==="U"?1:.75,"rgba(94,215,255,.72)","#ffffff")}}
      if(selected){const t=selected.tierId==="U"?.885:.645,a=selected.angle;x.beginPath();x.arc(cx+Math.cos(a)*rx*t,cy+Math.sin(a)*ry*t,5,0,Math.PI*2);x.fillStyle="#fff";x.fill();x.strokeStyle="#071019";x.lineWidth=2;x.stroke()}
      if(!seatMode){const a=Math.PI/2-orbit.t,p=.99;x.save();x.translate(cx+Math.cos(a)*rx*p,cy+Math.sin(a)*ry*p);x.rotate(a+Math.PI/2);x.beginPath();x.moveTo(0,-7);x.lineTo(5.5,5);x.lineTo(-5.5,5);x.closePath();x.fillStyle="#f7f3ea";x.fill();x.restore()}
    }
`;
replaceSegment('    function drawMinimap(){','    function mapPick(e){',newDraw,"reference minimap renderer");
replaceExact('const cx=ui.map.width/2,cy=ui.map.height/2,rx=ui.map.width*.42,ry=ui.map.height*.4;','const cx=ui.map.width/2,cy=ui.map.height*.46,rx=ui.map.width*.43,ry=ui.map.height*.40;',"map hit-test geometry");
html=html.replaceAll('tap the minimap, use Random, or navigate by generated section, row and seat','tap the calibrated block map, use Random, or navigate by Block, Bay, Row and Seat');
html=html.replaceAll('Tap a block','Reference block map');
html=html.replaceAll('Choose a section to highlight it in 3D','Choose a Block and Bay to highlight it in 3D');

for(const required of ["const ACTUAL_ROW_LABELS=","function actualRowLabel(",'start:354.7,end:31.9','PRESIDENT GALLERY','PRESIDENTIAL SUITES','PREMIUM SUITES','#minimap{width:212px;height:166px'])if(!html.includes(required))throw new Error(`Seat-map integration missing: ${required}`);
for(const invariant of ['rows:35,rx:86.8,rz:72.8','rows:32,rx:118.7,rz:104.7','new THREE.InstancedMesh','function pick(x,y)','function enter(){','gsap.to(camera.position','ray.ray.intersectsSphere(sphere)','function orbitCam()','function seatCam()','function shareSeat()','function restoreFromUrl()'])if(!html.includes(invariant))throw new Error(`Core stadium invariant missing: ${invariant}`);

await writeFile(outputPath, html, "utf8");
console.log("Applied positional row labels and uploaded-map block calibration without changing 3D stadium geometry");

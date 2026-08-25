import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Seat-orientation patch target missing (${label}): ${before.slice(0, 140)}…`);
  }
  html = html.replace(before, after);
}

// The procedural pitch runs along the X axis and the sight screens sit at ±X.
// Therefore the reference map's 0° / north direction must be the seat geometry's
// angle 0° (+X). The previous +90/-90 transform incorrectly mapped north to ±Z.
replaceExact(
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a)+90);',
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  "3D seat angle to reference-map north"
);
replaceExact(
  'const a=actualWrapDeg(deg-90),n=Math.floor(a/360*CFG.sections)+1;',
  'const a=actualWrapDeg(deg),n=Math.floor(a/360*CFG.sections)+1;',
  "reference-map bay to internal section"
);

// Keep the selected-seat dot on the same north-up transform as the calibrated
// reference map instead of drawing it in raw Three.js XY canvas orientation.
replaceExact(
  'if(selected){const t=selected.tierId==="U"?.885:.645,a=selected.angle;x.beginPath();x.arc(cx+Math.cos(a)*rx*t,cy+Math.sin(a)*ry*t,5,0,Math.PI*2);x.fillStyle="#fff";x.fill();x.strokeStyle="#071019";x.lineWidth=2;x.stroke()}',
  'if(selected){const t=selected.tierId==="U"?.885:.645,a=toA(actualNavDegFromAngle(selected.angle));x.beginPath();x.arc(cx+Math.cos(a)*rx*t,cy+Math.sin(a)*ry*t,5,0,Math.PI*2);x.fillStyle="#fff";x.fill();x.strokeStyle="#071019";x.lineWidth=2;x.stroke()}',
  "selected-seat minimap marker"
);

// Block/Bay navigation must never expose a chair from the neighbouring bay just
// because the hidden procedural section overlaps both bays. Keep the stable
// internal section/row/seat identifiers, but filter candidates by the calibrated
// Block/Bay metadata before rows and seats are offered or resolved.
replaceExact(
  'function populateRows(section,preferred){const items=sectionIndex.get(section)||[],rows=uniqueSorted(items,"row"),tierId=section?.[0]||"";ui.navRow.innerHTML=\'<option value="">Row</option>\'+rows.map(v=>`<option value="${v}">${actualRowLabel(tierId,v,actualSelectedBlock)}</option>`).join("");ui.navRow.disabled=!rows.length;ui.navSeat.innerHTML=\'<option value="">—</option>\';ui.navSeat.disabled=true;if(preferred&&rows.includes(preferred)){ui.navRow.value=String(preferred);populateSeats(section,preferred)}}',
  'function populateRows(section,preferred){const items=(sectionIndex.get(section)||[]).filter(m=>!actualSelectedBlock||!actualSelectedBay||(actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay)),rows=uniqueSorted(items,"row"),tierId=section?.[0]||"";ui.navRow.innerHTML=\'<option value="">Row</option>\'+rows.map(v=>`<option value="${v}">${actualRowLabel(tierId,v,actualSelectedBlock)}</option>`).join("");ui.navRow.disabled=!rows.length;ui.navSeat.innerHTML=\'<option value="">—</option>\';ui.navSeat.disabled=true;if(preferred&&rows.includes(preferred)){ui.navRow.value=String(preferred);populateSeats(section,preferred)}}',
  "bay-scoped row candidates"
);
replaceExact(
  'function populateSeats(section,row,preferred){const items=(sectionIndex.get(section)||[]).filter(m=>m.row===Number(row)),seats=uniqueSorted(items,"seat");ui.navSeat.innerHTML=\'<option value="">Seat</option>\'+seats.map(v=>`<option value="${v}">${String(v).padStart(2,"0")}</option>`).join("");ui.navSeat.disabled=!seats.length;if(preferred&&seats.includes(preferred))ui.navSeat.value=String(preferred)}',
  'function populateSeats(section,row,preferred){const items=(sectionIndex.get(section)||[]).filter(m=>m.row===Number(row)&&(!actualSelectedBlock||!actualSelectedBay||(actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay))),seats=uniqueSorted(items,"seat");ui.navSeat.innerHTML=\'<option value="">Seat</option>\'+seats.map(v=>`<option value="${v}">${String(v).padStart(2,"0")}</option>`).join("");ui.navSeat.disabled=!seats.length;if(preferred&&seats.includes(preferred))ui.navSeat.value=String(preferred)}',
  "bay-scoped seat candidates"
);
replaceExact(
  'function findSeat(section,row,seat){return(sectionIndex.get(section)||[]).find(m=>m.row===Number(row)&&m.seat===Number(seat))||null}',
  'function findSeat(section,row,seat){return(sectionIndex.get(section)||[]).find(m=>m.row===Number(row)&&m.seat===Number(seat)&&(!actualSelectedBlock||!actualSelectedBay||(actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay)))||null}',
  "bay-scoped exact seat resolution"
);

// Build-time geometry sanity check for the reported regression. Block N Bay 1
// is at the top/north of the supplied map and must resolve to the +X sight-screen
// end (internal U48/U01 neighbourhood), never the old ±Z U36/U37 area.
const wrap = value => ((value % 360) + 360) % 360;
const nStart = 354.7;
const nSpan = ((31.9 - nStart) + 360) % 360;
const nBay1Center = wrap(nStart + (nSpan / 6) * 0.5);
const nBay1Section = Math.floor(nBay1Center / 360 * 48) + 1;
if (nBay1Section !== 48) {
  throw new Error(`Block N Bay 1 alignment regression: expected U48 neighbourhood, got U${String(nBay1Section).padStart(2, "0")}`);
}
const nRad = nBay1Center * Math.PI / 180;
if (Math.cos(nRad) < 0.95 || Math.abs(Math.sin(nRad)) > 0.15) {
  throw new Error("Block N Bay 1 no longer aligns with the +X sight-screen axis");
}

for (const required of [
  'const actualNavDegFromAngle=a=>actualWrapDeg(THREE.MathUtils.radToDeg(a));',
  'const a=actualWrapDeg(deg),n=Math.floor(a/360*CFG.sections)+1;',
  'a=toA(actualNavDegFromAngle(selected.angle))',
  'actualSeatMeta(m).blockId===actualSelectedBlock&&actualSeatMeta(m).bay===actualSelectedBay',
  'function enter(){',
  'function seatCam()',
  'rows:35,rx:86.8,rz:72.8',
  'rows:32,rx:118.7,rz:104.7',
  'ray.ray.intersectsSphere(sphere)'
]) {
  if (!html.includes(required)) throw new Error(`Seat-orientation invariant missing: ${required}`);
}
if (html.includes('actualWrapDeg(THREE.MathUtils.radToDeg(a)+90)') || html.includes('actualWrapDeg(deg-90)')) {
  throw new Error("Legacy 90-degree seating-map transform still present");
}

await writeFile(outputPath, html, "utf8");
console.log("Aligned Block/Bay navigation and seat view with the 3D sight-screen axis");

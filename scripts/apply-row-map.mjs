import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Row-map patch target missing (${label}): ${before.slice(0, 120)}…`);
  }
  html = html.replace(before, after);
}

// Presentation/metadata pass only. It never edits source stadium geometry,
// seat XYZ positions, instance IDs, raycasting, camera math, LOD, roof, field,
// or stable internal seat URLs.
replaceExact(
  "Block → Bay → generated Row → Seat",
  "Block → Bay → mapped Row → Seat",
  "navigator heading"
);
replaceExact(
  'aria-label="Generated row"',
  'aria-label="Mapped row"',
  "row aria label"
);
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
    // Terminal labels come from the supplied Block & Bay Master Matrix. The
    // source's written numeric row counts do not always equal the number of
    // labels implied by its A..Z / double-letter sequence, so we do not invent
    // extra 3D rows. Existing procedural rows are mapped proportionally from A
    // at the front to the supplied terminal label at the rear of each block.
    const ACTUAL_ROW_END={
      A:"TT",B:"UU",C:"TT",D:"SS",E:"SS",F:"TT",G:"UU",H:"TT",
      SPW:"PP",SPC:"NN",SPE:"PP",
      J:"KK",K:"MM",L:"KK",M:"JJ",N:"JJ",P:"KK",Q:"MM",R:"KK"
    };
    function actualRowLabel(tierId,internalRow,blockId=actualSelectedBlock){
      const end=ACTUAL_ROW_END[blockId],fallback=String(internalRow).padStart(2,"0");
      if(!end)return fallback;
      const endIndex=ACTUAL_ROW_LABELS.indexOf(end);if(endIndex<0)return fallback;
      const tierRows=CFG.tiers.find(t=>t.id===tierId)?.rows||Number(internalRow)||1;
      const idx=Math.round((Math.max(1,Number(internalRow))-1)*endIndex/Math.max(1,tierRows-1));
      return ACTUAL_ROW_LABELS[Math.max(0,Math.min(endIndex,idx))]||fallback
    }
`;
replaceExact(
  '    let actualSelectedBlock="",actualSelectedBay=0;',
  rowMetadata + '\n    let actualSelectedBlock="",actualSelectedBay=0;',
  "row metadata insertion"
);

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

replaceExact(
  'ui.row.textContent=String(m.row).padStart(2,"0");ui.seat.textContent=String(m.seat).padStart(2,"0");',
  'ui.row.textContent=actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):String(m.row).padStart(2,"0");ui.seat.textContent=String(m.seat).padStart(2,"0");',
  "selected row display"
);

replaceExact(
  'ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · R"+selected.row+" · S"+selected.seat;',
  'ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row)+" · Seat "+selected.seat;',
  "seat-view row label"
);

replaceExact(
  'const actual=actualSeatMeta(selected),url=location.href,text=`Motera 3D · ${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, generated Row ${selected.row}, Seat ${selected.seat}`;',
  'const actual=actualSeatMeta(selected),url=location.href,text=`Motera 3D · ${actual.bay?actual.name+" Bay "+actual.bay:actual.name}, Row ${actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row}, Seat ${selected.seat}`;',
  "share row label"
);

replaceExact(
  'ui.row.textContent=row?String(row).padStart(2,"0"):"—";',
  'ui.row.textContent=row?actualRowLabel(section[0],row,actualSelectedBlock):"—";',
  "row-change display"
);

for (const required of [
  "const ACTUAL_ROW_LABELS=",
  "const ACTUAL_ROW_END=",
  "function actualRowLabel(",
  "mapped Row",
  "actualRowLabel(m.tierId,m.row,actual.blockId)",
  "actualRowLabel(selected.tierId,selected.row,actual.blockId)"
]) {
  if (!html.includes(required)) throw new Error(`Row metadata integration missing: ${required}`);
}

// Guard the non-destructive contract: the built page must still contain the
// original procedural tier geometry and stable internal URL parser.
for (const preserved of [
  'rows:35,rx:86.8,rz:72.8',
  'rows:32,rx:118.7,rz:104.7',
  'const m=/^([LU]\\d{2})-R(\\d+)-S(\\d+)$/i.exec(raw)',
  'ray.ray.intersectsSphere(sphere)'
]) {
  if (!html.includes(preserved)) throw new Error(`Non-destructive row-map invariant failed: ${preserved}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Applied non-destructive positional row-label mapping");

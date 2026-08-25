import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function replaceExact(before, after, label) {
  if (!html.includes(before)) {
    throw new Error(`Seat-switch patch target missing (${label}): ${before.slice(0, 160)}…`);
  }
  html = html.replace(before, after);
}

// While already in first-person seat mode, selecting another seat used to update
// only the UI/metadata. The camera remained at the previous seat because enter()
// returned early whenever seatMode was true. Centralize the seat camera transfer
// so enter(), dropdown changes, Random, and rapid consecutive changes all use the
// same deterministic transition path.
const seatMoveHelper = `
    function seatViewLabel(m){
      const actual=actualSeatMeta(m);
      return (actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(m.tierId,m.row,actual.blockId):m.row)+" · Seat "+m.seat
    }
    function moveSeatCameraTo(m,duration=reduced?0:.72){
      if(!m||!seatMode)return;
      buildSeatDetails(m);ui.label.textContent=seatViewLabel(m);
      camera.fov=58;camera.updateProjectionMatrix();
      const inward=new THREE.Vector3(-m.position.x,0,-m.position.z).normalize(),dest=m.position.clone().addScaledVector(inward,.16);dest.y+=1.2;
      seatLook.yaw=Math.atan2(-dest.x,-dest.z);seatLook.pitch=m.tierId==="U"?-.12:-.08;
      gsap.killTweensOf(camera.position);
      gsap.to(camera.position,{x:dest.x,y:dest.y,z:dest.z,duration,ease:"power3.inOut",overwrite:true,onUpdate:seatCam,onComplete:()=>{seatCam();updateLOD()}})
    }
`;
replaceExact(
  '    function enter(){\n',
  seatMoveHelper + '\n    function enter(){\n',
  "seat camera transfer helper"
);

replaceExact(
  '      if(updateUrl)syncUrl(m);drawMinimap()\n    }',
  '      if(updateUrl)syncUrl(m);drawMinimap();if(seatMode)moveSeatCameraTo(m)\n    }',
  "move camera after selecting another seat in seat mode"
);

replaceExact(
  '    function enter(){\n      if(!selected||seatMode)return;seatMode=true;document.body.classList.add("seatmode");canvas.classList.add("seatmode");ui.bar.classList.add("show");const actual=actualSeatMeta(selected);ui.label.textContent=(actual.bay?actual.name+" · Bay "+actual.bay:actual.name)+" · Row "+(actual.entry&&!actual.entry.pavilion?actualRowLabel(selected.tierId,selected.row,actual.blockId):selected.row)+" · Seat "+selected.seat;if(marker)marker.visible=false;\n      buildSeatDetails(selected);camera.fov=58;camera.updateProjectionMatrix();const inward=new THREE.Vector3(-selected.position.x,0,-selected.position.z).normalize(),dest=selected.position.clone().addScaledVector(inward,.16);dest.y+=1.2;seatLook.yaw=Math.atan2(-dest.x,-dest.z);seatLook.pitch=selected.tierId==="U"?-.12:-.08;\n      gsap.to(camera.position,{x:dest.x,y:dest.y,z:dest.z,duration:reduced?0:1.05,ease:"power3.inOut",onUpdate:seatCam,onComplete:()=>{seatCam();updateLOD()}})\n    }',
  '    function enter(){\n      if(!selected)return;if(seatMode){moveSeatCameraTo(selected,reduced?0:.5);return}seatMode=true;document.body.classList.add("seatmode");canvas.classList.add("seatmode");ui.bar.classList.add("show");if(marker)marker.visible=false;moveSeatCameraTo(selected,reduced?0:1.05)\n    }',
  "reusable enter-seat flow"
);

replaceExact(
  '      gsap.to(camera.position,{x:d.x,y:d.y,z:d.z,duration:reduced?0:.85,ease:"power2.inOut",onUpdate:()=>camera.lookAt(orbit.target),onComplete:()=>{orbitCam();updateLOD()}})',
  '      gsap.killTweensOf(camera.position);gsap.to(camera.position,{x:d.x,y:d.y,z:d.z,duration:reduced?0:.85,ease:"power2.inOut",overwrite:true,onUpdate:()=>camera.lookAt(orbit.target),onComplete:()=>{orbitCam();updateLOD()}})',
  "cancel active seat transfer when leaving"
);

for (const required of [
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'if(seatMode)moveSeatCameraTo(m)',
  'if(seatMode){moveSeatCameraTo(selected,reduced?0:.5);return}',
  'gsap.killTweensOf(camera.position)',
  'buildSeatDetails(m);ui.label.textContent=seatViewLabel(m)',
  'function select(m,sync=true,updateUrl=true)',
  'function leave(){',
  'function seatCam()',
  'function actualSeatMeta(m)'
]) {
  if (!html.includes(required)) throw new Error(`Seat-switch invariant missing: ${required}`);
}
if (html.includes('if(!selected||seatMode)return;')) {
  throw new Error("Legacy seatMode early-return still blocks switching seats");
}

await writeFile(outputPath, html, "utf8");
console.log("Enabled in-place seat-to-seat camera transitions without requiring reset");

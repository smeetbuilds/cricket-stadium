import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

function fail(message) {
  throw new Error(`Phase-15 browser hardening: ${message}`);
}
function replaceOnce(from, to, label) {
  const first = html.indexOf(from);
  if (first < 0) fail(`missing ${label}`);
  if (html.indexOf(from, first + from.length) >= 0) fail(`duplicate ${label}`);
  html = html.replace(from, to);
}

for (const marker of [
  'canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();fail3D("The WebGL context was lost. Reload the page to restart the 3D renderer.")},{once:true});',
  'document.addEventListener("visibilitychange",()=>{if(document.hidden){if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0}else{requestMinimap();requestRender()}},{passive:true});',
  'canvas.addEventListener("pointerup",pointerEnd);canvas.addEventListener("pointercancel",e=>{pointers.delete(e.pointerId);drag=false;canvas.classList.remove("drag");pinchStart=0});',
  'addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()});'
]) {
  if (!html.includes(marker)) fail(`protected runtime marker missing: ${marker}`);
}

const contextLost = 'canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();fail3D("The WebGL context was lost. Reload the page to restart the 3D renderer.")},{once:true});';
replaceOnce(
  contextLost,
  contextLost + '\n    canvas.addEventListener("webglcontextrestored",()=>{location.reload()},{once:true});',
  "WebGL context-loss handler"
);

const visibility = 'document.addEventListener("visibilitychange",()=>{if(document.hidden){if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0}else{requestMinimap();requestRender()}},{passive:true});';
replaceOnce(
  visibility,
  visibility +
    '\n    addEventListener("pagehide",()=>{if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0},{passive:true});' +
    '\n    addEventListener("pageshow",e=>{if(e.persisted){requestMinimap();requestRender()}},{passive:true});',
  "visibility handler"
);

const pointerCancel = 'canvas.addEventListener("pointerup",pointerEnd);canvas.addEventListener("pointercancel",e=>{pointers.delete(e.pointerId);drag=false;canvas.classList.remove("drag");pinchStart=0});';
const pointerSafe =
  'function cancelPointer(e){pointers.delete(e.pointerId);if(!pointers.size){drag=false;canvas.classList.remove("drag")}else if(pointers.size===1){const rem=[...pointers.values()][0];lx=sx=rem.x;ly=sy=rem.y;moved=true}pinchStart=0}' +
  '\n    canvas.addEventListener("pointerup",pointerEnd);canvas.addEventListener("pointercancel",cancelPointer);canvas.addEventListener("lostpointercapture",e=>{if(pointers.has(e.pointerId))cancelPointer(e)});';
replaceOnce(pointerCancel, pointerSafe, "pointer-cancel handler");

const resize = 'addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()});';
replaceOnce(
  resize,
  resize +
    '\n    addEventListener("orientationchange",()=>setTimeout(()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()},80),{passive:true});',
  "resize handler"
);

for (const marker of [
  'canvas.addEventListener("webglcontextrestored",()=>{location.reload()},{once:true});',
  'addEventListener("pagehide",()=>{if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0},{passive:true});',
  'addEventListener("pageshow",e=>{if(e.persisted){requestMinimap();requestRender()}},{passive:true});',
  'function cancelPointer(e){pointers.delete(e.pointerId);if(!pointers.size){drag=false;canvas.classList.remove("drag")}else if(pointers.size===1){const rem=[...pointers.values()][0];lx=sx=rem.x;ly=sy=rem.y;moved=true}pinchStart=0}',
  'canvas.addEventListener("lostpointercapture",e=>{if(pointers.has(e.pointerId))cancelPointer(e)});',
  'addEventListener("orientationchange",()=>setTimeout(()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()},80),{passive:true});'
]) {
  if (!html.includes(marker)) fail(`browser recovery marker missing after patch: ${marker}`);
}

await writeFile(outputPath, html, "utf8");
console.log("Hardened Safari/Firefox/Chrome runtime recovery without changing stadium UX");

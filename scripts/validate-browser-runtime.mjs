import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
const html = await readFile(outputPath, "utf8");

function fail(message) {
  throw new Error(`Phase-15 browser regression: ${message}`);
}
function need(marker) {
  if (!html.includes(marker)) fail(`missing ${marker}`);
}

for (const marker of [
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />',
  '--safe-b:max(12px,env(safe-area-inset-bottom));--safe-t:max(12px,env(safe-area-inset-top))',
  '-webkit-backdrop-filter:blur(18px)',
  '#c{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}',
  '#minimap{width:212px;height:166px;display:block;border-radius:9px;background:#0a1520;cursor:pointer;touch-action:none}',
  '@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;transition-duration:.001ms!important}}',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" onerror="window.__depsFailed=true"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" onerror="window.__depsFailed=true"></script>',
  'if(window.__depsFailed||!window.THREE||!window.gsap){fail3D("The 3D libraries could not load. Check your connection, content blocker, or network policy.");return}',
  'renderer=new THREE.WebGLRenderer({canvas,antialias:renderAntialias,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false});',
  'canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();fail3D("The WebGL context was lost. Reload the page to restart the 3D renderer.")},{once:true});',
  'canvas.addEventListener("webglcontextrestored",()=>{location.reload()},{once:true});',
  'document.addEventListener("visibilitychange",()=>{if(document.hidden){if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0}else{requestMinimap();requestRender()}},{passive:true});',
  'addEventListener("pagehide",()=>{if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=0},{passive:true});',
  'addEventListener("pageshow",e=>{if(e.persisted){requestMinimap();requestRender()}},{passive:true});',
  'function cancelPointer(e){pointers.delete(e.pointerId);if(!pointers.size){drag=false;canvas.classList.remove("drag")}else if(pointers.size===1){const rem=[...pointers.values()][0];lx=sx=rem.x;ly=sy=rem.y;moved=true}pinchStart=0}',
  'canvas.addEventListener("pointercancel",cancelPointer)',
  'canvas.addEventListener("lostpointercapture",e=>{if(pointers.has(e.pointerId))cancelPointer(e)});',
  'canvas.setPointerCapture?.(e.pointerId)',
  'canvas.releasePointerCapture?.(e.pointerId)',
  'addEventListener("wheel",',
  'addEventListener("orientationchange",()=>setTimeout(()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderPixelRatio());requestMinimap();requestRender()},80),{passive:true});',
  'const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);',
  'try{if(navigator.share){await navigator.share({title:"Motera 3D seat view",text,url})}else if(navigator.clipboard){await navigator.clipboard.writeText(url);',
  'if(!history.replaceState)return;',
  'const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;',
  'renderer.shadowMap.autoUpdate=false',
  'function ensureFrame(){if(document.hidden||frameHandle)return;frameHandle=requestAnimationFrame(animate)}',
  'async function seats(t)',
  'function renderPixelRatio()'
]) need(marker);

const forbidden = [
  ['navigator.gpu', 'WebGPU-only runtime path'],
  ['WebGPURenderer', 'WebGPU renderer'],
  ['WebGL2RenderingContext', 'hard WebGL2 requirement'],
  ['THREE.GLSL3', 'GLSL3-only shader path'],
  ['OffscreenCanvas', 'OffscreenCanvas-only path'],
  ['requestIdleCallback(', 'requestIdleCallback without Safari fallback'],
  ['SharedArrayBuffer', 'cross-origin-isolated SharedArrayBuffer requirement'],
  ['Atomics.', 'Atomics/worker synchronization requirement'],
  ['new THREE.WebGLMultisampleRenderTarget(', 'WebGL2 multisample render-target path'],
  ['new THREE.Data3DTexture(', 'WebGL2 3D texture path'],
  ['new THREE.DataArrayTexture(', 'WebGL2 array texture path'],
  ['renderer.setAnimationLoop(', 'always-on animation loop'],
  ['preserveDrawingBuffer:true', 'expensive/special-case drawing buffer'],
  ['http://cdnjs.cloudflare.com/', 'insecure CDN dependency']
];
for (const [needle, label] of forbidden) {
  if (html.includes(needle)) fail(`${label} introduced`);
}

const external = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]);
if (external.length !== 2) fail(`expected exactly two external runtime scripts, got ${external.length}`);
if (external.some(url => !url.startsWith('https://'))) fail('non-HTTPS runtime dependency found');

const moduleRuntimeScripts = (html.match(/<script\b[^>]*\btype="module"/g) || []).length;
if (moduleRuntimeScripts) fail('runtime unexpectedly requires module-script loading');

const pointerListeners = ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'];
for (const event of pointerListeners) {
  if (!html.includes(`"${event}"`)) fail(`pointer-event coverage missing ${event}`);
}

console.log(
  'Phase 15 browser/runtime contract validated: classic-script WebGL1-compatible path, ' +
  'Safari BFCache/orientation recovery, Firefox/Safari pointer-cancel handling, context restoration, ' +
  'HTTPS dependency fallbacks, reduced motion and hidden-tab recovery'
);

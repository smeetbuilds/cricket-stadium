import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const sourcePath = resolve(root, "index.html");
const outputPath = resolve(dist, "index.html");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let html = await readFile(sourcePath, "utf8");

// Three.js r128 InstancedMesh.raycast() delegates to Mesh.raycast() for each
// instance. Mesh.raycast() treats geometry.boundingSphere as local geometry
// coordinates and transforms it by the instance matrix. The app previously
// replaced that local sphere with a world-space section sphere, so the sphere
// was transformed twice and clicks could miss the actual seats entirely.
// Keep the seat geometry's native local bounds and use the section sphere only
// as a world-space prefilter before invoking the native per-instance raycast.
const replacements = [
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

for (const [before, after] of replacements) {
  if (!html.includes(before)) {
    throw new Error(`Seat-view compatibility patch target missing: ${before.slice(0, 90)}…`);
  }
  html = html.replace(before, after);
}

if (html.includes("panGeo.boundingSphere=sphere.clone()") || html.includes("backGeo.boundingSphere=sphere.clone()")) {
  throw new Error("Broken world-space InstancedMesh geometry bounds remain after build patch");
}
if (!html.includes("ray.ray.intersectsSphere(sphere)")) {
  throw new Error("Seat section raycast prefilter was not installed");
}

await writeFile(outputPath, html, "utf8");
await cp(resolve(root, "public"), dist, { recursive: true });

console.log("Applied Three.js r128 seat-picking compatibility fix");
console.log(`Built Motera 3D -> ${dist}`);

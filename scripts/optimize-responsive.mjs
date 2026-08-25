import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "dist", "index.html");
let html = await readFile(outputPath, "utf8");

const protectedMarkers = [
  '@media(max-width:800px){',
  '@media(max-width:430px){#minimap-wrap{width:150px}',
  '@media(max-height:720px) and (max-width:800px){',
  '@media(max-width:520px){.navgrid{grid-template-columns:1fr 1fr}',
  '#card{position:fixed;z-index:10;left:14px;bottom:var(--safe-b);width:min(430px,calc(100vw - 28px));padding:15px;border-radius:17px}',
  '#tools{position:fixed;z-index:11;right:14px;top:48%;transform:translateY(-50%);display:grid;gap:6px;padding:6px;border-radius:13px}',
  '#minimap-wrap{position:fixed;z-index:10;right:14px;top:calc(var(--safe-t) + 84px);width:230px;padding:9px;border-radius:14px}',
  'body.seatmode #card,body.seatmode #tools,body.seatmode #minimap-wrap{display:none}',
  'function moveSeatCameraTo(m,duration=reduced?0:.72)',
  'function renderPixelRatio()',
  'async function seats(t)'
];
for (const marker of protectedMarkers) {
  if (!html.includes(marker)) throw new Error(`Phase-13 protected baseline missing: ${marker}`);
}

if (html.includes('/* Phase 13 responsive matrix */')) {
  throw new Error('Phase-13 responsive rules already present; refusing duplicate insertion');
}

const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('Phase-13 style boundary missing');

const responsiveCss = `
    /* Phase 13 responsive matrix */
    @media(max-height:720px) and (max-width:800px){#minimap-wrap{display:none}}
    @media(orientation:landscape) and (max-height:700px) and (max-width:1180px){
      header{top:max(8px,env(safe-area-inset-top));left:9px;right:auto}
      .brand{width:auto;min-width:0;max-width:calc(100vw - 78px);padding:8px 10px}.brand span,.brand em,.facts,#note,#sub,#minimap-wrap{display:none}
      #card{left:9px;right:auto;bottom:max(9px,env(safe-area-inset-bottom));width:min(430px,calc(100vw - 78px));padding:9px;max-height:calc(100vh - 58px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
      .finder{padding:8px;margin-bottom:7px}h2{font-size:19px;margin-top:9px}.data .cell{padding:7px}.actions{grid-template-columns:1fr auto auto;margin-top:7px}.btn{min-height:36px;padding:0 10px}
      #tools{right:9px;top:50%}body.seatmode #card,body.seatmode #tools,body.seatmode #minimap-wrap{display:none}#seatbar{width:calc(100vw - 18px);justify-content:space-between}
    }
    @media(orientation:landscape) and (max-height:700px) and (min-width:1181px){#tools{right:258px}}
`;

html = html.slice(0, styleEnd) + responsiveCss + html.slice(styleEnd);
await writeFile(outputPath, html, "utf8");
console.log('Applied Phase 13 short-landscape collision fixes without changing portrait/tablet/desktop baseline');

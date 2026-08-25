import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const useDist = process.argv.includes("--dist");
const root = resolve(import.meta.dirname, useDist ? "../dist" : "..");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  const raw = decodeURIComponent((urlPath || "/").split("?")[0]);
  const relative = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
  return join(root, relative || "index.html");
}

const server = createServer((req, res) => {
  let file = safePath(req.url);
  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(root, "index.html");
  }
  if (!file.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const stat = statSync(file);
    res.writeHead(200, {
      "content-type": types[extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": stat.size,
      "cache-control": useDist ? "public, max-age=300" : "no-store"
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Motera 3D ${useDist ? "preview" : "dev"} server: http://127.0.0.1:${port}`);
});

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";

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
  let raw;
  try {
    raw = decodeURIComponent((urlPath || "/").split("?")[0]);
  } catch {
    return null;
  }
  const normalized = normalize(raw).replace(/^[/\\]+/, "");
  const file = resolve(root, normalized || "index.html");
  const rel = relative(root, file);
  if (!rel || rel === ".") return resolve(root, "index.html");
  if (rel.startsWith("..") || isAbsolute(rel)) return null;
  return file;
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8", allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let file = safePath(req.url);
  if (!file) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end("Bad request");
    return;
  }

  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    const stat = statSync(file);
    res.writeHead(200, {
      "content-type": types[extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": stat.size,
      "cache-control": useDist ? "public, max-age=300" : "no-store"
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Motera 3D ${useDist ? "preview" : "dev"} server: http://127.0.0.1:${port}`);
});

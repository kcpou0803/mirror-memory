import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distIndexPath = resolve(root, "dist", "index.html");
const outputPath = resolve(root, "mirror-memory.html");

let html = await readFile(distIndexPath, "utf8");
const scriptMatch = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/i);
const styleMatch = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/i);

if (!scriptMatch || !styleMatch) {
  throw new Error("Could not find the built JavaScript and CSS assets in dist/index.html.");
}

const assetPath = (url) => resolve(root, "dist", url.replace(/^\//, ""));
const javascript = (await readFile(assetPath(scriptMatch[1]), "utf8")).replace(/<\/script/gi, "<\\/script");
const css = (await readFile(assetPath(styleMatch[1]), "utf8"))
  .replace(/@import\s+"https:\/\/fonts\.googleapis\.com\/css2\?[^"]+";?/gi, "")
  .replace(/<\/style/gi, "<\\/style");

html = html
  .replace(scriptMatch[0], () => `<script type="module">${javascript}</script>`)
  .replace(styleMatch[0], () => `<style>${css}</style>`)
  .replace("</head>", "    <!-- Standalone offline build: CSS and JavaScript are embedded. -->\n  </head>");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, "utf8");

// Keep a copy alongside the conventional production build as well.
await copyFile(outputPath, resolve(root, "dist", "mirror-memory.html"));
console.log(`Created ${outputPath}`);

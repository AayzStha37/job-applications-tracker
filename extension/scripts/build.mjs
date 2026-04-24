#!/usr/bin/env node
import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await esbuild.build({
  entryPoints: [resolve(root, "src/popup/popup.ts")],
  outfile: resolve(dist, "popup.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  sourcemap: true,
});

await cp(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
await cp(resolve(root, "src/popup/popup.html"), resolve(dist, "popup.html"));
await cp(resolve(root, "src/popup/popup.css"), resolve(dist, "popup.css"));

if (existsSync(resolve(root, "icons"))) {
  await cp(resolve(root, "icons"), resolve(dist, "icons"), { recursive: true });
}

console.log("Extension built to:", dist);

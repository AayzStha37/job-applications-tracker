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

// Content script — injected into the page, builds the floating button + modal
await esbuild.build({
  entryPoints: [resolve(root, "src/content/ui.ts")],
  outfile: resolve(dist, "content-ui.js"),
  bundle: true,
  format: "iife",
  target: "es2022",
  platform: "browser",
  sourcemap: true,
});

// Background service worker
await esbuild.build({
  entryPoints: [resolve(root, "src/background/service-worker.ts")],
  outfile: resolve(dist, "service-worker.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  sourcemap: true,
});

// Options page
await esbuild.build({
  entryPoints: [resolve(root, "src/options/options.ts")],
  outfile: resolve(dist, "options.js"),
  bundle: true,
  format: "iife",
  target: "es2022",
  platform: "browser",
  sourcemap: true,
});

await cp(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
await cp(resolve(root, "src/options/options.html"), resolve(dist, "options.html"));

if (existsSync(resolve(root, "icons"))) {
  await cp(resolve(root, "icons"), resolve(dist, "icons"), { recursive: true });
}

console.log("Extension built to:", dist);

import type { JobData } from "../shared/types";
import { cleanUrl } from "../shared/url";
import { extract } from "../extractor/index";

const NS = "jt-tracker";

// ── Guard against double-injection ──────────────────────────────────────
if (!(globalThis as any).__jobTrackerInjected) {
  (globalThis as any).__jobTrackerInjected = true;
  // Skip if extension context is invalidated (stale content script after reload)
  let contextValid = true;
  try { chrome.runtime.getURL(""); } catch { contextValid = false; }
  if (contextValid) init();
}

// ── Helpers ─────────────────────────────────────────────────────────────

function isSparse(data: JobData): boolean {
  return !data.position && !data.company;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function extractWithRetry(): Promise<JobData> {
  const first = extract();
  if (!isSparse(first)) return first;
  for (let i = 0; i < 3; i++) {
    await delay(500);
    const retry = extract();
    if (!isSparse(retry)) return retry;
  }
  return first;
}

/** Collect page text + metadata for LLM extraction. */
function collectPageText(): string {
  const parts: string[] = [];

  // Meta tags (og:title, description, etc.)
  document.querySelectorAll("meta[property], meta[name]").forEach((el) => {
    const key = el.getAttribute("property") || el.getAttribute("name");
    const val = el.getAttribute("content");
    if (key && val) parts.push(`${key}: ${val}`);
  });

  // JSON-LD structured data
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    if (el.textContent) parts.push(el.textContent);
  });

  // Visible page text (truncated to keep token usage low)
  parts.push(document.body.innerText.substring(0, 4000));

  return parts.join("\n");
}

/** Ask the service worker to run LLM extraction. Returns null if unavailable. */
function extractViaLLM(): Promise<JobData | null> {
  const pageText = collectPageText();
  const pageUrl = location.href;

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "EXTRACT_VIA_LLM", pageText, pageUrl },
      (response) => {
        if (response?.data) {
          resolve({
            company: response.data.company || "",
            position: response.data.position || "",
            location: response.data.location || "",
            externalJobId: response.data.externalJobId || "",
            url: cleanUrl(),
            source: location.hostname.replace(/^www\./, ""),
          });
        } else {
          resolve(null);
        }
      },
    );
  });
}

/** Route API call through the background service worker to avoid CORS. */
function saveJob(payload: Record<string, string>): Promise<{ status: number; statusText: string; body: any; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SAVE_JOB", payload }, resolve);
  });
}

// ── Shadow DOM setup ────────────────────────────────────────────────────

function createHost(): ShadowRoot {
  const host = document.createElement("div");
  host.id = `${NS}-host`;
  document.body.appendChild(host);
  return host.attachShadow({ mode: "open" });
}

// ── Styles ──────────────────────────────────────────────────────────────

function getStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── FAB ─────────────────────────────────────── */
    .fab {
      position: fixed;
      top: 50%;
      right: 24px;
      z-index: 2147483647;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #eab308;
      cursor: grab;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
      user-select: none;
      transition: box-shadow 0.2s, top 0.35s cubic-bezier(.4,0,.2,1), left 0.35s cubic-bezier(.4,0,.2,1), right 0.35s cubic-bezier(.4,0,.2,1), background 0.25s;
    }
    .fab:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
    .fab:active { cursor: grabbing; }

    .fab-logo, .fab-close {
      position: absolute;
      transition: opacity 0.25s, transform 0.3s cubic-bezier(.4,0,.2,1);
    }
    .fab-logo {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      pointer-events: none;
    }
    .fab-close {
      width: 22px; height: 22px;
      fill: #fff;
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
      pointer-events: none;
    }

    .fab.open {
      cursor: pointer;
      background: #dc2626;
      box-shadow: 0 3px 12px rgba(220,38,38,0.4);
    }
    .fab.open .fab-logo {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }
    .fab.open .fab-close {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    /* ── Backdrop ────────────────────────────────── */
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0,0,0,0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .backdrop.visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Panel (grows from FAB) ──────────────────── */
    .panel {
      position: fixed;
      z-index: 2147483646;
      width: 370px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      padding: 36px 20px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #172b4d;
      transform: scale(0);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s;
      max-height: 85vh;
      overflow-y: auto;
    }
    .panel.open {
      transform: scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #172b4d;
      text-align: center;
    }

    form { display: flex; flex-direction: column; gap: 8px; }
    label { display: flex; flex-direction: column; gap: 2px; }

    label > span {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #6b778c;
      font-weight: 500;
    }

    input {
      font: inherit;
      padding: 6px 8px;
      border: 1px solid #dfe1e6;
      border-radius: 3px;
      color: #172b4d;
      font-size: 13px;
      width: 100%;
      background: #fff;
    }
    input:focus { outline: 2px solid #0052cc; outline-offset: -1px; border-color: transparent; }
    input[readonly] { background: #f4f5f7; color: #6b778c; }

    .url {
      font-size: 11px;
      color: #6b778c;
      word-break: break-all;
      padding: 4px 0;
    }

    .save-btn {
      margin-top: 4px;
      background: #0052cc;
      color: #fff;
      border: 0;
      padding: 8px;
      border-radius: 3px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-size: 13px;
    }
    .save-btn:hover { background: #003d99; }
    .save-btn:disabled { background: #6b778c; cursor: not-allowed; }

    .toast {
      margin-top: 6px;
      padding: 6px 8px;
      border-radius: 3px;
      font-size: 12px;
    }
    .toast.success { background: #e3fcef; color: #006644; }
    .toast.warn    { background: #fffae6; color: #974f00; }
    .toast.error   { background: #ffebe6; color: #bf2600; }

    .title.loading::after {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #dfe1e6;
      border-top-color: #0052cc;
      border-radius: 50%;
      margin-left: 8px;
      vertical-align: middle;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
}

// ── Build the UI ────────────────────────────────────────────────────────

function buildUI(shadow: ShadowRoot) {
  const style = document.createElement("style");
  style.textContent = getStyles();
  shadow.appendChild(style);

  // FAB button with both logo and close icon inside
  const fab = document.createElement("button");
  fab.className = "fab";
  fab.title = "Track this job";

  const fabLogo = document.createElement("img");
  fabLogo.className = "fab-logo";
  try {
    fabLogo.src = chrome.runtime.getURL("icons/icon48.png");
  } catch {
    // Extension context invalidated (e.g. after reload) — skip icon
    fabLogo.style.display = "none";
  }
  fabLogo.alt = "Track this job";
  fab.appendChild(fabLogo);

  const fabClose = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fabClose.classList.add("fab-close");
  fabClose.setAttribute("viewBox", "0 0 24 24");
  fabClose.innerHTML = `<path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>`;
  fab.appendChild(fabClose);

  shadow.appendChild(fab);

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  shadow.appendChild(backdrop);

  // Panel (replaces old overlay + modal)
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.addEventListener("click", (e) => e.stopPropagation());

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = "Track Job";

  const form = document.createElement("form");
  form.innerHTML = `
    <label><span>Company</span><input name="company" autocomplete="off" required /></label>
    <label><span>Position</span><input name="position" autocomplete="off" required /></label>
    <label><span>Location</span><input name="location" autocomplete="off" /></label>
    <label><span>Job ID</span><input name="externalJobId" autocomplete="off" /></label>
    <label><span>Source</span><input name="source" autocomplete="off" readonly /></label>
    <div class="url" id="url-display"></div>
    <input type="hidden" name="url" />
    <button class="save-btn" type="submit">Save</button>
    <div class="toast" id="toast" hidden></div>
  `;

  panel.appendChild(title);
  panel.appendChild(form);
  shadow.appendChild(panel);

  return { fab, backdrop, panel, form };
}

// ── Main ────────────────────────────────────────────────────────────────

function init() {
  const shadow = createHost();
  const { fab, backdrop, panel, form } = buildUI(shadow);

  let isOpen = false;

  // Saved FAB position to restore after close
  let savedFabTop = "";
  let savedFabLeft = "";
  let savedFabRight = "";

  // ── Drag logic ──────────────────────────────────────────────────────
  let isDragging = false;
  let wasDragged = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let fabStartX = 0;
  let fabStartY = 0;

  fab.addEventListener("mousedown", (e: MouseEvent) => {
    if (isOpen) return; // no dragging when open
    isDragging = true;
    wasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = fab.getBoundingClientRect();
    fabStartX = rect.left;
    fabStartY = rect.top;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 48, fabStartX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 48, fabStartY + dy));
    fab.style.left = `${newX}px`;
    fab.style.top = `${newY}px`;
    fab.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // ── Open / Close ──────────────────────────────────────────────────

  function openPanel() {
    if (isOpen) return;
    isOpen = true;

    // Save current FAB position
    const fabRect = fab.getBoundingClientRect();
    savedFabTop = fab.style.top;
    savedFabLeft = fab.style.left;
    savedFabRight = fab.style.right;

    // Position the panel so FAB will sit at its top-center
    // Panel appears centered on the FAB horizontally, below it vertically
    const panelWidth = 370;
    let panelLeft = fabRect.left + fabRect.width / 2 - panelWidth / 2;
    const panelTop = fabRect.top - 4; // FAB overlaps top edge of panel

    // Clamp panel to viewport
    panelLeft = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, panelLeft));

    panel.style.left = `${panelLeft}px`;
    panel.style.top = `${panelTop}px`;
    panel.style.transformOrigin = `${fabRect.left + fabRect.width / 2 - panelLeft}px 0px`;

    // Move FAB to center-top of panel
    const fabTargetLeft = panelLeft + panelWidth / 2 - 24; // 24 = half of 48
    const fabTargetTop = panelTop - 20; // sit above panel top edge

    fab.style.left = `${fabTargetLeft}px`;
    fab.style.top = `${fabTargetTop}px`;
    fab.style.right = "auto";
    fab.classList.add("open");

    // Show panel + backdrop
    requestAnimationFrame(() => {
      panel.classList.add("open");
      backdrop.classList.add("visible");
    });
  }

  function closePanel() {
    if (!isOpen) return;
    isOpen = false;

    // Restore FAB position
    fab.style.top = savedFabTop;
    fab.style.left = savedFabLeft;
    fab.style.right = savedFabRight;
    fab.classList.remove("open");

    panel.classList.remove("open");
    backdrop.classList.remove("visible");

    // Reset toast
    const toast = shadow.getElementById("toast");
    if (toast) toast.hidden = true;
  }

  // ── Event listeners ────────────────────────────────────────────────

  const titleEl = panel.querySelector(".title") as HTMLDivElement;

  fab.addEventListener("click", async (e: MouseEvent) => {
    if (wasDragged) { e.preventDefault(); return; }

    if (isOpen) {
      closePanel();
    } else {
      openPanel();

      // Show loading state
      titleEl.textContent = "Extracting\u2026";
      titleEl.classList.add("loading");

      // Try LLM first, fall back to DOM scraping
      let data = await extractViaLLM();
      if (!data || isSparse(data)) {
        data = await extractWithRetry();
      }

      titleEl.textContent = "Track Job";
      titleEl.classList.remove("loading");
      fillForm(form, data);
    }
  });

  backdrop.addEventListener("click", closePanel);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".save-btn") as HTMLButtonElement;
    const payload = readForm(form);
    btn.disabled = true;
    try {
      const res = await saveJob(payload);
      if (res.error) {
        showToast(shadow, "error", `Network error: ${res.error}`);
      } else if (res.status === 201) {
        showToast(shadow, "success", "Tracked!");
      } else if (res.status === 200) {
        showToast(shadow, "warn", `Already tracked \u2014 status: ${res.body?.status}`);
      } else {
        showToast(shadow, "error", `${res.status} ${res.statusText}`);
      }
    } catch (err) {
      showToast(shadow, "error", `Error: ${(err as Error).message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

function fillForm(form: HTMLFormElement, data: JobData) {
  (form.elements.namedItem("company") as HTMLInputElement).value = data.company;
  (form.elements.namedItem("position") as HTMLInputElement).value = data.position;
  (form.elements.namedItem("location") as HTMLInputElement).value = data.location;
  (form.elements.namedItem("externalJobId") as HTMLInputElement).value = data.externalJobId;
  (form.elements.namedItem("source") as HTMLInputElement).value = data.source;
  (form.elements.namedItem("url") as HTMLInputElement).value = data.url;
  const urlDisplay = form.querySelector("#url-display");
  if (urlDisplay) urlDisplay.textContent = data.url;
}

function readForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  return {
    company: String(fd.get("company") ?? "").trim(),
    position: String(fd.get("position") ?? "").trim(),
    location: String(fd.get("location") ?? "").trim(),
    externalJobId: String(fd.get("externalJobId") ?? "").trim(),
    source: String(fd.get("source") ?? "").trim(),
    url: String(fd.get("url") ?? "").trim(),
  };
}

function showToast(shadow: ShadowRoot, kind: "success" | "warn" | "error", msg: string) {
  const el = shadow.getElementById("toast")!;
  el.className = `toast ${kind}`;
  el.textContent = msg;
  el.hidden = false;
}

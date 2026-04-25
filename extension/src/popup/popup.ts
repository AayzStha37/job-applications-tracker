import type { JobData } from "../shared/types";

const API = "http://127.0.0.1:8081/applications";

function getTargetTabId(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("tabId");
  return raw ? parseInt(raw, 10) : null;
}

async function runExtractor(): Promise<JobData | null> {
  const tabId = getTargetTabId();
  if (!tabId) return null;
  try {
    // Inject the bundled content script that runs all extractors
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    // Wait for the extraction (may retry on SPA pages)
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => (globalThis as any).__jobTrackerExtractedPromise,
    });
    return (results[0]?.result as JobData) ?? null;
  } catch (err) {
    console.error("extractor failed", err);
    return null;
  }
}

function fill(form: HTMLFormElement, data: JobData) {
  (form.elements.namedItem("company") as HTMLInputElement).value = data.company;
  (form.elements.namedItem("position") as HTMLInputElement).value = data.position;
  (form.elements.namedItem("location") as HTMLInputElement).value = data.location;
  (form.elements.namedItem("externalJobId") as HTMLInputElement).value =
    data.externalJobId;
  (form.elements.namedItem("source") as HTMLInputElement).value = data.source;
  (form.elements.namedItem("url") as HTMLInputElement).value = data.url;
  document.getElementById("url-display")!.textContent = data.url;
}

function showToast(kind: "success" | "warn" | "error", msg: string) {
  const el = document.getElementById("toast")!;
  el.className = `toast ${kind}`;
  el.textContent = msg;
  el.hidden = false;
}

function readForm(form: HTMLFormElement): Omit<JobData, never> & { notes?: string } {
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

async function onSubmit(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const btn = document.getElementById("save-btn") as HTMLButtonElement;
  const payload = readForm(form);
  btn.disabled = true;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) {
      showToast("success", "Tracked.");
    } else if (res.status === 200) {
      const body = (await res.json()) as { status: string };
      showToast("warn", `Already tracked — status: ${body.status}`);
    } else {
      showToast("error", `${res.status} ${res.statusText}`);
    }
  } catch (err) {
    showToast("error", `Network error: ${(err as Error).message}`);
  } finally {
    btn.disabled = false;
  }
}

async function init() {
  document.getElementById("close-btn")!.addEventListener("click", () => {
    window.close();
  });

  const form = document.getElementById("track-form") as HTMLFormElement;
  form.addEventListener("submit", onSubmit);
  const data = await runExtractor();
  if (!data) {
    showToast("error", "Could not read page. Fill fields manually.");
    return;
  }
  fill(form, data);
}

void init();

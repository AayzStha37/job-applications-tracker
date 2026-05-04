import type { CreatePayload, JobData, LocCode, MailAlias } from "../shared/types";
import { resolveLocCode } from "../shared/loc-mapping";

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
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
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

function el<T extends HTMLElement>(form: HTMLFormElement, name: string): T {
  return form.elements.namedItem(name) as T;
}

function fill(form: HTMLFormElement, data: JobData) {
  el<HTMLInputElement>(form, "company").value = data.company;
  el<HTMLInputElement>(form, "position").value = data.position;
  el<HTMLInputElement>(form, "location").value = data.location;
  el<HTMLInputElement>(form, "externalJobId").value = data.externalJobId;
  el<HTMLInputElement>(form, "source").value = data.source;
  el<HTMLInputElement>(form, "url").value = data.url;
  el<HTMLTextAreaElement>(form, "jobDescription").value = data.jobDescription;
  document.getElementById("url-display")!.textContent = data.url;

  const mapped = resolveLocCode(data.location);
  const locSelect = el<HTMLSelectElement>(form, "locCode");
  const locHint = document.getElementById("loc-hint")!;
  if (mapped) {
    locSelect.value = mapped;
    locHint.textContent = `auto: ${data.location}`;
    locHint.classList.remove("warn");
  } else {
    locSelect.value = "";
    locHint.textContent = data.location ? "couldn't map — pick one" : "no location detected";
    locHint.classList.add("warn");
  }

  el<HTMLSelectElement>(form, "mailAlias").value = "email1";
  updateJdHint(form);
}

function updateJdHint(form: HTMLFormElement) {
  const ta = el<HTMLTextAreaElement>(form, "jobDescription");
  const hint = document.getElementById("jd-len")!;
  const n = ta.value.length;
  hint.textContent = n ? `${n.toLocaleString()} chars` : "empty — paste or scrape failed";
  hint.classList.toggle("warn", n < 200);
}

function showToast(kind: "success" | "warn" | "error", msg: string) {
  const t = document.getElementById("toast")!;
  t.className = `toast ${kind}`;
  t.textContent = msg;
  t.hidden = false;
}

function readForm(form: HTMLFormElement): CreatePayload {
  const fd = new FormData(form);
  const locCode = String(fd.get("locCode") ?? "") as LocCode | "";
  const mailAlias = (String(fd.get("mailAlias") ?? "email1") || "email1") as MailAlias;
  return {
    company: String(fd.get("company") ?? "").trim(),
    position: String(fd.get("position") ?? "").trim(),
    location: String(fd.get("location") ?? "").trim(),
    externalJobId: String(fd.get("externalJobId") ?? "").trim(),
    source: String(fd.get("source") ?? "").trim(),
    url: String(fd.get("url") ?? "").trim(),
    jobDescription: String(fd.get("jobDescription") ?? "").trim(),
    locCode,
    mailAlias,
  };
}

async function onSubmit(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const btn = document.getElementById("save-btn") as HTMLButtonElement;
  const payload = readForm(form);

  if (!payload.locCode) {
    showToast("warn", "Pick a LOC before saving (or location won't map for /tailor).");
    return;
  }

  btn.disabled = true;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) {
      showToast("success", payload.jobDescription ? "Tracked + queued for tailor." : "Tracked (no JD — won't tailor).");
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
  document.getElementById("close-btn")!.addEventListener("click", () => window.close());

  const form = document.getElementById("track-form") as HTMLFormElement;
  form.addEventListener("submit", onSubmit);
  el<HTMLTextAreaElement>(form, "jobDescription").addEventListener("input", () => updateJdHint(form));

  const data = await runExtractor();
  if (!data) {
    showToast("error", "Could not read page. Fill fields manually.");
    return;
  }
  fill(form, data);
}

void init();

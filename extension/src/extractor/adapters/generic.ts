import type { JobData } from "../../shared/types";

function meta(property: string): string {
  const el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"], meta[name="${property}"]`,
  );
  return el?.content?.trim() ?? "";
}

function firstH1(): string {
  return document.querySelector("h1")?.textContent?.trim() ?? "";
}

function guessIdFromUrl(): string {
  const segments = location.pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i];
    if (/^\d{4,}$/.test(s)) return s;
    if (/^[A-Z0-9_-]{6,}$/.test(s) && /\d/.test(s)) return s;
  }
  const params = location.search.slice(1).split("&");
  for (const p of params) {
    const [k, v] = p.split("=");
    if (!v) continue;
    if (/^(gh_jid|jobId|job_id|jid|id|req|reqId)$/i.test(k)) return decodeURIComponent(v);
  }
  return "";
}

export function fromGeneric(): Partial<JobData> {
  return {
    position: meta("og:title") || firstH1(),
    company: meta("og:site_name") || location.hostname.replace(/^www\./, ""),
    location: "",
    externalJobId: guessIdFromUrl(),
  };
}

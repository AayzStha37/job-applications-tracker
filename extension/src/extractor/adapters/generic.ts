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

/** Strip generic ATS/platform suffixes from page titles. */
const TITLE_NOISE = /\s*[\|–—-]\s*(Dayforce Jobs|Workday|Greenhouse|Lever|Jobs|Careers|Career Page|Job Board|Job Details)$/i;

function cleanTitle(raw: string): string {
  let t = raw;
  // Repeatedly strip trailing platform names
  for (let i = 0; i < 3; i++) {
    const cleaned = t.replace(TITLE_NOISE, "");
    if (cleaned === t) break;
    t = cleaned;
  }
  return t.trim();
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
    if (/^(gh_jid|jobId|job_id|jid|id|req|reqId|req_id|requisitionId|requisition_id|positionId|position_id|openingId|opening_id|vacancyId|vacancy_id)$/i.test(k))
      return decodeURIComponent(v);
  }
  return "";
}

/** Scan visible page text for a requisition / job ID label. */
function findReqIdInText(): string {
  const body = document.body?.innerText ?? "";
  const match = body.match(
    /(?:req(?:uisition)?|job)[\s\-#:]*(?:id|number|no|#)?[\s\-#:]*([A-Z0-9][\w-]{2,})/i,
  );
  return match ? match[1] : "";
}

export function fromGeneric(): Partial<JobData> {
  const siteName = meta("og:site_name");
  const host = location.hostname.replace(/^www\./, "");
  // og:site_name is usually just the platform name (e.g. "LinkedIn", "Indeed"),
  // not the hiring company — only use it if it differs from the hostname
  const isBrandName = siteName.toLowerCase().replace(/\.\w+$/, "") === host.replace(/\.\w+$/, "");
  return {
    position: cleanTitle(meta("og:title")) || firstH1(),
    company: (!isBrandName && siteName) ? siteName : "",
    location: "",
    externalJobId: guessIdFromUrl() || findReqIdInText(),
  };
}

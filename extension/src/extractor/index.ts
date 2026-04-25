import type { JobData } from "../shared/types";
import { fromDayforce } from "./adapters/dayforce";
import { fromGeneric } from "./adapters/generic";
import { fromGlassdoor } from "./adapters/glassdoor";
import { fromIndeed } from "./adapters/indeed";
import { fromJsonLd } from "./adapters/jsonld";
import { fromLinkedIn } from "./adapters/linkedin";
import { fromWorkday } from "./adapters/workday";

const TRACKING_PARAMS = /^(utm_|trk|ref|ref_|fbclid|gclid|mc_|pk_|_hs|alternateChannel|eBP|trackingId|refId|trk_|li_)/i;

/** For sites with known canonical URL patterns, return a stripped URL. */
function siteCanonical(): string | null {
  const host = location.hostname.replace(/^www\./, "");
  // LinkedIn: /jobs/view/{id}/ is the canonical form
  if (host.endsWith("linkedin.com")) {
    const m = location.pathname.match(/^(\/jobs\/view\/\d+)\/?/);
    if (m) return `${location.origin}${m[1]}/`;
  }
  return null;
}

function cleanUrl(): string {
  const canonical = siteCanonical();
  if (canonical) return canonical;

  const u = new URL(location.href);
  const keep: [string, string][] = [];
  u.searchParams.forEach((v, k) => {
    if (!TRACKING_PARAMS.test(k)) keep.push([k, v]);
  });
  u.search = "";
  for (const [k, v] of keep) u.searchParams.append(k, v);
  u.hash = "";
  return u.toString();
}

function merge(parts: Partial<JobData>[]): Partial<JobData> {
  const out: Partial<JobData> = {};
  for (const p of parts) {
    for (const key of Object.keys(p) as (keyof JobData)[]) {
      if (!out[key] && p[key]) out[key] = p[key] as string;
    }
  }
  return out;
}

export function extract(): JobData {
  const host = location.hostname.replace(/^www\./, "");
  const merged = merge([
    fromJsonLd(),
    fromLinkedIn(),
    fromIndeed(),
    fromWorkday(),
    fromDayforce(),
    fromGlassdoor(),
    fromGeneric(),
  ]);
  return {
    company: merged.company ?? "",
    position: merged.position ?? "",
    location: merged.location ?? "",
    externalJobId: merged.externalJobId ?? "",
    url: cleanUrl(),
    source: host,
  };
}

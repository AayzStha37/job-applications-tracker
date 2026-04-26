import type { JobData } from "../shared/types";
import { cleanUrl } from "../shared/url";
import { fromDayforce } from "./adapters/dayforce";
import { fromGeneric } from "./adapters/generic";
import { fromGlassdoor } from "./adapters/glassdoor";
import { fromIndeed } from "./adapters/indeed";
import { fromJsonLd } from "./adapters/jsonld";
import { fromLinkedIn } from "./adapters/linkedin";
import { fromWorkday } from "./adapters/workday";

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

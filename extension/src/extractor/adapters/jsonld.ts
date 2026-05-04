import type { JobData } from "../../shared/types";
import { htmlToMarkdown } from "../../shared/html-to-markdown";

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const types = asArray(type) as string[];
  if (types.includes("JobPosting")) return obj;
  if (Array.isArray(obj["@graph"])) {
    for (const child of obj["@graph"] as unknown[]) {
      const hit = findJobPosting(child);
      if (hit) return hit;
    }
  }
  return null;
}

function readLocation(job: Record<string, unknown>): string {
  const locs = asArray(job.jobLocation as unknown);
  for (const l of locs) {
    if (!l || typeof l !== "object") continue;
    const addr = (l as Record<string, unknown>).address;
    if (addr && typeof addr === "object") {
      const a = addr as Record<string, unknown>;
      const parts = [a.addressLocality, a.addressRegion, a.addressCountry]
        .filter((p): p is string => typeof p === "string" && p.length > 0);
      if (parts.length) return parts.join(", ");
    }
  }
  return "";
}

function readIdentifier(job: Record<string, unknown>): string {
  const id = job.identifier;
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object") {
    const v = (id as Record<string, unknown>).value;
    if (typeof v === "string") return v;
  }
  return "";
}

export function fromJsonLd(): Partial<JobData> {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s.textContent ?? "");
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const job = findJobPosting(node);
        if (!job) continue;
        const org = job.hiringOrganization as Record<string, unknown> | undefined;
        const desc = typeof job.description === "string" ? job.description : "";
        return {
          company: typeof org?.name === "string" ? org.name : "",
          position: typeof job.title === "string" ? job.title : "",
          location: readLocation(job),
          externalJobId: readIdentifier(job),
          jobDescription: desc ? htmlToMarkdown(desc) : "",
        };
      }
    } catch {
      // skip malformed ld+json block
    }
  }
  return {};
}

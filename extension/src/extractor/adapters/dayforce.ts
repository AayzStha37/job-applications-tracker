import type { JobData } from "../../shared/types";
import { elementToMarkdown } from "../../shared/html-to-markdown";

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

/** Looks for a requisition/req ID in visible text on the page. */
function findReqId(): string {
  const body = document.body?.innerText ?? "";
  const match = body.match(
    /(?:req(?:uisition)?[\s\-#:]*(?:id)?[\s\-#:]*|job[\s\-#:]*(?:id|number|no|#)[\s\-#:]*)([A-Z0-9][\w-]{2,})/i,
  );
  return match ? match[1] : "";
}

export function fromDayforce(): Partial<JobData> {
  if (!location.hostname.endsWith("dayforcehcm.com")) return {};

  // URL: jobs.dayforcehcm.com/en-US/{company-slug}/alljobs/jobs/{id}
  const pathParts = location.pathname.split("/").filter(Boolean);
  // Find the segment after the locale (e.g. "en-US") but before "alljobs" or "jobs"
  const slugIndex = pathParts.findIndex(
    (s) => s === "alljobs" || s === "jobs",
  );
  const companySlug =
    slugIndex > 0 ? pathParts[slugIndex - 1] : "";

  // Job ID from URL path: last numeric segment
  const jobIdMatch = location.pathname.match(/\/jobs\/(\d+)/);
  const externalJobId = jobIdMatch ? jobIdMatch[1] : "";

  // Try to read the rendered DOM — Dayforce is a SPA so these may or may not be present
  const position =
    text("h1.job-title") ||
    text("h1[class*='title']") ||
    text("[class*='jobTitle']") ||
    text("[data-testid='job-title']") ||
    text("h1");

  const company =
    text("[class*='companyName']") ||
    text("[class*='company-name']") ||
    text("[data-testid='company-name']") ||
    "";

  const loc =
    text("[class*='jobLocation']") ||
    text("[class*='job-location']") ||
    text("[data-testid='job-location']") ||
    "";

  // Format company slug into readable name (e.g. "mydayforce" -> "Mydayforce")
  const companyFromSlug = companySlug
    ? companySlug
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const descEl =
    document.querySelector("[class*='job-description']") ||
    document.querySelector("[class*='jobDescription']") ||
    document.querySelector("[data-testid='job-description']") ||
    document.querySelector("article") ||
    document.querySelector("main");

  return {
    position,
    company: company || companyFromSlug,
    location: loc,
    externalJobId: externalJobId || findReqId(),
    jobDescription: elementToMarkdown(descEl),
  };
}

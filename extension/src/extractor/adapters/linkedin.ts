import type { JobData } from "../../shared/types";

function idFromUrl(): string {
  const viewMatch = location.pathname.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];
  const paramId = new URLSearchParams(location.search).get("currentJobId");
  return paramId ?? "";
}

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

export function fromLinkedIn(): Partial<JobData> {
  if (!location.hostname.endsWith("linkedin.com")) return {};
  return {
    position:
      text(".job-details-jobs-unified-top-card__job-title") ||
      text(".jobs-unified-top-card__job-title") ||
      text("h1"),
    company:
      text(".job-details-jobs-unified-top-card__company-name") ||
      text(".jobs-unified-top-card__company-name"),
    location:
      text(".job-details-jobs-unified-top-card__primary-description-container span") ||
      text(".jobs-unified-top-card__bullet"),
    externalJobId: idFromUrl(),
  };
}

import type { JobData } from "../../shared/types";
import { elementToMarkdown } from "../../shared/html-to-markdown";

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

export function fromIndeed(): Partial<JobData> {
  if (!location.hostname.includes("indeed.")) return {};
  const jk = new URLSearchParams(location.search).get("jk") ?? "";
  const descEl =
    document.querySelector("#jobDescriptionText") ||
    document.querySelector('[data-testid="jobDescriptionText"]');
  return {
    position:
      text("h1.jobsearch-JobInfoHeader-title") ||
      text('[data-testid="jobsearch-JobInfoHeader-title"]') ||
      text("h1"),
    company:
      text('[data-testid="inlineHeader-companyName"]') ||
      text(".jobsearch-CompanyInfoContainer a"),
    location:
      text('[data-testid="inlineHeader-companyLocation"]') ||
      text(".jobsearch-JobInfoHeader-subtitle > div:last-child"),
    externalJobId: jk,
    jobDescription: elementToMarkdown(descEl),
  };
}

import type { JobData } from "../../shared/types";
import { elementToMarkdown } from "../../shared/html-to-markdown";

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

export function fromGlassdoor(): Partial<JobData> {
  if (!location.hostname.includes("glassdoor.")) return {};
  const jlMatch = location.href.match(/jobListingId=(\d+)/);
  const descEl =
    document.querySelector('[data-test="jobDescriptionContent"]') ||
    document.querySelector(".jobDescriptionContent") ||
    document.querySelector(".JobDetails_jobDescription__uW_fK");
  return {
    position:
      text('[data-test="job-title"]') ||
      text(".JobDetails_jobTitle__Rw_gn") ||
      text("h1"),
    company:
      text('[data-test="employer-name"]') ||
      text(".EmployerProfile_employerName__Xemli"),
    location: text('[data-test="location"]'),
    externalJobId: jlMatch ? jlMatch[1] : "",
    jobDescription: elementToMarkdown(descEl),
  };
}

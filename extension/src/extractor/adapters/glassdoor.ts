import type { JobData } from "../../shared/types";

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

export function fromGlassdoor(): Partial<JobData> {
  if (!location.hostname.includes("glassdoor.")) return {};
  const jlMatch = location.href.match(/jobListingId=(\d+)/);
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
  };
}

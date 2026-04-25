import type { JobData } from "../../shared/types";

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

export function fromWorkday(): Partial<JobData> {
  if (!/myworkdayjobs\.com$/.test(location.hostname)) return {};
  // URL shape: https://<tenant>.wd5.myworkdayjobs.com/<site>/job/<location>/<slug>_<JOB_ID>
  const idMatch = location.pathname.match(/_([A-Z0-9-]+)$/);
  const tenantMatch = location.hostname.match(/^([^.]+)\./);
  return {
    position: text('[data-automation-id="jobPostingHeader"]') || text("h2"),
    company: tenantMatch ? tenantMatch[1] : "",
    location: text('[data-automation-id="locations"] dd') ||
      text('[data-automation-id="locations"]'),
    externalJobId: idMatch ? idMatch[1] : "",
  };
}
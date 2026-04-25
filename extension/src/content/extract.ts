import type { JobData } from "../shared/types";
import { extract } from "../extractor/index";

function isSparse(data: JobData): boolean {
  return !data.position && !data.company;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function extractWithRetry(): Promise<JobData> {
  const first = extract();
  if (!isSparse(first)) return first;

  // SPA pages (Dayforce, etc.) may not have rendered yet — wait and retry
  for (let i = 0; i < 3; i++) {
    await delay(500);
    const retry = extract();
    if (!isSparse(retry)) return retry;
  }
  return first;
}

// Store a promise so the popup can wait for it
(globalThis as any).__jobTrackerExtractedPromise = extractWithRetry().then((data) => {
  (globalThis as any).__jobTrackerExtracted = data;
  return data;
});

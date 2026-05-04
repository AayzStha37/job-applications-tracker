import type { JobData } from "../../shared/types";
import { elementToMarkdown } from "../../shared/html-to-markdown";

function idFromUrl(): string {
  const viewMatch = location.pathname.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];
  const paramId = new URLSearchParams(location.search).get("currentJobId");
  return paramId ?? "";
}

function text(sel: string): string {
  return document.querySelector(sel)?.textContent?.trim() ?? "";
}

function meta(property: string): string {
  const el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"], meta[name="${property}"]`,
  );
  return el?.content?.trim() ?? "";
}

/**
 * Parse position, company, and location from a title string.
 *
 * LinkedIn uses several formats:
 *   "Position (Location) | Company | LinkedIn"
 *   "Position | Company | LinkedIn"
 *   "Company hiring Position in Location | LinkedIn"
 *   "Position - Company | LinkedIn"
 *   "(3) Position - Company | LinkedIn"
 */
function parseTitle(raw: string): { position: string; company: string; location: string } {
  let title = raw;
  // strip notification count prefix like "(3) "
  title = title.replace(/^\(\d+\)\s*/, "");
  // strip trailing "| LinkedIn"
  title = title.replace(/\s*\|\s*LinkedIn\s*$/i, "");

  // Pattern: "Company hiring Position in Location"
  const hiringMatch = title.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+)$/i);
  if (hiringMatch) {
    return { company: hiringMatch[1], position: hiringMatch[2], location: hiringMatch[3] };
  }

  // Pattern with pipe: "Position (Location) | Company" or "Position | Company"
  const pipeParts = title.split(/\s*\|\s*/);
  if (pipeParts.length >= 2) {
    const positionPart = pipeParts[0];
    const company = pipeParts[pipeParts.length - 1];
    // Extract location from parentheses if present: "Backend Developer (Remote)"
    const locMatch = positionPart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (locMatch) {
      return { position: locMatch[1], company, location: locMatch[2] };
    }
    return { position: positionPart, company, location: "" };
  }

  // Pattern with dash: "Position - Company - Location" or "Position - Company"
  const dashParts = title.split(/\s+-\s+/);
  if (dashParts.length >= 2) {
    return {
      position: dashParts[0],
      company: dashParts[1],
      location: dashParts.slice(2).join(", "),
    };
  }

  return { position: title, company: "", location: "" };
}

function descriptionMd(): string {
  const el =
    document.querySelector(".jobs-description__content .jobs-box__html-content") ||
    document.querySelector(".jobs-description__content") ||
    document.querySelector(".show-more-less-html__markup") ||
    document.querySelector(".description__text");
  return elementToMarkdown(el);
}

export function fromLinkedIn(): Partial<JobData> {
  if (!location.hostname.endsWith("linkedin.com")) return {};

  const externalJobId = idFromUrl();
  const jobDescription = descriptionMd();

  // Try DOM selectors (multiple generations of LinkedIn class names)
  const domPosition =
    text(".job-details-jobs-unified-top-card__job-title") ||
    text(".jobs-unified-top-card__job-title") ||
    text(".t-24.job-details-jobs-unified-top-card__job-title") ||
    text("h1.topcard__title") ||
    text("h1");

  const domCompany =
    text(".job-details-jobs-unified-top-card__company-name") ||
    text(".jobs-unified-top-card__company-name") ||
    text(".topcard__org-name-link") ||
    text(".job-details-jobs-unified-top-card__primary-description-container a");

  const domLocation =
    text(".job-details-jobs-unified-top-card__primary-description-container .tvm__text") ||
    text(".jobs-unified-top-card__bullet") ||
    text(".topcard__flavor--bullet");

  // If DOM selectors found real data, use them
  if (domPosition && domCompany && domCompany.toLowerCase() !== "linkedin") {
    return { position: domPosition, company: domCompany, location: domLocation, externalJobId, jobDescription };
  }

  // Fallback: parse og:title or document.title (reliable across LinkedIn redesigns)
  // og:title is typically "Position (Location) | Company" on LinkedIn
  const ogTitle = meta("og:title");
  const fromOg = ogTitle ? parseTitle(ogTitle) : { position: "", company: "", location: "" };
  const fromDoc = parseTitle(document.title);

  return {
    position: domPosition || fromOg.position || fromDoc.position,
    company:
      (domCompany && domCompany.toLowerCase() !== "linkedin" ? domCompany : "") ||
      fromOg.company ||
      fromDoc.company,
    location: domLocation || fromOg.location || fromDoc.location,
    externalJobId,
    jobDescription,
  };
}

const TRACKING_PARAMS = /^(utm_|trk|ref|ref_|fbclid|gclid|mc_|pk_|_hs|alternateChannel|eBP|trackingId|refId|trk_|li_)/i;

/** For sites with known canonical URL patterns, return a stripped URL. */
export function siteCanonical(): string | null {
  const host = location.hostname.replace(/^www\./, "");
  // LinkedIn: /jobs/view/{id}/ is the canonical form
  if (host.endsWith("linkedin.com")) {
    const m = location.pathname.match(/^(\/jobs\/view\/\d+)\/?/);
    if (m) return `${location.origin}${m[1]}/`;
  }
  return null;
}

export function cleanUrl(): string {
  const canonical = siteCanonical();
  if (canonical) return canonical;

  const u = new URL(location.href);
  const keep: [string, string][] = [];
  u.searchParams.forEach((v, k) => {
    if (!TRACKING_PARAMS.test(k)) keep.push([k, v]);
  });
  u.search = "";
  for (const [k, v] of keep) u.searchParams.append(k, v);
  u.hash = "";
  return u.toString();
}

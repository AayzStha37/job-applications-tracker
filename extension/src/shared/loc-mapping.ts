import type { LocCode } from "./types";

const RULES: Array<{ code: LocCode; needles: string[] }> = [
  { code: "HFX", needles: ["halifax", "dartmouth", "bedford", " hfx", "ns,", "nova scotia"] },
  { code: "TO",  needles: ["toronto", "north york", "scarborough", "etobicoke", "mississauga", "brampton", "markham", "vaughan", "gta", " on,", "ontario"] },
  { code: "OW",  needles: ["ottawa", "kanata", "gatineau"] },
  { code: "MO",  needles: ["montreal", "montréal", "laval", " qc,", "quebec", "québec"] },
  { code: "VC",  needles: ["vancouver", "burnaby", "richmond, bc", "surrey", " bc,", "british columbia"] },
];

export function resolveLocCode(rawLocation: string): LocCode | "" {
  if (!rawLocation) return "";
  const hay = ` ${rawLocation.toLowerCase()} `;
  for (const r of RULES) {
    if (r.needles.some((n) => hay.includes(n))) return r.code;
  }
  return "";
}

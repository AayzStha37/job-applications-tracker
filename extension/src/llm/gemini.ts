interface ExtractedFields {
  company: string;
  position: string;
  location: string;
  externalJobId: string;
  jobDescription: string;
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 30_000;

const PROMPT = `You are a job posting data extractor. Given the text content of a job posting page, extract the following fields and return ONLY valid JSON:

{
  "company": "The hiring company name",
  "position": "The job title / position name",
  "location": "The job location (city, state/province, country, or 'Remote')",
  "externalJobId": "The job/requisition ID if visible",
  "jobDescription": "The full job description body, converted to GitHub-flavored Markdown"
}

Rules:
- Use empty string "" for any field you cannot find.
- Do NOT guess or fabricate data — only extract what is explicitly present on the page.
- For company, use the actual employer name, not the job board name (e.g. not "LinkedIn", "Indeed", "Workday").
- For externalJobId, look for labels like "Job ID", "Req ID", "Requisition", "Reference", "#" followed by an alphanumeric code.
- For jobDescription:
  - Include sections like Responsibilities, Requirements, Qualifications, Benefits, About Us — anything substantive about the role.
  - EXCLUDE site chrome, navigation, cookie banners, "apply now" buttons, related job listings, footer/legal text.
  - Preserve structure: use ## headings for major sections, - for bullet points, **bold** for emphasis already present.
  - Do NOT summarize or paraphrase — preserve the original wording.
  - Return at most ~6000 words of description. If the page has more, prefer the role-specific content.
- Return ONLY the JSON object, no other text. Properly escape newlines (\\n) and quotes inside JSON strings.

Page URL: `;

export async function extractViaGemini(
  pageText: string,
  pageUrl: string,
): Promise<ExtractedFields | null> {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT + pageUrl + "\n\nPage content:\n" + pageText }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      company: String(parsed.company ?? ""),
      position: String(parsed.position ?? ""),
      location: String(parsed.location ?? ""),
      externalJobId: String(parsed.externalJobId ?? ""),
      jobDescription: String(parsed.jobDescription ?? ""),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Validate that an API key works by sending a trivial request. */
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with OK" }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("geminiApiKey", (result) => {
      resolve(result.geminiApiKey || null);
    });
  });
}

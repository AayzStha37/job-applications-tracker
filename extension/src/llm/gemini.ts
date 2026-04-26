interface ExtractedFields {
  company: string;
  position: string;
  location: string;
  externalJobId: string;
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 15_000;

const PROMPT = `You are a job posting data extractor. Given the text content of a job posting page, extract the following fields and return ONLY valid JSON:

{
  "company": "The hiring company name",
  "position": "The job title / position name",
  "location": "The job location (city, state, remote, etc.)",
  "externalJobId": "The job/requisition ID if visible"
}

Rules:
- Use empty string "" for any field you cannot find.
- Do NOT guess or fabricate data — only extract what is explicitly present.
- For company, use the actual employer name, not the job board name.
- For externalJobId, look for labels like "Job ID", "Req ID", "Requisition", "Reference", "#" followed by an alphanumeric code.
- Return ONLY the JSON object, no other text.

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
          maxOutputTokens: 256,
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

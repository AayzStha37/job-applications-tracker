import { extractViaGemini, testApiKey } from "../llm/gemini";

const DEFAULT_API = "http://127.0.0.1:8081";

async function getApiConfig(): Promise<{ apiBase: string; token: string | null }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiBase", "token"], (result) => {
      resolve({
        apiBase: (result.apiBase as string | undefined) ?? DEFAULT_API,
        token: (result.token as string | undefined) ?? null,
      });
    });
  });
}

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SAVE_JOB") {
    getApiConfig().then(({ apiBase, token }) => {
      fetch(`${apiBase}/applications`, {
        method: "POST",
        headers: buildHeaders(token),
        body: JSON.stringify(msg.payload),
      })
        .then(async (res) => {
          const body = res.status !== 204 ? await res.json().catch(() => null) : null;
          if (res.status === 401 || res.status === 403) {
            sendResponse({ status: res.status, statusText: res.statusText, body, authError: true });
          } else {
            sendResponse({ status: res.status, statusText: res.statusText, body });
          }
        })
        .catch((err) => {
          sendResponse({ error: (err as Error).message });
        });
    });
    return true;
  }

  if (msg.type === "EXTRACT_VIA_LLM") {
    extractViaGemini(msg.pageText, msg.pageUrl)
      .then((data) => sendResponse({ data }))
      .catch((err) => sendResponse({ error: (err as Error).message }));
    return true;
  }

  if (msg.type === "TEST_API_KEY") {
    testApiKey(msg.apiKey)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: (err as Error).message }));
    return true;
  }

  if (msg.type === "TEST_CONNECTION") {
    getApiConfig().then(({ apiBase, token }) => {
      fetch(`${apiBase}/healthz`, { headers: buildHeaders(token) })
        .then(async (res) => {
          sendResponse({ ok: res.ok, status: res.status });
        })
        .catch((err) => sendResponse({ ok: false, error: (err as Error).message }));
    });
    return true;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-ui.js"],
  });
});

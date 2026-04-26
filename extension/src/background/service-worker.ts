import { extractViaGemini, testApiKey } from "../llm/gemini";

const API = "http://127.0.0.1:8081/applications";

// Handle API requests from content scripts (avoids CORS issues)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SAVE_JOB") {
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg.payload),
    })
      .then(async (res) => {
        const body = res.status !== 204 ? await res.json().catch(() => null) : null;
        sendResponse({ status: res.status, statusText: res.statusText, body });
      })
      .catch((err) => {
        sendResponse({ error: (err as Error).message });
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
});

// Inject content script on extension icon click (manual trigger)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-ui.js"],
  });
});

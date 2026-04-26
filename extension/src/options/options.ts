const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const toggleVis = document.getElementById("toggleVis") as HTMLButtonElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const testBtn = document.getElementById("testBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

// Load saved key on open
chrome.storage.local.get("geminiApiKey", (result) => {
  if (result.geminiApiKey) apiKeyInput.value = result.geminiApiKey;
});

// Toggle visibility
toggleVis.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleVis.textContent = isPassword ? "Hide" : "Show";
});

// Save
saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    showStatus("success", key ? "API key saved." : "API key cleared.");
  });
});

// Test via service worker (avoids CORS)
testBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus("error", "Enter an API key first.");
    return;
  }
  testBtn.disabled = true;
  testBtn.textContent = "Testing\u2026";

  chrome.runtime.sendMessage({ type: "TEST_API_KEY", apiKey: key }, (result) => {
    testBtn.disabled = false;
    testBtn.textContent = "Test Key";
    if (result?.ok) {
      showStatus("success", "Key is valid!");
    } else {
      showStatus("error", result?.error ?? "Unknown error");
    }
  });
});

function showStatus(kind: "success" | "error", msg: string) {
  statusEl.className = `status ${kind}`;
  statusEl.textContent = msg;
}

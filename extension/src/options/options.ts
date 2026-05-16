// ── Connection settings (API base + PAT token) ───────────────────────────
const apiBaseInput = document.getElementById("apiBase") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const toggleToken = document.getElementById("toggleToken") as HTMLButtonElement;
const saveConnectionBtn = document.getElementById("saveConnectionBtn") as HTMLButtonElement;
const testConnectionBtn = document.getElementById("testConnectionBtn") as HTMLButtonElement;
const connectionStatus = document.getElementById("connectionStatus") as HTMLDivElement;

chrome.storage.sync.get(["apiBase", "token"], (result) => {
  if (result.apiBase) apiBaseInput.value = result.apiBase as string;
  if (result.token) tokenInput.value = result.token as string;
});

toggleToken.addEventListener("click", () => {
  const isPassword = tokenInput.type === "password";
  tokenInput.type = isPassword ? "text" : "password";
  toggleToken.textContent = isPassword ? "Hide" : "Show";
});

saveConnectionBtn.addEventListener("click", () => {
  const apiBase = apiBaseInput.value.trim();
  const token = tokenInput.value.trim();
  chrome.storage.sync.set({ apiBase: apiBase || null, token: token || null }, () => {
    showStatus(connectionStatus, "success", "Saved.");
  });
});

testConnectionBtn.addEventListener("click", () => {
  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = "Testing…";
  chrome.runtime.sendMessage({ type: "TEST_CONNECTION" }, (result) => {
    testConnectionBtn.disabled = false;
    testConnectionBtn.textContent = "Test Connection";
    if (result?.ok) {
      showStatus(connectionStatus, "success", "Connected! Backend is reachable.");
    } else {
      showStatus(connectionStatus, "error", result?.error ?? `HTTP ${result?.status}`);
    }
  });
});

// ── Gemini API key ───────────────────────────────────────────────────────
const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const toggleVis = document.getElementById("toggleVis") as HTMLButtonElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const testBtn = document.getElementById("testBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

chrome.storage.local.get("geminiApiKey", (result) => {
  if (result.geminiApiKey) apiKeyInput.value = result.geminiApiKey;
});

toggleVis.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleVis.textContent = isPassword ? "Hide" : "Show";
});

saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    showStatus(statusEl, "success", key ? "API key saved." : "API key cleared.");
  });
});

testBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus(statusEl, "error", "Enter an API key first.");
    return;
  }
  testBtn.disabled = true;
  testBtn.textContent = "Testing…";

  chrome.runtime.sendMessage({ type: "TEST_API_KEY", apiKey: key }, (result) => {
    testBtn.disabled = false;
    testBtn.textContent = "Test Key";
    if (result?.ok) {
      showStatus(statusEl, "success", "Key is valid!");
    } else {
      showStatus(statusEl, "error", result?.error ?? "Unknown error");
    }
  });
});

// ── Shared helper ────────────────────────────────────────────────────────
function showStatus(el: HTMLDivElement, kind: "success" | "error", msg: string) {
  el.className = `status ${kind}`;
  el.textContent = msg;
}

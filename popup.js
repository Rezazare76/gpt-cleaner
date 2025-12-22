const runBtn = document.getElementById("runBtn");
const countInput = document.getElementById("count");
const autoCleanInput = document.getElementById("autoClean");

// Load saved settings from storage
chrome.storage.local.get(["keepCount", "autoClean"], (data) => {
  countInput.value = data.keepCount ?? 5;
  autoCleanInput.checked = data.autoClean ?? false;
});

// Save settings when changed
countInput.addEventListener("input", () => {
  const keepCount = parseInt(countInput.value) || 5;
  chrome.storage.local.set({ keepCount });
});

autoCleanInput.addEventListener("change", async () => {
  const isChecked = autoCleanInput.checked;
  chrome.storage.local.set({ autoClean: isChecked });

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (tab.url && tab.url.startsWith("https://chat.openai.com/")) {
    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (e) {
      console.warn("Content script already injected or failed:", e);
    }

    // Send message to content script to update autoClean
    chrome.tabs
      .sendMessage(tab.id, { action: "updateAutoClean", value: isChecked })
      .catch((err) => console.warn("Content script not ready:", err));
  }
});

// Run button click
runBtn.addEventListener("click", async () => {
  const keepCount = parseInt(countInput.value) || 5;
  chrome.storage.local.set({ keepCount });

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.startsWith("https://chatgpt.com/")) {
    alert("Cannot run on this page. Please open ChatGPT page.");
    return;
  }

  // Execute cleaning function directly
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: cleanChatGPT,
    args: [keepCount],
  });
});

// Main cleaning function (runs only once)
function cleanChatGPT(keepCount) {
  // Find the div where all children are <article>
  const parent = Array.from(document.querySelectorAll("div")).find(
    (div) =>
      div.children.length &&
      Array.from(div.children).every(
        (c) => c.tagName.toLowerCase() === "article"
      )
  );

  if (!parent) return;

  // Remove all children except the last N
  const children = Array.from(parent.children);
  const toRemove = children.slice(0, Math.max(0, children.length - keepCount));
  toRemove.forEach((child) => child.remove());
}

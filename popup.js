const runBtn = document.getElementById("runBtn");
const countInput = document.getElementById("count");
const autoCleanInput = document.getElementById("autoClean");
const CHATGPT_URL_PATTERNS = [
  "https://chatgpt.com/",
  "https://chat.openai.com/",
];

// Load saved settings from storage
chrome.storage.local.get(["keepCount", "autoClean"], (data) => {
  countInput.value = data.keepCount ?? 5;
  autoCleanInput.checked = data.autoClean ?? false;
  if (autoCleanInput.checked) {
    runInitialClean(data.keepCount ?? 5);
  }
});

// Save settings when changed
countInput.addEventListener("input", () => {
  const keepCount = parseInt(countInput.value) || 5;
  chrome.storage.local.set({ keepCount });
});

autoCleanInput.addEventListener("change", async () => {
  const isChecked = autoCleanInput.checked;
  chrome.storage.local.set({ autoClean: isChecked });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isChatGptUrl(tab.url || "")) return;

  await notifyAutoCleanChange(tab.id, isChecked);
});

// Run button click
runBtn.addEventListener("click", async () => {
  const keepCount = parseInt(countInput.value) || 5;
  chrome.storage.local.set({ keepCount });

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!isChatGptUrl(tab?.url || "")) {
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
  // Chat turns are wrapped inside this container in current ChatGPT UI.
  const parent = document.querySelector("div.flex.flex-col.text-sm");

  if (!parent) return;

  // Remove only div children except the last N
  const children = Array.from(parent.children).filter(
    (child) => child.tagName.toLowerCase() === "section"
  );
  const toRemove = children.slice(0, Math.max(0, children.length - keepCount));
  toRemove.forEach((child) => child.remove());
}

async function runInitialClean(keepCount) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isChatGptUrl(tab.url || "")) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: cleanChatGPT,
    args: [keepCount],
  });
}

async function notifyAutoCleanChange(tabId, isChecked) {
  const message = {
    action: "updateAutoClean",
    value: isChecked,
  };

  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (!String(error?.message || "").includes("Receiving end does not exist")) {
      throw error;
    }

    // Content script may not be injected yet (e.g. after extension reload).
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    await chrome.tabs.sendMessage(tabId, message);
  }
}

function isChatGptUrl(url) {
  return CHATGPT_URL_PATTERNS.some((prefix) => url.startsWith(prefix));
}

const CHATGPT_URL_PATTERNS = [
  "https://chatgpt.com/",
  "https://chat.openai.com/",
];

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    syncTab(tab.id, tab.url || "");
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const nextUrl = changeInfo.url || tab.url || "";
  if (changeInfo.status === "complete" || changeInfo.url) {
    syncTab(tabId, nextUrl);
  }
});

chrome.runtime.onInstalled.addListener(syncAllTabs);
chrome.runtime.onStartup.addListener(syncAllTabs);

function isChatGptUrl(url) {
  return CHATGPT_URL_PATTERNS.some((prefix) => url.startsWith(prefix));
}

function syncAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (!tab.id) return;
      syncTab(tab.id, tab.url || "");
    });
  });
}

function syncTab(tabId, url) {
  if (!tabId) return;

  if (isChatGptUrl(url)) {
    chrome.action.enable(tabId);
    ensureContentScript(tabId);
    return;
  }

  chrome.action.disable(tabId);
}

function ensureContentScript(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "pingCleaner" }, () => {
    if (!chrome.runtime.lastError) return;

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ["content.js"],
      },
      () => {
        // Ignore temporary injection errors (tab closing, navigation race).
        void chrome.runtime.lastError;
      }
    );
  });
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    updateExtensionState(tab.id, tab.url || "");
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateExtensionState(tabId, tab.url || "");
  }
});

chrome.runtime.onInstalled.addListener(syncAllTabs);
chrome.runtime.onStartup.addListener(syncAllTabs);

function syncAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (!tab.id) return;
      updateExtensionState(tab.id, tab.url || "");
    });
  });
}

function updateExtensionState(tabId, url) {
  if (!tabId) return;

  if (url.startsWith("https://chatgpt.com/")) {
    chrome.action.enable(tabId);
  } else {
    chrome.action.disable(tabId);
  }
}

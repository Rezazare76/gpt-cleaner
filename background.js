chrome.tabs.onActivated.addListener(updateExtensionState);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateExtensionState();
  }
});

function updateExtensionState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    const tabId = tabs[0].id;
    const url = tabs[0].url || "";

    if (url.startsWith("https://chatgpt.com/")) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  });
}

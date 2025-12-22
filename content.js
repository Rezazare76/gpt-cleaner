// Content script for automatic cleaning on ChatGPT
let autoCleanEnabled = false;
let keepCount = 5;
let observer = null;

// Load settings from storage
chrome.storage.local.get(["autoClean", "keepCount"], (data) => {
  autoCleanEnabled = data.autoClean ?? false;
  keepCount = data.keepCount ?? 5;

  if (autoCleanEnabled) {
    // Initial clean on page load
    cleanChatGPT();

    // Start observing for new messages
    startObserving();
  }
});

// Listen for storage changes to update settings
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.autoClean) {
      autoCleanEnabled = changes.autoClean.newValue;
      if (autoCleanEnabled) {
        cleanChatGPT();
        startObserving();
      } else {
        stopObserving();
      }
    }
    if (changes.keepCount) {
      keepCount = changes.keepCount.newValue;
      if (autoCleanEnabled) {
        cleanChatGPT();
      }
    }
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateAutoClean") {
    autoCleanEnabled = message.value;

    if (autoCleanEnabled) {
      cleanChatGPT();
      startObserving();
    } else {
      stopObserving();
    }
  }
});

// Main cleaning function
function cleanChatGPT() {
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

// Start observing DOM changes
function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    let hasNewArticle = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "ARTICLE") {
          hasNewArticle = true;
        }
        // Also check descendants
        if (node.querySelector && node.querySelector("article")) {
          hasNewArticle = true;
        }
      });
    });

    if (hasNewArticle) {
      // Debounce the cleaning to avoid multiple calls
      setTimeout(cleanChatGPT, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Stop observing
function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

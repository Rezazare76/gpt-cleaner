// Content script for automatic cleaning on ChatGPT
let autoCleanEnabled = false;
let keepCount = 5;
let observer = null;
let cleanScheduled = false;

// Load settings from storage
chrome.storage.local.get(["autoClean", "keepCount"], (data) => {
  autoCleanEnabled = data.autoClean ?? false;
  keepCount = data.keepCount ?? 5;

  if (autoCleanEnabled) {
    // Start observing for new messages
    startObserving();
    runInitialCleanSoon();
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
      startObserving();
      runInitialCleanSoon();
    } else {
      stopObserving();
    }
  }
});

// Main cleaning function
function cleanChatGPT() {
  const parent = document.querySelector("div.flex.flex-col.text-sm");

  if (!parent) return;

  // Remove only turn containers (div children) and keep last N.
  const children = Array.from(parent.children).filter(
    (child) => child.tagName.toLowerCase() === "div"
  );
  const toRemove = children.slice(0, Math.max(0, children.length - keepCount));
  toRemove.forEach((child) => child.remove());
}

function scheduleClean() {
  if (cleanScheduled) return;
  cleanScheduled = true;

  requestAnimationFrame(() => {
    cleanScheduled = false;
    cleanChatGPT();
  });
}

function runInitialCleanSoon() {
  let attempts = 0;
  const maxAttempts = 60; // ~1s at 60fps

  const tick = () => {
    if (!autoCleanEnabled) return;
    scheduleClean();
    attempts += 1;

    const hasTurns = document.querySelector("div[data-turn-id-container]");
    if (!hasTurns && attempts < maxAttempts) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

// Start observing DOM changes
function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    let hasNewTurnContainer = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.matches &&
          node.matches("div[data-turn-id-container]")
        ) {
          hasNewTurnContainer = true;
        }
        // Also check descendants
        if (
          node.querySelector &&
          node.querySelector("div[data-turn-id-container]")
        ) {
          hasNewTurnContainer = true;
        }
      });
    });

    if (hasNewTurnContainer) {
      // Run on next frame for faster, smoother updates.
      scheduleClean();
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

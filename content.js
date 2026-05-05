// Content script for automatic cleaning on ChatGPT
let autoCleanEnabled = false;
let keepCount = 5;
let observer = null;
let cleanScheduled = false;
let currentUrl = location.href;
let periodicTimer = null;

// Load settings from storage
chrome.storage.local.get(["autoClean", "keepCount"], (data) => {
  autoCleanEnabled = data.autoClean ?? false;
  keepCount = data.keepCount ?? 5;

  if (autoCleanEnabled) {
    // Start observing for new messages
    startObserving();
    runInitialCleanSoon();
    startPeriodicCheck();
  }
});

// Listen for storage changes to update settings
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.autoClean) {
      autoCleanEnabled = changes.autoClean.newValue;
      if (autoCleanEnabled) {
        scheduleClean();
        startObserving();
        startPeriodicCheck();
        runInitialCleanSoon();
      } else {
        stopObserving();
        stopPeriodicCheck();
      }
    }
    if (changes.keepCount) {
      keepCount = changes.keepCount.newValue;
      if (autoCleanEnabled) {
        scheduleClean();
      }
    }
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pingCleaner") {
    sendResponse({ ok: true });
    return;
  }

  if (message.action === "updateAutoClean") {
    autoCleanEnabled = message.value;

    if (autoCleanEnabled) {
      startObserving();
      startPeriodicCheck();
      runInitialCleanSoon();
    } else {
      stopObserving();
      stopPeriodicCheck();
    }
  }
});

// Main cleaning function
function cleanChatGPT() {
  const parent = document.querySelector("div.flex.flex-col.text-sm");

  if (!parent) return;

  // Remove only turn containers (section children) and keep last N.
  const children = Array.from(parent.children).filter(
    (child) => child.tagName.toLowerCase() === "section"
  );
  const toRemove = children.slice(0, Math.max(0, children.length - keepCount));
  toRemove.forEach((child) => child.remove());
}

function handleRouteChange() {
  if (!autoCleanEnabled) return;
  runInitialCleanSoon();
}

function checkUrlChange() {
  const nextUrl = location.href;
  if (nextUrl === currentUrl) return;
  currentUrl = nextUrl;
  handleRouteChange();
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
  const maxAttempts = 360; // ~6s at 60fps

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

function startPeriodicCheck() {
  if (periodicTimer) return;

  periodicTimer = window.setInterval(() => {
    if (!autoCleanEnabled) return;
    checkUrlChange();
    scheduleClean();
  }, 1500);
}

function stopPeriodicCheck() {
  if (!periodicTimer) return;
  window.clearInterval(periodicTimer);
  periodicTimer = null;
}

// Start observing DOM changes
function startObserving() {
  if (observer) return;
  if (!document.body) {
    requestAnimationFrame(startObserving);
    return;
  }

  observer = new MutationObserver((mutations) => {
    checkUrlChange();
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

window.addEventListener("popstate", handleRouteChange);
window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("focus", () => {
  if (autoCleanEnabled) runInitialCleanSoon();
});
window.addEventListener("pageshow", () => {
  if (autoCleanEnabled) runInitialCleanSoon();
});
document.addEventListener("visibilitychange", () => {
  if (!autoCleanEnabled) return;
  if (document.visibilityState === "visible") {
    runInitialCleanSoon();
  }
});

const originalPushState = history.pushState;
history.pushState = function (...args) {
  originalPushState.apply(this, args);
  handleRouteChange();
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  handleRouteChange();
};

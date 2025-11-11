const UAT_SOURCE_DOMAIN = "uatracker.microsoft.com";
const UAT_DESTINATION_BASE = "https://dev.azure.com/unifiedactiontracker/Unified%20Action%20Tracker/_workitems/edit/";
const FEEDBACK360_SOURCE_DOMAIN = "feedback360.microsoft.com";

// Function to update the badge indicator
async function updateBadge() {
  const { uatEnabled = true, feedback360Enabled = true, showBadge = true } = await chrome.storage.local.get(["uatEnabled", "feedback360Enabled", "showBadge"]);
  
  if (!showBadge) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  
  // Show badge if either redirect is enabled
  if (uatEnabled || feedback360Enabled) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" }); // Green
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
  }
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Initialize badge on install
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = new URL(tab.url);

  // Handle UAT Tracker redirects
  if (url.hostname === UAT_SOURCE_DOMAIN) {
    const params = new URLSearchParams(url.search);
    const id = params.get("id");

    if (!id || isNaN(id)) return;

    const { uatEnabled = true } = await chrome.storage.local.get("uatEnabled");
    if (!uatEnabled) return;

    const redirectUrl = `${UAT_DESTINATION_BASE}${id}`;
    console.log(`Redirecting UAT to: ${redirectUrl}`);

    // Store history with timestamp
    const { uatHistory = [] } = await chrome.storage.local.get("uatHistory");
    const newEntry = { id, timestamp: Date.now() };
    // Filter out any existing entry with the same ID (handle both old and new formats)
    const filteredHistory = uatHistory.filter(i => {
      const entryId = typeof i === 'object' ? i.id : i;
      return entryId !== id;
    });
    const newHistory = [newEntry, ...filteredHistory].slice(0, 5);
    await chrome.storage.local.set({ uatHistory: newHistory });

    chrome.tabs.update(tabId, { url: redirectUrl });
  }

  // Handle Feedback360 redirects
  if (url.hostname === FEEDBACK360_SOURCE_DOMAIN && url.pathname === "/issue") {
    const params = new URLSearchParams(url.search);
    const feedbackId = params.get("id");

    if (!feedbackId) return;

    const { feedback360Enabled = true } = await chrome.storage.local.get("feedback360Enabled");
    if (!feedback360Enabled) return;

    // Wait for the page to load and retry finding the ADO link
    const maxRetries = 10;
    const retryDelay = 500; // milliseconds

    async function findAdoLink(attempt = 1) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const adoLink = document.querySelector('button[aria-label="ADO Id link"] a[name]');
            return adoLink ? adoLink.getAttribute('name') : null;
          }
        });

        const workItemId = results[0]?.result;
        
        if (workItemId) {
          const adoUrl = `https://dev.azure.com/unifiedactiontracker/Technical%20Feedback/_workitems/edit/${workItemId}`;
          console.log(`Redirecting Feedback360 to: ${adoUrl} (found on attempt ${attempt})`);

          // Store history with timestamp
          const { feedback360History = [] } = await chrome.storage.local.get("feedback360History");
          const newEntry = { id: workItemId, feedbackId, timestamp: Date.now() };
          const filteredHistory = feedback360History.filter(i => i.feedbackId !== feedbackId);
          const newHistory = [newEntry, ...filteredHistory].slice(0, 5);
          await chrome.storage.local.set({ feedback360History: newHistory });

          chrome.tabs.update(tabId, { url: adoUrl });
        } else if (attempt < maxRetries) {
          console.log(`ADO link not found yet, retrying (${attempt}/${maxRetries})...`);
          setTimeout(() => findAdoLink(attempt + 1), retryDelay);
        } else {
          console.log("ADO link not found on Feedback360 page after maximum retries");
        }
      } catch (error) {
        console.error("Error extracting ADO link:", error);
      }
    }

    findAdoLink();
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-feature") {
    const { uatEnabled = true, feedback360Enabled = true } = await chrome.storage.local.get(["uatEnabled", "feedback360Enabled"]);
    const newUatState = !uatEnabled;
    const newFeedback360State = !feedback360Enabled;
    await chrome.storage.local.set({ uatEnabled: newUatState, feedback360Enabled: newFeedback360State });
    await updateBadge(); // Update badge when toggled via keyboard shortcut
    console.log(`RetroUAT redirecting is now ${newUatState ? "ON" : "OFF"}`);
    console.log(`Feedback360 redirecting is now ${newFeedback360State ? "ON" : "OFF"}`);
  }
});
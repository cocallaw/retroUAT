const SOURCE_DOMAIN = "uatracker.microsoft.com";
const DESTINATION_BASE = "https://dev.azure.com/unifiedactiontracker/Unified%20Action%20Tracker/_workitems/edit/";

// Function to update the badge indicator
async function updateBadge() {
  const { enabled = true, showBadge = true } = await chrome.storage.local.get(["enabled", "showBadge"]);
  
  if (!showBadge) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  
  if (enabled) {
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

  if (url.hostname === SOURCE_DOMAIN) {
    const params = new URLSearchParams(url.search);
    const id = params.get("id");

    if (!id || isNaN(id)) return;

    const { enabled = true } = await chrome.storage.local.get("enabled");
    if (!enabled) return;

    const redirectUrl = `${DESTINATION_BASE}${id}`;
    console.log(`Redirecting to: ${redirectUrl}`);

    // Store history with timestamp
    const { history = [] } = await chrome.storage.local.get("history");
    const newEntry = { id, timestamp: Date.now() };
    // Filter out any existing entry with the same ID (handle both old and new formats)
    const filteredHistory = history.filter(i => {
      const entryId = typeof i === 'object' ? i.id : i;
      return entryId !== id;
    });
    const newHistory = [newEntry, ...filteredHistory].slice(0, 5);
    await chrome.storage.local.set({ history: newHistory });

    chrome.tabs.update(tabId, { url: redirectUrl });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-feature") {
    const { enabled = true } = await chrome.storage.local.get("enabled");
    await chrome.storage.local.set({ enabled: !enabled });
    await updateBadge(); // Update badge when toggled via keyboard shortcut
    console.log(`RetroUAT redirecting is now ${!enabled ? "ON" : "OFF"}`);
  }
});
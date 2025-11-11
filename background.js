const SOURCE_DOMAIN = "uatracker.microsoft.com";
const DESTINATION_BASE = "https://dev.azure.com/unifiedactiontracker/Unified%20Action%20Tracker/_workitems/edit/";

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

    // Store history
    const { history = [] } = await chrome.storage.local.get("history");
    const newHistory = [id, ...history.filter(i => i !== id)].slice(0, 5);
    await chrome.storage.local.set({ history: newHistory });

    chrome.tabs.update(tabId, { url: redirectUrl });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-feature") {
    const { enabled = true } = await chrome.storage.local.get("enabled");
    await chrome.storage.local.set({ enabled: !enabled });
    console.log(`RetroUAT redirecting is now ${!enabled ? "ON" : "OFF"}`);
  }
});
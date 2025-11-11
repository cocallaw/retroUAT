document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggleRedirects");
  const statusText = document.getElementById("statusText");
  const historyList = document.getElementById("historyList");
  const clearHistory = document.getElementById("clearHistory");
  const toggleBadge = document.getElementById("toggleBadge");

  const { enabled = true, history = [], showBadge = true } = await chrome.storage.local.get(["enabled", "history", "showBadge"]);

  toggle.checked = enabled;
  toggleBadge.checked = showBadge;

  updateHistoryList(history);

  toggle.addEventListener("change", async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
    
    // Update the badge when toggled from popup (only if badge is enabled)
    const { showBadge = true } = await chrome.storage.local.get("showBadge");
    if (showBadge) {
      if (toggle.checked) {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e" }); // Green
      } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
      }
    }
  });

  toggleBadge.addEventListener("change", async () => {
    await chrome.storage.local.set({ showBadge: toggleBadge.checked });
    
    // Update the badge immediately based on the new setting
    if (toggleBadge.checked) {
      // Show badge with current status
      if (toggle.checked) {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e" }); // Green
      } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
      }
    } else {
      // Hide badge
      chrome.action.setBadgeText({ text: "" });
    }
  });

  clearHistory.addEventListener("click", async () => {
    await chrome.storage.local.set({ history: [] });
    updateHistoryList([]);
  });

  function updateHistoryList(history) {
    historyList.innerHTML = "";
    if (history.length === 0) {
      historyList.innerHTML = "<li>No recent redirects</li>";
      return;
    }

    history.forEach(entry => {
      // Handle both old format (just ID) and new format (object with id and timestamp)
      const id = typeof entry === 'object' ? entry.id : entry;
      const timestamp = typeof entry === 'object' && entry.timestamp ? entry.timestamp : null;
      
      const li = document.createElement("li");
      const link = `<a href="https://dev.azure.com/unifiedactiontracker/Unified%20Action%20Tracker/_workitems/edit/${id}" target="_blank">${id}</a>`;
      
      if (timestamp) {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleString();
        li.innerHTML = `${link}<br><span class="timestamp">${formattedDate}</span>`;
      } else {
        li.innerHTML = link;
      }
      
      historyList.appendChild(li);
    });
  }
});
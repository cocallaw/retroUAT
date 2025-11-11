document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggleRedirects");
  const statusText = document.getElementById("statusText");
  const historyList = document.getElementById("historyList");
  const clearHistory = document.getElementById("clearHistory");

  const { enabled = true, history = [] } = await chrome.storage.local.get(["enabled", "history"]);

  toggle.checked = enabled;
  statusText.textContent = enabled ? "Redirects Enabled" : "Redirects Disabled";

  updateHistoryList(history);

  toggle.addEventListener("change", async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
    statusText.textContent = toggle.checked ? "Redirects Enabled" : "Redirects Disabled";
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
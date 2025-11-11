document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggleRedirects");
  const toggleFeedback360 = document.getElementById("toggleFeedback360");
  const statusText = document.getElementById("statusText");
  const historyList = document.getElementById("historyList");
  const feedback360HistoryList = document.getElementById("feedback360HistoryList");
  const clearHistory = document.getElementById("clearHistory");
  const toggleBadge = document.getElementById("toggleBadge");

  const { 
    uatEnabled = true, 
    feedback360Enabled = true,
    uatHistory = [], 
    feedback360History = [],
    showBadge = true 
  } = await chrome.storage.local.get([
    "uatEnabled", 
    "feedback360Enabled", 
    "uatHistory", 
    "feedback360History",
    "showBadge"
  ]);

  toggle.checked = uatEnabled;
  toggleFeedback360.checked = feedback360Enabled;
  toggleBadge.checked = showBadge;

  updateHistoryList(uatHistory);
  updateFeedback360HistoryList(feedback360History);

  toggle.addEventListener("change", async () => {
    await chrome.storage.local.set({ uatEnabled: toggle.checked });
    await updateBadgeState();
  });

  toggleFeedback360.addEventListener("change", async () => {
    await chrome.storage.local.set({ feedback360Enabled: toggleFeedback360.checked });
    await updateBadgeState();
  });

  async function updateBadgeState() {
    const { showBadge = true } = await chrome.storage.local.get("showBadge");
    if (showBadge) {
      if (toggle.checked || toggleFeedback360.checked) {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e" }); // Green
      } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
      }
    }
  }

  toggleBadge.addEventListener("change", async () => {
    await chrome.storage.local.set({ showBadge: toggleBadge.checked });
    
    // Update the badge immediately based on the new setting
    if (toggleBadge.checked) {
      // Show badge with current status
      if (toggle.checked || toggleFeedback360.checked) {
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
    await chrome.storage.local.set({ uatHistory: [], feedback360History: [] });
    updateHistoryList([]);
    updateFeedback360HistoryList([]);
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

  function updateFeedback360HistoryList(history) {
    feedback360HistoryList.innerHTML = "";
    if (history.length === 0) {
      feedback360HistoryList.innerHTML = "<li>No recent redirects</li>";
      return;
    }

    history.forEach(entry => {
      const workItemId = entry.id;
      const feedbackId = entry.feedbackId;
      const timestamp = entry.timestamp;
      
      const li = document.createElement("li");
      const link = `<a href="https://dev.azure.com/unifiedactiontracker/Technical%20Feedback/_workitems/edit/${workItemId}" target="_blank">Feedback ${feedbackId} → ${workItemId}</a>`;
      
      if (timestamp) {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleString();
        li.innerHTML = `${link}<br><span class="timestamp">${formattedDate}</span>`;
      } else {
        li.innerHTML = link;
      }
      
      feedback360HistoryList.appendChild(li);
    });
  }
});
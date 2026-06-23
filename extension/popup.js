// Format a timestamp into a readable date and time.
function formatDate(timestamp) {
  if (!timestamp) {
    return "Never synced";
  }

  return new Date(timestamp).toLocaleString();
}

// Safely update text content only when the element exists.
function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent = value;
}

// Render the top matched sites from the analytics object.
function renderTopSites(siteVisits) {
  const container = document.getElementById("top-sites-list");

  // Avoid crashing if popup.html is missing the analytics container.
  if (!container) {
    return;
  }

  const entries = Object.entries(siteVisits || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (entries.length === 0) {
    container.innerHTML = `<p class="empty-state">No matched visits yet.</p>`;
    return;
  }

  container.innerHTML = entries
    .map(
      ([domain, count]) => `
        <div class="top-site-row">
          <span class="top-site-domain">${domain}</span>
          <strong class="top-site-count">${count}</strong>
        </div>
      `
    )
    .join("");
}

// Load extension data from Chrome local storage and render it in the popup.
async function loadDashboard() {
  const data = await chrome.storage.local.get([
    "siteList",
    "lastFetchAt",
    "activationCount",
    "dismissedSites",
    "siteVisits"
  ]);

  const siteList = data.siteList || [];
  const dismissedSites = data.dismissedSites || {};
  const siteVisits = data.siteVisits || {};

  setText("last-sync", formatDate(data.lastFetchAt));
  setText("sites-loaded", siteList.length);
  setText("activations", data.activationCount || 0);
  setText("dismissed-sites", Object.keys(dismissedSites).length);

  renderTopSites(siteVisits);
}

// Clear all dismissed sites so alerts can show again immediately.
async function clearDismissedSites() {
  await chrome.storage.local.set({
    dismissedSites: {}
  });

  await loadDashboard();
}

// Set up popup events after the page loads.
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();

  const clearButton = document.getElementById("clear-dismissed");

  if (clearButton) {
    clearButton.addEventListener("click", clearDismissedSites);
  }
});
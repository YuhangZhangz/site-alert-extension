// Format a timestamp into a readable date and time.
function formatDate(timestamp) {
  if (!timestamp) {
    return "Never synced";
  }

  return new Date(timestamp).toLocaleString();
}

// Render the top matched sites from the analytics object.
function renderTopSites(siteVisits) {
  const container = document.getElementById("top-sites-list");

  // If the popup HTML has not been updated yet, avoid crashing the popup.
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

  document.getElementById("last-sync").textContent = formatDate(
    data.lastFetchAt
  );

  document.getElementById("sites-loaded").textContent = siteList.length;

  document.getElementById("activations").textContent =
    data.activationCount || 0;

  document.getElementById("dismissed-sites").textContent =
    Object.keys(dismissedSites).length;

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

  document
    .getElementById("clear-dismissed")
    .addEventListener("click", clearDismissedSites);
});
// Format a timestamp into a readable date and time.
function formatDate(timestamp) {
  if (!timestamp) {
    return "Never synced";
  }

  return new Date(timestamp).toLocaleString();
}

// Load extension data from Chrome local storage and render it in the popup.
async function loadDashboard() {
  const data = await chrome.storage.local.get([
    "siteList",
    "lastFetchAt",
    "activationCount",
    "dismissedSites"
  ]);

  const siteList = data.siteList || [];
  const dismissedSites = data.dismissedSites || {};

  document.getElementById("last-sync").textContent = formatDate(
    data.lastFetchAt
  );

  document.getElementById("sites-loaded").textContent = siteList.length;

  document.getElementById("activations").textContent =
    data.activationCount || 0;

  document.getElementById("dismissed-sites").textContent =
    Object.keys(dismissedSites).length;
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
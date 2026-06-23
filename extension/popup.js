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

// Clear dismissed sites so alerts can show again immediately.
async function clearDismissedSites() {
  await chrome.storage.local.set({
    dismissedSites: {}
  });

  await loadDashboard();
}

// Clear cached sitelist data so the extension fetches the latest server list.
async function forceRefreshSitelist() {
  await chrome.storage.local.remove([
    "siteList",
    "lastFetchAt",
    "activationCount"
  ]);

  await loadDashboard();
}

// Render information about the currently active tab.
async function renderCurrentSite() {
  const container = document.getElementById(
    "current-site-content"
  );

  if (!container) {
    return;
  }

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const activeTab = tabs[0];

  if (!activeTab?.url) {
    return;
  }

  const hostname = new URL(activeTab.url).hostname.replace(
    /^www\./,
    ""
  );

  const data = await chrome.storage.local.get([
    "siteList",
    "siteVisits"
  ]);

  const siteList = data.siteList || [];
  const siteVisits = data.siteVisits || {};

  const matchedSite = siteList.find((site) => {
    const domain = site.domain.replace(/^\*\./, "");

    return (
      hostname === domain ||
      hostname.endsWith("." + domain)
    );
  });

  if (!matchedSite) {
    container.innerHTML = `
      <p class="empty-state">
        No matching rule for ${hostname}
      </p>
    `;
    return;
  }

  const visitCount = siteVisits[hostname] || 0;

  container.innerHTML = `
    <div class="current-site-row">
      <span>Domain</span>
      <strong>${hostname}</strong>
    </div>

    <div class="current-site-row">
      <span>Severity</span>
      <strong>${matchedSite.severity}</strong>
    </div>

    <div class="current-site-row">
      <span>Title</span>
      <strong>${matchedSite.title}</strong>
    </div>

    <div class="current-site-row">
      <span>Visits</span>
      <strong>${visitCount}</strong>
    </div>
  `;
}

// Set up popup events after the page loads.
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  renderCurrentSite();

  const clearButton = document.getElementById(
    "clear-dismissed"
  );

  const refreshButton = document.getElementById(
    "force-refresh"
  );

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearDismissedSites
    );
  }

  if (refreshButton) {
    refreshButton.addEventListener(
      "click",
      forceRefreshSitelist
    );
  }
});
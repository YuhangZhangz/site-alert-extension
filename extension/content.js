// Check whether the current site has been dismissed.
async function isDismissed(hostname) {
  const data = await chrome.storage.local.get("dismissedSites");
  const dismissedSites = data.dismissedSites || {};
  const expirationTime = dismissedSites[hostname];

  // If this site was never dismissed, show the alert.
  if (!expirationTime) {
    return false;
  }

  // If the saved expiration time is still in the future, skip the alert.
  return Date.now() < expirationTime;
}

// Save a dismissed site for 24 hours.
async function dismissSite(hostname) {
  const data = await chrome.storage.local.get("dismissedSites");
  const dismissedSites = data.dismissedSites || {};

  // Suppress this site's alert for 24 hours.
  dismissedSites[hostname] = Date.now() + 24 * 60 * 60 * 1000;

  await chrome.storage.local.set({
    dismissedSites
  });
}

// Wrap the main logic in an async function so we can check dismiss state first.
(async () => {
  const hostname = window.location.hostname.replace(/^www\./, "");

  // Skip rendering if the current site was dismissed recently.
  if (await isDismissed(hostname)) {
    return;
  }

  // Ask the background service worker whether the current page matches the sitelist.
  chrome.runtime.sendMessage(
    {
      type: "CHECK_SITE",
      url: window.location.href
    },
    (response) => {
      // Do nothing if the current site is not on the sitelist.
      if (!response?.shouldShow) return;

      // Prevent duplicate alert bars on the same page.
      if (document.getElementById("site-alert-bar")) return;

      const bar = document.createElement("div");
      bar.id = "site-alert-bar";

      const title = response.site.title || "Site Notice";
      const message =
        response.site.message || "This site is included in the monitored list.";

      // Use severity from the remote sitelist to control the visual style.
      const severity = response.site.severity || "info";
      bar.classList.add(`site-alert-${severity}`);

      // Build the alert bar UI.
      bar.innerHTML = `
        <div class="site-alert-inner">
          <strong>${title}</strong>
          <span>${message}</span>
          <button id="site-alert-close" aria-label="Close alert">×</button>
        </div>
      `;

      // Insert the alert bar at the top of the page.
      document.body.prepend(bar);

      // Let the user close the alert bar and remember that choice for 24 hours.
      document
        .getElementById("site-alert-close")
        .addEventListener("click", async () => {
          await dismissSite(hostname);
          bar.remove();
        });
    }
  );
})();
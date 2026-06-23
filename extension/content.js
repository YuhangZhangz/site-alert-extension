// Check whether the current site has been dismissed.
async function isDismissed(hostname) {
  const data = await chrome.storage.local.get("dismissedSites");
  const dismissedSites = data.dismissedSites || {};
  const expirationTime = dismissedSites[hostname];

  if (!expirationTime) return false;

  return Date.now() < expirationTime;
}

// Save a dismissed site for 24 hours.
async function dismissSite(hostname) {
  const data = await chrome.storage.local.get("dismissedSites");
  const dismissedSites = data.dismissedSites || {};

  dismissedSites[hostname] = Date.now() + 24 * 60 * 60 * 1000;

  await chrome.storage.local.set({ dismissedSites });
}

// Wrap the main logic in an async function so we can check dismiss state first.
(async () => {
  const hostname = window.location.hostname.replace(/^www\./, "");

  if (await isDismissed(hostname)) return;

  chrome.runtime.sendMessage(
    {
      type: "CHECK_SITE",
      url: window.location.href
    },
    (response) => {
      if (!response?.shouldShow) return;
      if (document.getElementById("site-alert-bar")) return;

      const bar = document.createElement("div");
      bar.id = "site-alert-bar";

      const title = response.site.title || "Site Notice";
      const message =
        response.site.message || "This site is included in the monitored list.";

      const severity = response.site.severity || "info";
      const actionText = response.site.actionText;
      const actionUrl = response.site.actionUrl;

      bar.classList.add(`site-alert-${severity}`);

      // Build optional action button only when both text and URL are provided.
      const actionButtonHtml =
        actionText && actionUrl
          ? `<a class="site-alert-action" href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionText}</a>`
          : "";

      bar.innerHTML = `
        <div class="site-alert-inner">
          <strong>${title}</strong>
          <span>${message}</span>
          ${actionButtonHtml}
          <button id="site-alert-close" aria-label="Close alert">×</button>
        </div>
      `;

      document.body.prepend(bar);

      document
        .getElementById("site-alert-close")
        .addEventListener("click", async () => {
          await dismissSite(hostname);
          bar.remove();
        });
    }
  );
})();
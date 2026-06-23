// The remote URL that hosts the sitelist.
// During local development, this points to the local Express server.
const LIST_URL = "http://localhost:3000/sitelist.json";

// The sitelist cache is valid for up to 7 days.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// The sitelist should also refresh after 1000 page activations.
const ACTIVATION_LIMIT = 1000;

// Fetch the latest sitelist from the remote server.
async function fetchSiteList() {
  const response = await fetch(LIST_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch sitelist");
  }

  const data = await response.json();

  // Save the sitelist, fetch timestamp, and activation count in Chrome local storage.
  await chrome.storage.local.set({
    siteList: data.sites || [],
    lastFetchAt: Date.now(),
    activationCount: 0
  });

  return data.sites || [];
}

// Return the cached sitelist unless it is missing, expired, or over the activation limit.
async function getSiteList() {
  const state = await chrome.storage.local.get([
    "siteList",
    "lastFetchAt",
    "activationCount"
  ]);

  const activationCount = (state.activationCount || 0) + 1;
  const listIsOld = !state.lastFetchAt || Date.now() - state.lastFetchAt > WEEK_MS;
  const hitLimit = activationCount >= ACTIVATION_LIMIT;

  // Count every page check as one activation.
  await chrome.storage.local.set({ activationCount });

  if (!state.siteList || listIsOld || hitLimit) {
    return await fetchSiteList();
  }

  return state.siteList;
}

// Normalize domains so www.example.com and example.com can match consistently.
function normalizeDomain(domain) {
  return domain.replace(/^www\./, "");
}

// Check whether the current URL matches any domain in the sitelist.
function matchSite(currentUrl, sites) {
  const hostname = normalizeDomain(new URL(currentUrl).hostname);

  return sites.find((site) => {
    const domain = normalizeDomain(site.domain);

    // Match both exact domains and subdomains.
    return hostname === domain || hostname.endsWith("." + domain);
  });
}

// Track how many times a matched site has been visited.
async function trackMatchedSite(currentUrl) {
  const hostname = normalizeDomain(new URL(currentUrl).hostname);

  const data = await chrome.storage.local.get("siteVisits");
  const siteVisits = data.siteVisits || {};

  siteVisits[hostname] = (siteVisits[hostname] || 0) + 1;

  await chrome.storage.local.set({
    siteVisits
  });
}

// Listen for requests from the content script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "CHECK_SITE") return;

  getSiteList()
    .then(async (sites) => {
      const matchedSite = matchSite(message.url, sites);

      // Only track visits when the current site matches the sitelist.
      if (matchedSite) {
        await trackMatchedSite(message.url);
      }

      sendResponse({
        shouldShow: Boolean(matchedSite),
        site: matchedSite || null
      });
    })
    .catch(() => {
      // Fail silently so the extension does not interrupt normal browsing.
      sendResponse({
        shouldShow: false,
        site: null
      });
    });

  // Required because sendResponse is called asynchronously.
  return true;
});
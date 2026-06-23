# Site Alert Bar

Chrome extension that displays customizable alert banners when visiting monitored websites from a remotely synced sitelist.

## Features

- Remote sitelist synchronization
- Wildcard domain support (`*.reddit.com`)
- Multiple alert severities
- Dismissable alert banners
- Visit tracking analytics
- Dashboard popup
- Manual sitelist refresh

---

## Alert Banner (Warning)

![Warning Banner](./screenshots/alert-banner-example.png)

---

## Dashboard

![Dashboard](./screenshots/dashboard-example.png)

---

## Wildcard Domain Support

The extension supports wildcard matching:

```json
{
  "domain": "*.reddit.com"
}
```

Example on Reddit:

![Reddit Banner](./screenshots/alert-banner-reddit.png)

---

## Site Analytics

Current matched site information and visit statistics:

![Analytics Dashboard](./screenshots/dashboard-reddit.png)

---

## Tech Stack

- JavaScript
- Chrome Extension Manifest V3
- Chrome Storage API
- Node.js
- Remote JSON Configuration

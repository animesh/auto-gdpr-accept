# Auto Accept GDPR / Reject Cookie Banners Chrome Extension

This Chrome extension automatically hides cookie banners and modals that contain 'reject', 'decline', 'deny', 'do not consent', and similar words (including Norwegian equivalents). It does not click any buttons or accept cookies; it simply removes the visual clutter from your browsing experience.

## Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `auto-gdpr-accept` folder.

## How it works

The extension scans every page you visit for visible elements containing common reject/deny phrases (in English and Norwegian) such as:
- reject, decline, deny, do not consent, disable
- avslå, avvis, nei, ikke tillat, avslå alle, avvis alle, tilpass, tilpass cookies, cookieinnstillinger

If such a phrase is found, the element is hidden from view. The extension does not interact with or accept cookies.

## Notes
- This extension uses simple heuristics and may not work on every website.
- No data is collected or sent anywhere.
- The extension does not click any buttons or submit any forms; it only hides banners and modals containing reject/deny phrases.

## Uninstall
- Go to `chrome://extensions/` and remove the extension. 
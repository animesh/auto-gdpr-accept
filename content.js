let observer;
let debounceTimer = null;
let mutationCount = 0;
const MUTATION_LIMIT = 50; // Max times to run in a session

const EXCLUDED_SITES = [
  /linkedin\.com\/login/i,
  /accounts\.google\.com/i,
  /twitter\.com\/login/i,
  /github\.com\/login/i
];

function isExcludedSite() {
  return EXCLUDED_SITES.some(re => re.test(window.location.href));
}

function autoRejectInstagramCookies() {
  // Try to find and click the reject/essential cookies button
  const rejectTexts = [
    'reject', 'only allow essential', 'bare nødvendige', 'avslå', 'avvis'
  ];
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  for (const btn of buttons) {
    const text = (btn.innerText || btn.value || '').toLowerCase();
    if (rejectTexts.some(t => text.includes(t))) {
      btn.click();
      console.log('[CookieBannerHider] Clicked Instagram reject/essential cookies button:', btn);
      return true;
    }
  }
  return false;
}

function autoRejectLinkedInCookies() {
  const rejectTexts = [
    'reject', 'decline', 'do not consent', 'avslå', 'avvis'
  ];
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  for (const btn of buttons) {
    const text = (btn.innerText || btn.value || '').toLowerCase();
    if (rejectTexts.some(t => text.includes(t))) {
      btn.click();
      console.log('[CookieBannerHider] Clicked LinkedIn reject/decline cookies button:', btn);
      return true;
    }
  }
  return false;
}

function autoRejectYouTubeCookies() {
  // Try to find and click the reject/essential cookies button on YouTube
  const rejectTexts = [
    'reject', 'decline', 'only use necessary', 'use necessary cookies only', 'refuse', 'refuser', 'essential', 'manage options', 'do not consent', 'disable', 'avslå', 'avvis', 'bare nødvendige',
    // Hindi
    'अस्वीकार', 'इनकार', 'सिर्फ आवश्यक', 'केवल आवश्यक', 'जरूरी कुकीज़', 'जरूरी कुकीज', 'जरूरी', 'इनकार करें', 'स्वीकार नहीं', 'मना करें', 'मना करना', 'डिक्लाइन', 'रिजेक्ट', 'डिनाई', 'इनकार करना'
  ];
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  for (const btn of buttons) {
    const text = (btn.innerText || btn.value || '').toLowerCase();
    if (rejectTexts.some(t => text.includes(t))) {
      btn.click();
      console.log('[CookieBannerHider] Clicked YouTube reject/essential cookies button:', btn);
      return true;
    }
  }
  return false;
}

function debouncedHandleCookies() {
  if (mutationCount > MUTATION_LIMIT) {
    if (observer) observer.disconnect();
    console.warn('[CookieBannerHider] Mutation limit reached, stopping observer.');
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    mutationCount++;
    handleCookies();
  }, 100);
}

// Hide elements containing key phrases (case-insensitive, visible only), including in iframes and shadow DOMs
function hideCookieBanners(root) {
  const keyPhrases = [
    // English
    "reject",
    "decline",
    "deny",
    "do not consent",
    "disable",
    // Norwegian
    "avslå",
    "avvis",
    "nei",
    "ikke tillat",
    "avslå alle",
    "avvis alle",
    "tilpass",
    "tilpass cookies",
    "cookieinnstillinger",
    // Generic
    "manage options",
    // Hindi
    "अस्वीकार",
    "इनकार",
    "सिर्फ आवश्यक",
    "केवल आवश्यक",
    "जरूरी कुकीज़",
    "जरूरी कुकीज",
    "जरूरी",
    "इनकार करें",
    "स्वीकार नहीं",
    "मना करें",
    "मना करना",
    "डिक्लाइन",
    "रिजेक्ट",
    "डिनाई",
    "इनकार करना",
    // Common banner actions
    "बंद करें",
    "खोलें",
    // Notification banners (Hindi)
    "allow",
    "not now",
    "नोटिफिकेशन",
    "सब्सक्राइब करें",
    "ताज़ा खबरों के लिए",
    "बटन दबाकर",
    "अनुमति दें",
    "अभी नहीं"
  ];
  function isBannerLike(el) {
    const style = window.getComputedStyle(el);
    const isOverlay = (style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 10;
    const isDialogRole = ['dialog', 'alert', 'banner'].includes((el.getAttribute('role') || '').toLowerCase());
    const isNotBodyOrHtml = !['BODY', 'HTML'].includes(el.tagName);
    return isNotBodyOrHtml && (isOverlay || isDialogRole);
  }
  const all = root.querySelectorAll('*');
  all.forEach(el => {
    if (el.offsetParent !== null && !el.hasAttribute('data-cookiebannerhider')) {
      const text = (el.innerText || el.value || "").toLowerCase();
      if (keyPhrases.some(phrase => text.includes(phrase)) && isBannerLike(el)) {
        el.setAttribute('data-cookiebannerhider', 'true');
        console.log('[CookieBannerHider] Removing:', el);
        el.remove();
      }
    }
    // Also check shadow roots recursively
    if (el.shadowRoot) {
      hideCookieBanners(el.shadowRoot);
    }
  });
  // Aggressively remove any visible element containing both 'accept' and 'reject' (or Norwegian equivalents) if it is banner-like
  const acceptRejectPhrases = [
    ['accept', 'reject'],
    ['godta', 'avslå'],
    ['godta', 'avvis'],
    // Hindi
    ['स्वीकार', 'अस्वीकार'],
    ['स्वीकार', 'इनकार'],
    ['स्वीकार', 'मना करें'],
    ['स्वीकार', 'डिक्लाइन'],
    ['स्वीकार', 'रिजेक्ट'],
    // Banner close/open
    ['बंद करें', 'खोलें'],
    // Notification banners (Hindi)
    ["allow", "not now"],
    ["अनुमति दें", "अभी नहीं"],
    ["allow", "deny"],
    ["allow", "block"]
  ];
  all.forEach(el => {
    if (
      el.offsetParent !== null &&
      !el.hasAttribute('data-cookiebannerhider')
    ) {
      const text = (el.innerText || el.value || "").toLowerCase();
      if (
        acceptRejectPhrases.some(
          ([a, r]) => text.includes(a) && text.includes(r)
        ) && isBannerLike(el)
      ) {
        el.setAttribute('data-cookiebannerhider', 'true');
        console.log('[CookieBannerHider] Aggressively removing Accept/Reject banner:', el);
        el.remove();
      }
    }
  });
  // Also check all iframes (same-origin)
  if (root === document) {
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        if (iframe.contentDocument) {
          hideCookieBanners(iframe.contentDocument);
        }
      } catch (e) {
        // Ignore cross-origin iframes
      }
    });
  }
}

// Hide iframes with src containing known consent providers
function hideConsentIframes() {
  document.querySelectorAll('iframe').forEach(iframe => {
    if (!iframe.hasAttribute('data-cookiebannerhider')) {
      const src = iframe.src || '';
      if (src.includes('consent') || src.includes('schibsted') || src.includes('cookie')) {
        iframe.setAttribute('data-cookiebannerhider', 'true');
        console.log('[CookieBannerHider] Hiding iframe:', iframe);
        iframe.style.display = 'none';
      }
    }
  });
}

function removeGlobalOverlays() {
  document.querySelectorAll('body *').forEach(el => {
    const style = window.getComputedStyle(el);
    const isOverlay = (style.position === 'fixed' || style.position === 'absolute') &&
      parseInt(style.zIndex) > 1000 &&
      (parseInt(style.width) > window.innerWidth * 0.8 || parseInt(style.height) > window.innerHeight * 0.8);
    if (isOverlay && !el.hasAttribute('data-cookiebannerhider')) {
      el.setAttribute('data-cookiebannerhider', 'true');
      console.log('[CookieBannerHider] Removing global overlay:', el);
      el.remove();
    }
  });
  // Force pointer events on main containers
  ['body', 'html'].forEach(tag => {
    const el = document.querySelector(tag);
    if (el) {
      el.style.setProperty('pointer-events', 'auto', 'important');
    }
  });
}

// Main function: only hide banners and iframes, do not click any elements
function handleCookies() {
  // Special case: Instagram auto-reject
  if (/instagram\.com/i.test(window.location.href)) {
    autoRejectInstagramCookies();
    return;
  }
  // Special case: LinkedIn auto-reject
  if (/linkedin\.com/i.test(window.location.href)) {
    autoRejectLinkedInCookies();
    return;
  }
  // Special case: YouTube auto-reject
  if (/youtube\.com/i.test(window.location.href)) {
    autoRejectYouTubeCookies();
    return;
  }
  if (isExcludedSite()) return;
  if (observer) observer.disconnect();
  hideCookieBanners(document);
  hideConsentIframes();
  if (observer) observer.observe(document.documentElement, { childList: true, subtree: true });
  // Restore scrolling in case the site disabled it for a modal
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  // Aggressively remove scroll-blocking classes and force scroll/position/height
  ['body', 'html'].forEach(tag => {
    const el = document.querySelector(tag);
    if (el) {
      el.classList.remove('no-scroll', 'modal-open', 'overflow-hidden', 'stop-scrolling');
      el.style.setProperty('overflow', 'auto', 'important');
      el.style.setProperty('position', 'static', 'important');
      el.style.setProperty('height', 'auto', 'important');
    }
  });
  removeGlobalOverlays();
}

// Run on load and after a short delay (for late banners)
handleCookies();
setTimeout(handleCookies, 2000);
setTimeout(handleCookies, 5000);
// Also observe DOM changes for dynamically loaded banners
observer = new MutationObserver(debouncedHandleCookies);
observer.observe(document.documentElement, { childList: true, subtree: true }); 
// The stylesheets are injected by the manifest; this script only flips the
// attributes they are scoped on, so settings apply live without a reload.
// Keep DEFAULTS in sync with popup/popup.js.
const DEFAULTS = {
  twitch: true,
  space: 2,
  accent: "#8b7cf6",
  // Empty: keep the background of Twitch's current theme.
  background: "",
  // Chat without badges or username colours.
  plainChat: false,
};

const root = document.documentElement;

// Whether a #rrggbb colour is light enough to need dark text on it: relative
// luminance above that of mid grey.
function isLight(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18;
}

function apply(settings) {
  if (settings.twitch) {
    root.removeAttribute("data-rs");
  } else {
    root.setAttribute("data-rs", "off");
  }
  root.setAttribute("data-rs-space", String(settings.space));
  root.toggleAttribute("data-rs-plain-chat", settings.plainChat);
  root.style.setProperty("--rs-accent", settings.accent);
  // tokens.css derives the sidebars and other surfaces from this colour, and
  // picks the text palette from its tone.
  if (settings.background) {
    root.style.setProperty("--rs-bg-custom", settings.background);
    root.setAttribute("data-rs-bg", isLight(settings.background) ? "light" : "dark");
  } else {
    root.style.removeProperty("--rs-bg-custom");
    root.removeAttribute("data-rs-bg");
  }
}

chrome.storage.sync.get(DEFAULTS, apply);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") chrome.storage.sync.get(DEFAULTS, apply);
});

// Home: twitch.css hides the featured carousel, but a hidden video keeps
// autoplaying and streaming. Pause it whenever Twitch (re)starts it.
// Keep these selectors in sync with the carousel rule in twitch.css.
const CAROUSEL_VIDEOS = [
  '[class*="front-page-carousel"] video',
  '[data-a-target*="front-page-carousel"] video',
  '[class*="featured-content-carousel"] video',
].join(", ");

setInterval(() => {
  if (root.getAttribute("data-rs") === "off") return;
  for (const video of document.querySelectorAll(CAROUSEL_VIDEOS)) {
    if (!video.paused) video.pause();
  }
}, 1000);

// Dev-only live reload, see dev-reload.js. Unpacked builds have no update_url.
if (!("update_url" in chrome.runtime.getManifest())) {
  const timer = setInterval(() => {
    if (!chrome.runtime?.id) {
      // The extension was reloaded under us; give it a moment to come back.
      clearInterval(timer);
      setTimeout(() => location.reload(), 300);
    } else if (!document.hidden) {
      chrome.runtime.sendMessage({ type: "rs-dev-check" }).catch(() => {});
    }
  }, 1000);
}

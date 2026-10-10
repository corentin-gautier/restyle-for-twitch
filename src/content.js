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
  // On channel pages, take the accent and background from the channel's colour.
  channelColors: false,
};

const root = document.documentElement;

// Relative luminance of a #rrggbb colour (WCAG).
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Whether a colour is light enough to need dark text on it: above mid grey.
const isLight = (hex) => luminance(hex) > 0.18;

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHsl([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

// Twitch paints .channel-root in the channel's colour, inline; channels
// without one get a variable instead, which is not a colour of their own.
function channelColor() {
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(document.querySelector(".channel-root")?.style.backgroundColor ?? "");
  return match && match.slice(1).map(Number);
}

const TEXT_CONTRAST = 4.5;

// A palette in the channel's hue: a faintly tinted background in the current
// tone, and the channel's colour as accent, lightened or darkened until text
// in it is readable on that background. Null when the colour has no hue to
// carry over (greys), or no readable shade.
function channelPalette(rgb, dark) {
  const [h, s, l] = rgbToHsl(rgb);
  if (s < 0.15) return null;
  const background = hslToHex(h, Math.min(s, 0.3), dark ? 0.07 : 0.96);
  for (let shade = l; shade > 0.05 && shade < 0.95; shade += dark ? 0.02 : -0.02) {
    const accent = hslToHex(h, s, shade);
    if (contrast(accent, background) >= TEXT_CONTRAST) return { accent, background };
  }
  return null;
}

let settings = DEFAULTS;
// What the channel palette was last computed from, to skip idle ticks.
let applied = "";

function apply() {
  if (settings.twitch) {
    root.removeAttribute("data-rs");
  } else {
    root.setAttribute("data-rs", "off");
  }
  root.setAttribute("data-rs-space", String(settings.space));
  root.toggleAttribute("data-rs-plain-chat", settings.plainChat);

  let { accent, background } = settings;
  const rgb = settings.channelColors && channelColor();
  if (rgb) {
    const dark = background ? !isLight(background) : root.classList.contains("tw-root--theme-dark");
    ({ accent, background } = channelPalette(rgb, dark) ?? settings);
  }
  applied = String(rgb);

  root.style.setProperty("--rs-accent", accent);
  // Labels on accent-filled buttons: white unless the accent is too pale for it.
  root.style.setProperty("--rs-on-accent", contrast("#ffffff", accent) >= 3 ? "#fff" : "#16171a");
  // tokens.css derives the sidebars and other surfaces from this colour, and
  // picks the text palette from its tone.
  if (background) {
    root.style.setProperty("--rs-bg-custom", background);
    root.setAttribute("data-rs-bg", isLight(background) ? "light" : "dark");
  } else {
    root.style.removeProperty("--rs-bg-custom");
    root.removeAttribute("data-rs-bg");
  }
}

function load() {
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = stored;
    apply();
  });
}

load();

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") load();
});

// Twitch is a single-page app: the channel, and so its colour, changes
// without a page load.
setInterval(() => {
  if (settings.channelColors && String(channelColor()) !== applied) apply();
}, 1000);

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

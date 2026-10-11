// The stylesheets are injected by the manifest; this script only flips the
// attributes they are scoped on, so settings apply live without a reload.
// Keep DEFAULTS in sync with popup/popup.js.
const DEFAULTS = {
  twitch: true,
  space: 2,
  // Corner rounding: 0 square, 1 soft, 2 round.
  round: 2,
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
  root.setAttribute("data-rs-round", String(settings.round));
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

// Page state the stylesheet needs to know from the root: whether the sidebar
// is collapsed (its popups are rendered outside it) and whether a channel's
// Home tab is showing (the player lives outside the channel's block).
// CSS could test both with html:has(...), but a :has() on the root is
// re-evaluated on every DOM change and restyles the whole page each time,
// so they are kept as attributes instead. Keep in sync with twitch/shell.css
// and twitch/channel-tabs.css.
function pageState() {
  const nav = document.querySelector(".side-nav--collapsed") ? "collapsed" : null;
  const home = document.querySelector(".channel-root--home");
  const channel = home ? (home.classList.contains("channel-root--live") ? "live-home" : "home") : null;
  for (const [name, value] of [["data-rs-nav", nav], ["data-rs-channel", channel]]) {
    if (value === null) root.removeAttribute(name);
    else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
  }
}

// Card grids (twitch/cards.css). Twitch has two kinds under one stable class:
// grids that wrap, and shelves that hold one row whatever their width. Only
// its generated classes tell them apart, so each grid is marked once with
// what its own rule says.
function towers() {
  for (const tower of document.querySelectorAll(".tw-tower:not([data-rs-tower])")) {
    tower.setAttribute("data-rs-tower", getComputedStyle(tower).flexWrap === "nowrap" ? "row" : "grid");
  }
}

// Twitch is a single-page app: all of this changes without a page load. One
// check per frame at most, however many mutations it took.
let stateQueued = false;
new MutationObserver(() => {
  if (stateQueued) return;
  stateQueued = true;
  requestAnimationFrame(() => {
    stateQueued = false;
    pageState();
    towers();
  });
}).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
pageState();
towers();

// Video cards replace their thumbnail with an animated storyboard while
// hovered: a sprite sheet downloaded and stepped through for every card the
// pointer crosses. Twitch's script never learns that the pointer is on a
// thumbnail: the events it reads hover from are stopped on their way down.
// CSS :hover is not affected, and clicks go through.
const THUMBNAIL = '[data-a-target="preview-card-image-link"]';
const onThumbnail = (node) => node instanceof Element && node.closest(THUMBNAIL) !== null;

for (const type of ["mouseover", "mouseout", "pointerover", "pointerout"]) {
  window.addEventListener(
    type,
    (event) => {
      if (!event.isTrusted || root.getAttribute("data-rs") === "off") return;
      const target = onThumbnail(event.target);
      const related = onThumbnail(event.relatedTarget);
      if (!target && !related) return;
      event.stopPropagation();
      if (!type.endsWith("out") || target === related) return;
      // The pointer crossed the thumbnail's edge. Twitch reads both sides of
      // a move from this one event, so the side outside the thumbnail is
      // told separately, as a move from or to nowhere: without it, what the
      // pointer left would stay hovered, and what it enters would not be.
      const Event = type.startsWith("pointer") ? PointerEvent : MouseEvent;
      const init = { bubbles: true, cancelable: true, composed: true, view: window };
      if (related) {
        event.target.dispatchEvent(new Event(type, init));
      } else if (event.relatedTarget instanceof Element) {
        event.relatedTarget.dispatchEvent(new Event(type.replace("out", "over"), init));
      }
    },
    true,
  );
}

// Home: twitch/pages.css hides the featured carousel, but a hidden video keeps
// autoplaying and streaming. Pause it whenever Twitch (re)starts it.
// Keep these selectors in sync with the carousel rule in twitch/pages.css.
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

// Dev-only live reload, see dev-reload.js. Only the repository's manifest
// declares that worker: the packages built by scripts/package.sh leave it out.
if ("background" in chrome.runtime.getManifest()) {
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

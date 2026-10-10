// Keep in sync with DEFAULTS in src/content.js.
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

// Labels come from _locales, in the browser's language (English otherwise).
document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll("[data-i18n]")) {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n) || el.textContent;
}
for (const el of document.querySelectorAll("[data-i18n-label]")) {
  el.setAttribute("aria-label", chrome.i18n.getMessage(el.dataset.i18nLabel) || el.getAttribute("aria-label"));
}

// A background and an accent that go together. An empty background keeps
// Twitch's own theme. Names are message keys in _locales.
const THEMES = [
  { name: "themeDefault", background: "", accent: "#8b7cf6" },
  { name: "themeMidnight", background: "#0b1220", accent: "#7aa7ff" },
  { name: "themeForest", background: "#0d1512", accent: "#5ecf9b" },
  { name: "themeEmber", background: "#181110", accent: "#ff8f66" },
  { name: "themeRose", background: "#180f15", accent: "#f47fb9" },
  { name: "themeSlate", background: "#14171c", accent: "#9fb4c8" },
  { name: "themePaper", background: "#f7f3ea", accent: "#a8501c" },
  { name: "themeMist", background: "#eef2f7", accent: "#2f5fd0" },
];

const themes = document.querySelector("#themes");
for (const theme of THEMES) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = chrome.i18n.getMessage(theme.name);
  button.setAttribute("aria-label", button.title);
  button.style.setProperty("--swatch-bg", theme.background || "var(--bg)");
  button.style.setProperty("--swatch-accent", theme.accent);
  button.addEventListener("click", () => save({ background: theme.background, accent: theme.accent }));
  themes.append(button);
}

const inputs = document.querySelectorAll("[data-key]");
const spaceButtons = document.querySelectorAll("#space button");
const resetButtons = document.querySelectorAll("[data-reset]");

function render(settings) {
  for (const input of inputs) {
    const value = settings[input.dataset.key];
    if (input.type === "checkbox") input.checked = value;
    // A colour input cannot be empty: unset colours show their fallback.
    else input.value = value || input.dataset.fallback;
  }
  for (const button of resetButtons) {
    // Only offered once the setting differs from its default.
    button.hidden = settings[button.dataset.reset] === DEFAULTS[button.dataset.reset];
  }
  for (const button of spaceButtons) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.value) === settings.space));
  }
  THEMES.forEach((theme, i) => {
    const current = theme.background === settings.background && theme.accent === settings.accent;
    themes.children[i].setAttribute("aria-pressed", String(current));
  });
  document.documentElement.style.setProperty("--accent", settings.accent);
}

function save(patch) {
  chrome.storage.sync.set(patch, () => chrome.storage.sync.get(DEFAULTS, render));
}

for (const input of inputs) {
  input.addEventListener("change", () => {
    save({ [input.dataset.key]: input.type === "checkbox" ? input.checked : input.value });
  });
}

for (const button of spaceButtons) {
  button.addEventListener("click", () => save({ space: Number(button.dataset.value) }));
}

for (const button of resetButtons) {
  button.addEventListener("click", () => save({ [button.dataset.reset]: DEFAULTS[button.dataset.reset] }));
}

chrome.storage.sync.get(DEFAULTS, render);

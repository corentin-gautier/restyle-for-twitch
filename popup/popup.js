// Keep in sync with DEFAULTS in src/content.js.
const DEFAULTS = {
  twitch: true,
  space: 2,
  accent: "#8b7cf6",
  // Empty: keep the background of Twitch's current theme.
  background: "",
  // Chat without badges or username colours.
  plainChat: false,
};

// Labels come from _locales, in the browser's language (English otherwise).
document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll("[data-i18n]")) {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n) || el.textContent;
}
for (const el of document.querySelectorAll("[data-i18n-label]")) {
  el.setAttribute("aria-label", chrome.i18n.getMessage(el.dataset.i18nLabel) || el.getAttribute("aria-label"));
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

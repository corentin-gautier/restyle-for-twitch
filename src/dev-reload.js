// Dev-only live reload. Chrome caches content-script files when the extension
// loads, so a CSS edit needs an extension reload plus a page reload. Open tabs
// ping this worker (see content.js); it re-reads the files from disk and
// reloads the extension when one changed. The tabs then notice their context
// died and reload themselves.
//
// Store builds carry an update_url, unpacked ones don't: this stays inert there.
const manifest = chrome.runtime.getManifest();
const DEV = !("update_url" in manifest);

// Popup files are not watched: Chrome reads them from disk on every open.
const WATCHED = [
  ...new Set([
    "manifest.json",
    manifest.background.service_worker,
    ...manifest.content_scripts.flatMap((s) => [...(s.css ?? []), ...(s.js ?? [])]),
  ]),
];

function snapshot() {
  return Promise.all(
    WATCHED.map(async (path) => {
      const res = await fetch(chrome.runtime.getURL(path), { cache: "no-store" });
      return res.text();
    })
  );
}

let baseline;
let checking = false;

async function check() {
  if (checking) return;
  checking = true;
  try {
    const current = await snapshot();
    if (!baseline) {
      baseline = current;
    } else if (current.some((text, i) => text !== baseline[i])) {
      // A broken manifest would leave the extension disabled: wait for a valid one.
      JSON.parse(current[0]);
      chrome.runtime.reload();
    }
  } catch {
    // File mid-save or manifest not valid yet: try again on the next ping.
  } finally {
    checking = false;
  }
}

if (DEV) {
  check();
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "rs-dev-check") check();
  });
}

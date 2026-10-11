#!/bin/sh
# Builds a store package into dist/ and prints its path: the extension as it
# is, minus the dev-only live reload (its service worker and manifest entry).
#
#   ./scripts/package.sh            Chrome Web Store  -> restyle-<version>.zip
#   ./scripts/package.sh firefox    Firefox Add-ons   -> restyle-<version>-firefox.zip
#
# The Firefox manifest is derived from manifest.json: it gains the add-on id
# Firefox needs for synced storage and the data collection statement its
# store requires, and loses the Chrome-only minimum version.
set -eu
cd "$(dirname "$0")/.."

target=${1:-chrome}
case "$target" in
  chrome) suffix="" ;;
  firefox) suffix="-firefox" ;;
  *) echo "usage: $0 [chrome|firefox]" >&2; exit 2 ;;
esac

version=$(node -p "require('./manifest.json').version")
out="$PWD/dist/restyle-$version$suffix.zip"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

mkdir -p dist "$stage/src"
cp -R _locales icons popup "$stage/"
cp LICENSE "$stage/"
cp src/content.js src/tokens.css "$stage/src/"
cp -R src/twitch "$stage/src/"
node -e '
  const manifest = require("./manifest.json");
  delete manifest.background;
  if (process.argv[2] === "firefox") {
    delete manifest.minimum_chrome_version;
    manifest.browser_specific_settings = {
      gecko: {
        id: "restyle-for-twitch@corentin-gautier",
        // Host access is granted at install from 127; 128 is the ESR after it.
        strict_min_version: "128.0",
        data_collection_permissions: { required: ["none"] },
      },
    };
  }
  require("fs").writeFileSync(process.argv[1], JSON.stringify(manifest, null, 2) + "\n");
' "$stage/manifest.json" "$target"

rm -f "$out"
(cd "$stage" && zip -qr -X "$out" . -x "*.DS_Store")
echo "$out"

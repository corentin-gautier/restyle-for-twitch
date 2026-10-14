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
# The stylesheet is compiled from src/scss/ (needs `npm ci` once).
npm run --silent build >&2
cp src/content.js src/restyle.css "$stage/src/"
node -e '
  const manifest = require("./manifest.json");
  delete manifest.background;
  if (process.argv[2] === "firefox") {
    delete manifest.minimum_chrome_version;
    manifest.browser_specific_settings = {
      gecko: {
        id: "restyle-for-twitch@corentin-gautier",
        // 140 (an ESR) is the first to read data_collection_permissions.
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] },
      },
      // Firefox for Android reads it from 142.
      gecko_android: { strict_min_version: "142.0" },
    };
  }
  require("fs").writeFileSync(process.argv[1], JSON.stringify(manifest, null, 2) + "\n");
' "$stage/manifest.json" "$target"

rm -f "$out"
(cd "$stage" && zip -qr -X "$out" . -x "*.DS_Store")
echo "$out"

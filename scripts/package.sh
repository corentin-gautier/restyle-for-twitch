#!/bin/sh
# Builds the Chrome Web Store package into dist/: the extension as it is,
# minus the dev-only live reload (its service worker and manifest entry).
set -eu
cd "$(dirname "$0")/.."

version=$(node -p "require('./manifest.json').version")
out="$PWD/dist/restyle-$version.zip"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

mkdir -p dist "$stage/src"
cp -R icons popup "$stage/"
cp src/content.js src/tokens.css src/twitch.css "$stage/src/"
node -e '
  const manifest = require("./manifest.json");
  delete manifest.background;
  require("fs").writeFileSync(process.argv[1], JSON.stringify(manifest, null, 2) + "\n");
' "$stage/manifest.json"

rm -f "$out"
(cd "$stage" && zip -qr -X "$out" . -x "*.DS_Store")
echo "$out"

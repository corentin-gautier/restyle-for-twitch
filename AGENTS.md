# Restyle for Twitch

Chrome and Firefox MV3 extension that restyles twitch.tv with a stylesheet,
written in Sass and compiled to one file.
The user is French-speaking: reply in French, write code and docs in English.

## Files

| Path | Role |
| --- | --- |
| `src/scss/` | The stylesheet's source: `restyle.scss` lists the partials in cascade order, every rule scoped under `html:not([data-rs="off"])`; `base/` (tokens, theme), `tools/` (the guard mixin, the shared mixins), `layout/`, `components/`, `pages/`. |
| `src/restyle.css` | Compiled from `src/scss/` and loaded by `manifest.json`. Never edited by hand, and not in the repository: after a clone, `npm install` then `npm run build`. The packages (local and GitHub release) are built with it inside. |
| `src/scss/base/_tokens.scss` | Design tokens (`--rs-*`): spacing, the shelf rhythm (`--rs-shelf-head`, `--rs-shelf-gap`), the page gutter (`--rs-page-inset`), the gap around floating panels (`--rs-panel-gap`), radii (all multiplied by `--rs-round`, the popup's corner setting), type scale, palette. |
| `src/content.js` | Applies the popup's settings as attributes and variables on `<html>` (among them `data-rs-carousel` and `data-rs-stories`, without which the home carousel and the stories are hidden). With "Channel colours" on, derives a palette from the inline background of `.channel-root`. Sets what the stylesheet reads instead of working it out itself: page state on `<html>` (`data-rs-nav`, `data-rs-channel`, `data-rs-info`, `data-rs-following`, `data-rs-has`), each card grid's kind, card count and content (`data-rs-tower`, `data-rs-count`, `data-rs-games`), and `data-rs-hook` on the elements the stylesheet could only find with a costly selector (`HOOKS`). Stops the hover events that start a video card's animated preview. |
| `popup/` | Settings popup. Texts come from `_locales/`, one folder per language with the same keys as `en`. The three spacing labels must each fit on one line of the segmented control. |
| `src/dev-reload.js` | Live reload for unpacked installs; left out of the store package. |
| `scripts/package.sh` | Builds `dist/restyle-<version>.zip` for the Chrome Web Store, or with `firefox` the `-firefox.zip` for Firefox Add-ons (manifest derived from `manifest.json`, with the gecko id). |
| `docs/` | GitHub Pages site. |
| `.github/workflows/release.yml` | On a `v*` tag, publishes a GitHub release with the package as `restyle-for-twitch.zip`, and the Firefox one as `restyle-for-twitch-firefox.zip`, then submits each to its store (Chrome Web Store API v2, `web-ext sign --channel listed`). A store whose secrets are missing is skipped; they are listed under "Releasing" in the README. |
| `promo/` | GIFs, stills and post drafts (`posts.md`) for Reddit and Bluesky. Local only for now (untracked), and not part of the packages. |

## Conventions

- Twitch's class names are mostly generated (`Layout-sc-…`, `fPJBrv`) and
  change without notice. Target stable hooks instead: BEM-like classes
  (`.channel-info-content`), `data-a-target`, `data-test-selector`, ARIA
  roles, or structure with `:has()`.
- Use the `--rs-*` tokens rather than raw values. Twitch sets `1rem = 10px`.
- A radius is a `--rs-radius-*` token, or a raw value times `--rs-round`, so
  that it follows the popup's corner setting (`data-rs-round="0|1|2"`: square,
  soft, round; soft is the default). Circles (`50%`) stay as they are.
- Almost every declaration needs `!important` to beat Twitch's styles.
- Firefox (140+) loads the same files: stick to CSS both engines support, and
  add the `-moz-` twin of any `-webkit-` pseudo-element in the popup.
- `:has()` inside `:has()` is invalid.
- Follow the rules under "Performance" (`scss-editor` agent): a selector that looks harmless can
  make the browser restyle the whole page on every chat message.
- On a rounded element, a border goes all round or not at all: never on one
  side only.
- After an edit, `npm run build` must pass without a warning.

## Where the rest lives

- Stylesheet work (Sass, the performance rules for selectors, the order of the
  partials, the folders): the `scss-editor` agent, `.claude/agents/scss-editor.md`.
- Checking a change in a browser, measuring performance, logged-in pages: the
  `twitch-checker` agent, `.claude/agents/twitch-checker.md`.
- Each page's address, files and hooks, shared components, what is not styled:
  `.claude/reference/pages.md`. Search it; do not read it whole.

## Not covered yet

- The chat settings popover is positioned by Twitch's script and overhangs
  the chat's left edge; left as is.
- Light theme and a custom background colour, beyond the token layer.
- Theatre mode, narrow windows.
- Twitch in another language: a few rules match English `aria-label`s.


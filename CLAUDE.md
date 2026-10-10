# Restyle for Twitch

Chrome MV3 extension that restyles twitch.tv with a stylesheet. No build step.
The user is French-speaking: reply in French, write code and docs in English.

## Files

| Path | Role |
| --- | --- |
| `src/tokens.css` | Design tokens (`--rs-*`): spacing, radii, type scale, palette. |
| `src/twitch.css` | All the rules, scoped under `html:not([data-rs="off"])`, in the sections listed below. |
| `src/content.js` | Applies the popup's settings as attributes and variables on `<html>`. |
| `popup/` | Settings popup. Texts come from `_locales/` (en, fr). |
| `src/dev-reload.js` | Live reload for unpacked installs; left out of the store package. |
| `scripts/package.sh` | Builds `dist/restyle-<version>.zip` for the Chrome Web Store. |
| `docs/` | GitHub Pages site. |

## Conventions

- Twitch's class names are mostly generated (`Layout-sc-…`, `fPJBrv`) and
  change without notice. Target stable hooks instead: BEM-like classes
  (`.channel-info-content`), `data-a-target`, `data-test-selector`, ARIA
  roles, or structure with `:has()`.
- Use the `--rs-*` tokens rather than raw values. Twitch sets `1rem = 10px`.
- Almost every declaration needs `!important` to beat Twitch's styles.
- Nest only under single-selector parents; `:has()` inside `:has()` is invalid.
- After an edit, check that the file still parses:
  `npx --yes lightningcss-cli@1.27.0 src/twitch.css -o /tmp/out.css`

## Pages

Each page type, an address to test it on, and where its rules live in
`src/twitch.css`. "Public" pages can be opened logged out, so they can be
checked in a headless Chrome; the others need the user's session.

### Shell, on every page

| Part | Section | Main hooks |
| --- | --- | --- |
| Top bar | Top bar | search field, nav links, icon buttons |
| Left sidebar | Left sidebar | `.side-nav`, `[data-a-target="side-nav-card-metadata"]` |
| Sign-up banner (logged out only) | Left sidebar (at its end) | `#twilight-sticky-footer-root` |
| Menus, popovers, dialogs | Menus, popovers, dialogs | `.tw-balloon`, `.ReactModal__Content[role="dialog"]` |
| Filter and sort menus | Filter and sort menus | `.tw-interactable` rows, `.tw-checkbox` |

### Directory pages

| Page | Address | Access | Section | Main hooks |
| --- | --- | --- | --- | --- |
| Home | `/` | Public | Pages; Cards | shelves of `.tw-tower`, carousel hidden |
| Following | `/directory/following` | Logged in | Pages | `.common-centered-column`, tabs |
| Browse | `/directory` | Public | Pages | `.vertical-selector`, `section[aria-label="Filter & Sort Options"]` |
| Browse section | `/directory/gaming` | Public | Pages | `.vertical-directory-home-header` |
| All live channels | `/directory/all` | Public | Pages; Cards | `.tw-tower` |
| Category, live | `/directory/category/<slug>` | Public | Category page header | `.directory-header-new__info` |
| Category, videos | `/directory/category/<slug>/videos/all` | Public | Category page header; Pages (filter row) | filter row |
| Category, clips | `/directory/category/<slug>/clips?range=7d` | Public | same | filter row |
| Search | `/search?term=<query>` | Public | Search results | `.search-results`, `.search-result-card` |
| Settings | `/settings/profile` | Logged in | Pages | `.settings-tabs`, `.settings-root__content` |

### Channel pages

| Page | Address | Access | Section | Main hooks |
| --- | --- | --- | --- | --- |
| Live channel | `/<channel>` while live | Public | Channel page; Chat | `.persistent-player`, `#live-channel-stream-information`, `.about-section`, `.channel-panels` |
| Offline channel, Home tab | `/<channel>` while offline | Public | Offline channel page | `.channel-root--home`, `.home-offline-hero`, `.home__lower-content` |
| About tab | `/<channel>/about` | Public | Offline channel page; Channel page | `.about-section__panel`, `.channel-panels-container` |
| Clips tab | `/<channel>/clips?range=7d` | Public | Offline channel page; Cards | "Filter By" row, `.tw-tower` |
| Videos tab | `/<channel>/videos` | Public | Offline channel page; Video page (shelf headers) | `.preview-card-carousel` |
| Schedule tab | `/<channel>/schedule` | Public | Offline channel page (caption only) | `[data-test-selector="schedule-caption"]` |
| Video (VOD) | `/videos/<id>` | Public | Video (VOD) page; Chat (replay) | `.metadata-layout__split-top`, `.video-chat`, `.vod-message` |
| Subscribe / Gift a Sub | buttons on a channel | Public (logged-out variant) | Subscribe and Gift a Sub panels | `.sub-modal`, `.support-panel` |
| Creator Dashboard | `dashboard.twitch.tv` | | excluded in `manifest.json` | |

### Shared components

| Component | Section | Notes |
| --- | --- | --- |
| Stream, video and clip cards | Cards | `article`, three text layouts; name first, then title, then category or "Clipped by". |
| Category cards | Cards | `.game-card`, `.tw-box-art-card`. |
| Shelf titles | Pages; Offline channel page | Display size (`--rs-text-display`) on home, channel tabs and under a video. |
| Tags and category chips | Cards; Channel page | Accent-tinted pills. "Chapters" is a taller, squarer button in the same tint. |
| Live chat | Chat | `.chat-line__message`, leaderboard hidden, highlight cards. |

## Not covered yet

- Logged-in variants: Following, Settings, notifications, whispers, user menu,
  the logged-in Subscribe panel. Ask the user for a DOM dump or a screenshot.
- Light theme and a custom background colour, beyond the token layer.
- Theatre mode, narrow windows, the clip page (`/<channel>/clip/<slug>`).
- Twitch in another language: a few rules match English `aria-label`s.

## Checking a change

There is no test suite. For public pages, drive a headless Chrome (for example
with `puppeteer-core` and the system Chrome), inject `src/tokens.css` and
`src/twitch.css` at document start, set `data-rs-space="2"` on `<html>`, and
screenshot. Take a capture without the stylesheet too when unsure whether a
defect comes from Twitch or from the extension. Keep such scripts out of the
repository.

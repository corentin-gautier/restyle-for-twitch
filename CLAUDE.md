# Restyle for Twitch

Chrome and Firefox MV3 extension that restyles twitch.tv with a stylesheet. No build step.
The user is French-speaking: reply in French, write code and docs in English.

## Files

| Path | Role |
| --- | --- |
| `src/tokens.css` | Design tokens (`--rs-*`): spacing, the shelf rhythm (`--rs-shelf-head`, `--rs-shelf-gap`), the page gutter (`--rs-page-inset`), the gap around floating panels (`--rs-panel-gap`), radii (all multiplied by `--rs-round`, the popup's corner setting), type scale, palette. |
| `src/twitch/` | All the rules, one file per area (table below), each scoped under `html:not([data-rs="off"])`. |
| `src/content.js` | Applies the popup's settings as attributes and variables on `<html>`. With "Channel colours" on, derives a palette from the inline background of `.channel-root`. Sets what the stylesheet reads instead of working it out itself (see "Performance"): page state on `<html>` (`data-rs-nav`, `data-rs-channel`, `data-rs-info`, `data-rs-has`), each card grid's kind, card count and content (`data-rs-tower`, `data-rs-count`, `data-rs-games`), and `data-rs-hook` on a few elements only a generated class name identifies. Stops the hover events that start a video card's animated preview. |
| `popup/` | Settings popup. Texts come from `_locales/`, one folder per language with the same keys as `en`. The three spacing labels must each fit on one line of the segmented control. |
| `src/dev-reload.js` | Live reload for unpacked installs; left out of the store package. |
| `scripts/package.sh` | Builds `dist/restyle-<version>.zip` for the Chrome Web Store, or with `firefox` the `-firefox.zip` for Firefox Add-ons (manifest derived from `manifest.json`, with the gecko id). |
| `docs/` | GitHub Pages site. |
| `.github/workflows/release.yml` | On a `v*` tag, publishes a GitHub release with the package as `restyle-for-twitch.zip`, and the Firefox one as `restyle-for-twitch-firefox.zip`. |

## Conventions

- Twitch's class names are mostly generated (`Layout-sc-…`, `fPJBrv`) and
  change without notice. Target stable hooks instead: BEM-like classes
  (`.channel-info-content`), `data-a-target`, `data-test-selector`, ARIA
  roles, or structure with `:has()`.
- Use the `--rs-*` tokens rather than raw values. Twitch sets `1rem = 10px`.
- A radius is a `--rs-radius-*` token, or a raw value times `--rs-round`, so
  that it follows the popup's corner setting (`data-rs-round="0|1|2"`: square,
  soft, round). Circles (`50%`) stay as they are.
- Almost every declaration needs `!important` to beat Twitch's styles.
- Firefox (128+) loads the same files: stick to CSS both engines support, and
  add the `-moz-` twin of any `-webkit-` pseudo-element in the popup.
- Nest only under single-selector parents; `:has()` inside `:has()` is invalid.
- Follow the rules under "Performance": a selector that looks harmless can
  make the browser restyle the whole page on every chat message.
- On a rounded element, a border goes all round or not at all: never on one
  side only.
- After an edit, check that the file still parses:
  `npx --yes lightningcss-cli@1.27.0 src/twitch/<file>.css -o /tmp/out.css`

## Performance

Twitch changes its DOM all the time (chat lines, rolling viewer counts,
classes toggled on containers). What a selector matches is not what makes it
costly: it is which elements the browser has to *try* it on, and what it then
restyles when something changes. One rule of the wrong shape was enough to
restyle the whole page on every change (45% of CPU time in style on a busy
chat, against 2% without the extension). The rules:

- **A `:has()` on a bare tag or `*` carries a guard.** `div:has(> x)` is tried
  on every `div` of the page, and each try marks the element for
  re-evaluation. Written `div:where(.scope *):has(> x)`, with a `:where()`
  that repeats an ancestor the selector already requires, it is only tried
  inside that ancestor; `:where()` adds no specificity and changes nothing
  that matches. The guard follows the exact path (`.scope > * > *`), child
  and descendant steps only.
- **So does a bare-tag subject after a position or sibling test.**
  `.a + div`, `.a > :first-child p`: every `div` or `p` of the page is tried,
  and each try marks its parent as "restyle the children when one is added".
  Written `.a + div:where(.scope *)`.
- **A guard's scope is a class, an id or a stable attribute**, never `[class…]`,
  `[style…]` or an `aria-` state, and not a container as large as
  `.twilight-main` when a smaller one exists.
- **No nesting under a selector list that holds `:has()`**, and no nested
  `&:hover`, `&.x`, `& + x` under a `:has()` parent: both compile to
  `:is(<whole parent>)…`, which the browser cannot reject early. Write
  `& a:hover` beside `& a`, and one rule per selector (or one `:has(a, b)`).
- **No generated class name (`[class*="x"]`) ahead of a broad subject**
  (`[class*="x"] > div`, `[class*="x"] > *`, `[class*="x"] ~ [class*="y"]`):
  every class change on the page then restyles what is under the changed
  element. Have `content.js` mark the element once (`HOOKS`,
  `data-rs-hook`) and select the attribute.
- **Page state is an attribute set by `content.js`, not a `:has()` on a large
  container**: `#live-channel-stream-information:not(:has(.x)) …` is
  re-evaluated on every change inside it. Same for counting a grid's cards.
- **No position test followed by a sibling combinator with a broad subject**
  (`:first-child ~ div`): write `div:not(:first-child)`.

After touching selectors, measure rather than guess: on a live channel with
a busy chat, a performance trace's "Recalculate Style" events should stay
around a millisecond and a few dozen elements each. A regression shows as
events of thousands of elements.

## Stylesheets

`manifest.json` loads these in this order, after `src/tokens.css`. They are
one cascade split by area, not independent sheets: rules of equal weight are
settled by order, so a new file goes where its rules belong in the sequence,
and a rule that must beat another goes in the same file or a later one.

| File | Sections |
| --- | --- |
| `shell.css` | Theme remap; Top bar; Left sidebar; Floating panels |
| `pages.css` | Pages: home, Following, Browse (also Settings, account pages, tabs) |
| `cards.css` | Cards (grids, thumbnails, hover, loading) |
| `channel.css` | Channel page |
| `directory.css` | Category page header; Search results |
| `channel-tabs.css` | Offline channel page |
| `shelves.css` | Shelf rhythm (also empty states, filter rows, the Following tabs) |
| `video.css` | Video (VOD) page (also the clip page) |
| `team.css` | Team page |
| `drops.css` | Drops & Rewards (Inventory, All Campaigns, Social Media Badge) |
| `subscribe.css` | Subscribe and Gift a Sub panels |
| `forms.css` | Form controls; Filter and sort menus |
| `chat.css` | Chat |
| `overlays.css` | Menus, popovers, dialogs (also the clip viewer, the streamer card, `@keyframes`) |

## Pages

Each page type, an address to test it on, and the section its rules live in
(see the table above for the section's file). "Public" pages can be opened logged out, so they can be
checked in a headless Chrome; the others need the user's session.

### Shell, on every page

| Part | Section | Main hooks |
| --- | --- | --- |
| Top bar | Top bar | search field, nav links, icon buttons |
| Left sidebar | Left sidebar | `.side-nav`, `[data-a-target="side-nav-card-metadata"]` |
| Sign-up banner (logged out only) | Left sidebar (at its end) | `#twilight-sticky-footer-root` |
| Menus, popovers, dialogs | Menus, popovers, dialogs | `.tw-balloon`, `.ReactModal__Content[role="dialog"]` |
| Filter and sort menus | Filter and sort menus | `.tw-interactable` rows, `.tw-checkbox` |
| Floating panels (popup option, `data-rs-floating` on `<html>`) | Floating panels; Chat (at its start) | `.top-nav`, `div:has(> .side-nav)`, `.right-column:not(.right-column--theatre) .channel-root__right-column > div` |

### Directory pages

| Page | Address | Access | Section | Main hooks |
| --- | --- | --- | --- | --- |
| Home | `/` | Public | Pages; Cards | shelves of `.tw-tower`, carousel hidden |
| Following | `/directory/following` | Logged in | Pages; Shelf rhythm | `.common-centered-column`, tabs, `.channel-follow-listing--card` on the Channels tab |
| Event | `/directory/event/<slug>` | Public | Category page header | `.directory-header-new__description` without `.directory-header-new__info` |
| Collection | `/directory/collection/<slug>` | Public | Pages | first block of the column's `<section>`, holding an `<h1>` and a `<p>`, over a `.tw-tower` |
| Browse | `/directory` | Public | Pages | `.vertical-selector`, `section[aria-label="Filter & Sort Options"]` |
| Browse section | `/directory/gaming` | Public | Pages | `.vertical-directory-home-header` |
| All live channels | `/directory/all` | Public | Pages; Cards | `.tw-tower` |
| Category, live | `/directory/category/<slug>` | Public | Category page header | `.directory-header-new__info` |
| Category, videos | `/directory/category/<slug>/videos/all` | Public | Category page header; Pages (filter row) | filter row |
| Category, clips | `/directory/category/<slug>/clips?range=7d` | Public | same | filter row |
| Search | `/search?term=<query>` | Public | Search results | `.search-results`, `.search-result-card` |
| Settings | `/settings/profile` | Logged in | Pages | `.settings-tabs`, `.settings-root__content` |
| Drops, Inventory | `/drops/inventory` | Logged in | Pages (account pages: title, tabs, margins); Drops & Rewards | `.drops-tabs`, `.drops-root__content`, `.inventory-campaign-info` (a campaign's head, laid across its panel), tiles around `.inventory-drop-image`, `.reward_tile` |
| Drops, All Campaigns | `/drops/campaigns` | Logged in | Drops & Rewards | `.accordion-header` and the block after it, `.drop-details__label`, `.drop-benefit__image-container` |
| Drops, Social Media Badge | `/drops/social-badge` | Logged in | Drops & Rewards | `article` holding `.tw-callout-message`, the box holding `.tw-avatar` |
| Wallet, Subscriptions | `/wallet`, `/subscriptions` | Logged in | Pages (account pages) | a block holding an `<h2>`, tabs and content |
| Subscriptions, a tab | `/subscriptions?tab=expired` (also `paid`, `gifts`, `mobile`, `turbo`, `other`) | Logged in | Pages (after the tabs); Shelf rhythm (empty tab) | `.subscription-card` in a grid, `.sub-badge-progress`, `[data-test-selector="SubscriptionsEmptyMessage"]`; the six tabs wrap |

### Channel pages

| Page | Address | Access | Section | Main hooks |
| --- | --- | --- | --- | --- |
| Live channel | `/<channel>` while live | Public | Channel page; Chat | `.persistent-player`, `#live-channel-stream-information`, `.about-section`, `.channel-panels` |
| Offline channel, Home tab | `/<channel>` while offline | Public | Offline channel page | `.channel-root--home`, `.home-offline-hero`, `.home__lower-content` |
| About tab | `/<channel>/about` | Public | Offline channel page; Channel page | `.about-section__panel`, `.channel-panels-container` |
| Clips tab | `/<channel>/clips?range=7d` | Public | Offline channel page; Cards | "Filter By" row, `.tw-tower` |
| Videos tab | `/<channel>/videos` | Public | Offline channel page; Video page (shelf headers) | `.preview-card-carousel` |
| Schedule tab | `/<channel>/schedule` | Public | Offline channel page | `.stream-schedule__header`, `.stream-schedule-times`, `.stream-schedule-segment--element` |
| Video (VOD) | `/videos/<id>` | Public | Video (VOD) page; Chat (replay) | `.metadata-layout__split-top`, `.video-chat`, `.vod-message` |
| Clip | `/<channel>/clip/<slug>` | Public | Video (VOD) page | `.metadata-layout__split-top` holding `.reedit-clip-button`; guests open the streamer card |
| Subscribe / Gift a Sub | buttons on a channel | Public (logged-out variant) | Subscribe and Gift a Sub panels | `.sub-modal`, `.support-panel` |
| Team | `/team/<name>` | Public | Team page | `.teams-page-body__inner-container` (its two columns dissolved into one grid), `.teams-page-body__banner`, `.teams-player`, `.member-list__scrollable-container`; no left sidebar on this page |
| Creator Dashboard | `dashboard.twitch.tv` | | not matched in `manifest.json` | |

### Not styled

Only the main app is matched: `www.twitch.tv` (and `clips.twitch.tv`, which
leads into it). Every other subdomain is a separate site with its own design
(`dashboard`, `m`, `help`, `safety`, `dev`, `blog`, `appeals`, `player`…), and
so are two paths of `www.twitch.tv`, listed in `exclude_matches`: `/p/*`
(About, press, legal) and `/creatorcamp/*`.

Some pages of the app itself have a design of their own too: `/turbo`,
`/downloads`, `/privacy`, `/dj-program`, `/annual-recap`, `/bits`, `/subs`,
`/redeem`, `/activate`. The app moves to and from them without a page load,
which the manifest cannot follow, so `src/content.js` sets `data-rs="off"` on
them (`STANDALONE`, matched on the first segment of the path). A page of that
kind found later goes in that list; one served by another site goes in
`exclude_matches`.

### Shared components

| Component | Section | Notes |
| --- | --- | --- |
| Stream, video and clip cards | Cards | `article`, three text layouts; name first, then title, then category or "Clipped by". |
| Card grids | Cards | Drops tiles use the same grid with narrower columns (`--rs-tower-column`, set in Drops & Rewards). `.tw-tower`: a CSS grid with one gap, at most four cards (eight categories) to a row. Twitch decides how many cards a shelf gets, one per 30rem of the grid's width; the columns follow that count. `data-rs-tower="row"` marks the shelves Twitch keeps on one row. |
| Category cards | Cards | `.game-card`, `.tw-box-art-card`. |
| Shelf titles | Pages; Offline channel page | Display size (`--rs-text-display`) on home, channel tabs and under a video. |
| Tags and category chips | Cards; Channel page | Accent-tinted pills. "Chapters" is a taller, squarer button in the same tint. |
| Live chat | Chat | `.chat-line__message`, leaderboard hidden, highlight cards. |
| Shelves | Shelf rhythm | A title, a grid, sometimes "Show more": all spacing sits on the title, `--rs-shelf-gap` above and `--rs-shelf-head` under. Same on home, Following, a channel's Home tab and under a video. |
| Empty states | Shelf rhythm | One panel (icon in a tinted disc over a line) for "No Channels Live", "No videos found.", "No Clips Found" and an empty tab of Subscriptions. |
| Loading | Cards | Twitch's ghosts (`.tw-placeholder`) are invisible; one spinner (`rs-spin`) per group of them. |
| Streamer card | Menus, popovers, dialogs (end of file) | Popup opened from a guest's name; the box holding `.tw-halo` and an `<h1>`. |
| Turbo offer | Menus, popovers, dialogs (end of file) | Popover of the top bar's "Try 1-Month Ad-Free" button (logged in): the box holding `.tw-popover-header` and `.turbo-ballon-content__scroll-container` (Twitch's spelling); its parts are told apart by position. |
| Clip viewer | Menus, popovers, dialogs (end of file) | `.modal-wrapper__content > div[class*="clips-modal-view"]`, opened from a clip card on home. |
| Chat popups | Chat | Emote picker, cheer card, Power-ups & Rewards, Chat Identity (`.chat-identity-menu`), Drops & More (`[class*="panelContainer"]`): one floating box on the same gutters. |

## Not covered yet

- The chat settings popover is positioned by Twitch's script and overhangs
  the chat's left edge; left as is.
- Light theme and a custom background colour, beyond the token layer.
- Theatre mode, narrow windows.
- Twitch in another language: a few rules match English `aria-label`s.

## Checking a change

There is no test suite. For public pages, drive a headless Chrome (for example
with `puppeteer-core` and the system Chrome), inject `src/tokens.css` and
the files of `src/twitch/` in the manifest's order at document start (in the top frame only: styled too, the player's extension iframe paints over the video), set `data-rs-space="2"` on `<html>`, and
screenshot. Take a capture without the stylesheet too when unsure whether a
defect comes from Twitch or from the extension. Keep such scripts out of the
repository.

For a refactor that must change nothing, compare instead of eyeballing: save
pages as MHTML (`Page.captureSnapshot` over CDP, popups open), then load each
file offline, inject the sheet before and after the change, and diff every
element's box and computed styles. Freeze transitions and animations first,
or two runs of the same sheet differ.

Logged-in pages need the user's session: a Chrome started by puppeteer is
refused by Twitch's login. Start a normal Chrome on a separate profile with
`--user-data-dir=<dir> --remote-debugging-port=<port>`, let the user log in,
then attach with `puppeteer.connect()`. Only open pages and popups; never
post, buy or change account settings.

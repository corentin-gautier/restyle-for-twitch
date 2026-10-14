# Restyle for Twitch

Chrome and Firefox MV3 extension that restyles twitch.tv with a stylesheet,
written in Sass and compiled to one file (see "Sass").
The user is French-speaking: reply in French, write code and docs in English.

## Files

| Path | Role |
| --- | --- |
| `src/scss/` | The stylesheet's source (see "Sass" and "Stylesheets"): `restyle.scss` lists the partials in cascade order, every rule scoped under `html:not([data-rs="off"])`; `base/` (tokens, theme), `tools/` (the guard mixin, the shared mixins), `layout/`, `components/`, `pages/`. |
| `src/restyle.css` | Compiled from `src/scss/` and loaded by `manifest.json`. Never edited by hand, and not in the repository: after a clone, `npm install` then `npm run build`. The packages (local and GitHub release) are built with it inside. |
| `src/scss/base/_tokens.scss` | Design tokens (`--rs-*`): spacing, the shelf rhythm (`--rs-shelf-head`, `--rs-shelf-gap`), the page gutter (`--rs-page-inset`), the gap around floating panels (`--rs-panel-gap`), radii (all multiplied by `--rs-round`, the popup's corner setting), type scale, palette. |
| `src/content.js` | Applies the popup's settings as attributes and variables on `<html>` (among them `data-rs-carousel` and `data-rs-stories`, without which the home carousel and the stories are hidden). With "Channel colours" on, derives a palette from the inline background of `.channel-root`. Sets what the stylesheet reads instead of working it out itself (see "Performance"): page state on `<html>` (`data-rs-nav`, `data-rs-channel`, `data-rs-info`, `data-rs-following`, `data-rs-has`), each card grid's kind, card count and content (`data-rs-tower`, `data-rs-count`, `data-rs-games`), and `data-rs-hook` on the elements the stylesheet could only find with a costly selector (`HOOKS`). Stops the hover events that start a video card's animated preview. |
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
- Follow the rules under "Performance": a selector that looks harmless can
  make the browser restyle the whole page on every chat message.
- On a rounded element, a border goes all round or not at all: never on one
  side only.
- After an edit, `npm run build` must pass without a warning.

## Sass

`npm run watch` while working (readable output, rebuilt on save; the live
reload picks it up), `npm run build` for the minified file. Both write
`src/restyle.css`. `scripts/package.sh` builds before it zips.

Sass compiles nesting flat (`.a { &:hover b {} }` gives `.a:hover b`, with no
`:is()`), so the two nesting rules of "Performance" do not apply to the
partials: `&:hover` and `& + x` may sit under any parent. Under a selector
list, each child is written out once per selector of the list.

- **Guards are generated.** `@include guarded("> div%g:has(> img)") { … }`
  replaces a hand-written `:where()` guard: `%g` becomes the path from the
  nearest class or id above. `$from: '[role="dialog"]'` names another
  ancestor to start from. Guards it cannot work out (a union of scopes, a
  page state ahead of the scope) stay written in full. See
  `tools/_guard.scss`.
- **Repeated declarations are mixins** (`tools/_mixins.scss`): `flush`, `bare`,
  `panel`, `floating`, `clip`, `type`, `muted`, `caps`, `stack`, `row`,
  `inline-row`. Use them where the same lines would be typed again; add one
  when a group of declarations with one meaning turns up a third time.
- A partial loads what it uses, by its path from `src/scss/` (the build's
  load path): `@use "tools/guard" as *;`, `@use "tools/mixins" as *;`.
- Sass comments (`//`) for notes on the source; `/* */` comments go to the
  readable build and are dropped from the minified one.

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
- **A `:has()` goes on the element a rule styles, not on one of its
  ancestors.** `div:where(.scope *):has(> .x) > p` tries the `:has()` on every
  `div` of the scope, guard or not, and marks each one; a card added to a
  grid anywhere under them then restyles the whole scope (20 to 40 ms a card
  on Following, a channel's Videos tab or Drops, against under 1 ms). So does
  a `:has()` on a sibling of those ancestors (`header:has(.x) + div …`).
  Have `content.js` mark the element (`HOOKS`: a container to look in, then
  the selector) and write `div[data-rs-hook~="name"] > p`; a guard under it
  then starts from the mark. A mark is a token: `~=`, since an element can
  carry two.
- **Page state is an attribute set by `content.js`, not a `:has()` on a large
  container**: `#live-channel-stream-information:not(:has(.x)) …` and
  `.twilight-main:has(.tw-tower) h2` are re-evaluated on every change inside
  the container. Same for counting a grid's cards, and for which tab of
  Following is open (`data-rs-following`).
- **No position test followed by a sibling combinator with a broad subject**
  (`:first-child ~ div`): write `div:not(:first-child)`.

After touching selectors, measure rather than guess: on a live channel with
a busy chat, a performance trace's "Recalculate Style" events should stay
around a millisecond and a few dozen elements each. A regression shows as
events of thousands of elements. On a page of grids (home, Following, a
channel's tabs, under a video, Drops), clone a card into a `.tw-tower` and
read the same event: it should count little more than the card's own
elements.

## Stylesheets

`src/scss/restyle.scss` loads every partial, in an order that matters: they
are one cascade split by scope, not independent sheets. Rules of equal weight
are settled by that order, which is why the list interleaves the folders
instead of going through them one by one. A new file goes where its rules
belong in the sequence, and a rule that must beat another goes in the same
file or a later one. Moving a file in the list can change the rendering.

The root `components/` is for what the whole site shares. A component that
only one page uses goes in that page's folder, under `components/`
(`pages/channel/components/chat/`), so that a page's rules stay together.

| Folder | Holds |
| --- | --- |
| `base/` | `_tokens.scss` (the `--rs-*` design tokens), `_theme.scss` (Twitch's palette remapped to them, square corners), `_keyframes.scss`. |
| `tools/` | `_guard.scss` and `_mixins.scss`: no CSS of their own. |
| `layout/` | What frames every page: `_top-bar`, `_sidebar`, `_sidebar-collapsed`, `_signup-banner`, `_cookie-banner`, `_floating-panels` (the popup option), `_page-column` (the directory pages' gutters). |
| `components/` | What the whole site shares, and only that: `_page-header`, `_titles`, `_tabs`, `_tabs-in-popovers`, `_shelf` (the shelf rhythm), `_shelf-arrows`, `_empty-state`, `_filter-row`, `_filter-menus`, `_form-controls`, `_loading`, `_tags`, `_content-notice`. |
| `components/cards/` | `_grid` (`.tw-tower`), `_thumbnail`, `_thumbnail-stats`, `_hover`, `_body` (avatar beside the text), `_text`, `_chapters`, `_category-card`. |
| `components/overlays/` | `_floating-boxes` (balloons, popovers, dialogs), `_menus`, `_backdrop`, `_modal`, `_whispers`, `_clip-viewer`, `_streamer-card`, `_turbo-offer`, `_buy-bits`, `_prime-offers`, `_empty-dialog`. |
| `components/player/` | What opens over any player: `_settings-menu`, `_keyboard-shortcuts`, `_stats`, `_content-gate`. |
| `pages/` | One file per page: `_home`, `_settings`, `_account` (the header Drops, Wallet and Subscriptions share), `_wallet`, `_subscriptions`, `_collection`, `_category`, `_event`, `_search`, `_error`, `_clip`, `_team`. A page with several files has a folder, and what only that page uses sits in the folder's own `components/`. |
| `pages/browse/` | `_sections` (the "Games / IRL…" cards), `_filters`. |
| `pages/following/` | `_stories`, `_upcoming-streams`, `_follow-games-banner`, `_channels-tab`. |
| `pages/channel/` | `_player`, `_info-column`, `_stream-info`, `_about`, `_follow-callout`, `_panels` (a live channel); `_home-hero`, `_home-tab`, `_tabs-content`, `_schedule-tab`, `_videos-tab`, `_shelf-titles` (its tabs). |
| `pages/channel/components/` | `_subscribe-panel`, `_accent-regions`, and `chat/`: `_column`, `_highlights`, `_messages`, `_plain-chat` (the popup option), `_input`, `_community` (who is in the chat), `_notices`, and its popups `_emote-picker`, `_cheer-and-rewards`, `_predictions`, `_identity`, `_drops`, `_cards` (viewer card, emote card). |
| `pages/video/` | `_info` (the video's own block), and in `components/`: `_chat-replay`, `_seek-preview`, `_chapter-list`, `_muted-audio-alert`. |
| `pages/drops/` | `_shared`, then one file per tab: `_inventory`, `_campaigns`, `_social-badge`. |

## Pages

Each page type, an address to test it on, and the files its rules live in
(paths from `src/scss/`). "Public" pages can be opened logged out, so they can be
checked in a headless Chrome; the others need the user's session.

### Shell, on every page

| Part | Files | Main hooks |
| --- | --- | --- |
| Top bar | `layout/_top-bar` | search field, nav links, icon buttons |
| Left sidebar | `layout/_sidebar`, `layout/_sidebar-collapsed` | `.side-nav`, `[data-a-target="side-nav-card-metadata"]`; the stories' row (marked `stories`, hidden unless `data-rs-stories`) |
| Sign-up banner (logged out only) | `layout/_signup-banner` | `#twilight-sticky-footer-root` |
| Cookie banner (until a choice is made) | `layout/_cookie-banner` | `.consent-banner`, `[data-a-target="consent-banner-accept"]` |
| Menus, popovers, dialogs | `components/overlays/` | `.tw-balloon`, `.ReactModal__Content[role="dialog"]` |
| Filter and sort menus | `components/_filter-menus` | `.tw-interactable` rows, `.tw-checkbox` |
| Floating panels (popup option, `data-rs-floating` on `<html>`) | `layout/_floating-panels`, `pages/channel/components/chat/_column` | `.top-nav`, `div:has(> .side-nav)`, `.right-column:not(.right-column--theatre) .channel-root__right-column > div` |

### Directory pages

| Page | Address | Access | Files | Main hooks |
| --- | --- | --- | --- | --- |
| Home | `/` | Public | `pages/_home`, `components/_shelf`, `components/cards/` | shelves of `.tw-tower`; the carousel (`.front-page-carousel`, `.featured-content-carousel-featured-item`, `.carousel-metadata`) hidden unless `data-rs-carousel` |
| Following | `/directory/following` | Logged in | `pages/following/`, `components/_shelf` | `.common-centered-column`, tabs, the stories' row (marked `stories-row` by `content.js`, hidden unless `data-rs-stories`), `.channel-follow-listing--card` on the Channels tab |
| Event | `/directory/event/<slug>` | Public | `pages/_event` | `.directory-header-new__description` without `.directory-header-new__info` |
| Collection | `/directory/collection/<slug>` | Public | `pages/_collection` | first block of the column's `<section>`, holding an `<h1>` and a `<p>`, over a `.tw-tower` |
| Browse | `/directory` | Public | `pages/browse/` | `.vertical-selector`, `section[aria-label="Filter & Sort Options"]` |
| Browse section | `/directory/gaming` | Public | `pages/browse/_filters` | `.vertical-directory-home-header` |
| All live channels | `/directory/all` | Public | `layout/_page-column`, `components/cards/` | `.tw-tower` |
| Category, live | `/directory/category/<slug>` | Public | `pages/_category` | `.directory-header-new__info` |
| Category, videos | `/directory/category/<slug>/videos/all` | Public | `pages/_category`, `components/_filter-row` | filter row |
| Category, clips | `/directory/category/<slug>/clips?range=7d` | Public | same | filter row |
| Search | `/search?term=<query>` | Public | `pages/_search` | `.search-results`, `.search-result-card` |
| Search, one type | `/search?term=<query>&type=channels` (also `categories`, `videos`) | Public | `pages/_search` | the block holding an `h2.tw-title` and the "Back to all results" `<span>`; `[data-a-target="search-result-category"]`, `.search-result-card__category` |
| Settings | `/settings/profile` | Logged in | `pages/_settings` | `.settings-tabs`, `.settings-root__content` |
| Settings, Notifications | `/settings/notifications` | Logged in | `pages/_settings` | `#desktop_notifications`, `#smart_notifications`, the groups `[id$="_category"]` (an `.accordion-header` and the block after it), `#manage_channels` |
| Drops, Inventory | `/drops/inventory` | Logged in | `pages/_account` (title, tabs, margins), `pages/drops/_shared`, `pages/drops/_inventory` | `.drops-tabs`, `.drops-root__content`, `.inventory-campaign-info` (a campaign's head, laid across its panel), tiles around `.inventory-drop-image`, `.reward_tile` |
| Drops, All Campaigns | `/drops/campaigns` | Logged in | `pages/drops/_shared`, `pages/drops/_campaigns` | `.accordion-header` and the block after it, `.drop-details__label`, `.drop-benefit__image-container` |
| Drops, Social Media Badge | `/drops/social-badge` | Logged in | `pages/drops/_shared`, `pages/drops/_social-badge` | `article` holding `.tw-callout-message`, the box holding `.tw-avatar` |
| Wallet, Subscriptions | `/wallet`, `/subscriptions` | Logged in | `pages/_account` | a block holding an `<h2>`, tabs and content |
| Wallet, first tab | `/wallet` | Logged in | `pages/_wallet` | `.payment-methods-tab` on every block: the welcome and the two balances (panels), the row holding the `.tw-title` "Saved Payment Methods", then the methods (the last one), `[data-a-target="saved-payment-method"]` |
| Wallet, history tabs | `/wallet?tab=purchase-history`, `/wallet?tab=bits-usage-history` | Logged in | `pages/_wallet` | `.tw-table` (`.tw-table-heading`, `.tw-table-row`, `.tw-table-cell`), `#transaction_range_start_label`, `[data-test-selector^="table-pagination__"]` |
| Subscriptions, a tab | `/subscriptions?tab=expired` (also `paid`, `gifts`, `mobile`, `turbo`, `other`) | Logged in | `pages/_subscriptions`, `components/cards/_grid` (its grid), `components/_empty-state` (empty tab) | `.subscription-card` in a grid, `.sub-badge-progress`, `[data-test-selector="SubscriptionsEmptyMessage"]`; the six tabs wrap |

### Channel pages

| Page | Address | Access | Files | Main hooks |
| --- | --- | --- | --- | --- |
| Live channel | `/<channel>` while live | Public | `pages/channel/` (`_player`, `_info-column`, `_stream-info`, `_about`, `_panels`), `pages/channel/components/chat/` | `.persistent-player`, `#live-channel-stream-information`, `.about-section`, `.channel-panels` |
| Offline channel, Home tab | `/<channel>` while offline | Public | `pages/channel/_home-hero`, `pages/channel/_home-tab` | `.channel-root--home`, `.home-offline-hero`, `.home__lower-content` |
| About tab | `/<channel>/about` | Public | `pages/channel/_tabs-content`, `pages/channel/_about`, `pages/channel/_panels` | `.about-section__panel`, `.channel-panels-container` |
| Clips tab | `/<channel>/clips?range=7d` | Public | `components/_filter-row`, `pages/channel/_videos-tab`, `components/cards/` | "Filter By" row, `.tw-tower` |
| Videos tab | `/<channel>/videos` | Public | `pages/channel/_videos-tab`, `pages/channel/_shelf-titles` | `.preview-card-carousel` |
| Schedule tab | `/<channel>/schedule` | Public | `pages/channel/_schedule-tab` | `.stream-schedule__header`, `.stream-schedule-times`, `.stream-schedule-segment--element`; an event's popup is `[data-test-selector="segment-popover-content"]` |
| Video (VOD) | `/videos/<id>` | Public | `pages/video/_info`, `pages/channel/_videos-tab` (the shelves under it), `pages/video/components/_chat-replay` | `.metadata-layout__split-top`, `.video-chat`, `.vod-message` |
| Clip | `/<channel>/clip/<slug>` | Public | `pages/_clip` | `.metadata-layout__split-top` holding `.reedit-clip-button`; guests open the streamer card |
| Subscribe / Gift a Sub | buttons on a channel | Public (logged-out variant) | `pages/channel/components/_subscribe-panel` | `.sub-modal`, `.support-panel` |
| Team | `/team/<name>` | Public | `pages/_team` | `.teams-page-body__inner-container` (its two columns dissolved into one grid), `.teams-page-body__banner`, `.teams-player`, `.member-list__scrollable-container`; no left sidebar on this page |
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

| Component | Files | Notes |
| --- | --- | --- |
| Stream, video and clip cards | `components/cards/` | `article`, three text layouts; name first, then title, then category or "Clipped by". |
| Card grids | `components/cards/_grid` | Drops tiles use the same grid with narrower columns (`--rs-tower-column`, set in `pages/drops/_shared`). `.tw-tower`: a CSS grid with one gap, at most four cards (eight categories) to a row. Twitch decides how many cards a shelf gets, one per 30rem of the grid's width; the columns follow that count. `data-rs-tower="row"` marks the shelves Twitch keeps on one row. |
| Category cards | `components/cards/_category-card` | `.game-card`, `.tw-box-art-card`. |
| Shelf titles | `components/_titles`, `pages/channel/_shelf-titles` | Display size (`--rs-text-display`) on home, channel tabs and under a video. |
| Tags and category chips | `components/_tags`, `components/cards/_text`, `components/cards/_chapters`, `pages/channel/_stream-info` | Accent-tinted pills. "Chapters" is a taller, squarer button in the same tint. |
| Live chat | `pages/channel/components/chat/_messages`, `pages/channel/components/chat/_highlights` | `.chat-line__message`, leaderboard hidden, highlight cards (`.community-highlight`, its box `.highlight`). A pinned message is `.pinned-chat__highlight-card`: `.pinned-chat__pinned-by`, `.pinned-chat__message`, the buttons in `.pinned-chat__scrollable-area`; `.highlight__collapsed` once folded to one line. A notice in the messages (subscription, redeemed reward) is `[data-test-selector="user-notice-line"]`, after a bar Twitch colours inline; a highlighted message's text is `.chat-line__message-body--highlighted`, a reward's icon `.channel-points-reward-line__icon`. An announcement is `.announcement-line`, its colour an inline `border-color` or a `--blue`/`--green`/… class. A prediction's card is `.highlight__click-target`; with several cards, `.community-highlight-stack__backlog-card` shows behind. A hype train is `.sticky-community-highlight`, over those cards: its banner `button[aria-controls="hype-train-expanded-view"]`, and under it the panel, all generated classes, restyled through Twitch's palette variables set on the card. |
| Shelves | `components/_shelf` | A title, a grid, sometimes "Show more": all spacing sits on the title, `--rs-shelf-gap` above and `--rs-shelf-head` under. Same on home, Following, a channel's Home tab and under a video. |
| Empty states | `components/_empty-state` | One panel (icon in a tinted disc over a line) for "No Channels Live", "No videos found.", "No Clips Found" and an empty tab of Subscriptions. |
| Loading | `components/_loading` | Twitch's ghosts (`.tw-placeholder`) are invisible; one spinner (`rs-spin`) per group of them. |
| Streamer card | `components/overlays/_streamer-card` | Popup opened from a guest's name; the box holding `.tw-halo` and an `<h1>`. |
| Turbo offer | `components/overlays/_turbo-offer` | Popover of the top bar's "Try 1-Month Ad-Free" button (logged in): the box holding `.tw-popover-header` and `.turbo-ballon-content__scroll-container` (Twitch's spelling); its parts are told apart by position. |
| Buy Bits | `components/overlays/_buy-bits` | Popover of the top bar's Bits button (logged in): `[role="dialog"][aria-labelledby="GetBitsPopover-header"]`, the featured pack (`[class*="bitsHeroPrice"]`), the packs (`[role="listitem"]`). |
| Prime offers | `components/overlays/_prime-offers` | Popover of the top bar's crown button (logged in): `.prime-offers-upsell` (the pitch), `.prime-offer-list__content` (tabs and list), `.prime-offer__data` (a game's card), `[data-a-target="prime-claim-button"]`. |
| Confirmations | `components/overlays/_modal`, `components/overlays/_backdrop` | "Unfollow <channel>?", from the heart of a card on Following > Channels (logged in): `.ReactModal__Content[role="alertdialog"] .tw-modal`, the title `.tw-title`, the line under it `[id$="-body"]`, then the row of two buttons (cancel first; `[data-a-target="modal-unfollow-button"]`). Twitch's own backdrop is an empty box, hidden by `_empty-dialog`: the overlay carries ours. |
| Clip viewer | `components/overlays/_clip-viewer`, `pages/_clip` (the clip's own block) | `.modal-wrapper__content > div[class*="clips-modal-view"]`, opened from a clip card on home. |
| Viewer and emote cards | `pages/channel/components/chat/_cards` | Opened from a name or an emote in chat: `.viewer-card`, `.emote-card`, both inside `.viewer-card-layer__draggable`, which Twitch positions inline (the gutter is its padding). |
| Community list | `pages/channel/components/chat/_community` | `.chatter-list-item`; the list is marked by `content.js` (`chatters`). |
| Chat notices | `pages/channel/components/chat/_notices` | `[data-test-selector^="chat-private-callout-queue"] article`, above the message field. |
| Message field | `pages/channel/components/chat/_input` | `.chat-wysiwyg-input-box` (the outlined field), `.chat-input__buttons-container` (balances, settings, "Chat"). The tab joined to its top ("Followers-Only Chat", a reply's thread) is `.chat-input-tray__open`, `--web-nonpersistent` once clicked open; the field's wrapper is then `.chat-input-container__open`. |
| Error page | `pages/_error` | `.core-error__container`: an unknown address, an unavailable channel. |
| Chat popups | `pages/channel/components/chat/` (`_emote-picker`, `_cheer-and-rewards`, `_predictions`, `_identity`, `_drops`) | Emote picker, cheer card, Power-ups & Rewards (and its prediction view, logged in: `.prediction-checkout-details-header`, `.prediction-summary-outcome`, `.prediction-summary-stat`, `.prediction-summary-outcome-bar`), Chat Identity (`.chat-identity-menu`), Drops & More (`[class*="panelContainer"]`): one floating box on the same gutters. |

## Not covered yet

- The chat settings popover is positioned by Twitch's script and overhangs
  the chat's left edge; left as is.
- Light theme and a custom background colour, beyond the token layer.
- Theatre mode, narrow windows.
- Twitch in another language: a few rules match English `aria-label`s.

## Checking a change

There is no test suite. For public pages, drive a headless Chrome (for example
with `puppeteer-core` and the system Chrome), inject `src/restyle.css` at
document start (in the top frame only: styled too, the player's extension iframe paints over the video), set `data-rs-space="2"` on `<html>`, and
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

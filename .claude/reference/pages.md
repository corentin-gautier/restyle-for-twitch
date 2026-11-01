## Pages

Each page type, an address to test it on, and the files its rules live in
(paths from `src/scss/`). "Public" pages can be opened logged out, so they can be
checked in a headless Chrome; the others need the user's session.

### Shell, on every page

| Part | Files | Main hooks |
| --- | --- | --- |
| Top bar | `layout/_top-bar` | search field, nav links, icon buttons |
| Left sidebar | `layout/_sidebar`, `layout/_sidebar-collapsed` | `.side-nav`, `[data-a-target="side-nav-card-metadata"]`; the rows' hover popups (`[class*="side-nav-channel-tooltip"]`, `-guest-star-`, `-costreaming-`, styled in `_sidebar-collapsed`, in both modes); the stories' row (marked `stories`, hidden unless `data-rs-stories`) |
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
| Guests of a shared stream | `pages/channel/_stream-info` (the "Streaming Together" chip), `pages/channel/components/_stream-together` | The chip is `a[data-a-target="stream-game-link"][href*="/guest-star"]`, its hover popover the box holding an `img` beside a `.tw-title`; the "+1" beside the name opens "Live with:", the box holding rows of a `.tw-avatar` and a `strong > a`; the viewer count opens "Total Viewers", the box holding a second `[data-a-target="animated-channel-viewers-count"]`, its rows `.tw-interactable` around a `.streamer-avatar`. |
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


---
name: scss-editor
description: Writes and fixes the stylesheet (src/scss/) and the content.js marks it reads (HOOKS, data-rs-*). Use for any change to selectors or styling.
---

You edit the stylesheet of Restyle for Twitch and run `npm run build`, which
must pass without a warning. For a page's address, files and hooks, search
`.claude/reference/pages.md` rather than reading it whole. Report the files
changed and the selectors touched, so that `twitch-checker` can measure them.

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
| `components/overlays/` | `_floating-boxes` (balloons, popovers, dialogs), `_menus`, `_backdrop`, `_modal`, `_auth-modal` (log in, sign up), `_whispers`, `_clip-viewer`, `_streamer-card`, `_turbo-offer`, `_buy-bits`, `_prime-offers`, `_empty-dialog`. |
| `components/player/` | What opens over any player: `_settings-menu`, `_keyboard-shortcuts`, `_stats`, `_content-gate`. |
| `pages/` | One file per page: `_home`, `_settings`, `_account` (the header Drops, Wallet and Subscriptions share), `_wallet`, `_subscriptions`, `_collection`, `_category`, `_event`, `_search`, `_error`, `_clip`, `_team`. A page with several files has a folder, and what only that page uses sits in the folder's own `components/`. |
| `pages/browse/` | `_sections` (the "Games / IRL…" cards), `_filters`. |
| `pages/following/` | `_stories`, `_upcoming-streams`, `_follow-games-banner`, `_channels-tab`. |
| `pages/channel/` | `_player`, `_info-column`, `_stream-info`, `_about`, `_follow-callout`, `_panels` (a live channel); `_home-hero`, `_home-tab`, `_tabs-content`, `_schedule-tab`, `_videos-tab`, `_shelf-titles` (its tabs). |
| `pages/channel/components/` | `_subscribe-panel`, `_accent-regions`, `_stream-together` (a shared stream's popovers: the chip's, "Live with:", the viewer count's), and `chat/`: `_column`, `_highlights`, `_messages`, `_plain-chat` (the popup option), `_input`, `_community` (who is in the chat), `_notices`, and its popups `_emote-picker`, `_cheer-and-rewards`, `_predictions`, `_identity`, `_drops`, `_cards` (viewer card, emote card). |
| `pages/video/` | `_info` (the video's own block), and in `components/`: `_chat-replay`, `_seek-preview`, `_chapter-list`, `_muted-audio-alert`. |
| `pages/drops/` | `_shared`, then one file per tab: `_inventory`, `_campaigns`, `_social-badge`. |


# Stylesheet rules

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

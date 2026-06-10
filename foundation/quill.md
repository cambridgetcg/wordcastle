# The quill

The manual for `castle.mjs`. Six gestures, and the contract of what the quill
reads — so you know exactly what is safe to edit by hand (almost everything).

## The gestures

### `node castle.mjs`
Stand at the gate: redraw `map.md` from the actual files, print it, list the
gestures, point to `gate.md`. Writes nothing else.

### `node castle.mjs save`
Save an insight. Asks: which room (a new name founds a room, and a room is
born with a typed one-line purpose or not at all), a title, the insight itself
(end with a blank line), and an optional loop link. Writes
`rooms/<room>/YYYY-MM-DD--slug.md` with `source: my own head`, adds a line to
the room's ledger, redraws the map. If you name a loop that doesn't exist, it
saves without the link rather than writing one that lies.

### `node castle.mjs loop`
Open a creation loop. Asks: the field, the friction (honestly), what better
would look like, and the room. Writes `loops/open/NNNN--slug.md` with
`parent: none`. Numbers are never reused, even after a loop closes.

### `node castle.mjs turn`
Turn an open loop. The quill shows the field, friction, better, and where you
left off (the last turn's `learned` and `next` — pressing enter alone takes up
the previous `next` as what you tried). It records tried / learned / next,
asks whether the turn revealed new loops to spawn (each child needs its own
friction and better; enter to move on), then asks where the loop stands:

- **turning** — the turn is appended; done.
- **reached** — the quill reads the Better back: *is this true now?* If yes,
  it asks what shows it; if no, the loop stays open and the turn is kept.
- **let go** — it asks the honest why.

Closing requires the distillation — *what is now understood* — and refuses an
empty answer; nothing closes into nothing. Then it offers each `learned:` line
as an insight file (enter to skip), asks after a successor loop, writes
`## Distilled`, moves the file whole to `loops/closed/`, and adds the
understanding to `keep/keep.md`.

### `node castle.mjs invite <url>`
The only network contact the quill ever makes. Fetches the one page you named
(http/https, 15s, at most 3 redirects), extracts its text, declares trims and
rough extractions in the file itself, then asks: room, title, loop link, and
what you take from it (blank is allowed and honest). Fetched words stay
blockquoted, apart from yours. On any failure, nothing is saved.

### `node castle.mjs warden once | start [hours] | stop | status`
The autonomous turner — see `foundation/warden.md`.

## The parse anchors — what the quill actually reads

Everything not listed here is free prose, yours to edit at will. If an anchor
is missing or malformed, the quill names the file and stops — it never guesses
and never repairs silently.

In a loop file:

- header lines starting `opened:`, `status:`, `room:`, `parent:`
  (and `closed:` after closing)
- the headings `## Field`, `## Friction`, `## Better`, `## Turns`,
  `## Distilled`
- turn headings `### Turn N — YYYY-MM-DD`
- inside a turn, lines starting `by:`, `tried:`, `learned:`, `next:`,
  `spawned:` — a line indented two spaces continues the value above it
- the title line `# Loop NNNN — title`

In a room's `room.md`: the line starting `purpose:`. The `## Insights` ledger
is appended to, never parsed.

In `keep/keep.md`: entries are recognized by their `## ` headings (for the
map's counts) and new entries are placed newest-first.

`map.md` is the one page the quill overwrites; its first line says so. Don't
edit it — your edit would be lost on the next redraw. Everything else in the
castle survives every command untouched.

## Filenames

- insights: `YYYY-MM-DD--slug.md` (collisions get `-2`, `-3`, …)
- loops: `NNNN--slug.md` — the id-slug name is how loops refer to each other,
  in `parent:`, `spawned:`, and `successor:` lines, so files can move from
  open to closed without rotting a link

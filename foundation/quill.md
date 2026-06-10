# The quill

The manual for `castle.mjs`: the gestures, and the contract of what the quill
reads — so you know exactly what is safe to edit by hand (almost everything).

## The gestures

### `./castle.mjs`
Stand at the gate: redraw `map.md` from the actual files, print it, and end
with one quiet line of gestures. Writes nothing else. `./castle.mjs help`
prints the fuller list.

### `./castle.mjs save "the thought"`
The fastest path: one line, saved, no questions. It lands in **the hall**
(the default room — the one room that founds itself, its purpose typed in
the design) with a title taken from its first words. Optional flags:
`--room <name>` (must already exist), `--title "…"`, `--loop NNNN`. Run
`save` with no words for a short interview instead — there, every answer can
be skipped with enter except the words themselves, and a new room's purpose,
which is never skippable (a room is born with a typed one-line purpose or
not at all). The interview never asks for a loop link; that is what the
`--loop` flag is for. Either way it writes `rooms/<room>/YYYY-MM-DD--slug.md` with
`source: my own head`, adds a ledger line, redraws the map. A loop link that
matches nothing is dropped with a word, never written as a lie.

### `./castle.mjs loop`
Open a creation loop. Asks: the field, the friction, what better would look
like, and the room (enter = the hall). Writes `loops/open/NNNN--slug.md` with
`parent: none`. Numbers are never reused, even after a loop closes.

### `./castle.mjs turn`
Turn an open loop. The quill shows the field, friction, better, and where you
left off (the last turn's `learned` and `next` — pressing enter alone takes up
the previous `next` as what you tried). It records tried / learned / next,
asks whether the turn revealed new loops to spawn (each child needs its own
friction and better; enter to move on), then asks where the loop stands:

- **turning** — the turn is appended; done.
- **reached** — the quill shows the Better beside one question: *what shows
  it?*
- **let go** — it asks the honest why.

Closing requires one thing only — the distillation, *what is now understood* —
and refuses an empty answer; nothing closes into nothing. Then it writes
`## Distilled`, moves the file whole to `loops/closed/`, and adds the
understanding to `keep/keep.md`. Every `learned:` line lives on in the closed
file; nothing else is asked.

### `./castle.mjs invite <url>`
The only page-fetch the quill ever makes. Fetches the one page you named
(http/https; 15 seconds per request, at most 3 redirects, so at most 4
requests), extracts its text, declares trims and rough extractions in the file
itself, then asks: room, title, loop link, and what you take from it (blank is
allowed and honest). Fetched words stay blockquoted, apart from yours. On any
failure, nothing is saved.

### `./castle.mjs publish`
Render the front — the castle's public face — into `front/` as plain HTML:
the five self-description pages (gate, design, vows, quill, warden) and a
words page holding every insight or loop file that carries a `public: yes`
line. Nothing else ever appears there; the keep, the rooms, and the loops
stay private until marked. Publishing makes **no network call** — it only
writes files. Carrying `front/` to the web (e.g. `vercel deploy`) is a
separate, deliberate act, and the front says on every page how many words
were marked public and when it was rendered.

To mark a word public, add a line reading exactly `public: yes` to the
insight or loop file. Remove the line and the next `publish` withdraws it
from the rendering (what already reached the web stays until you redeploy).

### `./castle.mjs warden once | start [hours] | stop | status`
The autonomous turner — see `foundation/warden.md`. Its `claude` call is the
castle's only other road to the world, and it opens only when you wake it.

## The parse anchors — what the quill actually reads

Everything not listed here is free prose, yours to edit at will. If an anchor
is missing or malformed, the quill names the file and the broken line, and
stops — it never guesses and never repairs silently.

In a loop file:

- header lines starting `opened:`, `status:`, `room:`, `parent:` — all four
  must be present (`closed:` is written on close but never read back)
- the headings `## Field`, `## Friction`, `## Better`, `## Turns`,
  `## Distilled`
- turn headings `### Turn N — YYYY-MM-DD` — the dash may be the long dash (—)
  or a plain hyphen (-); any line starting `### ` inside Turns that doesn't
  fit this shape stops the quill rather than vanishing
- inside a turn, lines starting `by:`, `tried:`, `learned:`, `next:`,
  `spawned:` — every turn must carry its `by:` line (every word here is
  signed); a line indented two spaces continues the value above it
- the title line `# Loop NNNN — title` (long dash or hyphen)
- the placeholder `(empty until the loop closes)` under `## Distilled` is
  replaced at close; notes you write in that section are kept below the close,
  never thrown away

So that your own words can never be mistaken for structure: when the quill
writes a prose line of yours that begins with `#`, it indents it two spaces.

In a room's `room.md`: the line starting `purpose:`. The `## Insights` ledger
is appended to, never parsed.

In any insight or loop file: a line reading exactly `public: yes` — read only
by `publish`, and only to decide what the front may show.

In `keep/keep.md`: entries are recognized by their `## ` headings (for the
map's counts) and new entries are placed newest-first.

Two places are generated and overwritten, and both say so: `map.md` (on every
run; its top line names the quill) and `front/` (on every `publish`; each
page's footer states when it was rendered). Don't edit either — your edit
would be lost on the next redraw. Everything else in the castle survives
every command untouched.

## Filenames

- insights: `YYYY-MM-DD--slug.md` (collisions get `-2`, `-3`, … — files are
  created exclusively, so two quills at once cannot overwrite each other)
- loops: `NNNN--slug.md` — the id-slug name is how loops refer to each other,
  in `parent:` and `spawned:` lines, so files can move from
  open to closed without rotting a link. If hand-renaming ever leaves two
  open loops sharing a number, the quill asks for the full name rather than
  guessing. In the turn picker, a short number means the menu position; a
  full four-digit number (0012) means the loop id.

# The vows

Two honest lists. The first is kept by code — each line is testable against
`castle.mjs`, and if the code ever stops keeping one, the castle is lying and
must be mended. The second is kept by a person — labeled as such, so no
written promise outruns what code can actually enforce.

## Promises the quill keeps

1. **The castle has exactly two roads to the world, and both are yours to
   open.** `invite` fetches only the one URL you typed — 15 seconds per
   request, at most 3 redirects (so at most 4 requests), and there is no other
   fetch in the file. The warden, when woken, sends the loop it is turning
   (with the vows and a keep excerpt) to Claude through this device's `claude`
   CLI — which needs the network — and to nowhere else. Every other gesture
   works with no internet at all.
2. **The quill never deletes a castle file.** Closing a loop is a move from
   `loops/open/` to `loops/closed/`, whole history intact, and it refuses to
   close over a file that already stands there. New files are created
   exclusively — two quills writing at once cannot overwrite each other. The
   only page it overwrites is `map.md`, which says so at its top.
3. **No loop closes without an understanding written down.** `understood:` may
   not be empty — whether the loop was reached or let go, by hand or by the
   warden. Nothing closes into nothing.
4. **Every insight says where it came from.** `source:` is always exactly one
   of `my own head`, `loop NNNN, turn N`, or the URL of an invited page — and
   invited words stay blockquoted, apart from yours.
5. **When the quill cannot read a file, it names the file and the broken
   line, and stops.** It never guesses and never repairs silently.
6. **The quill writes nothing unseen.** What you type is what it writes (empty
   answers become honest placeholders like `(nothing yet)`, never invented
   words), and the warden prints every turn in full before writing it — when
   it runs on schedule, that printout lands in `loops/warden-launchd.log`.
7. **The front shows only what is marked.** `publish` renders into `front/`
   nothing but the castle's five self-description pages and files carrying a
   `public: yes` line — and makes no network call of its own. Every front
   page states how many words are marked public and when it was rendered.
   Carrying the front to the web is a separate act of the keeper's hands.
8. **Every word the warden writes is signed `by: the warden`.** It turns at
   most one loop per run, spawns at most 2 child loops per turn, refuses to
   spawn past 12 open loops or 3 generations deep (your own hands are never
   capped) — and when a cap or a refused close stops it, the refusal is
   written into the turn, not hidden. It runs only while you keep it woken;
   `node castle.mjs warden stop` ends it with one command; every run leaves a
   line in `loops/warden-journal.md`.

## Practices the keeper keeps

_(human disciplines — the code cannot enforce these, and says so)_

1. Design changes ride on a turn of loop 0001 — and `foundation/design.md` is
   updated in the same breath.
2. `my own head` really means my own head. Borrowed words get their source.
3. One insight per file, one true thing. If it won't fit in a few sentences,
   it is two insights, or it isn't understood yet.
4. The map is read, never edited. Everything else here is mine to edit freely.
5. The warden's turns are read with the same care as a friend's letter —
   trusted, but checked. What it writes becomes true for the castle only when
   the keeper lets it stand.

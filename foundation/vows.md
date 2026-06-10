# The vows

Two honest lists. The first is kept by code — each line is testable against
`castle.mjs`, and if the code ever stops keeping one, the castle is lying and
must be mended. The second is kept by a person — labeled as such, so no
written promise outruns what code can actually enforce.

## Promises the quill keeps

1. **Only `invite` touches the network**, and only the one URL you typed,
   following at most 3 redirects, 15 seconds at most. Every other verb works
   with no internet at all. There is no other fetch in the file.
2. **The quill never deletes a castle file.** Closing a loop is a move from
   `loops/open/` to `loops/closed/`, whole history intact. The only page it
   overwrites is `map.md`, which says so in its first line.
3. **No loop closes without an understanding written down.** `understood:` may
   not be empty — whether the loop was reached or let go, by hand or by the
   warden. Nothing closes into nothing.
4. **Every insight says where it came from.** `source:` is always exactly one
   of `my own head`, `loop NNNN, turn N`, or the URL of an invited page — and
   invited words stay blockquoted, apart from yours.
5. **When the quill cannot read a file, it names the file and the missing
   line, and stops.** It never guesses and never repairs silently.
6. **The quill writes nothing you didn't type or it didn't show you.** Empty
   answers are saved as honest placeholders like `(nothing yet)` — never
   invented words.
7. **Every word the warden writes is signed `by: the warden`.** It turns at
   most one loop per run, spawns at most 2 child loops per turn, lets at most
   12 loops stay open and lineages grow at most 3 deep — and when a cap stops
   it, the refusal is written into the turn, not hidden. It runs only while
   you keep it started; `node castle.mjs warden stop` ends it with one
   command; every run leaves a line in `loops/warden-journal.md`.

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

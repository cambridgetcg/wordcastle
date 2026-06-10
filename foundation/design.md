# The design

This page is the castle describing itself, in its own medium. A person with no
quill could keep the castle by hand from this file alone — the code holds no
state these files don't show.

## The idea

The files are the system; the quill (`castle.mjs`) only writes what a hand
could write. Understanding builds up through words: small insights gather in
rooms, work-in-motion turns in loops, and what closed loops leave behind rests
in the keep. Every folder teaches the metaphor it serves, and the whole place
reads end to end in a bare text editor.

Creation loops are the engine. A loop names a **field**, the **friction** in
it, and what **better** would look like. Each **turn** records what was tried,
what was learned, and what comes next. A turn can **spawn** child loops — so
loops create loops. And the one hard rule, kept by code: **nothing closes into
nothing.** A loop may close as *reached* (with evidence) or *let go* (with the
honest why), but either way it must leave an understanding behind, distilled
upward into the keep. That is how the creation creates — mechanically, not as
a slogan.

## The grounds

    wordcastle/
    ├── castle.mjs          the quill — one file, Node, built-ins only
    ├── gate.md             start here: the whole castle on one page
    ├── map.md              the ONLY generated page; redrawn on every run
    ├── foundation/
    │   ├── design.md       this page
    │   ├── vows.md         promises the quill keeps / practices the keeper keeps
    │   ├── quill.md        the command manual and the parse anchors
    │   └── warden.md       the autonomous turner, plainly explained
    ├── keep/keep.md        distillations of closed loops, newest first
    ├── rooms/<room>/       room.md (purpose + ledger) and one file per insight
    └── loops/
        ├── open/           loops still turning
        ├── closed/         loops that closed — moved whole, never deleted
        └── warden-journal.md   one line per autonomous run

## An insight, verbatim

    # Why words first

    saved: 2026-06-10
    room: the-castle
    source: my own head
    loop: 0001--the-castle-itself

    If the quill broke tomorrow, nothing would be lost. A text editor is
    enough to read the castle, and any pencil is enough to extend it.

`source:` is always exactly one of three honest values — `my own head`,
`loop NNNN, turn N`, or the URL of an invited page — so any reader can see
where any word came from by eye. An invited page's insight adds a `fetched:`
line, keeps every fetched word blockquoted under `## What the page said`, and
holds your reading separately under `## What I take from it`.

## A room, verbatim

    # Room: the castle

    purpose: the castle itself — how this system works and why
    founded: 2026-06-10

    ## Insights
    - 2026-06-10 — [why words first](2026-06-10--why-words-first.md)

A room is born with a typed one-line purpose, or not at all.

## A loop, verbatim

    # Loop 0001 — the castle itself

    opened: 2026-06-10
    status: open
    room: the-castle
    parent: none

    ## Field
    The castle — this system of words, rooms, and loops.

    ## Friction
    A new place starts empty and unproven.

    ## Better
    Saving an insight takes under a minute.

    ## Turns

    ### Turn 1 — 2026-06-10
    by: the keeper
    tried: Raised the castle.
    learned: The whole design fits in words.
    next: Live in it for a week, then record what rubbed.
    spawned: none

    ## Distilled
    (empty until the loop closes)

A turn that spawns children lists their names on its `spawned:` line, and each
child carries `parent: 0001--the-castle-itself` home. Values longer than a
line continue on lines indented two spaces. `by:` is `the keeper` (a hand) or
`the warden` (the autonomous turner) — every word signed.

## Closing — the creation creates

Closing happens inside a turn (closing is itself a turn of work). Reached: the
quill reads the Better back and asks *is this true now? what shows it?* — if
not, the loop simply stays open and the turn is kept. Let go: the honest *why*
counts as real material, not a consolation prize. Either way the quill insists
on one thing — the distillation. Then it offers each `learned:` line as an
insight, asks after a successor loop, writes the `## Distilled` section, moves
the file whole to `loops/closed/`, and sets the understanding into the keep:

    ## Distilled
    closed as: reached
    shown by: read the whole castle cold in under a minute
    understood: Saving became lighter than forgetting.
    closed by: the keeper
    successor: none
    children still turning: none

Loops reference each other by id-slug name (`0001--the-castle-itself`), never
by path, so the move from open to closed never rots a link.

## The internet, by invitation

Growth is organic because it follows need, not feeds: a turn wants outside
knowledge, so you type `invite <url>` — one deliberate act, one page. The
quill fetches only that URL (15 seconds, at most 3 redirects), and on any
failure saves nothing. Extraction is honest about itself: trimmed is declared,
rough is declared. No background refresh, no link-following, no tracking —
`invite` holds the only `fetch` in the code.

## The warden — autonomy, bounded and signed

The warden is the castle's autonomous turner: on a schedule (or by hand with
`warden once`) it picks the loop quiet longest and takes one real turn —
thinking done by Claude on this device's own CLI, written by the quill, signed
`by: the warden`. Its turns can spawn child loops, and those children come up
in its later rounds — autonomous loops creating autonomous loops. Its bounds
are code, not promises: one loop per run, at most 2 spawns per turn, at most
12 loops open, lineages at most 3 deep, every refusal written down, every run
journaled, and `warden stop` ends it with one command. The full account is in
`foundation/warden.md`.

## Why words first

Plain text is the only format that has never broken a promise. Everything else
here — the quill, the warden, the map — is replaceable; the files are not.

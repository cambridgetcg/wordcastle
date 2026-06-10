# The design

This page is the castle describing itself, in its own medium. A person with no
quill could keep the castle by hand from this file alone — every format is
shown exactly, and the code holds no castle state these files don't show. (The
warden's schedule is the one thing kept outside the walls, in a launchd plist;
the map and `warden status` report it.)

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
    ├── front/              the public face, rendered by publish — generated,
    │                       like map.md, and carried to the web only by hand
    └── loops/
        ├── open/           loops still turning
        ├── closed/         loops that closed — moved whole, never deleted
        ├── warden-journal.md     one line per autonomous run
        └── warden-launchd.log    the warden's console when run on schedule

## An insight — the exact shape

    # Why words first

    saved: 2026-06-10
    room: the-castle
    source: my own head
    loop: 0001--the-castle-itself

    If the quill broke tomorrow, nothing would be lost. A text editor is
    enough to read the castle, and any pencil is enough to extend it. The
    files are the system; the code is a convenience.

(That is the castle's actual first insight, whole.) `source:` is always
exactly one of three honest values — `my own head`, `loop NNNN, turn N`, or
the URL of an invited page — so any reader can see where any word came from by
eye. An invited page's insight adds a `fetched:` line, keeps every fetched
word blockquoted under `## What the page said`, and holds your reading
separately under `## What I take from it`.

## A room — the exact shape

    # Room: the castle

    purpose: the castle itself — how this system works and why
    founded: 2026-06-10

    ## Insights
    - 2026-06-10 — [why words first](2026-06-10--why-words-first.md)

A room is born with a typed one-line purpose, or not at all.

## A loop — the shape, abridged

(The prose under each heading is shortened here; the structure is exact. The
real first loop is `loops/open/0001--the-castle-itself.md`.)

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
line continue on lines indented two spaces. `by:` is `the keeper` (a human
hand) or `the warden` (the autonomous turner) — every word signed.

## Closing — the creation creates

Closing happens inside a turn (closing is itself a turn of work). Reached: the
quill reads the Better back and asks *is this true now? what shows it?* — if
not, the loop simply stays open and the turn is kept. Let go: the honest *why*
counts as real material, not a consolation prize. Either way the quill insists
on one thing — the distillation. Then it offers each `learned:` line as an
insight, asks after a successor loop, writes the `## Distilled` section, moves
the file whole to `loops/closed/`, and sets the understanding into the keep.

The Distilled section, exactly — reached on the left, let go on the right:

    ## Distilled                          ## Distilled
    closed as: reached                    closed as: let go
    shown by: <the evidence>              because: <the honest why>
    understood: <the distillation>        understood: <the distillation>
    closed by: the keeper                 closed by: the keeper
    successor: none                       successor: none
    children still turning: none          children still turning: none

And the keep entry it writes, exactly:

    ## 2026-06-17 — from loop 0001, the castle itself (reached)
    <the distillation, word for word>
    whole story: loops/closed/0001--the-castle-itself.md

Loops reference each other by id-slug name (`0001--the-castle-itself`), never
by path, so the move from open to closed never rots a link.

## The internet, by invitation

Growth is organic because it follows need, not feeds: a turn wants outside
knowledge, so you type `invite <url>` — one deliberate act, one page. The
quill fetches only that URL (15 seconds per request, at most 3 redirects), and
on any failure saves nothing. Extraction is honest about itself: trimmed is
declared, rough is declared. No background refresh, no link-following, no
tracking — `invite` holds the only page-fetch in the code.

## The warden — autonomy, bounded and signed

The warden is the castle's autonomous turner: on a schedule (or by hand with
`warden once`) it picks the loop quiet longest and takes one real turn —
thinking done by Claude on this device's own CLI (the castle's second road to
the world, open only while you keep the warden woken), written by the quill,
signed `by: the warden`, printed in full before writing. Its turns can spawn
child loops, and those children come up in its later rounds — autonomous loops
creating autonomous loops. Its bounds are code, not promises: one loop per
run, at most 2 spawns per turn, at most 12 loops open, lineages at most 3
deep, every refusal written down, every run journaled, and `warden stop` ends
it with one command. The full account is in `foundation/warden.md`.

## The front — a window, not a door

The castle is private by construction, but it can show a face: `publish`
renders `front/` — plain HTML of the five self-description pages plus every
insight or loop file the keeper marked with a `public: yes` line. The marking
is the whole protocol: no line, no leaving. Rendering makes no network call;
the front reaches the web only when the keeper carries it there (today it
stands behind Cambridge TCG, on the keeper's own Vercel team). Every front
page states when it was rendered and how many words are marked public, so the
window never pretends to show more — or less — than it does.

## Why words first

Plain text is the only format that has never broken a promise. Everything else
here — the quill, the warden, the map — is replaceable; the files are not.

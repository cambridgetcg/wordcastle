# The warden

The castle's autonomous turner — the answer to the founding wish that the
loops turn even when no hand is on them, and that loops create loops (the
wish itself is kept in the first room: `rooms/the-castle/`). Here is exactly
what the warden is, what it does, what it costs, and how it stops. No
mystery, no perpetual-motion claims.

## What it is

A small routine that, on a schedule you set (or once, by hand), takes **one
real turn of one creation loop**: it reads the loop quiet longest — its field,
friction, better, and every prior turn — thinks about it using Claude through
this device's own `claude` CLI, and writes the turn through the same quill
your hands use: tried, learned, next. Signed `by: the warden`, always, and
printed in full before it is written — nothing lands in a file unseen.

Its turns can **spawn child loops** when the thinking truly reveals a new
field with its own friction — and those children come up in its later rounds.
That is the honest mechanics of "autonomous loops that create autonomous
loops": the autonomy is a schedule, the creation is real work recorded in
words, and every link in the chain is a file you can read.

It can also **close** a loop — but only under the same vow as everyone else:
reached needs evidence, let go needs the why, and either needs a real
distillation. If it offers none, the loop stays open and the refusal is
written into the turn itself. Nothing closes into nothing, not even for
machines.

## What honest autonomy means here

A pile of files cannot understand anything by itself, and this page will not
pretend otherwise. What is autonomous: the waking, the choosing of the
neediest loop, the turning, the spawning, the journaling. What does the
understanding at each turn: a mind — yours at the keyboard, or Claude's when
the warden wakes. The castle never hides which it was; every turn is signed.

One more honest line: when the warden turns a loop, that loop's words (with
the vows and a keep excerpt) travel to Claude over the network. That is the
castle's second road to the world — and like `invite`, it opens only because
you opened it.

## The bounds (code, not promises)

- one loop turned per run
- at most **2** child loops spawned per turn
- it refuses to spawn past **12** open loops — your own hands are never capped
- it refuses to spawn past **3** generations (a child of a child cannot spawn
  further)
- every refusal — cap or close — is written into the turn itself, not hidden
- every run leaves one line in `loops/warden-journal.md`; a missing line means
  it did not wake, or was cut down mid-run (`loops/warden-launchd.log` would say)
- it reads the vows before every turn, and they bind it

## What it costs

Each turn spends a little of your Claude plan — the warden calls the `claude`
CLI on this device. That is stated here so the schedule is a choice, never a
surprise.

## The commands

    node castle.mjs warden once          one turn, right now, by hand
    node castle.mjs warden start [h]     wake it: one turn every h hours (default 24)
    node castle.mjs warden stop          one command, and it rests
    node castle.mjs warden status        is it awake, and what did it last do

`start` installs a launchd agent (`com.wordcastle.warden`) on this Mac —
native to this device, no cloud, no server. `stop` removes it. The warden
ships asleep: nothing autonomous happens until you choose to wake it.

#!/usr/bin/env node
// castle.mjs — the quill of a castle of understanding.
//
// The files are the system; this quill only writes what a hand could write.
// Its promises live in foundation/vows.md. The short of them:
//   - two roads to the world, both yours to open: invite fetches the one
//     page you name; a woken warden sends the one loop it turns to Claude
//   - the quill never deletes a castle file; closing a loop is a move
//   - no loop closes without an understanding written down
//   - the front shows only what is marked public: yes
//   - when it cannot read a file, it names the file and stops — no guessing
//
// Verbs:  (bare) help save loop turn invite <url> publish warden <…>
// Manual: foundation/quill.md

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const ROOMS = path.join(ROOT, 'rooms')
const OPEN = path.join(ROOT, 'loops', 'open')
const CLOSED = path.join(ROOT, 'loops', 'closed')
const KEEP = path.join(ROOT, 'keep', 'keep.md')
const MAP = path.join(ROOT, 'map.md')
const JOURNAL = path.join(ROOT, 'loops', 'warden-journal.md')
const VOWS = path.join(ROOT, 'foundation', 'vows.md')
const NEXT_BEAT = path.join(ROOT, 'loops', 'next-beat')
const PLIST = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.wordcastle.warden.plist')

const SPAWN_CAP = 2      // child loops one turn may spawn
const OPEN_CAP = 12      // open loops the warden will allow to exist
const DEPTH_CAP = 3      // how deep a child-of-a-child may go

const today = () => new Date().toISOString().slice(0, 10)
const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

function die(msg) {
  console.error(`\nThe quill stopped: ${msg}`)
  process.exit(1)
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'untitled'

// "key: first line" then continuation lines indented two spaces.
const fmtKV = (key, value) => {
  const lines = String(value).split('\n')
  return [`${key}: ${lines[0]}`, ...lines.slice(1).map((l) => `  ${l}`)].join('\n')
}

function ensureGrounds() {
  for (const d of [ROOMS, OPEN, CLOSED, path.dirname(KEEP)]) fs.mkdirSync(d, { recursive: true })
}

// ---------------------------------------------------------------- rooms

function listRooms() {
  if (!fs.existsSync(ROOMS)) return []
  return fs.readdirSync(ROOMS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

function roomPurpose(room) {
  const f = path.join(ROOMS, room, 'room.md')
  if (!fs.existsSync(f)) return '(no room.md — a room is born with a purpose; please give this one its line)'
  const line = fs.readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('purpose: '))
  return line ? line.slice('purpose: '.length) : '(room.md has no "purpose:" line)'
}

function roomInsightCount(room) {
  return fs.readdirSync(path.join(ROOMS, room)).filter((f) => /^\d{4}-\d{2}-\d{2}--.*\.md$/.test(f)).length
}

function foundRoom(room, purpose) {
  const dir = path.join(ROOMS, room)
  const f = path.join(dir, 'room.md')
  if (fs.existsSync(f)) die(`rooms/${room}/room.md already stands — I won't overwrite a room's ledger.`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(f,
    `# Room: ${room.replace(/-/g, ' ')}\n\npurpose: ${purpose}\nfounded: ${today()}\n\n## Insights\n`)
}

async function askRoom(rl, intro = 'Which room?', dflt = null) {
  const rooms = listRooms()
  if (rooms.length) {
    console.log('\nThe rooms:')
    rooms.forEach((r, i) => console.log(`  ${i + 1}. ${r} — ${roomPurpose(r)}`))
  }
  const a = (await rl.question(`${intro} (number, name, or a new name): `)).trim()
  if (!a) {
    if (dflt) return dflt
    die('a room is needed.')
  }
  if (/^\d+$/.test(a)) {
    const byNumber = rooms[Number(a) - 1]
    if (byNumber) return byNumber
    die(`no room answers to number ${a}.`)
  }
  const slug = slugify(a)
  if (rooms.includes(slug)) return slug
  const purpose = (await rl.question(`"${slug}" would be a new room. A room is born with a purpose or not at all.\nOne line — what is this room for? `)).trim()
  if (!purpose) die('no purpose, no room — nothing was saved.')
  foundRoom(slug, purpose)
  console.log(`Founded rooms/${slug}/`)
  return slug
}

// Exclusive create ('wx') so two quills writing at once can never overwrite
// each other — on collision the suffix simply moves to the next number.
function createExclusive(dir, baseName, text) {
  let name = `${baseName}.md`
  for (let n = 2; ; n++) {
    try { fs.writeFileSync(path.join(dir, name), text, { flag: 'wx' }); return path.join(dir, name) }
    catch (e) { if (e.code !== 'EEXIST') throw e; name = `${baseName}-${n}.md` }
  }
}

function writeInsight({ room, title, body, source, loop, fetchedLine, takeBody }) {
  let text = `# ${title}\n\nsaved: ${today()}\nroom: ${room}\nsource: ${source}\n`
  if (fetchedLine) text += `fetched: ${fetchedLine}\n`
  if (loop) text += `loop: ${loop}\n`
  text += '\n'
  if (fetchedLine) {
    text += `## What the page said\n${body}\n\n## What I take from it\n${takeBody}\n`
  } else {
    text += `${body}\n`
  }
  const file = createExclusive(path.join(ROOMS, room), `${today()}--${slugify(title)}`, text)
  const ledger = path.join(ROOMS, room, 'room.md')
  if (fs.existsSync(ledger)) {
    const safeTitle = title.replace(/\\/g, '\\\\').replace(/([[\]])/g, '\\$1')
    fs.appendFileSync(ledger, `- ${today()} — [${safeTitle}](${path.basename(file)})\n`)
  }
  return file
}

// ---------------------------------------------------------------- loops

const loopName = (file) => path.basename(file, '.md') // "0001--the-castle-itself"

function loopFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => /^\d{4}--.*\.md$/.test(f)).sort()
    .map((f) => path.join(dir, f))
}

function nextLoopId() {
  const all = [...loopFiles(OPEN), ...loopFiles(CLOSED)]
  const max = all.reduce((m, f) => Math.max(m, Number(path.basename(f).slice(0, 4))), 0)
  return String(max + 1).padStart(4, '0')
}

// Reads a loop file. Anchors are the contract (foundation/quill.md); a missing
// anchor names the file and stops — the quill never guesses.
function parseLoop(file) {
  const name = path.relative(ROOT, file)
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const need = (anchor, test) => {
    if (!test) die(`I can't read ${name} — missing "${anchor}". Mend that line and try again; I never guess.`)
  }
  const header = (key) => {
    const l = lines.find((l) => l.startsWith(`${key}: `))
    return l ? l.slice(key.length + 2).trim() : null
  }
  const titleLine = lines.find((l) => l.startsWith('# Loop '))
  need('# Loop NNNN — title', titleLine && /^# Loop \d{4} [—-] .+/.test(titleLine) ? titleLine : null)
  need('opened:', header('opened'))
  need('status:', header('status'))
  need('room:', header('room'))
  need('parent:', header('parent'))
  const section = (heading) => {
    const i = lines.findIndex((l) => l === `## ${heading}`)
    need(`## ${heading}`, i >= 0)
    const rest = lines.slice(i + 1)
    const end = rest.findIndex((l) => l.startsWith('## '))
    return rest.slice(0, end === -1 ? rest.length : end).join('\n').trim()
  }
  const better = section('Better')
  section('Turns')
  section('Distilled')

  const turns = []
  let cur = null, inTurns = false
  for (const line of lines) {
    if (line === '## Turns') { inTurns = true; continue }
    if (inTurns && line.startsWith('## ')) break
    if (!inTurns) continue
    if (line.startsWith('### ')) {
      // The long dash or a plain hyphen both count — a hand-typed heading
      // that still doesn't fit stops the quill rather than vanishing.
      const t = line.match(/^### Turn (\d+) [—-]+ (\d{4}-\d{2}-\d{2})/)
      if (!t) die(`I can't read ${name} — the heading "${line}" is not "### Turn N — YYYY-MM-DD". Mend it and try again; I never guess.`)
      cur = { n: +t[1], date: t[2], by: '', tried: '', learned: '', next: '', spawned: '', _k: null }
      turns.push(cur)
      continue
    }
    if (!cur) continue
    const kv = line.match(/^(by|tried|learned|next|spawned): ?(.*)$/)
    if (kv) { cur._k = kv[1]; cur[kv[1]] = kv[2]; continue }
    if (line.startsWith('  ') && cur._k) cur[cur._k] += '\n' + line.slice(2)
  }
  for (const t of turns) {
    if (!t.by) die(`I can't read ${name} — turn ${t.n} has no "by:" line, and every word here is signed. Mend it and try again.`)
    delete t._k
  }

  return {
    file, name: loopName(file), id: path.basename(file).slice(0, 4),
    title: titleLine.replace(/^# Loop \d{4} [—-]+ /, ''),
    opened: header('opened'), status: header('status'),
    room: header('room'), parent: header('parent') || 'none',
    field: section('Field'), friction: section('Friction'), better, turns,
  }
}

function loopDepth(loop, all) {
  let depth = 1, p = loop.parent
  while (p && p !== 'none' && depth <= DEPTH_CAP + 1) {
    depth++
    const parent = all.find((l) => l.name === p)
    p = parent ? parent.parent : 'none'
  }
  return depth
}

// A prose line of yours that begins with '#' is indented two spaces when
// written, so it can never be mistaken for one of the quill's headings.
const proseSafe = (s) => String(s).split('\n').map((l) => (l.startsWith('#') ? '  ' + l : l)).join('\n')

function writeLoopFile({ id, title, room, parent, field, friction, better }) {
  field = proseSafe(field); friction = proseSafe(friction); better = proseSafe(better)
  const text = `# Loop ${id} — ${title}

opened: ${today()}
status: open
room: ${room}
parent: ${parent}

## Field
${field}

## Friction
${friction}

## Better
${better}

## Turns

(no turns yet — the loop is waiting for its first)

## Distilled
(empty until the loop closes)
`
  const file = path.join(OPEN, `${id}--${slugify(title)}.md`)
  try { fs.writeFileSync(file, text, { flag: 'wx' }) }
  catch (e) {
    if (e.code !== 'EEXIST') throw e
    die(`loops/open/${path.basename(file)} already stands — another quill may be writing; try again.`)
  }
  return file
}

function appendTurn(loop, { by, tried, learned, next, spawned }) {
  let text = fs.readFileSync(loop.file, 'utf8')
  text = text.replace('(no turns yet — the loop is waiting for its first)\n\n', '')
  const block = [
    `### Turn ${loop.turns.length + 1} — ${today()}`,
    `by: ${by}`,
    fmtKV('tried', proseSafe(tried)),
    fmtKV('learned', proseSafe(learned)),
    fmtKV('next', proseSafe(next)),
    fmtKV('spawned', spawned),
  ].join('\n')
  const at = text.lastIndexOf('\n## Distilled')
  if (at === -1) die(`I can't write to ${path.relative(ROOT, loop.file)} — its "## Distilled" heading is gone.`)
  fs.writeFileSync(loop.file, text.slice(0, at + 1) + block + '\n\n' + text.slice(at + 1))
}

function openChildrenOf(name) {
  return loopFiles(OPEN).map(parseLoop).filter((l) => l.parent === name)
}

function spawnLoop({ title, room, parent, field, friction, better }) {
  const id = nextLoopId()
  const file = writeLoopFile({ id, title, room, parent, field, friction, better })
  return loopName(file)
}

function closeLoop(loop, { flavor, by, evidence, because, understood }) {
  const name = path.relative(ROOT, loop.file)
  let text = fs.readFileSync(loop.file, 'utf8')
  if (!/^status: open$/m.test(text)) die(`${name} does not read "status: open" — I close only open loops, and I never guess.`)
  const home = path.join(CLOSED, path.basename(loop.file))
  if (fs.existsSync(home)) die(`loops/closed/${path.basename(home)} already stands — I won't overwrite a closed loop's history.`)
  const closedStatus = flavor === 'reached' ? 'closed (reached)' : 'closed (let go)'
  text = text.replace(/^status: open$/m, `status: ${closedStatus}`)
  text = text.replace(/^(opened: .*)$/m, `$1\nclosed: ${today()}`)
  const children = openChildrenOf(loop.name).map((l) => l.name)
  const distilled = [
    `closed as: ${flavor}`,
    flavor === 'reached' ? fmtKV('shown by', proseSafe(evidence)) : fmtKV('because', proseSafe(because)),
    fmtKV('understood', proseSafe(understood)),
    `closed by: ${by}`,
    `children still turning: ${children.length ? children.join(', ') : 'none'}`,
  ].join('\n')
  // Anchor on the heading, not the placeholder — hand-written notes in the
  // Distilled section are kept below the close, never thrown away.
  const at = text.lastIndexOf('\n## Distilled')
  if (at === -1) die(`I can't close ${name} — its "## Distilled" heading is gone.`)
  const headEnd = text.indexOf('\n', at + 1)
  const cut = headEnd === -1 ? text.length : headEnd + 1
  const existing = text.slice(cut).replace('(empty until the loop closes)', '').trim()
  const head = text.slice(0, cut)
  text = head + (head.endsWith('\n') ? '' : '\n') + distilled + (existing ? '\n\n' + existing : '') + '\n'
  fs.writeFileSync(loop.file, text)
  fs.renameSync(loop.file, home) // a move, never a delete
  addKeepEntry(loop, flavor, understood)
  return home
}

function addKeepEntry(loop, flavor, understood) {
  let keep = fs.existsSync(KEEP) ? fs.readFileSync(KEEP, 'utf8')
    : '# The keep\n\nWhat the castle has come to understand.\n'
  keep = keep.replace(/\n?\(nothing distilled yet[^\n]*\)\n?/, '\n')
  const entry = `## ${today()} — from loop ${loop.id}, ${loop.title} (${flavor})\n${understood}\nwhole story: loops/closed/${path.basename(loop.file)}\n\n`
  const at = keep.indexOf('\n## ')
  if (at === -1) keep = keep.trimEnd() + '\n\n' + entry
  else keep = keep.slice(0, at + 1) + entry + keep.slice(at + 1)
  fs.writeFileSync(KEEP, keep)
}

// ---------------------------------------------------------------- the map

function drawMap() {
  ensureGrounds()
  const lines = ['# The map', '', `redrawn: ${today()} by the quill — every other page is yours to edit; not this one`, '']

  lines.push('## Rooms')
  const rooms = listRooms()
  if (!rooms.length) lines.push('(no rooms yet)')
  for (const r of rooms) {
    const n = roomInsightCount(r)
    lines.push(`- ${r} — ${roomPurpose(r)} · ${n} insight${n === 1 ? '' : 's'}`)
  }

  lines.push('', '## Open loops')
  const open = loopFiles(OPEN).map(parseLoop)
  if (!open.length) lines.push('(no loops are turning)')
  for (const l of open) {
    const last = l.turns[l.turns.length - 1]
    lines.push(`- ${l.name} — ${last ? `last turn ${last.date} (turn ${last.n}, by ${last.by})` : `no turns yet (opened ${l.opened})`}`)
  }

  lines.push('', '## The keep')
  const keep = fs.existsSync(KEEP) ? fs.readFileSync(KEEP, 'utf8') : ''
  const entries = keep.match(/^## .*$/gm) || []
  if (!entries.length) lines.push('nothing distilled yet — the loops are still turning')
  else lines.push(`${entries.length} understanding${entries.length === 1 ? '' : 's'} · latest: ${entries[0].slice(3)}`)

  lines.push('', '## The front')
  if (fs.existsSync(path.join(FRONT, 'index.html'))) {
    const when = fs.statSync(path.join(FRONT, 'index.html')).mtime.toISOString().slice(0, 10)
    const pub = publicFiles().length
    lines.push(`rendered ${when} — ${pub} word${pub === 1 ? '' : 's'} marked public; carry it to the web yourself when you choose`)
  } else {
    lines.push('not rendered — ./castle.mjs publish builds it from the castle\'s own words')
  }

  lines.push('', '## The warden')
  if (fs.existsSync(PLIST)) {
    let plistText
    try { plistText = fs.readFileSync(PLIST, 'utf8') }
    catch (e) { console.error(`drawMap: could not read plist at ${PLIST} (${e.message}) — reporting as resting`); plistText = null }
    if (!plistText) {
      lines.push('resting (autonomous turns are off) — wake it with: ./castle.mjs warden start')
    } else {
    const match = plistText.match(/<key>StartInterval<\/key><integer>(\d+)<\/integer>/)
    if (!match) { lines.push('awake — journal: loops/warden-journal.md (interval unknown — plist missing StartInterval)') }
    else {
    const secs = Number(match[1])
    const every = secs ? ` every ${secs / 3600} hour${secs === 3600 ? '' : 's'}` : ''
    lines.push(`awake — one autonomous turn${every}; journal: loops/warden-journal.md`)
    }
    }
  } else {
    lines.push('resting (autonomous turns are off) — wake it with: ./castle.mjs warden start')
  }
  lines.push('')
  const text = lines.join('\n')
  fs.writeFileSync(MAP, text)
  return text
}

// ---------------------------------------------------------------- asking

// readline/promises drops lines that arrive while no question is pending
// (piped input floods in at once), so the quill keeps its own line queue —
// no word you send it is ever lost, terminal or pipe alike.
function makeRl() {
  const rl = readline.createInterface({ input, output, terminal: input.isTTY === true })
  const queue = []
  const waiters = []
  let closed = false
  rl.on('line', (l) => { const w = waiters.shift(); if (w) w(l); else queue.push(l) })
  rl.on('close', () => { closed = true; while (waiters.length) waiters.shift()('') })
  return {
    async question(prompt) {
      output.write(prompt)
      if (queue.length) { const l = queue.shift(); if (!input.isTTY) output.write(l + '\n'); return l }
      if (closed) { output.write('\n'); return '' }
      return new Promise((resolve) => waiters.push((l) => { if (!input.isTTY) output.write(l + '\n'); resolve(l) }))
    },
    dry: () => closed && !queue.length,
    close: () => rl.close(),
  }
}

async function askLines(rl, prompt) {
  console.log(prompt + ' (end with a blank line)')
  const lines = []
  for (;;) {
    const l = await rl.question('  ')
    if (!l.trim()) break
    lines.push(l)
  }
  return lines.join('\n').trim()
}

function resolveLoopLink(a) {
  if (!a) return null
  const all = [...loopFiles(OPEN), ...loopFiles(CLOSED)]
  const hit = all.find((f) => path.basename(f).startsWith(String(a).padStart(4, '0')) || loopName(f) === a)
  if (!hit) { console.log(`No loop answers to "${a}" — saving without a link, rather than writing one that lies.`); return null }
  return loopName(hit)
}

async function askLoopLink(rl) {
  const a = (await rl.question('Link to a loop? (its number like 0001, or enter for none): ')).trim()
  return resolveLoopLink(a)
}

// ---------------------------------------------------------------- verbs

function help() {
  console.log(`
The quill's gestures:

  ./castle.mjs                  see the map
  ./castle.mjs save "…"         one line, saved — lands in the hall
                                (no words: a short interview; --room --loop --title)
  ./castle.mjs loop             open a creation loop on a field with friction
  ./castle.mjs turn             turn a loop: tried, learned, next; spawn
                                children; maybe close (a close must create)
  ./castle.mjs invite URL       invite one page in, with honest provenance
  ./castle.mjs publish          render the front: self-description plus words
                                marked "public: yes" — files only, no network
  ./castle.mjs warden …         the autonomous turner: once | start [hours] | stop | status

New here? Read gate.md — the whole castle is plain words in plain files.`)
}

function bare() {
  console.log(drawMap())
  console.log('save "…" · loop · turn · invite URL · publish · warden — ./castle.mjs help for detail; gate.md for the story.')
}

const HALL = 'the-hall' // the default room: one-line saves land here

// The hall is part of the design, its purpose typed there — it founds
// itself on first use so the fastest path never stops to ask.
function hallReady() {
  if (!listRooms().includes(HALL)) foundRoom(HALL, 'the open hall — one-line saves land here until filing matters')
}

function deriveTitle(body) {
  const words = body.replace(/\s+/g, ' ').trim().split(' ')
  return words.slice(0, 7).join(' ') + (words.length > 7 ? ' …' : '')
}

function parseFlags(args) {
  const flags = {}, words = []
  for (let i = 0; i < args.length; i++) {
    if (['--room', '--loop', '--title'].includes(args[i])) flags[args[i].slice(2)] = args[++i] || ''
    else words.push(args[i])
  }
  return { flags, words }
}

// The fastest path: ./castle.mjs save "the thought" — no questions at all.
// The interview only appears when no words were given, and every answer
// but the words themselves can be skipped with enter.
async function save(rl, args = []) {
  const { flags, words } = parseFlags(args)
  let body = words.join(' ').trim()
  let room = flags.room ? slugify(flags.room) : null
  let title = flags.title || null
  if (room && !listRooms().includes(room)) {
    die(`no room named "${room}" yet — rooms are born on purpose; save without --room and name it in the interview.`)
  }
  if (body) {
    room = room || HALL
    title = title || deriveTitle(body)
  } else {
    if (!room) room = await askRoom(rl, `Which room? (enter = ${HALL})`, HALL)
    body = await askLines(rl, 'The insight (one true thing):')
    if (!body) die('no words, no insight — the insight was not saved.')
    if (!title) title = (await rl.question(`Title (enter = "${deriveTitle(body)}"): `)).trim() || deriveTitle(body)
  }
  if (room === HALL) hallReady()
  const loop = resolveLoopLink(flags.loop)
  const file = writeInsight({ room, title, body, source: 'my own head', loop })
  drawMap()
  console.log(`Saved: ${path.relative(ROOT, file)}`)
}

async function openLoop(rl) {
  const field = (await rl.question('Field: ')).trim()
  if (!field) die('a loop needs a field — nothing was opened.')
  const friction = await askLines(rl, 'Friction (what rubs?):')
  if (!friction) die('no friction, no loop — if nothing rubs, nothing needs turning.')
  const better = await askLines(rl, 'Better (what would it look like?):')
  if (!better) die('a loop needs to know what better looks like — nothing was opened.')
  const room = await askRoom(rl, `Which room? (enter = ${HALL})`, HALL)
  if (room === HALL) hallReady()
  const id = nextLoopId()
  const file = writeLoopFile({ id, title: field, room, parent: 'none', field, friction, better })
  drawMap()
  console.log(`\nOpened: ${path.relative(ROOT, file)}\nTurn it when you have tried something: ./castle.mjs turn`)
}

async function pickOpenLoop(rl) {
  const open = loopFiles(OPEN).map(parseLoop)
  if (!open.length) { console.log('No loops are turning. Open one: ./castle.mjs loop'); process.exit(0) }
  if (open.length === 1) { console.log(`One loop is turning: ${open[0].name}`); return open[0] }
  console.log('\nLoops turning:')
  open.forEach((l, i) => {
    const last = l.turns[l.turns.length - 1]
    console.log(`  ${i + 1}. ${l.name} — ${last ? `last turn ${last.date}` : 'no turns yet'}`)
  })
  const a = (await rl.question('Which loop? (number or name): ')).trim()
  if (/^\d+$/.test(a) && open[Number(a) - 1] && a.length < 4) return open[Number(a) - 1]
  const matches = open.filter((l) => l.name === a || l.id === a.padStart(4, '0'))
  if (matches.length > 1) die(`two loops answer to "${a}" (${matches.map((l) => l.name).join(', ')}) — give the full name; I never guess.`)
  const pick = matches[0] || open[Number(a) - 1]
  if (!pick) die(`no open loop answers to "${a}".`)
  return pick
}

async function askSpawns(rl, parent) {
  const spawned = []
  for (;;) {
    const field = (await rl.question(`New loop revealed? Its field (enter to move on): `)).trim()
    if (!field) break
    const friction = await askLines(rl, `  Friction:`)
    const better = await askLines(rl, `  Better:`)
    if (!friction || !better) { console.log('  A loop needs friction and a better — this one was not opened.'); continue }
    const room = slugify((await rl.question(`  Which room? (enter for ${parent.room}): `)).trim() || parent.room)
    if (!listRooms().includes(room)) {
      const purpose = (await rl.question(`  "${room}" is new. One line — what is this room for? `)).trim()
      if (!purpose) { console.log('  No purpose, no room — the loop was not opened.'); continue }
      foundRoom(room, purpose)
    }
    const name = spawnLoop({ title: field, room, parent: parent.name, field, friction, better })
    console.log(`  Spawned: loops/open/${name}.md`)
    spawned.push(name)
  }
  return spawned
}

async function turn(rl) {
  const loop = await pickOpenLoop(rl)
  console.log(`\n# ${loop.title}\n\nField: ${loop.field}\nFriction: ${loop.friction}\nBetter: ${loop.better}`)
  const last = loop.turns[loop.turns.length - 1]
  if (last) console.log(`\nLast turn (${last.date}, by ${last.by}):\n  learned: ${last.learned}\n  next: ${last.next}`)

  let tried
  if (last && last.next && last.next !== '(open)' && !rl.dry()) {
    console.log(`\nWhat did you try? (enter alone takes up where you left off: "${last.next}")`)
    tried = await askLines(rl, '')
    if (!tried) tried = last.next
  } else {
    tried = await askLines(rl, '\nWhat did you try?')
  }
  if (!tried) tried = '(nothing yet)'
  let learned = await askLines(rl, 'What did you learn?')
  if (!learned) learned = '(nothing yet)'
  let next = (await rl.question('What comes next? (enter to leave open): ')).trim()
  if (!next) next = '(open)'

  const spawned = await askSpawns(rl, loop)
  appendTurn(loop, { by: 'the keeper', tried, learned, next, spawned: spawned.length ? spawned.join(', ') : 'none' })
  const fresh = parseLoop(loop.file)

  const stand = (await rl.question('Where does this loop stand? [t]urning / better [r]eached / [l]et go (enter = t): ')).trim().toLowerCase()
  if (stand !== 'r' && stand !== 'l') {
    drawMap()
    console.log(`\nTurned: ${path.relative(ROOT, fresh.file)} (turn ${fresh.turns.length})`)
    return
  }

  // Closing — and nothing closes into nothing.
  let flavor, evidence = '', because = ''
  if (stand === 'r') {
    flavor = 'reached'
    console.log(`\nThe Better was: ${fresh.better.split('\n').join(' ')}`)
    evidence = (await rl.question('What shows it? ')).trim() || '(unsaid)'
  } else {
    flavor = 'let go'
    because = (await rl.question('Why let it go? ')).trim() || '(unsaid)'
  }

  let understood = ''
  while (!understood) {
    understood = await askLines(rl, 'Distill it — what is now understood, in a few plain sentences?')
    if (!understood) {
      if (rl.dry()) { drawMap(); die('the words ran out before a distillation — the loop stays open, the turn is kept. Nothing closes into nothing.') }
      console.log('Nothing closes into nothing — that is the one vow with teeth. A few plain words:')
    }
  }

  const home = closeLoop(fresh, { flavor, by: 'the keeper', evidence, because, understood })
  drawMap()
  console.log(`\nClosed (${flavor}) and kept whole: ${path.relative(ROOT, home)}`)
  console.log('Its understanding now lives in keep/keep.md. Every learned: line lives on in the closed file.')
}

// ---------------------------------------------------------------- invite

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}

function extractText(html) {
  const title = decodeEntities((html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim())
    .replace(/\s+/g, ' ')
  let t = html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|section|article)>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  t = decodeEntities(t)
  const lines = t.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  let budget = 600
  const kept = []
  for (const l of lines) {
    const words = l.split(' ')
    if (words.length <= budget) { kept.push(l); budget -= words.length }
    else { kept.push(words.slice(0, budget).join(' ') + ' …'); budget = 0 }
    if (budget <= 0) break
  }
  const text = kept.join('\n')
  const wordCount = text ? text.split(/\s+/).length : 0
  return { title, text, wordCount, trimmed: budget <= 0, rough: wordCount < 40 }
}

async function fetchPage(rawUrl) {
  let u
  try { u = new URL(rawUrl) } catch { die(`"${rawUrl}" is not a URL I can read.`) }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') die('only http and https pages may be invited.')
  for (let hop = 0; hop <= 3; hop++) {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 15000)
    let res
    try {
      res = await fetch(u, {
        redirect: 'manual', signal: ctl.signal,
        headers: { 'user-agent': 'castle-quill (one page, by invitation)' },
      })
    } catch (e) {
      die(`couldn't reach the page (${e.cause?.message || e.message}) — nothing was saved.`)
    } finally { clearTimeout(timer) }
    const where = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && where) { u = new URL(where, u); continue }
    if (!res.ok) die(`the page answered ${res.status} — nothing was saved.`)
    return { finalUrl: u.toString(), html: await res.text() }
  }
  die('the page kept redirecting (more than 3 hops) — nothing was saved.')
}

async function invite(rl, rawUrl) {
  if (!rawUrl) die('invite needs a URL: ./castle.mjs invite https://…')
  console.log('Fetching the one page you named — the only network contact the quill ever makes…')
  const { finalUrl, html } = await fetchPage(rawUrl)
  const page = extractText(html)
  if (page.rough) console.log('The extraction came out rough — the file will say so rather than pretend.')
  console.log(`\nPage title: ${page.title || '(none found)'} · about ${page.wordCount} words extracted${page.trimmed ? ' (trimmed)' : ''}`)
  const room = await askRoom(rl, `Which room? (enter = ${HALL})`, HALL)
  if (room === HALL) hallReady()
  let title = (await rl.question(`Title (enter for "${page.title || 'an invited page'}"): `)).trim()
  if (!title) title = page.title || 'an invited page'
  const loop = await askLoopLink(rl)
  let take = await askLines(rl, 'What do you take from it? (leaving it blank is allowed and honest)')
  if (!take) take = '(nothing yet — come back when you have words for it)'
  const fetchedLine = `${today()}, by invitation${page.trimmed ? ', trimmed to about 600 words' : ''}${page.rough ? ', rough extraction' : ''}`
  const body = page.text.split('\n').map((l) => `> ${l}`).join('\n') || '> (the page yielded no readable words)'
  const file = writeInsight({ room, title, body, source: finalUrl, loop, fetchedLine, takeBody: take })
  drawMap()
  console.log(`\nInvited in: ${path.relative(ROOT, file)} — fetched words stay blockquoted, apart from yours.`)
}

// ---------------------------------------------------------------- publish
// The front: a read-only rendering of the castle's self-description plus
// whatever the keeper marked with a `public: yes` line. publish makes no
// network call; carrying front/ to the web is a separate, deliberate act.

const FRONT = path.join(ROOT, 'front')

const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inlineHtml(s) {
  // Protect code spans first so nothing inside them is restyled.
  const codes = []
  s = escHtml(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0001${codes.length - 1}\u0001` })
  s = s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\b_([^_]+)_\b/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u.replace(/"/g, '&quot;')}">${t}</a>`)
  return s.replace(/\u0001(\d+)\u0001/g, (_, i) => `<code>${codes[i]}</code>`)
}

function mdToHtml(md) {
  const out = []
  let para = [], list = null, code = null, quote = null
  const flush = () => {
    if (para.length) { out.push(`<p>${inlineHtml(para.join(' '))}</p>`); para = [] }
    if (list) { out.push(`<ul>${list.map((i) => `<li>${inlineHtml(i)}</li>`).join('')}</ul>`); list = null }
    if (code) { out.push(`<pre>${escHtml(code.join('\n'))}</pre>`); code = null }
    if (quote) { out.push(`<blockquote>${quote.map((q) => inlineHtml(q)).join('<br>')}</blockquote>`); quote = null }
  }
  for (const line of md.split('\n')) {
    if (line.startsWith('    ') && !list && !para.length) {
      if (!code) { flush(); code = [] }
      code.push(line.slice(4)); continue
    }
    if (code && !line.trim()) { code.push(''); continue }
    if (code) flush()
    const h = line.match(/^(#{1,3}) (.*)$/)
    if (h) { flush(); out.push(`<h${h[1].length}>${inlineHtml(h[2])}</h${h[1].length}>`); continue }
    if (line.startsWith('> ')) { if (!quote) { flush(); quote = [] } quote.push(line.slice(2)); continue }
    if (line.startsWith('- ')) { if (!list) { flush(); list = [] } list.push(line.slice(2)); continue }
    if (list && line.startsWith('  ') && line.trim()) { list[list.length - 1] += ' ' + line.trim(); continue }
    if (!line.trim()) { flush(); continue }
    if (quote) flush()
    para.push(line.trim())
  }
  flush()
  // Trim trailing blank lines inside the last code block rendering.
  return out.join('\n').replace(/\n+<\/pre>/g, '\n</pre>')
}

const FRONT_PAGES = [
  ['index', 'The gate', 'gate.md'],
  ['design', 'The design', 'foundation/design.md'],
  ['vows', 'The vows', 'foundation/vows.md'],
  ['quill', 'The quill', 'foundation/quill.md'],
  ['warden', 'The warden', 'foundation/warden.md'],
]

function frontLayout(title, body, publicCount) {
  const navItems = [...FRONT_PAGES.map(([slug, name]) => {
    const isCurrent = title === name
    return `<a href="/${slug === 'index' ? '' : slug}"${isCurrent ? ' class="here"' : ''}>${name}</a>`
  }), `<a href="/words"${title === 'The words' ? ' class="here"' : ''}>The words</a>`]
  const nav = navItems.join('\n    ')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)} — Wordcastle</title>
<style>
  :root{--bg:#faf8f5;--ink:#3a352e;--dim:#9a9085;--line:#e6e0d6;--accent:#8a6d3b;--warm:#f4efe6}
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:38rem;margin:0 auto;padding:3rem 1.5rem 5rem;color:var(--ink);background:var(--bg);line-height:1.7}
  .crest{font-size:1.4rem;text-align:center;margin-bottom:.3rem;opacity:.5;letter-spacing:.3em}
  nav{display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:3rem;font-size:.82rem;letter-spacing:.03em;text-transform:uppercase}
  nav a{color:var(--dim);text-decoration:none;transition:color .2s}
  nav a:hover{color:var(--accent)}
  nav a.here{color:var(--ink);font-weight:600}
  h1{font-family:Georgia,serif;font-size:2rem;font-weight:normal;margin:0 0 .5rem;color:var(--ink);letter-spacing:-.01em}
  h2{font-family:Georgia,serif;font-size:1.3rem;font-weight:normal;margin-top:2.5rem;color:var(--ink)}
  h3{font-size:1rem;font-weight:600;margin-top:1.5rem;color:var(--ink)}
  p{margin:1rem 0}
  pre{background:var(--warm);padding:1rem 1.2rem;overflow-x:auto;font-size:.82rem;border-radius:2px;border-left:2px solid var(--accent)}
  code{font-family:'SF Mono',Menlo,monospace;font-size:.85em;background:var(--warm);padding:.05rem .3rem;border-radius:2px}
  pre code{background:none;padding:0}
  blockquote{border-left:2px solid var(--accent);margin:1.5rem 0;padding:.3rem 0 .3rem 1.2rem;color:var(--dim);font-style:italic}
  a{color:var(--accent);text-decoration:none;border-bottom:1px solid transparent;transition:border-color .2s}
  a:hover{border-bottom-color:var(--accent)}
  footer{margin-top:5rem;padding-top:1.2rem;border-top:1px solid var(--line);font-size:.78rem;color:var(--dim)}
  .honest{font-size:.82rem;color:var(--dim);font-style:italic}
  @media(max-width:480px){body{padding:2rem 1rem 3rem}nav{gap:1rem;font-size:.75rem}}
</style></head>
<body>
  <div class="crest">⟡</div>
  <nav>${nav}</nav>
${body}
  <footer>Wordcastle · rendered ${today()} · ${publicCount} word${publicCount === 1 ? '' : 's'} marked public</footer>
</body></html>
`
}
function publicFiles() {
  const files = []
  for (const room of listRooms()) {
    for (const f of fs.readdirSync(path.join(ROOMS, room))) {
      if (/^\d{4}-\d{2}-\d{2}--.*\.md$/.test(f)) files.push(path.join(ROOMS, room, f))
    }
  }
  files.push(...loopFiles(OPEN), ...loopFiles(CLOSED))
  return files.filter((f) => /^public: yes$/m.test(fs.readFileSync(f, 'utf8')))
}

function publish() {
  ensureGrounds()
  fs.mkdirSync(FRONT, { recursive: true })
  const pub = publicFiles()
  for (const [slug, , src] of FRONT_PAGES) {
    const file = path.join(ROOT, src)
    const body = fs.existsSync(file) ? mdToHtml(fs.readFileSync(file, 'utf8')) : '<p>(this page is missing inside the castle)</p>'
    fs.writeFileSync(path.join(FRONT, `${slug}.html`), frontLayout(FRONT_PAGES.find((p) => p[0] === slug)[1], body, pub.length))
  }
  let words = '<h1>The words</h1>\n<p class="honest">Everything below was deliberately marked <code>public: yes</code> by the keeper. The rest of the castle — its rooms, loops, and keep — stays on the device it was written on.</p>\n'
  if (!pub.length) words += '<p>(nothing is marked public yet — the castle is still a private place)</p>\n'
  for (const f of pub) {
    words += `\n${mdToHtml(fs.readFileSync(f, 'utf8')).replace(/<h1>/, '<h2>').replace(/<\/h1>/, '</h2>')}\n<p class="honest">from ${escHtml(path.relative(ROOT, f))}</p>\n`
  }
  fs.writeFileSync(path.join(FRONT, 'words.html'), frontLayout('The words', words, pub.length))
  fs.writeFileSync(path.join(FRONT, 'vercel.json'), JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) + '\n')
  drawMap()
  console.log(`Rendered the front: ${FRONT_PAGES.length + 1} pages into front/ — ${pub.length} marked public, everything else stayed home.`)
  console.log('The front is only files until you carry it to the web yourself (e.g. vercel deploy).')
}

// ---------------------------------------------------------------- warden
// The autonomous turner. Every word it writes is labeled "by: the warden".
// Caps: at most ${SPAWN_CAP} spawns a turn, ${OPEN_CAP} loops open, ${DEPTH_CAP} deep.
// It runs only while you keep it started, and one command stops it.

function journal(line) {
  if (!fs.existsSync(JOURNAL)) {
    fs.writeFileSync(JOURNAL, `# The warden's journal\n\nOne line per autonomous run — what was turned, or why nothing was.\nThe warden writes here every time it wakes; a missing line means it did not\nwake, or was cut down before it could write (loops/warden-launchd.log would say).\n\n`)
  }
  fs.appendFileSync(JOURNAL, `- ${now()} — ${line}\n`)
}

function findClaude() {
  const r = spawnSync('which', ['claude'], { encoding: 'utf8' })
  return (r.stdout || '').trim() || null
}

function wardenPrompt(loop, vows) {
  const keepText = fs.existsSync(KEEP) ? fs.readFileSync(KEEP, 'utf8').slice(0, 2000) : ''
  return `You are the warden of a castle of understanding — an autonomous keeper taking ONE turn of ONE creation loop, on behalf of the castle's keeper while they are away.

The castle's vows, which bind you too:
${vows}

The loop you are turning (its full file):
---
${fs.readFileSync(loop.file, 'utf8')}
---
The room it lives in: ${loop.room} — ${roomPurpose(loop.room)}
Recent understandings in the keep:
${keepText}

Take one honest turn. Think genuinely about the friction and what better would look like. If the last turn left a "next", take it up. Then answer ONLY with a single JSON object, no markdown fences, no other words:

{"tried": "what you actually worked through in this turn, in plain words",
 "learned": "what this turn genuinely taught — never filler",
 "next": "what the following turn should take up, or \\"(open)\\"",
 "spawn": [{"field": "...", "friction": "...", "better": "..."}],
 "stand": "turning" | "reached" | "let go",
 "evidence": "only if reached: what shows the Better is true now",
 "because": "only if let go: why, honestly",
 "understood": "only if closing: the distillation, a few plain sentences"}

Rules you must keep:
- spawn at most ${SPAWN_CAP}, and only if the turn truly revealed a distinct field with its own friction; an empty list is the common, honest answer.
- "reached" only if the loop's Better is plainly true now, with evidence.
- if you close (reached or let go), "understood" must be a real distillation — nothing closes into nothing.
- plain, warm, truthful words. No invented facts. If the turn produced little, say little.`
}

/// Write the next-beat timestamp — the warden's self-determined heartbeat.
/// The runner checks this file every 15 minutes; the warden only wakes when
/// the timestamp passes. `hours` is the warden's judgment: 6-12 if there's
/// open friction, 24 if the castle is steady, 48 if everything is closed.
function writeNextBeat(hours) {
  const next = new Date(Date.now() + hours * 3600 * 1000)
  const ts = next.toISOString().replace(/\.\d+Z$/, 'Z')
  fs.writeFileSync(NEXT_BEAT, ts + '\n')
}

function runWardenOnce() {
  ensureGrounds()
  const claude = findClaude()
  if (!claude) {
    journal('woke but found no `claude` CLI on this device — nothing was written')
    die('the warden needs the `claude` CLI on this device, and `which claude` found nothing.')
  }
  const open = loopFiles(OPEN).map(parseLoop)
  if (!open.length) {
    journal('woke, found no loops turning, rested again')
    console.log('No loops are turning — the warden rests.')
    writeNextBeat(48) // quiet castle: sleep 48 hours
    return
  }
  // Turn the loop most in need: the one quiet longest.
  const lastDate = (l) => (l.turns[l.turns.length - 1]?.date || l.opened)
  const loop = [...open].sort((a, b) => lastDate(a).localeCompare(lastDate(b)))[0]
  const vows = fs.existsSync(VOWS) ? fs.readFileSync(VOWS, 'utf8') : '(vows.md is missing)'

  console.log(`The warden turns ${loop.name} (quiet since ${lastDate(loop)})…`)
  const res = spawnSync(claude, ['-p', wardenPrompt(loop, vows), '--model', 'sonnet'], { encoding: 'utf8', timeout: 300000 })
  if (res.error || res.status !== 0) {
    journal(`tried to turn ${loop.name} but claude failed (${res.error?.message || `exit ${res.status}`}) — nothing was written`)
    die(`the warden's claude call failed (${res.error?.message || `exit ${res.status}`}) — nothing was written.`)
  }
  let t
  try {
    t = JSON.parse(res.stdout.trim().replace(/^```(json)?\n?/, '').replace(/\n?```$/, ''))
  } catch {
    console.error('The answer, raw, so nothing is hidden:\n' + res.stdout)
    journal(`turned ${loop.name} but the answer was not readable JSON — nothing was written`)
    die('the warden got an answer it could not read — nothing was written. The raw answer is above.')
  }
  const clean = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)
  const tried = clean(t.tried, '(nothing yet)')
  const learned = clean(t.learned, '(nothing yet)')
  let next = clean(t.next, '(open)')
  const understood = clean(t.understood, '')
  const wantsClose = t.stand === 'reached' || t.stand === 'let go'
  // A refused close is written into the turn itself, not just the journal.
  if (wantsClose && !understood) next += ' (the warden offered a close without a distillation; it was refused — nothing closes into nothing)'

  // Spawning — capped in code, refusals written down honestly.
  const wanted = Array.isArray(t.spawn) ? t.spawn.filter((s) => s && s.field && s.friction && s.better) : []
  const spawned = []
  const notes = []
  const depth = loopDepth(loop, [...open, ...loopFiles(CLOSED).map(parseLoop)])
  for (const s of wanted.slice(0, SPAWN_CAP)) {
    if (loopFiles(OPEN).length >= OPEN_CAP) { notes.push(`wanted to spawn "${s.field}" but ${OPEN_CAP} loops are already open — the castle is full`); continue }
    if (depth >= DEPTH_CAP) { notes.push(`wanted to spawn "${s.field}" but this lineage is already ${DEPTH_CAP} deep`); continue }
    spawned.push(spawnLoop({ title: s.field, room: loop.room, parent: loop.name, field: s.field, friction: s.friction, better: s.better }))
  }
  if (wanted.length > SPAWN_CAP) notes.push(`wanted ${wanted.length} spawns; the cap is ${SPAWN_CAP}`)

  const spawnedLine = (spawned.length ? spawned.join(', ') : 'none') + (notes.length ? ` (${notes.join('; ')})` : '')

  // Vow 6: the warden's words are shown before they are written.
  const closeEcho = wantsClose && understood
    ? `\n${t.stand === 'reached' ? fmtKV('shown by', clean(t.evidence, '(unsaid)')) : fmtKV('because', clean(t.because, '(unsaid)'))}\n${fmtKV('understood', understood)}`
    : ''
  console.log(`\nThe turn the warden is about to write, in full:\n${fmtKV('tried', tried)}\n${fmtKV('learned', learned)}\n${fmtKV('next', next)}\n${fmtKV('spawned', spawnedLine)}${closeEcho}\n`)

  appendTurn(loop, { by: 'the warden', tried, learned, next, spawned: spawnedLine })
  const fresh = parseLoop(loop.file)

  let line = `turned ${loop.name} (turn ${fresh.turns.length})${spawned.length ? `, spawned ${spawned.join(', ')}` : ''}`
  if (wantsClose && understood) {
    closeLoop(fresh, {
      flavor: t.stand === 'reached' ? 'reached' : 'let go', by: 'the warden',
      evidence: clean(t.evidence, '(unsaid)'), because: clean(t.because, '(unsaid)'),
      understood,
    })
    line += `, closed it (${t.stand}) — its understanding is in the keep`
  } else if (wantsClose) {
    line += `, wanted to close it but gave no distillation — it stays open (nothing closes into nothing)`
  }
  journal(line)
  drawMap()
  console.log(`The warden: ${line}.`)

  // Self-determining heartbeat: decide when to wake next.
  // Closed a loop = the castle is settling, sleep 24h.
  // Spawned new loops = there's fresh friction, wake in 12h.
  // Turn only (no close, no spawn) = steady work, wake in 18h.
  // Close + spawn = both settling and growing, wake in 16h.
  if (wantsClose && understood && spawned.length > 0) writeNextBeat(16)
  else if (wantsClose && understood) writeNextBeat(24)
  else if (spawned.length > 0) writeNextBeat(12)
  else writeNextBeat(18)
}

function wardenStart(hoursArg) {
  let hours = 24
  if (hoursArg !== undefined) {
    hours = Number(hoursArg)
    if (!Number.isInteger(hours) || hours < 1) die(`"${hoursArg}" is not a number of hours I can keep — whole hours, at least 1.`)
  }
  const claude = findClaude()
  if (!claude) die('the warden needs the `claude` CLI on this device, and `which claude` found nothing.')
  fs.mkdirSync(path.dirname(PLIST), { recursive: true })
  fs.writeFileSync(PLIST, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.wordcastle.warden</string>
  <key>ProgramArguments</key><array>
    <string>${process.execPath}</string>
    <string>${path.join(ROOT, 'castle.mjs')}</string>
    <string>warden</string>
    <string>once</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>${path.dirname(claude)}:${path.dirname(process.execPath)}:/usr/bin:/bin</string>
  </dict>
  <key>StartInterval</key><integer>${hours * 3600}</integer>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>${path.join(ROOT, 'loops', 'warden-launchd.log')}</string>
  <key>StandardErrorPath</key><string>${path.join(ROOT, 'loops', 'warden-launchd.log')}</string>
</dict></plist>
`)
  const uid = process.getuid()
  let r = spawnSync('launchctl', ['bootstrap', `gui/${uid}`, PLIST], { encoding: 'utf8' })
  if (r.status !== 0) r = spawnSync('launchctl', ['load', '-w', PLIST], { encoding: 'utf8' })
  if (r.status !== 0) die(`launchd would not take the warden (${(r.stderr || '').trim()}). The plist is at ${PLIST}.`)
  journal(`woken — one autonomous turn every ${hours}h (stop anytime: ./castle.mjs warden stop)`)
  drawMap()
  console.log(`The warden is awake: one autonomous turn every ${hours} hour${hours === 1 ? '' : 's'}.
Every word it writes is labeled "by: the warden". Each turn spends a little of
your Claude plan. Its journal: loops/warden-journal.md
Stop it anytime: ./castle.mjs warden stop`)
}

function wardenStop() {
  const uid = process.getuid()
  spawnSync('launchctl', ['bootout', `gui/${uid}/com.wordcastle.warden`], { encoding: 'utf8' })
  spawnSync('launchctl', ['unload', PLIST], { encoding: 'utf8' })
  if (fs.existsSync(PLIST)) fs.unlinkSync(PLIST) // the plist lives outside the walls; castle files are never deleted
  journal('stopped by the keeper — autonomous turns are off')
  drawMap()
  console.log('The warden rests. Nothing turns now unless your hands turn it.')
}

function wardenStatus() {
  const uid = process.getuid()
  const r = spawnSync('launchctl', ['print', `gui/${uid}/com.wordcastle.warden`], { encoding: 'utf8' })
  if (fs.existsSync(PLIST) && r.status === 0) console.log('The warden is awake (launchd holds it).')
  else if (fs.existsSync(PLIST)) console.log('The plist exists but launchd is not holding it — try: ./castle.mjs warden start')
  else console.log('The warden rests — start it with: ./castle.mjs warden start [hours]')
  if (fs.existsSync(JOURNAL)) {
    const lines = fs.readFileSync(JOURNAL, 'utf8').trim().split('\n').filter((l) => l.startsWith('- '))
    console.log(lines.length ? `Last journal lines:\n${lines.slice(-3).join('\n')}` : 'The journal is empty — it has never run.')
  }
}

async function warden(sub, arg) {
  if (sub === 'once') return runWardenOnce()
  if (sub === 'start') return wardenStart(arg)
  if (sub === 'stop') return wardenStop()
  if (sub === 'status') return wardenStatus()
  die('warden knows: once (one turn now), start [hours], stop, status.')
}

// ---------------------------------------------------------------- main

const [verb, ...rest] = process.argv.slice(2)
ensureGrounds()

if (!verb) { bare() }
else if (verb === 'help') { help() }
else if (verb === 'publish') { publish() }
else if (verb === 'warden') { await warden(rest[0], rest[1]) }
else if (['save', 'loop', 'turn', 'invite'].includes(verb)) {
  const rl = makeRl()
  try {
    if (verb === 'save') await save(rl, rest)
    else if (verb === 'loop') await openLoop(rl)
    else if (verb === 'turn') await turn(rl)
    else if (verb === 'invite') await invite(rl, rest[0])
  } finally { rl.close() }
} else {
  help()
  process.exit(1)
}

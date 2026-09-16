/* tools/validate.js — item bank checks. Run after any edit to molecules.js.
 *
 *   node tools/validate.js
 *
 * Exits non-zero if the bank could produce an unanswerable or ambiguous item.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'js');
eval(fs.readFileSync(path.join(src, 'groups.js'), 'utf8'));
eval(fs.readFileSync(path.join(src, 'molecules.js'), 'utf8'));

const problems = [];
const warn = [];
const fail = (m, msg) => problems.push(m.id + ': ' + msg);

const seenIds = new Set();

for (const m of MOLECULES) {
  if (seenIds.has(m.id)) fail(m, 'duplicate id');
  seenIds.add(m.id);

  if (!m.tags || !m.tags.length) fail(m, 'no level tags, so it can never be drawn');
  if (!m.structure || !m.structure.pts) fail(m, 'no structure');

  const targets = m.bands.filter(b => b.t);
  if (!targets.length) fail(m, 'no scored bands');

  for (const b of m.bands) {
    if (b.g && !GROUPS[b.g]) fail(m, 'unknown group id "' + b.g + '"');
    if (!(b.c > 400 && b.c < 4000)) fail(m, 'band centre ' + b.c + ' is off the plotted axis');
    if (!(b.d > 0 && b.d <= 1)) fail(m, 'band at ' + b.c + ' has depth ' + b.d + ', expected 0-1');
    if (b.s !== 'l' && b.s !== 'g') fail(m, 'band at ' + b.c + ' has shape "' + b.s + '"');
    if (!b.t) continue;
    if (!b.g) fail(m, 'a scored band has no group');
    if (!b.tol) { fail(m, 'scored band at ' + b.c + ' has no tolerance window'); continue; }
    if (b.c < b.tol[0] || b.c > b.tol[1]) {
      fail(m, 'scored band centre ' + b.c + ' sits outside its window ' + b.tol.join('-'));
    }
    /* jitter must never push a peak out of its own window */
    const span = b.s === 'g' ? 18 : 6;
    if (b.c - span < b.tol[0] || b.c + span > b.tol[1]) {
      warn.push(m.id + ': ' + b.g + ' jitter reaches the edge of its window (clamped at run time)');
    }
  }

  /* two different groups must not share overlapping drop windows */
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      if (targets[i].g === targets[j].g) {
        fail(m, 'two scored bands share the group ' + targets[i].g +
                ', which makes the pairing ambiguous');
        continue;
      }
      const [a, b] = [targets[i].tol, targets[j].tol];
      if (a[0] < b[1] && b[0] < a[1]) {
        fail(m, 'drop windows overlap: ' + targets[i].g + ' ' + a.join('-') +
                ' vs ' + targets[j].g + ' ' + b.join('-'));
      }
    }
  }

  /* a band belonging to another group must not sit inside a drop window */
  for (const t of targets) {
    for (const o of m.bands) {
      if (o === t || !o.g || o.g === t.g) continue;
      if (o.c >= t.tol[0] && o.c <= t.tol[1]) {
        fail(m, o.g + ' at ' + o.c + ' sits inside the drop window for ' + t.g);
      }
    }
  }
}

/* every level must have enough molecules to fill it */
const NEEDED = { l2: 6, l3: 6 };
for (const tag of Object.keys(NEEDED)) {
  const n = MOLECULES.filter(m => m.tags.includes(tag)).length;
  if (n < NEEDED[tag]) problems.push('only ' + n + ' molecules tagged ' + tag + ', need ' + NEEDED[tag]);
}

/* Level 3 needs two same-level decoys of a different class for the compound question */
for (const m of MOLECULES.filter(m => m.tags.includes('l3'))) {
  const decoys = MOLECULES.filter(o => o.id !== m.id && o.cls !== m.cls).length;
  if (decoys < 2) problems.push(m.id + ': not enough compounds of another class to build the choices');
}

/* report family multiplicity, which is what Level 2 tile counts depend on */
const multi = [];
for (const m of MOLECULES) {
  const counts = {};
  for (const b of m.bands.filter(b => b.t)) {
    const f = GROUPS[b.g].family;
    counts[f] = (counts[f] || 0) + 1;
  }
  const dupes = Object.keys(counts).filter(f => counts[f] > 1);
  if (dupes.length) multi.push(m.id + ' needs ' + dupes.map(f => counts[f] + '× ' + FAMILIES[f].label).join(', '));
}

console.log(MOLECULES.length + ' molecules, ' + Object.keys(GROUPS).length + ' groups, ' +
            MOLECULES.reduce((n, m) => n + m.bands.filter(b => b.t).length, 0) + ' scored bands');
if (multi.length) {
  console.log('\nLevel 2 items needing a repeated family tile:');
  multi.forEach(l => console.log('  ' + l));
}
if (warn.length) {
  console.log('\nnotes:');
  warn.forEach(l => console.log('  ' + l));
}
if (problems.length) {
  console.log('\nPROBLEMS:');
  problems.forEach(l => console.log('  ' + l));
  process.exit(1);
}
console.log('\nbank is valid');

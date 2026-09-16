/* tools/answer-key.js — regenerates ANSWER_KEY.md from the item bank so the
 * teacher key can never drift away from what the activity actually draws.
 *
 *   node tools/answer-key.js > ANSWER_KEY.md
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'js');
eval(fs.readFileSync(path.join(src, 'groups.js'), 'utf8'));
eval(fs.readFileSync(path.join(src, 'molecules.js'), 'utf8'));

const out = [];
out.push('# Answer key — IR Spectroscopy: The Diagnostic Region');
out.push('');
out.push('Generated from `src/js/molecules.js` by `node tools/answer-key.js`. Do not hand-edit:');
out.push('change the band table and regenerate, so the key and the activity stay in step.');
out.push('');
out.push('**Scored bands** are the drop targets a student must label. The *drawn* value is the');
out.push('centre this package uses; the *accepted window* is the wavenumber range a label may be');
out.push('dropped in, chosen to match the range in a standard correlation table. Each spectrum is');
out.push('drawn with a small seeded jitter about the drawn value, so the peak a student sees moves');
out.push('by a few wavenumbers between attempts and always stays inside the accepted window.');
out.push('');
out.push('Supporting bands are drawn so the spectrum reads like a real one but are never targets.');
out.push('');

const byClass = {};
for (const m of MOLECULES) (byClass[m.cls] = byClass[m.cls] || []).push(m);

out.push('## Contents');
out.push('');
for (const cls of Object.keys(byClass)) {
  out.push('- **' + cls + '** — ' + byClass[cls].map(m => m.name).join(', '));
}
out.push('');

for (const m of MOLECULES) {
  out.push('## ' + m.name);
  out.push('');
  out.push('`' + m.id + '` · ' + m.cls + ' · ' + m.formula +
           ' · appears in ' + m.tags.map(t => 'Level ' + t.slice(1)).join(' and '));
  out.push('');
  out.push('| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |');
  out.push('| --- | ---: | :---: | :---: | --- |');
  for (const b of m.bands.filter(b => b.t)) {
    const g = GROUPS[b.g];
    out.push('| ' + g.label + ' | ' + b.c + ' | ' + b.tol[0] + '–' + b.tol[1] +
             ' | ' + g.range + ' | ' + g.hint + ' |');
  }
  const extra = m.bands.filter(b => !b.t);
  if (extra.length) {
    out.push('');
    out.push('Supporting bands (drawn, not scored): ' +
             extra.map(b => b.c).sort((a, b) => b - a).join(', ') + ' cm⁻¹.');
  }
  out.push('');
}

out.push('## Level 2 vs Level 3');
out.push('');
out.push('Level 2 asks for the **family** of each scored band, so any carbonyl is just “C=O”.');
out.push('Level 3 asks for the **specific group**, so the student has to separate ester from');
out.push('ketone from acid from amide using the discriminator column above.');
out.push('');
out.push('| Family | Specific groups it covers |');
out.push('| --- | --- |');
for (const f of Object.keys(FAMILIES)) {
  const members = Object.keys(GROUPS).filter(k => GROUPS[k].family === f)
    .map(k => GROUPS[k].label);
  out.push('| ' + FAMILIES[f].label + ' | ' + members.join(', ') + ' |');
}
out.push('');

console.log(out.join('\n'));

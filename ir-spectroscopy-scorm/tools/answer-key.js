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
out.push('**Every scored band is above 1500 cm⁻¹.** The fingerprint region is drawn and is listed');
out.push('below for each compound, but nothing there is ever a drop target — including C–O, which');
out.push('is named so you can point at it in class without the activity asking students to label it.');
out.push('');
out.push('The sp² and sp³ C–H windows meet exactly at 3000 cm⁻¹, the line drawn on the plot.');
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
  const levelOf = { find: 'Level 1', name: 'Level 2' };
  out.push('`' + m.id + '` · ' + m.cls + ' · ' + m.formula +
           ' · theme `' + m.theme + '` · appears in ' +
           m.tags.map(t => levelOf[t] || t).join(' and '));
  out.push('');
  out.push('| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |');
  out.push('| --- | ---: | :---: | :---: | --- |');
  for (const b of m.bands.filter(b => b.t)) {
    const g = GROUPS[b.g];
    out.push('| ' + g.label + ' | ' + b.c + ' | ' + b.tol[0] + '–' + b.tol[1] +
             ' | ' + g.range + ' | ' + g.hint + ' |');
  }
  const named = m.bands.filter(b => !b.t && b.g);
  if (named.length) {
    out.push('');
    out.push('Drawn but never scored: ' +
             named.map(b => GROUPS[b.g].label + ' at ' + b.c).join(', ') + ' cm⁻¹ — ' +
             'below the 1500 line, so it is corroboration rather than a question.');
  }
  const extra = m.bands.filter(b => !b.t && !b.g);
  if (extra.length) {
    out.push('');
    out.push('Supporting bands (drawn, not scored): ' +
             extra.map(b => b.c).sort((a, b) => b - a).join(', ') + ' cm⁻¹.');
  }
  out.push('');
}

out.push('## Level 1 vs Level 2');
out.push('');
out.push('Level 1 asks for the **family** of each scored band, so any carbonyl is just “C=O”.');
out.push('Level 2 asks for the **specific group**, so the student has to separate ester from');
out.push('ketone from acid from amide using the discriminator column above.');
out.push('');
out.push('The four C–H groups are the exception: they are asked for by name at **both** levels.');
out.push('A single “C–H” tile would make the sp² and sp³ peaks interchangeable, which is the');
out.push('distinction the 3000 cm⁻¹ line exists to teach.');
out.push('');
out.push('| Level 1 asks for | Which covers |');
out.push('| --- | --- |');
for (const key of UNIVERSE.family) {
  const members = FAMILIES[key]
    ? Object.keys(GROUPS).filter(k => GROUPS[k].family === key && !GROUPS[k].atomic &&
                                      !GROUPS[k].fingerprint).map(k => GROUPS[k].label)
    : ['asked by name at both levels'];
  out.push('| ' + keyLabel(key) + ' | ' + members.join(', ') + ' |');
}
out.push('');

console.log(out.join('\n'));

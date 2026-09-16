# IR Spectroscopy — The Diagnostic Region

A click-and-drag SCORM 1.2 activity for Schoology. Students label the peaks in the
diagnostic region of an IR spectrum with the functional group that produced them.

Built to sit alongside the functional-group identification activity: same drag-a-label
interaction, but the target is a spectrum instead of a structure.

---

## Where the spectra come from

**Every spectrum is generated, not scanned.** `src/js/molecules.js` holds an empirical band
table for each compound — centre, width, depth and shape for each absorption. The renderer
in `src/js/spectrum.js` sums those band profiles and converts to percent transmittance:

```
T(v) = baseline(v) × ∏ (1 − depth × profile(v))
```

Lorentzian profiles give the sharp bands; broad Gaussians give the hydrogen-bonded O–H
envelopes. A seeded jitter moves each band a few wavenumbers and adds faint detector noise,
so the same compound never draws twice identically and students have to read the chemistry
rather than recognise a picture.

Three reasons this beats scraping a spectral database:

1. **Nothing is redistributed.** SDBS and similar databases prohibit systematic downloading
   and redistribution of their spectra, which a package you hand out through an LMS would
   plainly be. Nothing here is copied from anyone.
2. **Peak positions are known exactly**, so a drop can be scored against a defined
   wavenumber window instead of hand-annotated pixel coordinates on a JPEG.
3. **It scales.** The plot is redrawn at the container's size, so it stays crisp in a
   Schoology iframe, on a Chromebook and on a phone.

Every band value is listed with its expected literature range in `ANSWER_KEY.md`.

### Adding real spectra later

`spectrum.js` plots from a sampled curve, so a JCAMP-DX (`.jdx`) loader would drop in
without touching the game logic. NIST WebBook files are public domain and can be downloaded
by hand. That path is deliberately not built yet — it is not needed for the activity to work.

---

## The two levels

| Level | Name | What the student does |
| --- | --- | --- |
| 1 | Find the band | The compound is named and drawn. The student drags each **bond family** (C=O, O–H, C≡N …) onto the peak it produced. Correlation table available. Seven spectra. |
| 2 | Name the group | The compound is hidden. The student labels each marked peak with the **specific** group — ester vs ketone vs acid vs amide, 1° vs 2° amine — then identifies the compound from three structures. No correlation table. Seven spectra. |

Levels unlock in order. Wrong answers are never penalised: the tile returns to the tray and
the feedback line explains the discriminator, e.g. dropping *C=O (ketone)* on ethyl
acetate's 1742 cm⁻¹ band returns

> Not at 1742 cm⁻¹. Near 1740, higher than a ketone, and the strong C–O it pairs with shows
> up in the fingerprint region.

That explanation is the point of the activity; the score is incidental.

### Only the diagnostic region is scored

Every drop target is above 1500 cm⁻¹. Bands below that line — C–O single bonds, NO₂
symmetric stretch, aromatic out-of-plane bends — are drawn, and C–O is named in the
correlation table and the answer key, but a student is never asked to label one. Groups
marked as fingerprint are excluded from the distractor pool too, so nobody is told a
compound "has no C–O" when it plainly does.

`tools/validate.js` enforces this: a scored band below 1500 fails the build.

### Two dotted lines

The plot draws a dashed divider at **3000 cm⁻¹** and another at **1500 cm⁻¹**, captioned on
either side. The 1500 line separates the diagnostic region from the fingerprint. The 3000
line separates sp² C–H from sp³ C–H, and the item bank is built so nothing straddles it:
the sp² accepted window starts at exactly 3000 and the sp³ window ends at exactly 3000.

Because of that line, the four C–H groups — sp³, sp², ≡C–H and aldehyde C–H — are asked for
**by name at both levels**. Collapsing them into one "C–H" tile at Level 1 would make the
peaks on either side of 3000 interchangeable, which is precisely the distinction being
taught.

### Compounds in the bank

22 compounds spanning the Organic I diagnostic set: alkane, alkene, terminal alkyne,
arene, alcohol, phenol, ether, carboxylic acid (aliphatic and aromatic), ester, ketone,
aryl ketone, aldehyde, aromatic aldehyde, 1° and 2° amide, 1° and 2° amine, nitrile, nitro,
acid chloride and anhydride.

The draw is **balanced by theme, not purely random.** Each molecule carries a `theme`
(`oh`, `acid`, `co`, `nh`, `hc`, `triple`, `other`) and every level takes one compound per
core theme before filling the last place freely. A run therefore always contains an
alcohol, a carboxylic acid, a carbonyl, an N–H compound, a plain hydrocarbon and a triple
bond — which compound fills each place still varies, so a retry is a different set.

`tools/validate.js` fails if any level's pool is missing a theme, so a class of compound
can't silently drop out of rotation.

---

## Grading

**Completion only.** The SCO writes `cmi.core.lesson_status = "completed"` once a student
finishes both levels and writes no numeric score, so the Schoology column reads
complete / incomplete rather than a percent.

Students still see their own first-try accuracy on the level-complete and finish screens —
it just isn't reported.

To report a percent instead, set `cmi.core.score.raw` alongside the status in
`markComplete()` in `src/js/scorm.js` and add an `<adlcp:masteryscore>` to
`src/imsmanifest.xml`.

Progress is saved to `cmi.suspend_data` after every answer, so a student who closes the
window mid-activity resumes where they left off. It also mirrors to `localStorage`, which
is what makes resume work when the activity is opened outside an LMS.

---

## Building and uploading

```bash
./build.sh                    # → dist/ir-diagnostic-region-v1.zip
./build.sh ir-unit7-practice  # → dist/ir-unit7-practice.zip
```

`imsmanifest.xml` has to sit at the root of the zip, which is why `build.sh` zips from
inside `src/` rather than from the project root. Zipping the `src` folder itself will
produce a package Schoology rejects.

To upload:

1. In your Schoology course, **Add Materials → Add File/Link/External Tool → Add File**
   and upload `dist/ir-diagnostic-region-v1.zip`, or use **Add Materials → Package** if
   your install shows it.
2. Schoology detects the SCORM manifest and creates a SCORM item.
3. Open the item's settings and enable the gradebook column if you want completion tracked.
   With completion-only reporting the column will show complete/incomplete.
4. Open it once as a student (Preview as Student) to confirm the badge in the top right
   reads **Connected to the LMS**.

If that badge reads **Standalone — no LMS detected** inside Schoology, the SCO could not
find the SCORM API. That is almost always a nesting problem, not a code problem — check
that Schoology launched the package as SCORM rather than serving the zip as a plain file.

### Testing without an LMS

Open `src/index.html` directly in a browser. The activity runs identically; the badge reads
*Standalone* and nothing is reported.

### Putting one named spectrum on the board

Append a query string to show a single compound, useful for a lesson demo:

```
src/index.html?molecule=ethylacetate&level=3
```

`molecule` is any `id` from `ANSWER_KEY.md`; `level` is 1 or 2 (default 2). A pinned
spectrum never writes to saved progress, so demoing in class will not disturb a student's
resume state.

---

## Editing the content

Everything a teacher would want to change lives in two files.

**`src/js/molecules.js`** — the compound bank. To add a compound, copy an existing entry:

```js
{
  id: 'propanenitrile', name: 'Propanenitrile', formula: 'C₃H₅N', cls: 'Nitrile',
  theme: 'triple',                           // draw bucket; see the bank notes above
  tags: ['find', 'name'],                    // which levels may draw it
  structure: { pts: [...], bonds: [...], labels: {...} },
  bands: [
    { g: 'cn_nitrile', c: 2250, w: 18, d: 0.52, s: 'l', tol: [2180, 2300], t: true },
    { g: null,         c: 1460, w: 28, d: 0.38, s: 'l' }
  ]
}
```

- `g` is a group id from `src/js/groups.js`, or `null` for a band that is drawn but never
  scored.
- `c` centre, `w` full width at half maximum, `d` depth 0–1, `s` is `'l'` Lorentzian or
  `'g'` Gaussian.
- `tol` is the window a label may be dropped in; `t: true` makes the band a drop target.
  A drop target must be above 1500 cm⁻¹.

**`src/js/groups.js`** — the label vocabulary and, importantly, the `hint` string shown as
feedback. That is where to put the wording you use in class.

After any edit, validate and regenerate the key:

```bash
node tools/validate.js         # catches overlapping drop windows and bad group ids
node tools/answer-key.js > ANSWER_KEY.md
./build.sh
```

`tools/validate.js` is worth running every time. It refuses a bank where:

- two different groups have overlapping drop windows in the same molecule, or another
  group's band sits inside a target's window — either would make a question ambiguous;
- a drop target sits below 1500 cm⁻¹, or on a group marked `fingerprint`;
- an sp² C–H window does not start at exactly 3000, or an sp³ window does not end there;
- a level's pool is missing one of the core themes.

---

## Layout

```
ir-spectroscopy-scorm/
├── src/
│   ├── imsmanifest.xml      SCORM 1.2 manifest — must be at the zip root
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── groups.js        functional group vocabulary and feedback wording
│       ├── molecules.js     the compound bank — band tables and structures
│       ├── spectrum.js      band model and canvas renderer
│       ├── structures.js    skeletal structure SVG renderer
│       ├── scorm.js         SCORM 1.2 run-time wrapper
│       └── game.js          levels, drag and drop, progression
├── tools/
│   ├── validate.js          item bank checks
│   └── answer-key.js        regenerates ANSWER_KEY.md
├── build.sh
├── ANSWER_KEY.md            generated — every band with its literature range
└── README.md
```

No CDN, no web fonts, no network calls of any kind — about 76 KB of source, a 28 KB zip,
and it works offline inside a locked-down LMS iframe.

A built `dist/ir-diagnostic-region-v1.zip` is committed, so you can download and upload it
without running the build.

## Accessibility

Every drop works three ways, so it does not assume a mouse: pointer drag, click-the-label
then click-the-peak, and keyboard (tab to a label, Enter, tab to a peak, Enter). Peaks and
labels carry text alternatives naming their wavenumber, feedback is announced through an
ARIA live region, and `prefers-reduced-motion` disables the shake animation. Colour is never
the only signal — correct placements also change border style and show the label text.

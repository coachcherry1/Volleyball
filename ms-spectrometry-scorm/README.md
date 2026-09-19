# Mass Spectrometry — Reading the Fragments

A click-and-drag SCORM 1.2 activity for Schoology. Students label the peaks in an EI
mass spectrum, name the cations that produced them, and finally predict which peak will
be the base peak from the structure alone.

Built as a companion to the IR diagnostic-region activity: same drag-a-label interaction,
same three-level arc, same accessibility guarantees. The chemistry is different, and so is
the central question — IR asks *which bond is this*, mass spec asks *which cation was
stable enough to survive*.

---

## The one idea the whole package is built on

**The tall peaks are the stable cations.** 3° > 2° > 1° > methyl, with resonance beating
all of them. Every level, every hint and every piece of feedback comes back to that.

Four mechanisms, and no more:

| Mechanism | What breaks | Why the cation survives |
| --- | --- | --- |
| **α-cleavage** | the bond next to a heteroatom | the lone pair pushes in and shares the charge — an oxocarbenium, an acylium, an iminium |
| **Dehydration** | an alcohol throws off water | −18, the alcohol flag |
| **Branch-point cleavage** | the bond at the most substituted carbon | 3° > 2° > 1°; *tert*-butyl at m/z 57 is the showcase |
| **Benzylic cleavage** | the bond one carbon out from a ring | benzyl expands to tropylium, m/z 91 |

The McLafferty rearrangement is deliberately not taught. See
[The McLafferty decision](#the-mclafferty-decision) below for how the bank stays honest
about it anyway.

---

## Loss view and ion view — why there are two labelling levels

A peak can be named two ways, and they are not the same question:

- the **loss** view — *"that peak is M minus 43"* — is arithmetic
- the **ion** view — *"that 43 is an acylium, CH₃C≡O⁺"* — is chemistry

The gap between them is where the teaching happens. **CH₃CO⁺ sits at m/z 43 in both
acetone and 2-butanone** — but it is a loss of 15 from one and a loss of 29 from the
other. A loss is therefore computed per compound at run time rather than stored on the
ion; only the ion id lives in the bank.

This is also what makes −29 and −43 worth an entire unit. At Level 1 a peak is "−43". At
Level 2 the student has to decide *which* 43: a propyl cation, which needs three carbons
in a row, or an acylium, which needs a C=O. Four masses in this bank carry that
ambiguity — 29, 43, 57 and 105 — and `ANSWER_KEY.md` tables all of them with what
settles each one.

---

## The three levels

| Level | Name | What the student does |
| --- | --- | --- |
| 1 | **Read the losses** | The compound is named and drawn. Label each marked peak with what the molecule lost: −15, −18, −29, −43. Reference table available. Six spectra. |
| 2 | **Name the ion** | The compound is hidden. Name the cation each marked peak actually is, then identify the compound from three structures. **Tiles carry formulas, never m/z values**, so a student must count the formula rather than match a number to the axis. Six spectra. |
| 3 | **Predict the base peak** | **No spectrum.** From the structure alone, choose which cleavage gives the most stable cation, then work out where it lands. The spectrum is revealed afterwards, annotated, as the answer. Six compounds. |

Levels unlock in order. Wrong answers are never penalised: the tile returns to the tray
and the feedback explains the discriminator.

Eighteen items is a full class period. To shorten it, change `items` in the `LEVELS` table
at the top of `src/js/game.js`; each level needs at least five to keep one compound per
theme.

### Level 3 in detail

Two questions per compound, both answerable from the structure:

1. **Which cation is most stable?** Every competing cleavage is offered as a card with its
   formula, its name and its mechanism. Picking a loser explains *why* it loses.
2. **At what m/z does it appear?** The arithmetic, with the masses of the losing routes
   offered as decoys — every option is a number a student could genuinely have reached.

Only then does the spectrum appear, with the full ordering of routes spelled out
underneath it.

A compound is only eligible for Level 3 if it offers **two or more competing cleavages** —
`tools/validate.js` refuses the tag otherwise. That rules out *tert*-butanol, where one
route dominates so completely there is nothing to weigh, and benzaldehyde, whose base peak
is the molecular ion itself.

---

## Learning to ignore the noise

This is not a level. It is a property of every single item — a spectrum draws 15–25 peaks
and asks about 2–4 of them. Three mechanisms do the work:

**1. A threshold line.** Every plot carries a dashed line at 5% of the base peak, captioned
*below this line — don't read it*. It is the direct structural analogue of the 1500 cm⁻¹
line in the IR package. Peaks below it are drawn in a lighter ink — but colour is never the
only signal, because the line is drawn and captioned and every quiet peak says so when
clicked.

**2. Every non-answer peak explains itself.** Click any stick and it tells you why it is
not one of the answers. There are five different reasons, and they are not interchangeable:

- *below the line* — "m/z 38 is 2% of the base peak. Not worth your attention."
- *chatter* — "m/z 41 is 42%, well above the line, so it is a real peak. But it narrows
  nothing down: almost every chain of this length throws one off."
- *a ring breaking up further* — for m/z 51 and 65, which corroborate a ring and nothing more
- *an isotope peak* — M+1, M+2, or a ¹³C satellite, with the carbon-counting lesson attached
- *a rearrangement* — the McLafferty peaks, below

**3. Real ions that are simply not the marked peak.** The second reason above would be a lie
about benzaldehyde's m/z 29, which genuinely *is* the formyl cation. So a cluster peak whose
ion is resonance-stabilised or tertiary gets a different message — "it really is CHO⁺, it is
genuine chemistry, it is just not one of the peaks marked for you here."

A few peaks carry a hand-written `note` that overrides all of the above, because the stock
wording would mislead. CH₂=OH⁺ turning up at 25% in *2-butanol* is the clearest case: the
stock hint says *m/z 31 means a primary alcohol*, which would be exactly the wrong lesson
in a secondary alcohol. Those peaks say instead that reaching m/z 31 there takes a hydrogen
shift, and that the landmark only holds when m/z 31 is the **base peak**.

---

## Where the spectra come from

**Every spectrum is generated, not scanned.** `src/js/compounds.js` holds a peak table per
compound — m/z, relative abundance, the ion, and the role it plays. Nothing is copied from
a spectral database, which matters for the same reason it does in the IR package: SDBS and
similar databases prohibit systematic redistribution, which a package handed out through an
LMS plainly is.

Three things are **added** at draw time rather than typed into the bank:

- **Isotope peaks.** M+1 from the carbon count (1.1% per carbon) and M+2 from any chlorine
  (32%) or bromine (97%), computed from the molecular formula. They cannot be entered wrong,
  and the M+1 height really does count the carbons.
- **¹³C satellites** on every substantial fragment — the same effect one level down.
- **Noise** — a seeded scatter of sticks at 0.4–3%, fresh on every draw.

Abundances wobble a few percent from draw to draw, so a student cannot memorise a picture.
**Peak positions never move**: unlike an IR band, 43 is 43.

Relative intensities are rounded and idealised. Peak *identities* and base peaks are the
real ones — but if you want a compound's numbers to match a particular reference more
closely, they are one edit away in `compounds.js` and `ANSWER_KEY.md` regenerates from them.

### The arithmetic is machine-checked

A mass spectrum is arithmetic, so the arithmetic can be verified. `tools/validate.js`
parses every molecular formula and every ion formula and checks that

```
ion formula + neutral lost = molecular formula
```

with no negative atom counts anywhere. A mistyped m/z cannot survive that check, and the
build fails rather than shipping a spectrum that does not add up. The validator shares its
formula parser with the renderer, so the numbers students see are checked by the same code
that draws them.

---

## Isotope patterns

The M+2 peak is a drop target for the three halogen compounds, because reading it *is* the
lesson:

- **chlorine** — M+2 about a third the height of M⁺ (³⁵Cl : ³⁷Cl is 3:1)
- **bromine** — M+2 about equal to M⁺ (⁷⁹Br : ⁸¹Br is 1:1)

M+1 is never a drop target — it would be a tedious click — but it is drawn on every
compound with a visible molecular ion, and clicking it teaches the carbon count.

The **nitrogen rule** is taught through the amines: 1-propanamine's molecular ion at 59 and
diethylamine's at 73 are both odd, and the feedback says why.

---

## When there is no molecular ion

*tert*-Butanol and isooctane produce **essentially no molecular ion** — they fall apart the
instant they ionise, because the cation on offer is so stable. You cannot subtract from a
peak that is not there, so those compounds are tagged out of Level 1 entirely; the validator
enforces it, refusing a `loss` tag on any compound whose molecular ion is under 5%.

They appear at Levels 2 and 3 instead, where the missing M⁺ becomes evidence in its own
right: *no molecular ion means a very stable cation forms immediately — think tertiary.*

1-butanol, 2-butanol and MTBE sit in between: their molecular ions are real but around 1%,
drawn and clickable but too faint to measure a loss from. `ANSWER_KEY.md` distinguishes the
two cases explicitly.

---

## The McLafferty decision

This package does not teach the McLafferty rearrangement. That constrains the bank, because
**deleting a real peak would be a lie** — a student who later looks up the reference spectrum
would find a peak that this activity pretended was not there.

So the bank works two ways:

- Compounds whose base peak *is* a McLafferty product are simply excluded. That rules out
  butanal and longer aldehydes, most carboxylic acids (butanoic acid's base peak is the
  McLafferty at m/z 60), 2-hexanone, and the larger esters.
- Compounds with a **minor** McLafferty peak keep it. 2-pentanone (m/z 58) and butylbenzene
  (m/z 92) are both in the bank, both with a clean non-McLafferty base peak, and both draw
  the rearrangement peak honestly. Clicking it says: *"it comes from a rearrangement rather
  than a simple cleavage — the molecule folds over and passes a hydrogen across before it
  breaks. That is not part of this unit, so leave it alone for now."*

`tools/validate.js` refuses to let a peak marked `mcl` carry an ion id or become a drop
target, so a McLafferty peak can never be scored by accident.

---

## The compound bank

28 compounds across six themes. The draw is **balanced by theme, not purely random**: every
level takes one compound per theme before filling the remaining places freely, so a run
always contains an alcohol, a carbonyl, an arene, a branched chain, a heteroatom compound
and a halide.

| Theme | Compounds | Teaches |
| --- | --- | --- |
| **alcohol** | 1-butanol, 2-butanol, *tert*-butanol, 2-methyl-2-butanol, cyclohexanol, 1-phenylethanol | α-cleavage at 1°/2°/3°, and −18 |
| **carbonyl** | acetone, 2-butanone, 3-pentanone, 2-pentanone, acetophenone, benzaldehyde, methyl acetate | the acylium |
| **arene** | toluene, ethyl-, propyl-, isopropyl- and butylbenzene | tropylium at 91, benzylic cleavage |
| **branch** | hexane, 2,2-dimethylbutane, 2,2,4-trimethylpentane | the tertiary carbocation at 57 |
| **hetero** | 1-propanamine, diethylamine, diethyl ether, MTBE | α-cleavage at N and at ether O |
| **halide** | 1-bromopropane, 1-chlorobutane, chlorobenzene | M/M+2 isotope patterns |

Level 3 draws no halide: a C–X bond simply breaks, with no second route to weigh it
against, so there is nothing there to predict. The validator knows this and checks theme
coverage per level accordingly.

### The sets worth pointing at in class

- **1-butanol / 2-butanol / *tert*-butanol / diethyl ether** — four C₄H₁₀O isomers, all
  M = 74, base peaks **31 / 45 / 59 / 59**. Primary, secondary and tertiary α-cleavage in
  one family.
- **propylbenzene / cumene / acetophenone** — all M = 120, base peaks **91 / 105 / 105**.
  A −29 against a −15, tropylium against acylium against benzylic.
- **hexane / 2,2-dimethylbutane** — both C₆H₁₄, M = 86, base **43 vs 57**. One has a visible
  molecular ion and a smooth run of clusters; the other has essentially no M⁺ and one
  dominant peak. That contrast *is* the evidence for a branch point.
- **2-methyl-2-butanol** — one compound showing −15, −18 and −29 at once, where losing the
  larger radical (ethyl, giving m/z 59) beats losing the smaller one (methyl, giving m/z 73).
  Comparing those two peaks is the whole stability lesson in a single spectrum.

### Decoys have to be decidable

A student decides the identify question from the peaks they just labelled, so those peaks
are the only fair evidence. Two compounds with an identical scored-peak set are never
offered against each other — **acetophenone and cumene** both put peaks at 77, 105 and 120,
and nothing this activity asks about separates them. `tools/validate.js` prints these
clusters and `ANSWER_KEY.md` lists them.

Decoys are otherwise ranked to prefer compounds sharing the answer's peaks, its theme, its
molecular weight, and above all its molecular formula — so 1-butanol comes up against
2-butanol, separated by m/z 31 against 45, which is exactly the primary/secondary
distinction being taught. The ranking carries a small random term, so the same compound does
not always draw the same pair.

### Distractor tiles are the confusable twin

At Level 2 the wrong tile offered against a m/z 43 acylium is the **m/z 43 propyl cation** —
not something absurd. Each ion declares its `twin`, the ion of the same mass it is routinely
confused with, and those are drawn first, then ions of the same stability class, then at
random. A Level 2 tray is a set of genuine alternatives rather than a lineup of obvious
rejects.

---

## Grading

**Completion only.** The SCO writes `cmi.core.lesson_status = "completed"` once a student
finishes all three levels and writes no numeric score, so the Schoology column reads
complete / incomplete rather than a percent.

Students still see their own first-try accuracy on the level-complete and finish screens —
it just isn't reported.

To report a percent instead, set `cmi.core.score.raw` alongside the status in
`markComplete()` in `src/js/scorm.js` and add an `<adlcp:masteryscore>` to
`src/imsmanifest.xml`.

Progress is saved to `cmi.suspend_data` when the activity opens and after every answer, so
a student who closes the window mid-activity resumes where they left off. It also mirrors to
`localStorage`, which is what makes resume work outside an LMS.

The save carries a schema version (`SCHEMA` in `src/js/game.js`). **Bump it whenever you
change the level list, the draw or the vocabulary** — a save written by an older build is
then discarded rather than resumed. Without that, a student carries a stale lineup of
spectra forward and never sees your edits.

---

## Building and uploading

```bash
./build.sh                     # → dist/ms-reading-fragments-v1.zip
./build.sh ms-unit9-practice   # → dist/ms-unit9-practice.zip
```

`imsmanifest.xml` has to sit at the root of the zip, which is why `build.sh` zips from
inside `src/` rather than from the project root. Zipping the `src` folder itself produces a
package Schoology rejects.

To upload:

1. In your Schoology course, **Add Materials → Add File/Link/External Tool → Add File** and
   upload `dist/ms-reading-fragments-v1.zip`, or use **Add Materials → Package** if your
   install shows it.
2. Schoology detects the SCORM manifest and creates a SCORM item.
3. Open the item's settings and enable the gradebook column if you want completion tracked.
4. Open it once as a student (Preview as Student) to confirm the badge in the top right
   reads **Connected to the LMS**.

If that badge reads **Standalone — no LMS detected** inside Schoology, the SCO could not
find the SCORM API. That is almost always a nesting problem, not a code problem.

### Testing without an LMS

Open `src/index.html` directly in a browser. The activity runs identically; the badge reads
*Standalone* and nothing is reported.

### Putting one named spectrum on the board

```
src/index.html?compound=butanone&level=1
```

`compound` is any `id` from `ANSWER_KEY.md`; `level` is 1, 2 or 3. If the compound is not
tagged for the level you asked for, it falls back to one it is tagged for. A pinned spectrum
never writes to saved progress, so demoing in class will not disturb a student's resume
state.

---

## Editing the content

Everything a teacher would want to change lives in two files.

**`src/js/compounds.js`** — the bank. To add a compound, copy an existing entry:

```js
{
  id: 'propiophenone', name: 'Propiophenone', formula: 'C₉H₁₀O', f: 'C9H10O',
  cls: 'Aryl ketone', theme: 'carbonyl', tags: ['loss', 'ion', 'predict'],
  structure: { pts: [...], bonds: [...], labels: {...} },
  peaks: [
    { mz: 134, ab: 25, role: 'mplus' },
    { mz: 105, ab: 100, ion: 'phco', role: 'key',
      why: 'α-cleavage drops the ethyl and leaves a benzoyl cation …' },
    { mz: 77,  ab: 50, ion: 'ph', role: 'key', why: '…' },
    { mz: 51,  ab: 20, ion: 'c4h3', role: 'cluster' }
  ]
}
```

- `f` is the parseable formula, checked against the displayed one.
- `role` is `mplus`, `key` (scored), `cluster` (above the line, not diagnostic), `minor`
  (below the line), or `mcl` (a McLafferty peak, never scored).
- `why` is required on every `key` peak — it is the stability argument, and Level 3 reads it.
- `note` optionally overrides the generated explanation for a non-scored peak, for cases
  where the stock wording would mislead.
- `isotopeTarget: true` makes the M+2 peak a drop target. Use it for halides.

**`src/js/fragments.js`** — the vocabulary: the `LOSSES` table, the `IONS` table, and the
`hint` strings shown as feedback. That is where to put the wording you use in class.

After any edit:

```bash
node tools/validate.js              # arithmetic, ambiguity and level-eligibility checks
node tools/answer-key.js > ANSWER_KEY.md
./build.sh
```

`tools/validate.js` is worth running every time. It refuses a bank where:

- a fragment does not balance against the molecular formula, or an ion is listed at the
  wrong m/z;
- two peaks share an m/z, or two scored peaks would answer to the same tile at either level;
- a compound has no base peak, or more than one;
- a scored peak has no `why`, so Level 3 could not use it;
- a compound is tagged `loss` but its molecular ion is under 5%, or tagged `predict` with
  fewer than two competing cleavages;
- a McLafferty peak carries an ion id;
- a level's pool is missing one of the themes that level draws.

It also warns about scored peaks below the reading threshold, and about ions no compound
uses — those still teach in the reference table and still make fair distractors, but it is
worth knowing which are carrying their weight.

---

## Layout

```
ms-spectrometry-scorm/
├── src/
│   ├── imsmanifest.xml      SCORM 1.2 manifest — must be at the zip root
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── fragments.js     loss and ion vocabulary, feedback wording
│       ├── compounds.js     the bank — peak tables and structures
│       ├── massspec.js      isotopes, noise, stick-plot renderer, formula arithmetic
│       ├── structures.js    skeletal structure SVG renderer   (shared with the IR package)
│       ├── scorm.js         SCORM 1.2 run-time wrapper        (shared with the IR package)
│       └── game.js          levels, drag and drop, progression
├── tools/
│   ├── validate.js          item bank checks
│   └── answer-key.js        regenerates ANSWER_KEY.md
├── build.sh
├── ANSWER_KEY.md            generated — every peak, every loss, every mechanism
└── README.md
```

`structures.js` and `scorm.js` are shared with the IR package: the code is identical, and
only the header comment differs (it names the file each one reads its data from). A SCORM
zip has to be self-contained, so they are duplicated rather than linked — if you fix a bug
in one, fix it in both. `diff` the pair to confirm nothing has drifted:

```bash
diff <(tail -n +12 ../ir-spectroscopy-scorm/src/js/scorm.js) <(tail -n +16 src/js/scorm.js)
```

No CDN, no web fonts, no network calls of any kind. A 40 KB zip that works offline inside a
locked-down LMS iframe.

A built `dist/ms-reading-fragments-v1.zip` is committed, so you can download and upload it
without running the build.

## Accessibility

Every drop works three ways, so it does not assume a mouse: pointer drag, click-the-label
then click-the-peak, and keyboard (tab to a label, Enter, tab to a peak, Enter). Peaks and
labels carry text alternatives naming their m/z and relative abundance, feedback is
announced through an ARIA live region, and `prefers-reduced-motion` disables the shake
animation. Colour is never the only signal — correct placements change border style and show
the label text, and the reading threshold is a drawn, captioned line rather than a shade of
ink.

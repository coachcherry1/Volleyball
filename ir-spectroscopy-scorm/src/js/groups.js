/* groups.js — functional-group vocabulary used by the item bank and the tile tray.
 *
 * FAMILY = the coarse label used in Level 2 ("there is a C=O here").
 * GROUP  = the specific label used in Level 3 ("that C=O is an ester").
 *
 * `hint` is the one-line rationale shown when a student drops the wrong tile,
 * so the feedback teaches the discriminator rather than just saying "no".
 */

var FAMILIES = {
  oh:       { label: 'O–H',            aka: 'O–H stretch' },
  nh:       { label: 'N–H',            aka: 'N–H stretch' },
  ch:       { label: 'C–H',            aka: 'C–H stretch' },
  triple:   { label: 'C≡N or C≡C', aka: 'triple-bond stretch' },
  carbonyl: { label: 'C=O',                 aka: 'carbonyl stretch' },
  cc:       { label: 'C=C',                 aka: 'double-bond stretch' },
  cosingle: { label: 'C–O',            aka: 'C–O single-bond stretch' },
  no2:      { label: 'N–O',            aka: 'nitro stretch' }
};

var GROUPS = {
  /* ---- X–H stretch region, 4000–2500 ---- */
  oh_alcohol: {
    family: 'oh', label: 'O–H (alcohol)', range: '3200–3600',
    hint: 'Broad and rounded, but it ends before 3100 — an alcohol O–H, not an acid.'
  },
  oh_acid: {
    family: 'oh', label: 'O–H (carboxylic acid)', range: '2500–3300',
    hint: 'Enormously broad — it swallows the C–H peaks and runs down past 2600. Only a carboxylic acid does that.'
  },
  nh_amine1: {
    family: 'nh', label: 'N–H (1° amine)', range: '3300–3400',
    hint: 'Two sharp-ish spikes means TWO N–H bonds — a primary amine.'
  },
  nh_amine2: {
    family: 'nh', label: 'N–H (2° amine)', range: '3280–3350',
    hint: 'A single weak N–H spike means one N–H bond — a secondary amine.'
  },
  nh_amide: {
    family: 'nh', label: 'N–H (amide)', range: '3150–3400',
    hint: 'N–H stretch sitting above a carbonyl near 1650 — that pairing is an amide.'
  },
  ch_sp3: {
    family: 'ch', label: 'C–H (sp³ alkyl)', range: '2850–3000',
    hint: 'Just below 3000 — saturated C–H. Almost every organic spectrum has this.'
  },
  ch_sp2: {
    family: 'ch', label: 'C–H (sp² vinyl/aryl)', range: '3000–3100',
    hint: 'Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring).'
  },
  ch_sp: {
    family: 'ch', label: '≡C–H (terminal alkyne)', range: '3290–3320',
    hint: 'A narrow, strong spike near 3300 — sp C–H. Sharper than any O–H.'
  },
  ch_aldehyde: {
    family: 'ch', label: 'C–H (aldehyde)', range: '2690–2850',
    hint: 'The two weak peaks near 2820 and 2720 are the aldehyde C–H Fermi doublet — they prove –CHO.'
  },

  /* ---- triple-bond region, 2500–2000 ---- */
  cn_nitrile: {
    family: 'triple', label: 'C≡N (nitrile)', range: '2210–2260',
    hint: 'Sharp and medium-strength near 2250 — nitrile. A C≡C would be much weaker.'
  },
  cc_alkyne: {
    family: 'triple', label: 'C≡C (alkyne)', range: '2100–2260',
    hint: 'Weak and near 2120 — an alkyne. Nitriles sit higher and are stronger.'
  },

  /* ---- carbonyl region, 1900–1600 ---- */
  co_anhydride: {
    family: 'carbonyl', label: 'C=O (anhydride)', range: '1740–1830',
    hint: 'TWO carbonyl peaks about 60 cm⁻¹ apart — only an anhydride does that.'
  },
  co_chloride: {
    family: 'carbonyl', label: 'C=O (acid chloride)', range: '1770–1820',
    hint: 'Above 1770 — the chlorine pulls electron density in and stiffens the C=O. Acid chloride.'
  },
  co_ester: {
    family: 'carbonyl', label: 'C=O (ester)', range: '1730–1760',
    hint: 'Near 1740 AND a strong C–O near 1200–1250 — ester, not ketone.'
  },
  co_aldehyde: {
    family: 'carbonyl', label: 'C=O (aldehyde)', range: '1700–1740',
    hint: 'Check near 2720 — if the aldehyde C–H doublet is there, this carbonyl is an aldehyde.'
  },
  co_ketone: {
    family: 'carbonyl', label: 'C=O (ketone)', range: '1670–1725',
    hint: 'Near 1715 with no O–H, no C–O, and no aldehyde C–H — a plain ketone.'
  },
  co_acid: {
    family: 'carbonyl', label: 'C=O (carboxylic acid)', range: '1680–1725',
    hint: 'A carbonyl underneath a gigantic 2500–3300 O–H — carboxylic acid.'
  },
  co_amide: {
    family: 'carbonyl', label: 'C=O (amide)', range: '1630–1690',
    hint: 'Unusually LOW for a carbonyl (~1655) because N donates into it — amide.'
  },

  /* ---- double-bond / bend region ---- */
  cc_alkene: {
    family: 'cc', label: 'C=C (alkene)', range: '1620–1680',
    hint: 'One weak-to-medium band near 1640 — an isolated alkene.'
  },
  cc_arene: {
    family: 'cc', label: 'C=C (aromatic ring)', range: '1450–1620',
    hint: 'A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene.'
  },
  no2_group: {
    family: 'no2', label: 'N–O (nitro)', range: '1340–1560',
    hint: 'Two very strong bands near 1520 and 1350 — the asymmetric and symmetric NO₂ stretches.'
  },

  /* ---- C–O single-bond region ---- */
  co_single: {
    family: 'cosingle', label: 'C–O (single bond)', range: '1000–1300',
    hint: 'Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid).'
  }
};

/* Bands that exist to make the spectrum look real but are never drop targets. */
var GROUP_IDS = Object.keys(GROUPS);

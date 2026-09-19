/* fragments.js — the label vocabulary.
 *
 * A peak in an EI mass spectrum can be named two ways, and this activity
 * teaches them in that order:
 *
 *   LEVEL 1, the LOSS view      "that peak is M minus 43"
 *   LEVEL 2, the ION view       "that 43 is an acylium, CH3-C=O+"
 *
 * The loss is arithmetic: M - m/z. The ion is chemistry. They are not the
 * same question, and the gap between them is where the teaching happens -
 * CH3CO+ sits at m/z 43 in BOTH acetone and 2-butanone, but it is a loss of
 * 15 from one and a loss of 29 from the other.
 *
 * So a loss key is COMPUTED per molecule (see lossKey below) rather than
 * stored on the ion. Only the ion id lives in the bank.
 *
 * MECHANISMS. Four, and no more - this package deliberately does not teach
 * the McLafferty rearrangement. Compounds that really show one keep the peak
 * (it would be a lie to delete it) but it is drawn as `mcl` and can never be
 * scored; clicking it says so.
 *
 *   alpha       a bond next to a heteroatom breaks, and the lone pair left
 *               behind stabilises the cation by resonance. The single most
 *               productive idea in the whole unit.
 *   dehydr      an alcohol loses water, -18
 *   branch      the bond at the most substituted carbon breaks, because the
 *               carbocation left behind is 3 > 2 > 1 > methyl
 *   benzylic    a bond one carbon from a ring breaks; the cation delocalises
 *               into the ring (and, for C7H7+, expands to tropylium)
 *   sigma       a plain C-C break with nothing special stabilising it
 */

/* ---------------------------------------------------------------- losses */

/* `also` names the second neutral that fits the same arithmetic. -29 and -43
   are the two that matter: they are why Level 1 is not the whole story. */
var LOSSES = {
  1:  { neutral: '•H',      hint: 'Loss of a single hydrogen atom. Small, but when M−1 is TALLER than M⁺ it means the cation left behind is unusually stable — tropylium from toluene, benzoyl from benzaldehyde.' },
  15: { neutral: '•CH₃', hint: 'Loss of a methyl radical. Look for a methyl sitting on a branch point or right next to a C=O — those are the two places a methyl leaves from.' },
  17: { neutral: '•OH',     hint: 'Loss of a hydroxyl radical. An alcohol or an acid. Usually much weaker than the −18 next to it.' },
  18: { neutral: 'H₂O',     hint: 'Loss of water — dehydration. This is an alcohol. M⁺ and M−18 together are the signature; in a tertiary alcohol the M⁺ may be gone entirely and only the −18 survives.' },
  29: { neutral: '•C₂H₅', also: '•CHO',
        hint: 'Loss of 29 is AMBIGUOUS: an ethyl radical, or a formyl radical from an aldehyde. Decide it from the rest of the spectrum — an aldehyde also shows M−1, an ethyl group usually shows m/z 29 itself.' },
  31: { neutral: '•OCH₃', also: '•CH₂OH',
        hint: 'Loss of 31 is a methoxy radical from a methyl ester or ether — or a •CH₂OH from a primary alcohol. Both weigh 31, both are CH₃O.' },
  35: { neutral: '•Cl',     hint: 'Loss of a chlorine atom. Check the M/M+2 pair first: if it was 3:1 there was a Cl to lose.' },
  36: { neutral: 'HCl',     hint: 'Loss of hydrogen chloride from an alkyl chloride — the chlorine takes a neighbouring hydrogen with it.' },
  43: { neutral: '•C₃H₇', also: 'CH₃CO•',
        hint: 'Loss of 43 is AMBIGUOUS: a propyl radical, or an acetyl radical from a methyl ketone. Decide it from the rest of the spectrum — a methyl ketone normally shows a strong m/z 43 of its own.' },
  45: { neutral: '•OC₂H₅', hint: 'Loss of an ethoxy radical — an ethyl ester or an ethyl ether.' },
  57: { neutral: '•C₄H₉', also: '•COC₂H₅',
        hint: 'Loss of 57 runs the same trap as −29 and −43: a butyl radical, usually tert-butyl leaving a branch point, or an acyl radical from a ketone. Same question, bigger numbers.' },
  79: { neutral: '•Br',     hint: 'Loss of a bromine atom. Check the M/M+2 pair first: if it was 1:1 there was a Br to lose.' }
};

/* Landmarks are not losses and not ordinary ions. They answer to the same key
   at every level, because "which peak is the molecular ion" is the same
   question however far into the unit you are. */
var LANDMARKS = {
  mplus: {
    label: 'M⁺·  molecular ion', sub: 'the intact molecule',
    hint: 'The molecular ion — the whole molecule with one electron knocked off. It is the rightmost real peak, ignoring the isotope peaks just past it. Its mass is the compound’s molecular weight.'
  },
  miso1: {
    label: 'M+1', sub: '¹³C isotope',
    hint: 'The M+1 peak is one ¹³C in place of a ¹²C. Its height is about 1.1% of M⁺ for every carbon in the molecule, so M+1 ÷ M ÷ 1.1% COUNTS THE CARBONS.'
  },
  miso2: {
    label: 'M+2', sub: 'heavy halogen isotope',
    hint: 'An M+2 peak this big is a halogen. About a THIRD the height of M⁺ means chlorine (³⁵Cl : ³⁷Cl is 3:1). About EQUAL to M⁺ means bromine (⁷⁹Br : ⁸¹Br is 1:1).'
  }
};

/* ------------------------------------------------------------------- ions
 *
 * `f`    the ion's own formula, so tools/validate.js can check the arithmetic
 * `lost`  for an ion whose mass depends on the molecule, the NEUTRAL formula
 *         it corresponds to instead ('X' and 'HX' stand for a halogen)
 * `mz`   nominal m/z; null for an ion whose mass depends on the molecule
 * `cls`  stability class, which is the whole point of the unit
 * `mech` how it forms
 * `twin` an ion of the SAME m/z that it is routinely confused with. This
 *        drives distractor choice at Level 2: the wrong tile offered against
 *        a m/z 43 acylium is the m/z 43 propyl cation, not something absurd.
 */
var IONS = {
  /* --- alkyl cations: the stability ladder, bare --- */
  ch3: {
    f: 'CH3', mz: 15, cls: 'methyl', mech: 'sigma', label: 'CH₃⁺', name: 'methyl cation',
    hint: 'A bare methyl cation — the least stable carbocation there is. It shows up, but it is never the base peak of anything.'
  },
  c2h5: {
    f: 'C2H5', mz: 29, cls: 'primary', mech: 'sigma', label: 'C₂H₅⁺', name: 'ethyl cation', twin: 'cho',
    hint: 'A primary ethyl cation. At m/z 29 it is easy to confuse with the formyl ion CHO⁺ — if there is no carbonyl anywhere else in the spectrum, it is the ethyl.'
  },
  c3h5: {
    f: 'C3H5', mz: 41, cls: 'allylic', mech: 'sigma', label: 'C₃H₅⁺', name: 'allyl cation',
    hint: 'Resonance-stabilised allyl. Almost every chain longer than three carbons throws one off, so it corroborates nothing on its own.'
  },
  c3h7: {
    f: 'C3H7', mz: 43, cls: 'secondary', mech: 'branch', label: 'C₃H₇⁺', name: 'propyl / isopropyl cation', twin: 'ch3co',
    hint: 'A three-carbon alkyl cation. At m/z 43 its twin is the acylium CH₃CO⁺ — the acylium is resonance-stabilised and needs a carbonyl in the structure; this one only needs three carbons in a row.'
  },
  c4h7: {
    f: 'C4H7', mz: 55, cls: 'allylic', mech: 'sigma', label: 'C₄H₇⁺', name: 'butenyl cation',
    hint: 'A four-carbon allylic cation, very often what is left after an alcohol loses water and then a methyl.'
  },
  c5h11: {
    f: 'C5H11', mz: 71, cls: 'tertiary', mech: 'branch', label: 'C₅H₁₁⁺', name: 'tertiary pentyl cation', twin: 'c3h7co',
    hint: 'A methyl has left the branch point and what remains is still a tertiary carbocation. Good — but at m/z 71 its twin is an acylium, which is better again, so check whether the molecule has a C=O before you commit.'
  },
  c4h9: {
    f: 'C4H9', mz: 57, cls: 'tertiary', mech: 'branch', label: '(CH₃)₃C⁺', name: 'tert-butyl cation', twin: 'c2h5co',
    hint: 'THE tertiary carbocation. Three alkyl groups donating into an empty p orbital — so stable that a molecule containing a tert-butyl group will often show almost no molecular ion at all, because it falls apart the instant it ionises.'
  },

  /* --- oxocarbenium: alcohol and ether alpha cleavage, 1 / 2 / 3 --- */
  ch2oh: {
    f: 'CH3O', mz: 31, cls: 'resonance', mech: 'alpha', label: 'CH₂=OH⁺', name: 'oxocarbenium (from a 1° alcohol)',
    hint: 'ALPHA CLEAVAGE at a primary alcohol. The oxygen lone pair pushes in to make a C=O double bond, so the positive charge is shared between carbon and oxygen. As the BASE PEAK, m/z 31 means a primary alcohol.'
  },
  ch3choh: {
    f: 'C2H5O', mz: 45, cls: 'resonance', mech: 'alpha', label: 'CH₃CH=OH⁺', name: 'oxocarbenium (from a 2° alcohol)',
    hint: 'ALPHA CLEAVAGE at a secondary alcohol — same resonance, one more carbon. As the BASE PEAK, m/z 45 means a secondary alcohol.'
  },
  me2coh: {
    f: 'C3H7O', mz: 59, cls: 'resonance', mech: 'alpha', label: '(CH₃)₂C=OH⁺', name: 'oxocarbenium (from a 3° alcohol)',
    hint: 'ALPHA CLEAVAGE at a tertiary alcohol. Resonance stabilisation AND two methyls donating — As the BASE PEAK, m/z 59 means a tertiary alcohol.'
  },
  etmecoh: {
    f: 'C4H9O', mz: 73, cls: 'resonance', mech: 'alpha', label: 'CH₃CH₂(CH₃)C=OH⁺', name: 'oxocarbenium',
    hint: 'ALPHA CLEAVAGE the other way round — this time the methyl left and the ethyl stayed. Same resonance stabilisation, but losing the SMALLER group is the less favourable of the two, so this peak is the shorter one.'
  },
  etoch2: {
    f: 'C3H7O', mz: 59, cls: 'resonance', mech: 'alpha', label: 'CH₃CH₂O⁺=CH₂', name: 'oxocarbenium (from an ether)',
    hint: 'ALPHA CLEAVAGE in an ether: the bond next to the oxygen breaks and the lone pair stabilises what is left. Ethers behave exactly like alcohols here — the oxygen is doing the same job.'
  },
  ch2ome: {
    f: 'C2H5O', mz: 45, cls: 'resonance', mech: 'alpha', label: 'CH₃O=CH₂⁺', name: 'oxocarbenium (from a methyl ether)',
    hint: 'ALPHA CLEAVAGE next to a methyl ether oxygen.'
  },

  /* --- acylium: the strongest resonance stabilisation in the unit --- */
  cho: {
    f: 'CHO', mz: 29, cls: 'resonance', mech: 'alpha', label: 'CHO⁺', name: 'formyl cation', twin: 'c2h5',
    hint: 'The formyl ion from an aldehyde, and the reason −29 is ambiguous. C≡O⁺ with the charge on carbon — resonance-stabilised, unlike the ethyl cation sitting at the same mass.'
  },
  ch3co: {
    f: 'C2H3O', mz: 43, cls: 'resonance', mech: 'alpha', label: 'CH₃C≡O⁺', name: 'acylium (acetyl)', twin: 'c3h7',
    hint: 'ALPHA CLEAVAGE at a carbonyl gives an ACYLIUM: the oxygen lone pair makes a triple bond and the charge is fully delocalised. This is the most stable cation in this unit, which is why m/z 43 is the base peak of almost every methyl ketone and acetate.'
  },
  c2h5co: {
    f: 'C3H5O', mz: 57, cls: 'resonance', mech: 'alpha', label: 'CH₃CH₂C≡O⁺', name: 'acylium (propanoyl)', twin: 'c4h9',
    hint: 'A propanoyl acylium — same resonance as acetyl, one carbon longer. At m/z 57 its twin is the tert-butyl cation; only one of them needs a C=O in the structure.'
  },
  c3h7co: {
    f: 'C4H7O', mz: 71, cls: 'resonance', mech: 'alpha', label: 'CH₃CH₂CH₂C≡O⁺', name: 'acylium (butanoyl)', twin: 'c5h11',
    hint: 'A butanoyl acylium — the same resonance as every other acylium, four carbons long. At m/z 71 its twin is a tertiary alkyl cation; only this one needs a carbonyl.'
  },
  phco: {
    f: 'C7H5O', mz: 105, cls: 'resonance', mech: 'alpha', label: 'C₆H₅C≡O⁺', name: 'benzoyl cation', twin: 'phchch3',
    hint: 'A benzoyl acylium: acylium resonance PLUS a benzene ring to spread the charge into. m/z 105 with m/z 77 underneath it is the fingerprint of a phenyl ketone or a benzaldehyde.'
  },

  /* --- iminium: amine alpha cleavage --- */
  ch2nh2: {
    f: 'CH4N', mz: 30, cls: 'resonance', mech: 'alpha', label: 'CH₂=NH₂⁺', name: 'iminium (from a 1° amine)',
    hint: 'ALPHA CLEAVAGE at an amine — the nitrogen lone pair does exactly what an oxygen lone pair does, only better, because nitrogen is less electronegative. As the BASE PEAK, m/z 30 means a primary amine.'
  },
  etnhchme: {
    f: 'C3H8N', mz: 58, cls: 'resonance', mech: 'alpha', label: 'CH₃CH=NH⁺C₂H₅', name: 'iminium (from a 2° amine)',
    hint: 'ALPHA CLEAVAGE at a secondary amine. Losing the methyl from the ethyl group leaves a nitrogen-stabilised cation.'
  },

  /* --- benzylic: the ring does the stabilising --- */
  c7h7: {
    f: 'C7H7', mz: 91, cls: 'resonance', mech: 'benzylic', label: 'C₇H₇⁺', name: 'tropylium',
    hint: 'BENZYLIC CLEAVAGE. The bond one carbon out from the ring breaks, and the benzyl cation immediately expands into TROPYLIUM — a flat, aromatic seven-membered ring sharing the charge over all seven carbons. m/z 91 is the single most recognisable peak in organic mass spectrometry: it means a monosubstituted benzene ring with at least one carbon on it.'
  },
  phchch3: {
    f: 'C8H9', mz: 105, cls: 'resonance', mech: 'benzylic', label: 'C₆H₅CH⁺CH₃', name: 'methylbenzyl cation', twin: 'phco',
    hint: 'A SECONDARY benzylic cation — the ring stabilises it and a methyl donates into it as well. At m/z 105 its twin is the benzoyl acylium; the benzoyl needs an oxygen in the molecule and this one does not.'
  },
  c7h15: {
    f: 'C7H15', mz: 99, cls: 'tertiary', mech: 'branch', label: 'C₇H₁₅⁺', name: 'tertiary heptyl cation',
    hint: 'One methyl gone from the branch point, leaving a tertiary carbocation with most of the molecule still attached. In a heavily branched alkane this is often the highest peak you can see at all.'
  },
  ph: {
    f: 'C6H5', mz: 77, cls: 'aryl', mech: 'sigma', label: 'C₆H₅⁺', name: 'phenyl cation',
    hint: 'A bare phenyl cation. It is not especially stable — the empty orbital is in the ring plane and cannot conjugate — but m/z 77 is so characteristic that it is worth knowing on sight as "there is a benzene ring here".'
  },
  c4h3: {
    f: 'C4H3', mz: 51, cls: 'aryl', mech: 'sigma', label: 'C₄H₃⁺', name: 'ring fragment',
    hint: 'What is left when a phenyl cation itself breaks up. m/z 51 under m/z 77 corroborates a ring, and nothing more.'
  },
  c5h5: {
    f: 'C5H5', mz: 65, cls: 'aryl', mech: 'sigma', label: 'C₅H₅⁺', name: 'cyclopentadienyl cation',
    hint: 'Tropylium losing acetylene. m/z 65 sitting under m/z 91 confirms the 91 really is tropylium.'
  },

  c2h5choh: {
    f: 'C3H7O', mz: 59, cls: 'resonance', mech: 'alpha', label: 'CH\u2083CH\u2082CH=OH\u207a', name: 'oxocarbenium (from a 2\u00b0 alcohol)',
    hint: 'ALPHA CLEAVAGE the OTHER way round: this time the methyl left and the ethyl stayed. Same resonance stabilisation, but a methyl radical is the less stable of the two leaving groups, so this is the shorter of the pair.'
  },
  me2coome: {
    f: 'C4H9O', mz: 73, cls: 'resonance', mech: 'alpha', label: '(CH\u2083)\u2082C=O\u207aCH\u2083', name: 'oxocarbenium (from an ether)',
    hint: 'ALPHA CLEAVAGE next to the ether oxygen. A methyl leaves the quaternary carbon and the oxygen lone pair stabilises what is left \u2014 the same move an alcohol makes.'
  },
  phchoh: {
    f: 'C7H7O', mz: 107, cls: 'resonance', mech: 'alpha', label: 'C\u2086H\u2085CH=OH\u207a', name: 'benzylic oxocarbenium',
    hint: 'The best of both: ALPHA CLEAVAGE gives the oxygen resonance, and the benzene ring is right there to spread the charge as well. Two stabilisations on one cation, so this peak dominates.'
  },
  acetoxy: {
    f: 'C2H3O2', mz: 59, cls: 'resonance', mech: 'alpha', label: 'CH\u2083CO\u2013O\u207a', name: 'ester acylium-oxygen cation',
    hint: 'The ester has lost the methyl off its oxygen. Real, but much weaker than the acylium at 43 \u2014 breaking the other C\u2013O bond is the better deal.'
  },

  /* --- whole-molecule ions, mass set by the molecule --- */
  dehydr: {
    lost: 'H2O', f: null, mz: null, cls: 'radical', mech: 'dehydr', label: '[M − H₂O]⁺·', name: 'alkene radical cation',
    hint: 'DEHYDRATION. The alcohol throws off water and what is left is an alkene radical cation. M⁺ and M−18 together say alcohol; in a tertiary alcohol the M⁺ can vanish and leave M−18 as the highest peak you can see.'
  },
  dehydrohalo: {
    lost: 'HX', f: null, mz: null, cls: 'radical', mech: 'sigma', label: '[M − HX]⁺·', name: 'alkene radical cation',
    hint: 'The halogen leaves with a neighbouring hydrogen, exactly the way an alcohol loses water.'
  }
};

var ION_IDS = Object.keys(IONS);

/* ---------------------------------------------------------------- keying */

/* Level 1 asks what was LOST, which only exists relative to the molecular
   ion, so it has to be worked out per molecule rather than stored. */
function lossKey(peak, molecularMass) {
  if (peak.role === 'mplus') return 'mplus';
  if (peak.role === 'miso1') return 'miso1';
  if (peak.role === 'miso2') return 'miso2';
  return 'loss_' + (molecularMass - peak.mz);
}

function ionKey(peak) {
  if (peak.role === 'mplus') return 'mplus';
  if (peak.role === 'miso1') return 'miso1';
  if (peak.role === 'miso2') return 'miso2';
  return peak.ion;
}

function keyOf(peak, molecularMass, mode) {
  return mode === 'ion' ? ionKey(peak) : lossKey(peak, molecularMass);
}

/* ---------------------------------------------------------------- labels */

function lossNumber(key) {
  return key.indexOf('loss_') === 0 ? +key.slice(5) : null;
}

function keyLabel(key) {
  if (LANDMARKS[key]) return LANDMARKS[key].label;
  var n = lossNumber(key);
  if (n != null) {
    var L = LOSSES[n];
    return '− ' + n + (L ? '  (' + L.neutral + (L.also ? ' or ' + L.also : '') + ')' : '');
  }
  return IONS[key].label;
}

/* The sub-line under a tile. At Level 1 it says what the loss means; at
   Level 2 it names the ion but deliberately WITHHOLDS the m/z, so a student
   has to count the formula rather than match a number to the axis. */
function keySub(key) {
  if (LANDMARKS[key]) return LANDMARKS[key].sub;
  var n = lossNumber(key);
  if (n != null) return 'loss of ' + n + ' mass units';
  return IONS[key].name;
}

function keyHint(key) {
  if (LANDMARKS[key]) return LANDMARKS[key].hint;
  var n = lossNumber(key);
  if (n != null) return LOSSES[n] ? LOSSES[n].hint : 'A loss of ' + n + ' mass units.';
  return IONS[key].hint;
}

/* Everything a tile may show. Landmarks are in both universes because the
   molecular ion is asked for at both levels. */
var UNIVERSE = {
  loss: ['mplus', 'miso1', 'miso2'].concat(
    Object.keys(LOSSES).map(function (n) { return 'loss_' + n; })),
  ion: ['mplus', 'miso1', 'miso2'].concat(ION_IDS)
};

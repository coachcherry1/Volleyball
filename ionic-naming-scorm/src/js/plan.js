/* plan.js — the level list and the draw for one run. No DOM.
 *
 * A run is a list of item codes per level:
 *   m:Fe          Level 1: is this metal a transition metal? its charge? its name?
 *   a:O           Level 1: which ion does this nonmetal form, and what is it called?
 *   p:SO4:n       Level 4: name this polyatomic ion   (p:SO4:f = pick its formula)
 *   n:Fe3.SO4     name this compound                  (f:Fe3.SO4 = write its formula)
 *   q:tm1         a check-for-understanding question from the bank
 *   g:c:Pb4.O     a generated check question (see cfu.js)
 * A leading "!" marks a level-end checkpoint question and a leading "+" a
 * follow-up added after a missed check.
 *
 * The draw is balanced, not purely random: each level takes one compound per
 * required case before filling freely, so every run meets Ag and Zn, Sn and
 * Pb, a reduced formula like PbO2, a formula that needs parentheses, and
 * ammonium. Which compound fills each case varies, so a retry is a new set.
 */

var Plan = (function () {
  'use strict';

  var LEVELS = [
    { n: 1, name: 'Transition metal or not?', kind: 'ions', metals: 10, anions: 4, cfuEvery: 4,
      tags: ['tm', 'fixed', 'ide', 'ionic'], checkpoint: ['tm', 'fixed', 'ide'],
      blurb: 'Find each element on the periodic table. Decide whether it is a transition metal, then give its name and charge.' },
    { n: 2, name: 'Name it: not transition metals', kind: 'name', count: 5, cfuEvery: 2,
      tags: ['tm', 'fixed', 'ide', 'ionic'], checkpoint: ['tm', 'fixed', 'ide'],
      blurb: 'Every metal here has only one charge — Ag and Zn included. Decide “no Roman numeral,” then build the name.' },
    { n: 3, name: 'Name it: transition metals', kind: 'name', count: 6, cfuEvery: 2,
      tags: ['tm', 'numeral', 'charge', 'reduce'], checkpoint: ['tm', 'charge', 'numeral'],
      blurb: 'Now some metals are transition metals. When one is, work out its charge from the formula and write it as a Roman numeral.' },
    { n: 4, name: 'Polyatomic ions', kind: 'poly', drill: 5, count: 6, cfuEvery: 3,
      tags: ['poly', 'paren', 'tm', 'charge'], checkpoint: ['poly', 'paren', 'charge'],
      blurb: 'Know your polyatomic ions, then name compounds that contain them. The number after a parenthesis tells you how many of that ion there are.' },
    { n: 5, name: 'Write the formula', kind: 'formula', count: 7, cfuEvery: 2,
      tags: ['numeral', 'reduce', 'paren', 'poly'], checkpoint: ['numeral', 'reduce', 'paren'],
      blurb: 'From a name to a formula: find both charges, balance them, reduce, and use parentheses when you need more than one polyatomic ion.' },
    { n: 6, name: 'On your own', kind: 'typed', count: 8, cfuEvery: 2,
      tags: ['tm', 'charge', 'numeral', 'reduce', 'paren', 'poly', 'fixed', 'ide'],
      checkpoint: ['tm', 'charge', 'paren'],
      blurb: 'Mixed names and formulas. Type each answer — no flowchart and no steps. The periodic table is still there.' }
  ];

  var FIXED_METALS = ['Li', 'Na', 'K', 'Rb', 'Be', 'Mg', 'Ca', 'Ba', 'Al', 'Ga'];
  var TM_METALS = ['Ti', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Au', 'Hg'];
  var EXCEPTIONS = ['Ag', 'Zn', 'Sn', 'Pb'];
  var FAMILIES = [['SO4', 'SO3'], ['NO3', 'NO2'], ['ClO4', 'ClO3', 'ClO2', 'ClO'],
                  ['PO4', 'PO3'], ['CrO4', 'Cr2O7']];

  var POOL = Chem.all().map(function (cpd) { return { cpd: cpd, t: Chem.traits(cpd) }; });

  /* mulberry32 - small, fast, seedable */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function any(list, rand) { return list[Math.floor(rand() * list.length)]; }

  /* Picks a compound matching a test. Prefers one the run has not used and
     whose positive ion this level has not used, so a level does not name
     three iron compounds in a row. */
  function chooser(rand, used) {
    var cats = {};
    return function (test) {
      var base = POOL.filter(function (x) { return test(x.cpd, x.t); });
      var tiers = [
        base.filter(function (x) { return !used[x.cpd.code] && !cats[x.cpd.c.t]; }),
        base.filter(function (x) { return !used[x.cpd.code]; }),
        base
      ];
      for (var i = 0; i < tiers.length; i++) {
        if (!tiers[i].length) continue;
        var x = any(tiers[i], rand);
        used[x.cpd.code] = true;
        cats[x.cpd.c.t] = true;
        return x.cpd.code;
      }
      return null;
    };
  }

  function is(sym) { return function (c) { return c.c.t === sym; }; }

  /* ------------------------------------------------------ content per level */

  function drawIons(rand) {
    var metals = EXCEPTIONS
      .concat(shuffle(FIXED_METALS, rand).slice(0, 3))
      .concat(shuffle(TM_METALS, rand).slice(0, 3));
    var anions = [any(['N', 'P'], rand), any(['O', 'S'], rand), any(['F', 'Cl', 'Br', 'I'], rand)];
    var rest = ['N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'].filter(function (x) { return anions.indexOf(x) < 0; });
    anions.push(any(rest, rand));
    return shuffle(metals, rand).map(function (s) { return 'm:' + s; })
      .concat(shuffle(anions, rand).map(function (s) { return 'a:' + s; }));
  }

  function drawName2(rand, used) {
    var pick = chooser(rand, used);
    var plain = function (c, t) { return t.binary && !t.tm; };
    return shuffle([
      pick(function (c, t) { return plain(c, t) && c.c.t === 'Ag'; }),
      pick(function (c, t) { return plain(c, t) && c.c.t === 'Zn'; }),
      pick(function (c, t) { return plain(c, t) && c.a.charge === 3; }),
      pick(function (c, t) { return plain(c, t) && c.a.charge === 2; }),
      pick(function (c, t) { return plain(c, t) && c.a.charge === 1; })
    ], rand).map(function (x) { return 'n:' + x; });
  }

  function drawName3(rand, used) {
    var pick = chooser(rand, used);
    return shuffle([
      pick(function (c, t) { return t.binary && t.tm && t.fourOverTwo; }),
      pick(function (c, t) { return t.binary && t.tm && (c.c.t === 'Sn' || c.c.t === 'Pb'); }),
      pick(function (c, t) { return t.binary && t.tm && c.q === 1; }),
      pick(function (c, t) { return t.binary && t.tm && c.m > 1 && TM_METALS.indexOf(c.c.t) >= 0; }),
      pick(function (c, t) { return t.binary && !t.tm; }),
      pick(function (c, t) { return t.binary && !t.tm; })
    ], rand).map(function (x) { return 'n:' + x; });
  }

  function drawPoly(rand, used) {
    var family = shuffle(any(FAMILIES, rand), rand).slice(0, 2);
    var polys = DATA.ANIONS.filter(function (a) { return a.poly && family.indexOf(a.t) < 0; })
      .map(function (a) { return a.t; });
    var drill = ['NH4'].concat(family).concat(shuffle(polys, rand).slice(0, 2));
    drill = shuffle(drill, rand).map(function (t) { return 'p:' + t + ':' + (rand() < 0.5 ? 'n' : 'f'); });

    var pick = chooser(rand, used);
    var metal = function (c, t) { return !t.ammonium && c.a.poly; };
    var compounds = shuffle([
      pick(function (c, t) { return t.ammonium; }),
      pick(function (c, t) { return metal(c, t) && t.tm && c.n > 1; }),
      pick(function (c, t) { return metal(c, t) && t.tm && t.reduced; }),
      pick(function (c, t) { return metal(c, t) && !t.tm && c.n > 1; }),
      pick(function (c, t) { return metal(c, t) && !t.tm && c.n === 1; }),
      pick(function (c, t) { return t.poly; })
    ], rand).map(function (x) { return 'n:' + x; });
    return drill.concat(compounds);
  }

  function drawFormula(rand, used) {
    var pick = chooser(rand, used);
    return shuffle([
      pick(function (c, t) { return t.tm && t.fourOverTwo; }),
      pick(function (c, t) { return t.tm && t.binary && c.m > 1 && c.q !== c.m; }),
      pick(function (c, t) { return c.a.poly && c.n > 1; }),
      pick(function (c, t) { return c.a.poly && c.n === 1 && !t.ammonium; }),
      pick(function (c, t) { return t.ammonium; }),
      pick(function (c, t) { return t.binary && !t.tm; }),
      pick(function () { return true; })
    ], rand).map(function (x) { return 'f:' + x; });
  }

  function drawTyped(rand, used) {
    var pick = chooser(rand, used);
    var names = [
      pick(function (c, t) { return t.tm && t.binary; }),
      pick(function (c, t) { return t.tm && t.poly; }),
      pick(function (c, t) { return !t.tm && t.poly; }),
      pick(function () { return true; })
    ].map(function (x) { return 'n:' + x; });
    var formulas = [
      pick(function (c, t) { return t.tm && t.binary && t.reduced; }),
      pick(function (c, t) { return t.parens; }),
      pick(function (c, t) { return t.binary && !t.tm; }),
      pick(function () { return true; })
    ].map(function (x) { return 'f:' + x; });
    return shuffle(names.concat(formulas), rand);
  }

  /* ------------------------------------------------------------ checks */

  function compoundOf(code) {
    var m = /^(?:[nf]|g:[cfn]):(.+)$/.exec(code);
    return m ? m[1] : null;
  }

  function genCandidates(level, tag) {
    var test = null, kind = null;
    var scope = function (t) { return level >= 4 || t.binary; };
    if (tag === 'charge' && level >= 3) {
      kind = 'c';
      test = function (c, t) { return t.tm && scope(t) && c.n !== c.q; };
    } else if (tag === 'numeral' && level >= 3) {
      kind = 'f';
      test = function (c, t) { return t.tm && scope(t) && c.q !== c.m; };
    } else if (tag === 'reduce' && level >= 3) {
      kind = 'f';
      test = function (c, t) { return t.reduced && scope(t); };
    } else if (tag === 'paren' && level >= 4) {
      kind = 'f';
      test = function (c, t) { return t.parens; };
    } else if (tag === 'tm' && level >= 2) {
      kind = 'n';
      test = function (c, t) { return level === 2 ? t.binary && !t.tm : scope(t); };
    }
    if (!test) return [];
    return POOL.filter(function (x) { return test(x.cpd, x.t); })
      .map(function (x) { return 'g:' + kind + ':' + x.cpd.code; });
  }

  /* One check question for a level, preferring the given tags. Written
     questions are favoured; generated ones fill in and keep a long run fresh.
     A generated question never reuses a compound the level already shows. */
  function pickCheck(level, tags, rand, usedQ, avoid) {
    var order = shuffle(tags, rand);
    for (var i = 0; i < order.length; i++) {
      var tag = order[i];
      var bank = CFU.BANK.filter(function (b) {
        return b.tag === tag && b.min <= level && !usedQ['q:' + b.id];
      }).map(function (b) { return 'q:' + b.id; });
      var gen = genCandidates(level, tag).filter(function (g) {
        return !usedQ[g] && !avoid[compoundOf(g)];
      });
      var from = bank.length && (!gen.length || rand() < 0.6) ? bank : gen;
      if (from.length) {
        var code = any(from, rand);
        usedQ[code] = true;
        return code;
      }
    }
    return null;
  }

  function withChecks(level, content, rand, usedQ) {
    var L = LEVELS[level - 1], out = [], avoid = {};
    content.forEach(function (code) { var c = compoundOf(code); if (c) avoid[c] = true; });
    content.forEach(function (code, i) {
      out.push(code);
      if ((i + 1) % L.cfuEvery === 0 && i + 1 < content.length) {
        var q = pickCheck(level, L.tags, rand, usedQ, avoid);
        if (q) out.push(q);
      }
    });
    L.checkpoint.forEach(function (tag) {
      var q = pickCheck(level, [tag], rand, usedQ, avoid);
      if (q) out.push('!' + q);
    });
    return out;
  }

  function draw(level, rand, used, usedQ) {
    var content;
    switch (level) {
      case 1: content = drawIons(rand); break;
      case 2: content = drawName2(rand, used); break;
      case 3: content = drawName3(rand, used); break;
      case 4: content = drawPoly(rand, used); break;
      case 5: content = drawFormula(rand, used); break;
      default: content = drawTyped(rand, used);
    }
    return withChecks(level, content, rand, usedQ);
  }

  function newPlan(seed) {
    var rand = rng(seed);
    var used = {}, usedQ = {}, plan = {};
    LEVELS.forEach(function (L) { plan[L.n] = draw(L.n, rand, used, usedQ); });
    return plan;
  }

  function strip(code) { return code.replace(/^[!+]+/, ''); }

  /* Can this code still be built? A save from an older build may name an ion
     or question that has since been removed. */
  function valid(raw) {
    var code = strip(String(raw || ''));
    var p = code.split(':');
    switch (p[0]) {
      case 'm': return !!Chem.CAT[p[1]] && !Chem.CAT[p[1]].poly;
      case 'a': return !!Chem.AN[p[1]] && !Chem.AN[p[1]].poly;
      case 'p': return (p[1] === 'NH4' || !!(Chem.AN[p[1]] && Chem.AN[p[1]].poly)) &&
                       (p[2] === 'n' || p[2] === 'f');
      case 'n': case 'f': return !!Chem.fromCode(p.slice(1).join(':'));
      case 'q': case 'g': return !!CFU.build(code);
    }
    return false;
  }

  /* A follow-up question on the same idea after a missed check. Returns null
     when the bank and generators have nothing left for that tag. */
  function followUp(level, tag, plan, seed) {
    var rand = rng(seed);
    var usedQ = {}, avoid = {};
    Object.keys(plan).forEach(function (k) {
      plan[k].forEach(function (code) {
        var s = strip(code);
        usedQ[s] = true;
        if (+k === level) { var c = compoundOf(s); if (c) avoid[c] = true; }
      });
    });
    return pickCheck(level, [tag], rand, usedQ, avoid);
  }

  return {
    LEVELS: LEVELS, rng: rng, shuffle: shuffle, newPlan: newPlan, followUp: followUp,
    strip: strip, compoundOf: compoundOf, valid: valid
  };
})();

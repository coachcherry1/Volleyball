/* massspec.js — turns a peak table into a drawn EI mass spectrum.
 *
 * Unlike an IR band, a mass spectral peak sits at an INTEGER m/z. Nothing is
 * jittered sideways: 43 is 43. What varies from draw to draw is the
 * abundances, which wobble the way real ion statistics do, plus a fresh
 * scatter of low-level noise. A student therefore cannot memorise a picture,
 * but the chemistry stays exactly where it should be.
 *
 * Three things are ADDED to whatever compounds.js declares:
 *
 *   isotope peaks   M+1 from the carbon count (1.1% per carbon) and M+2 from
 *                   any chlorine (32%) or bromine (97%). These are computed
 *                   from the molecular formula rather than typed into the
 *                   bank, so they cannot be entered wrong — and the M+1
 *                   height really does count the carbons.
 *
 *   satellites      a small +1 on every substantial fragment, which is the
 *                   same 13C effect one level down.
 *
 *   noise           a seeded scatter of sticks at 0.4-3% and the +/-1 H
 *                   chatter around big peaks. Real spectra are full of this
 *                   and learning to look straight past it is half the skill.
 *
 * THRESHOLD is the line drawn across the plot. Below it, a peak is not worth
 * reading. It is the direct analogue of the 1500 cm-1 line in the IR package.
 */

var MS = (function () {
  var THRESHOLD = 5;                 /* % of base peak */
  var MASS = { C: 12, H: 1, N: 14, O: 16, F: 19, S: 32, Cl: 35, Br: 79, I: 127 };

  /* Deterministic PRNG (mulberry32), so a seed always redraws the same. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------ formula arithmetic
   * Shared with tools/validate.js, which evals this file, so the bank is
   * checked against the same arithmetic the renderer uses. */

  function parseFormula(f) {
    var out = {}, re = /([A-Z][a-z]?)(\d*)/g, m, consumed = 0;
    while ((m = re.exec(f)) !== null) {
      if (m[0] === '') break;
      consumed += m[0].length;
      if (!(m[1] in MASS)) return null;
      out[m[1]] = (out[m[1]] || 0) + (m[2] === '' ? 1 : +m[2]);
    }
    return consumed === f.length ? out : null;
  }

  function massOf(counts) {
    var s = 0;
    for (var el in counts) s += MASS[el] * counts[el];
    return s;
  }

  /* ------------------------------------------------------------ the spectrum */

  function build(compound, seed) {
    var r = rng(seed);
    var mol = parseFormula(compound.f);
    var M = massOf(mol);
    var byMz = {};
    var peaks = [];

    function put(p) {
      if (byMz[p.mz]) return byMz[p.mz];
      byMz[p.mz] = p;
      peaks.push(p);
      return p;
    }

    /* --- the declared peaks, with their abundances wobbled ---
       The base peak never moves. Benzaldehyde declares M+ at 100 and M−1 at
       95, so an unclamped +12% wobble on the 95 would overtake it and change
       which peak is the base peak — and the base peak is what Level 3 asks a
       student to predict and what ANSWER_KEY.md states. Everything else is
       held just below it. */
    compound.peaks.forEach(function (p) {
      var wobble = p.ab === 100 ? 1 : (0.88 + r() * 0.24);
      var ab = Math.min(p.ab * wobble, p.ab === 100 ? 100 : 97);
      put({
        mz: p.mz,
        ab: Math.max(0.3, ab),
        declared: p.ab,
        ion: p.ion || null,
        role: p.role,
        why: p.why || null,
        note: p.note || null
      });
    });

    var mplus = byMz[M] || null;

    /* --- isotope peaks, computed from the formula --- */
    /* An M+1 needs an M+ to sit next to. Where the molecular ion is absent
       (tert-butanol, isooctane) there is nothing to be one mass unit above,
       and that absence is itself part of what the student reads. */
    if (mplus) {
      var m1 = mplus.ab * 0.011 * (mol.C || 0);
      if (m1 > 0.15) {
        put({ mz: M + 1, ab: m1, role: 'miso1', ion: null,
              carbons: mol.C || 0, why: null });
      }
      var heavy = (mol.Cl || 0) * 0.320 + (mol.Br || 0) * 0.973 + (mol.S || 0) * 0.044;
      if (heavy > 0.02) {
        put({ mz: M + 2, ab: mplus.ab * heavy, role: 'miso2', ion: null,
              halogen: mol.Br ? 'Br' : mol.Cl ? 'Cl' : 'S', why: null });
      }
    }

    /* A fragment that kept the halogen carries the doublet too. Only peaks
       whose formula we actually know are treated this way — guessing would
       put a 3:1 pair somewhere it does not belong. */
    peaks.slice().forEach(function (p) {
      if (p.role === 'miso1' || p.role === 'miso2' || !p.ion) return;
      var ion = IONS[p.ion];
      var c = ion && ion.f ? parseFormula(ion.f) : null;
      if (!c) return;
      var h = (c.Cl || 0) * 0.320 + (c.Br || 0) * 0.973;
      if (h > 0.02 && p.ab * h > 0.4) {
        put({ mz: p.mz + 2, ab: p.ab * h, role: 'sat', ion: null, why: null });
      }
      if ((c.C || 0) >= 2 && p.ab > 12) {
        put({ mz: p.mz + 1, ab: p.ab * 0.011 * c.C, role: 'sat', ion: null, why: null });
      }
    });

    /* --- satellites on anything substantial that has no formula of its own --- */
    peaks.slice().forEach(function (p) {
      if (p.role === 'miso1' || p.role === 'miso2' || p.role === 'sat') return;
      if (p.ion || p.ab < 15 || p.mz >= M) return;
      /* roughly one carbon per 14 mass units of hydrocarbon fragment */
      put({ mz: p.mz + 1, ab: p.ab * 0.011 * Math.round(p.mz / 14), role: 'sat',
            ion: null, why: null });
    });

    /* --- noise: the low scatter every real spectrum carries --- */
    var lo = 26, hi = M - 1;
    var wanted = Math.min(16, Math.max(6, Math.round((hi - lo) / 9)));
    for (var i = 0; i < wanted * 3 && countNoise() < wanted; i++) {
      var mz = lo + Math.floor(r() * (hi - lo + 1));
      if (byMz[mz]) continue;
      put({ mz: mz, ab: 0.4 + r() * 2.6, role: 'noise', ion: null, why: null });
    }
    function countNoise() {
      var n = 0;
      for (var k = 0; k < peaks.length; k++) if (peaks[k].role === 'noise') n++;
      return n;
    }

    peaks.sort(function (a, b) { return a.mz - b.mz; });

    /* Renormalise so the tallest peak is exactly 100 after the wobble. */
    var max = peaks.reduce(function (m2, p) { return Math.max(m2, p.ab); }, 1);
    peaks.forEach(function (p) { p.ab = p.ab / max * 100; });

    /* A peak a student is asked to label. The molecular ion always counts;
       the M+2 doublet counts for the halides, where reading it is the
       lesson. */
    peaks.forEach(function (p, i) {
      p.i = i;
      p.target = p.role === 'key' || p.role === 'mplus' ||
                 (p.role === 'miso2' && !!compound.isotopeTarget);
    });

    return {
      compound: compound, M: M, mol: mol, peaks: peaks, seed: seed,
      base: peaks.reduce(function (a, b) { return b.ab > a.ab ? b : a; }, peaks[0]),
      mzMin: 10, mzMax: M + 8
    };
  }

  function peakAt(spec, mz) {
    for (var i = 0; i < spec.peaks.length; i++) if (spec.peaks[i].mz === mz) return spec.peaks[i];
    return null;
  }

  /* --------------------------------------------------------------- geometry */

  function plotRect(w, h) {
    return { x: 54, y: 16, w: Math.max(40, w - 54 - 16), h: Math.max(40, h - 16 - 34) };
  }

  function xOfMz(mz, rect, spec) {
    return rect.x + rect.w * (mz - spec.mzMin) / (spec.mzMax - spec.mzMin);
  }

  function mzOfX(px, rect, spec) {
    return spec.mzMin + (px - rect.x) / rect.w * (spec.mzMax - spec.mzMin);
  }

  function yOfAb(ab, rect) {
    return rect.y + rect.h * (1 - ab / 100);
  }

  /* A round tick spacing giving roughly eight labels across the axis. */
  function tickStep(span) {
    var steps = [5, 10, 20, 25, 50, 100, 200];
    for (var i = 0; i < steps.length; i++) if (span / steps[i] <= 9) return steps[i];
    return 500;
  }

  function tone(name, fallback) {
    var c = getComputedStyle(document.documentElement).getPropertyValue(name);
    return c && c.trim() ? c.trim() : fallback;
  }

  /* ----------------------------------------------------------------- drawing */

  function draw(canvas, spec, opts) {
    opts = opts || {};
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (!cssW || !cssH) return null;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var rect = plotRect(cssW, cssH);
    var grid = tone('--grid', '#d8e2ea');
    var muted = tone('--muted', '#5d7283');
    var stick = tone('--stick', '#0f5d8f');
    var quiet = tone('--quiet', '#a9bdcb');

    ctx.fillStyle = tone('--paper', '#ffffff');
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    /* horizontal gridlines and the abundance axis */
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var a = 0; a <= 100; a += 20) {
      var y = Math.round(yOfAb(a, rect)) + 0.5;
      ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.w, y); ctx.stroke();
      ctx.fillText(String(a), rect.x - 7, y);
    }

    /* the m/z axis */
    var step = tickStep(spec.mzMax - spec.mzMin);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var mz = Math.ceil(spec.mzMin / step) * step; mz <= spec.mzMax; mz += step) {
      var x = Math.round(xOfMz(mz, rect, spec)) + 0.5;
      ctx.strokeStyle = grid;
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h); ctx.lineTo(x, rect.y + rect.h + 4);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(String(mz), x, rect.y + rect.h + 7);
    }

    /* axis titles */
    ctx.save();
    ctx.translate(14, rect.y + rect.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = muted;
    ctx.fillText('Relative abundance (%)', 0, 0);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('m/z', rect.x + rect.w / 2, cssH - 4);

    ctx.strokeStyle = grid;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    /* --- the sticks --- */
    /* Peaks below the threshold are drawn in a lighter ink. Colour is never
       the only signal: the line is there, the caption says what it means, and
       every quiet peak explains itself when clicked. */
    var baseY = rect.y + rect.h;
    spec.peaks.forEach(function (p) {
      var x = Math.round(xOfMz(p.mz, rect, spec)) + 0.5;
      var top = yOfAb(p.ab, rect);
      ctx.strokeStyle = p.ab < THRESHOLD ? quiet : stick;
      ctx.lineWidth = p.ab < THRESHOLD ? 1 : 1.6;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, top);
      ctx.stroke();
    });

    /* the baseline itself, over the foot of the sticks */
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.x, baseY + 0.5); ctx.lineTo(rect.x + rect.w, baseY + 0.5);
    ctx.stroke();

    /* --- the reading threshold --- */
    var ty = Math.round(yOfAb(THRESHOLD, rect)) + 0.5;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = tone('--divider', '#b48ac8');
    ctx.beginPath(); ctx.moveTo(rect.x, ty); ctx.lineTo(rect.x + rect.w, ty); ctx.stroke();
    ctx.restore();

    ctx.font = '10px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    /* The caption sits at the low-m/z end, which is always empty — nothing
       fragments below about m/z 26 — so it can never cover a peak. At the
       high end it would sit on top of the molecular ion. */
    var cap = 'below this line — don’t read it';
    var tw = ctx.measureText(cap).width;
    if (tw + 12 <= rect.w) {            /* on a very narrow plot, the line speaks for itself */
      ctx.fillStyle = tone('--paper', '#ffffff');
      ctx.globalAlpha = 0.9;
      ctx.fillRect(rect.x + 2, ty - 8, tw + 6, 15);
      ctx.globalAlpha = 1;
      ctx.fillStyle = muted;
      ctx.fillText(cap, rect.x + 5, ty);
    }
    ctx.textBaseline = 'alphabetic';

    return rect;
  }

  /* A marker for a short peak can end up a long way above it once collision
     avoidance has pushed it clear, and then it is not obvious which stick it
     belongs to. A hairline from the marker down to the top of its peak
     settles that. Drawn after layout, because only then are the marker
     positions known — and it does not disturb the plot already on the canvas. */
  function drawLeaders(canvas, leaders) {
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = tone('--quiet', '#a9bdcb');
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    leaders.forEach(function (l) {
      if (l.y1 >= l.y0 - 3) return;          /* marker already sits on the peak */
      ctx.beginPath();
      ctx.moveTo(Math.round(l.x) + 0.5, l.y0 - 2);
      ctx.lineTo(Math.round(l.x) + 0.5, l.y1);
      ctx.stroke();
    });
    ctx.restore();
  }

  return {
    THRESHOLD: THRESHOLD,
    build: build, draw: draw, drawLeaders: drawLeaders, peakAt: peakAt, rng: rng,
    parseFormula: parseFormula, massOf: massOf,
    plotRect: plotRect, xOfMz: xOfMz, mzOfX: mzOfX, yOfAb: yOfAb
  };
})();

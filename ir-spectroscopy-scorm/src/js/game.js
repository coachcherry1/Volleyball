/* game.js — levels, drag-and-drop, feedback and progression.
 *
 * Level 1  identify bands by family, compound named:  "there is a C=O here"
 * Level 2  identify bands by specific group, compound hidden, then name it
 *
 * The four C-H groups are asked for by name at BOTH levels (see `atomic` in
 * groups.js): "C-H" alone would make the sp2 and sp3 peaks interchangeable,
 * and telling them apart across the 3000 line is the point.
 *
 * Only bands above 1500 cm-1 are ever drop targets. The fingerprint region is
 * drawn and discussed but never scored.
 *
 * Every drop works three ways so it survives a Chromebook trackpad, a touch
 * screen and a keyboard: pointer drag, click-tile-then-click-peak, and tab +
 * Enter, which uses the same click path.
 */

var Game = (function () {
  'use strict';

  /* One molecule is drawn per theme, so a run always contains an alcohol, an
     acid, a carbonyl, an N-H compound, a hydrocarbon and a triple bond instead
     of whatever chance produces. The last slot is a free draw. */
  var CORE_THEMES = ['oh', 'acid', 'co', 'nh', 'hc', 'triple'];

  var LEVELS = [
    { n: 1, name: 'Find the band', tag: 'find', mode: 'family', items: 7, reference: true,
      blurb: 'The compound is named for you. Drag each bond onto the peak it produced.' },
    { n: 2, name: 'Name the group', tag: 'name', mode: 'group', items: 7, identify: true,
      blurb: 'The compound is hidden. Label every marked peak with the specific functional group, then name the compound.' }
  ];

  /* Bumped whenever the shape of a saved run changes - the level list, the
     draw, or the group vocabulary. A save from an older build is discarded
     rather than resumed, otherwise a student carries an out-of-date lineup of
     spectra forward and never sees the new one. */
  var SCHEMA = 3;

  var el = {};
  var state = null;
  var item = null;          /* the item on screen right now */
  var selectedTile = null;  /* click-to-select fallback */
  var drag = null;
  var suppressClick = false; /* a completed drag must not also count as a click */

  /* ---------------------------------------------------------------- helpers */

  function $(id) { return document.getElementById(id); }

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function byId(id) {
    for (var i = 0; i < MOLECULES.length; i++) if (MOLECULES[i].id === id) return MOLECULES[i];
    return null;
  }

  /* ------------------------------------------------------------ item set-up */

  function pickMolecules(tag, count, rand) {
    var pool = MOLECULES.filter(function (m) { return m.tags.indexOf(tag) >= 0; });
    var chosen = [];

    CORE_THEMES.forEach(function (theme) {
      if (chosen.length >= count) return;
      var candidates = pool.filter(function (m) {
        return m.theme === theme && chosen.indexOf(m) < 0;
      });
      if (candidates.length) chosen.push(shuffle(candidates, rand)[0]);
    });

    /* fill any remaining places from whatever is left, themes included */
    var rest = shuffle(pool.filter(function (m) { return chosen.indexOf(m) < 0; }), rand);
    while (chosen.length < count && rest.length) chosen.push(rest.shift());

    return shuffle(chosen, rand);
  }

  function newRun() {
    var seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    var rand = IR.rng(seed);
    var plan = {};
    LEVELS.forEach(function (L) {
      plan[L.n] = pickMolecules(L.tag, L.items, rand).map(function (m) { return m.id; });
    });
    return {
      seed: seed, unlocked: 1, level: 1, index: 0, done: [],
      stats: { attempts: 0, firstTry: 0, slots: 0 },
      plan: plan
    };
  }

  function persist() {
    if (state.pin) return;
    SCORM.saveState({
      v: SCHEMA,
      s: state.seed, u: state.unlocked, l: state.level, i: state.index,
      d: state.done, st: state.stats, p: state.plan
    });
  }

  function restore(saved) {
    if (!saved || !saved.p || saved.v !== SCHEMA) return null;
    return {
      seed: saved.s, unlocked: saved.u || 1, level: saved.l || 1, index: saved.i || 0,
      done: saved.d || [], stats: saved.st || { attempts: 0, firstTry: 0, slots: 0 },
      plan: saved.p
    };
  }

  /* ------------------------------------------------------------- item build */

  /* A pinned spectrum (?molecule=ethylacetate) is a one-item level, so the
     teacher can put a single named compound on the board during a lesson. */
  function itemCount(level) {
    return state.pin ? 1 : LEVELS[level - 1].items;
  }

  function buildItem() {
    var cfg = LEVELS[state.level - 1];
    var molecule = state.pin ? byId(state.pin) : byId(state.plan[state.level][state.index]);
    var seed = (state.seed + state.level * 7919 + state.index * 104729) >>> 0;
    var spec = IR.build(molecule, seed);
    var rand = IR.rng(seed ^ 0x51ed2701);

    var targets = spec.bands.filter(function (b) { return b.t; });
    targets.sort(function (a, b) { return b.c - a.c; });

    var slots = targets.map(function (b, i) {
      /* Sharp bands are anchored at the deepest point of their window. Broad
         ones are anchored at the envelope centre instead: the lowest point
         inside a carboxylic acid's 2500-3300 O-H is the C-H spike riding on
         top of it, which is not what the label is pointing at. */
      var peak = b.s === 'g'
        ? { v: b.c, t: IR.tAt(spec, b.c) }
        : IR.depthAt(spec, b.tol[0], b.tol[1]);
      return {
        key: levelKey(b.g, cfg.mode), group: b.g,
        v: peak.v, t: peak.t, band: b, filled: false, tries: 0, i: i
      };
    });

    /* One tile per SLOT, not per distinct answer: a molecule can legitimately
       need the same label twice. */
    var needed = {};
    slots.forEach(function (s) { needed[s.key] = (needed[s.key] || 0) + 1; });

    var wanted = [];
    Object.keys(needed).forEach(function (k) {
      for (var i = 0; i < needed[k]; i++) wanted.push(k);
    });

    var distractors = shuffle(UNIVERSE[cfg.mode].filter(function (k) { return !needed[k]; }), rand)
      .slice(0, cfg.mode === 'family' ? 2 : 3);

    var tiles = shuffle(wanted.concat(distractors), rand).map(function (k) {
      return { key: k, label: keyLabel(k), sub: keySub(k), used: false, distractor: !needed[k] };
    });

    /* the multiple-choice compound question that closes out Level 2 */
    var choices = null;
    if (cfg.identify) {
      var others = shuffle(MOLECULES.filter(function (m) {
        return m.id !== molecule.id && m.cls !== molecule.cls;
      }), rand).slice(0, 2);
      choices = shuffle([molecule].concat(others), rand);
    }

    return { cfg: cfg, molecule: molecule, spec: spec, slots: slots, tiles: tiles,
             choices: choices, phase: 'label' };
  }

  /* ---------------------------------------------------------------- painting */

  function paintSpectrum() {
    var rect = IR.draw(el.plot, item.spec);
    if (rect) layoutSlots(rect);
  }

  /* Stagger chips that would otherwise sit on top of each other. */
  function layoutSlots(rect) {
    el.overlay.innerHTML = '';
    var placed = [];

    item.slots.forEach(function (s) {
      var x = IR.xOfV(s.v, rect);
      var yPeak = IR.yOfT(s.t, rect);
      /* The unfilled targets are 40px circles, so they need more clearance from
         each other and from the trace than the old chips did. */
      var below = yPeak + 28 < rect.y + rect.h - 22;
      var row = 0;
      placed.forEach(function (p) { if (Math.abs(p.x - x) < 130 && p.row === row) row++; });
      placed.push({ x: x, row: row });

      var y = below ? yPeak + 28 + row * 34 : yPeak - 30 - row * 34;
      y = Math.max(rect.y + 22, Math.min(rect.y + rect.h - 22, y));

      var node = make('button', 'slot' + (s.filled ? ' ok' : ''));
      node.type = 'button';
      node.style.left = x + 'px';
      node.style.top = y + 'px';
      node.dataset.slot = String(s.i);
      node.setAttribute('aria-label', s.filled
        ? s.filledLabel + ' at ' + Math.round(s.v) + ' wavenumbers'
        : 'Unlabelled peak at ' + Math.round(s.v) + ' wavenumbers');
      node.textContent = s.filled ? s.filledLabel : String(s.i + 1);
      el.overlay.appendChild(node);
    });
  }

  function paintTray() {
    el.tray.innerHTML = '';
    /* Once the labelling phase is over the leftovers are distractors nobody
       should still be poking at. */
    if (item.phase !== 'label') {
      el.tray.appendChild(make('p', 'tray-empty',
        'Labelling finished — the labels left over belong to other compounds.'));
      return;
    }
    var remaining = item.tiles.filter(function (t) { return !t.used; });
    if (!remaining.length) {
      el.tray.appendChild(make('p', 'tray-empty', 'All labels placed.'));
      return;
    }
    remaining.forEach(function (t) {
      var node = make('button', 'tile');
      node.type = 'button';
      node.dataset.tile = String(item.tiles.indexOf(t));
      node.appendChild(make('span', 'tile-label', t.label));
      node.appendChild(make('span', 'tile-sub', t.sub));
      el.tray.appendChild(node);
    });
  }

  function paintCard() {
    el.card.innerHTML = '';
    if (item.cfg.mode === 'group') {
      el.card.appendChild(make('p', 'card-kicker', 'Unknown compound'));
      el.card.appendChild(make('p', 'card-hidden', '?'));
      el.card.appendChild(make('p', 'card-note',
        'Label every numbered peak, then identify the compound.'));
      return;
    }
    el.card.appendChild(make('p', 'card-kicker', item.molecule.cls));
    el.card.appendChild(make('h3', 'card-name', item.molecule.name));
    el.card.appendChild(Structure.render(item.molecule.structure,
      { alt: 'Skeletal structure of ' + item.molecule.name }));
    el.card.appendChild(make('p', 'card-formula', item.molecule.formula));
  }

  function paintHeader() {
    var cfg = LEVELS[state.level - 1];
    el.levelName.textContent = 'Level ' + cfg.n + ' — ' + cfg.name;
    el.blurb.textContent = cfg.blurb;
    el.counter.textContent = state.pin
      ? 'Pinned spectrum'
      : 'Spectrum ' + (state.index + 1) + ' of ' + itemCount(cfg.n);

    el.tabs.innerHTML = '';
    LEVELS.forEach(function (L) {
      var tab = make('button', 'tab' + (L.n === state.level ? ' current' : '') +
                                (L.n > state.unlocked ? ' locked' : ''));
      tab.type = 'button';
      tab.dataset.level = String(L.n);
      tab.disabled = L.n > state.unlocked;
      tab.textContent = L.n + '. ' + L.name;
      el.tabs.appendChild(tab);
    });

    el.reference.hidden = !cfg.reference;
  }

  function say(text, kind) {
    el.feedback.className = 'feedback ' + (kind || '');
    el.feedback.textContent = text;
  }

  function render() {
    paintHeader();
    paintCard();
    paintTray();
    paintSpectrum();
    el.choices.hidden = true;
    el.next.hidden = true;
  }

  /* ------------------------------------------------------------- answering */

  function attempt(slotIndex, tileIndex) {
    if (item.phase !== 'label') return;
    var slot = item.slots[slotIndex], tile = item.tiles[tileIndex];
    if (!slot || !tile || slot.filled || tile.used) return;

    slot.tries++;
    state.stats.attempts++;

    if (tile.key === slot.key) {
      if (slot.tries === 1) state.stats.firstTry++;
      state.stats.slots++;
      slot.filled = true;
      slot.filledLabel = tile.label;
      tile.used = true;
      say('Correct — ' + Math.round(slot.v) + ' cm⁻¹. ' + GROUPS[slot.group].hint, 'good');
      paintTray();
      paintSpectrum();
      if (item.slots.every(function (s) { return s.filled; })) finishLabels();
    } else {
      say(wrongNote(slot, tile), 'bad');
      flash(slotIndex);
    }
    persist();
  }

  function wrongNote(slot, tile) {
    if (tile.distractor) {
      var g = GROUPS[tile.key];
      var where = g ? 'at ' + g.range + ' cm⁻¹' : 'anywhere in this spectrum';
      return 'This compound has no ' + tile.label + ' — you would be looking for it ' +
             where + ', and nothing is there.';
    }
    return 'Not at ' + Math.round(slot.v) + ' cm⁻¹. ' + GROUPS[slot.group].hint;
  }

  function flash(slotIndex) {
    var nodes = el.overlay.querySelectorAll('.slot');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.slot === String(slotIndex)) {
        nodes[i].classList.remove('shake');
        void nodes[i].offsetWidth;   /* restart the animation */
        nodes[i].classList.add('shake');
      }
    }
  }

  function finishLabels() {
    if (item.cfg.identify) {
      item.phase = 'identify';
      clearSelection();
      paintTray();
      say('Every peak is labelled. Now — which compound is this?', 'good');
      paintChoices();
    } else {
      item.phase = 'done';
      clearSelection();
      paintTray();
      say('Spectrum complete.', 'good');
      el.next.hidden = false;
      el.next.focus();
    }
  }

  function paintChoices() {
    el.choices.hidden = false;
    el.choices.innerHTML = '';
    el.choices.appendChild(make('p', 'choices-q', 'Which compound produced this spectrum?'));
    var row = make('div', 'choices-row');
    item.choices.forEach(function (m) {
      var b = make('button', 'choice');
      b.type = 'button';
      b.dataset.mol = m.id;
      b.appendChild(Structure.render(m.structure, { alt: m.name, scale: 28 }));
      b.appendChild(make('span', 'choice-name', m.name));
      row.appendChild(b);
    });
    el.choices.appendChild(row);
  }

  function chooseCompound(id, node) {
    if (item.phase !== 'identify') return;
    state.stats.attempts++;
    if (id === item.molecule.id) {
      state.stats.slots++;
      state.stats.firstTry++;
      item.phase = 'done';
      node.classList.add('right');
      say(item.molecule.name + ' — ' + item.molecule.cls.toLowerCase() + '. ' +
          'The band pattern you labelled is the evidence.', 'good');
      el.next.hidden = false;
      el.next.focus();
    } else {
      node.classList.add('wrong');
      node.disabled = true;
      say('No — re-read the peaks you just labelled and ask which structure could ' +
          'produce all of them.', 'bad');
    }
    persist();
  }

  /* ------------------------------------------------------------ progression */

  function nextItem() {
    var cfg = LEVELS[state.level - 1];
    state.index++;
    if (state.index >= itemCount(cfg.n)) {
      state.done.push(state.level);
      if (state.level < LEVELS.length) {
        state.unlocked = Math.max(state.unlocked, state.level + 1);
        state.level++;
        state.index = 0;
        persist();
        showScreen('level', cfg);
        return;
      }
      state.index = itemCount(cfg.n) - 1;
      persist();
      SCORM.markComplete();
      showScreen('finish');
      return;
    }
    persist();
    item = buildItem();
    render();
    say('');
  }

  function goToLevel(n) {
    if (n > state.unlocked) return;
    state.level = n;
    state.index = 0;
    persist();
    item = buildItem();
    render();
    say('');
  }

  /* ---------------------------------------------------------------- screens */

  /* Emptying the overlay on the way out keeps stale headings out of the
     accessibility tree and out of anything that queries the DOM. */
  function hideScreen() {
    el.screen.hidden = true;
    el.screen.innerHTML = '';
  }

  function showScreen(kind, cfg) {
    var s = el.screen;
    s.innerHTML = '';
    s.hidden = false;
    var box = make('div', 'screen-box');

    if (kind === 'intro') {
      box.appendChild(make('h2', null, 'Reading the diagnostic region'));
      box.appendChild(make('p', null,
        'Below 1500 cm⁻¹ an IR spectrum is a fingerprint — unique, but hard to ' +
        'read. Above 1500 is the diagnostic region, where individual bonds announce ' +
        'themselves at predictable wavenumbers. Every peak you are asked to label is in ' +
        'that region; both dotted lines on the plot are there to help you place it.'));
      var ul = make('ul', 'screen-list');
      LEVELS.forEach(function (L) {
        var li = make('li', null);
        li.appendChild(make('strong', null, 'Level ' + L.n + ' — ' + L.name + ': '));
        li.appendChild(document.createTextNode(L.blurb));
        ul.appendChild(li);
      });
      box.appendChild(ul);
      box.appendChild(make('p', 'screen-note',
        'Drag a label onto a peak, or click the label and then click the peak. ' +
        'Wrong answers are not penalised — read the explanation and try again.'));
      var start = make('button', 'primary', 'Start');
      start.type = 'button';
      start.addEventListener('click', function () { hideScreen(); el.tray.focus(); });
      box.appendChild(start);

    } else if (kind === 'level') {
      box.appendChild(make('h2', null, 'Level ' + cfg.n + ' complete'));
      box.appendChild(make('p', null, accuracyLine()));
      box.appendChild(make('p', 'screen-note', LEVELS[state.level - 1].blurb));
      var go = make('button', 'primary', 'Start Level ' + state.level);
      go.type = 'button';
      go.addEventListener('click', function () {
        hideScreen();
        item = buildItem();
        render();
        say('');
      });
      box.appendChild(go);

    } else {
      box.appendChild(make('h2', null, 'Both levels complete'));
      box.appendChild(make('p', null, accuracyLine()));
      box.appendChild(make('p', 'screen-note', SCORM.isConnected()
        ? 'Your completion has been sent to the gradebook. You may close this window.'
        : 'Running outside an LMS — nothing was reported.'));
      var again = make('button', 'primary', 'Play again with new spectra');
      again.type = 'button';
      again.addEventListener('click', function () {
        state = newRun();
        persist();
        hideScreen();
        item = buildItem();
        render();
        say('');
      });
      box.appendChild(again);
    }

    s.appendChild(box);
  }

  function accuracyLine() {
    var st = state.stats;
    if (!st.slots) return 'No answers recorded yet.';
    var pct = Math.round(st.firstTry / st.slots * 100);
    return st.firstTry + ' of ' + st.slots + ' labels placed correctly on the first try (' +
           pct + '%), across ' + st.attempts + ' attempts.';
  }

  /* ----------------------------------------------------------- interaction */

  function tileIndexOf(node) {
    var t = node.closest ? node.closest('.tile') : null;
    return t ? +t.dataset.tile : -1;
  }

  function slotIndexAt(clientX, clientY) {
    var node = document.elementFromPoint(clientX, clientY);
    if (!node || !node.closest) return -1;
    var hit = node.closest('.slot');
    return hit ? +hit.dataset.slot : -1;
  }

  function clearSelection() {
    if (selectedTile == null) return;
    var nodes = el.tray.querySelectorAll('.tile.selected');
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove('selected');
    selectedTile = null;
    el.stage.classList.remove('picking');
  }

  function startDrag(ev) {
    var idx = tileIndexOf(ev.target);
    if (idx < 0) return;
    var tileNode = ev.target.closest('.tile');
    drag = { index: idx, moved: false, node: null, pointerId: ev.pointerId,
             from: tileNode, x0: ev.clientX, y0: ev.clientY };
    try { tileNode.setPointerCapture(ev.pointerId); } catch (e) { /* not capturable */ }
  }

  function moveDrag(ev) {
    if (!drag) return;
    if (!drag.moved) {
      /* movementX is unreliable on touch, so measure from the press point */
      if (Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) < 6) return;
      drag.moved = true;
      var ghost = make('div', 'ghost', item.tiles[drag.index].label);
      document.body.appendChild(ghost);
      drag.node = ghost;
      drag.from.classList.add('dragging');
    }
    drag.node.style.left = ev.clientX + 'px';
    drag.node.style.top = ev.clientY + 'px';

    var over = slotIndexAt(ev.clientX, ev.clientY);
    var nodes = el.overlay.querySelectorAll('.slot');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle('hover', over >= 0 && nodes[i].dataset.slot === String(over));
    }
  }

  function endDrag(ev) {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (d.node) d.node.remove();
    d.from.classList.remove('dragging');
    var nodes = el.overlay.querySelectorAll('.slot');
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove('hover');

    /* A tap without movement is left to the click handler below, so that a
       keyboard Enter - which fires click and no pointer events at all - takes
       exactly the same path. */
    if (!d.moved) return;

    suppressClick = true;
    var slot = slotIndexAt(ev.clientX, ev.clientY);
    if (slot >= 0) attempt(slot, d.index);
  }

  function selectTile(index) {
    var wasSelected = selectedTile === index;
    clearSelection();
    if (wasSelected) { say(''); return; }
    selectedTile = index;
    var nodes = el.tray.querySelectorAll('.tile');
    for (var i = 0; i < nodes.length; i++) {
      if (+nodes[i].dataset.tile === index) nodes[i].classList.add('selected');
    }
    el.stage.classList.add('picking');
    say('Now choose the peak that belongs to ' + item.tiles[index].label + '.');
  }

  function onTrayClick(ev) {
    if (suppressClick) { suppressClick = false; return; }
    var idx = tileIndexOf(ev.target);
    if (idx >= 0) selectTile(idx);
  }

  function onStageClick(ev) {
    var hit = ev.target.closest && ev.target.closest('.slot');
    if (hit && selectedTile != null) {
      var tileIdx = selectedTile;
      clearSelection();
      attempt(+hit.dataset.slot, tileIdx);
      return;
    }
    var choice = ev.target.closest && ev.target.closest('.choice');
    if (choice) chooseCompound(choice.dataset.mol, choice);
  }

  /* ------------------------------------------------------------------ boot */

  function cacheDom() {
    ['plot', 'overlay', 'tray', 'card', 'feedback', 'next', 'tabs',
     'levelName', 'blurb', 'counter', 'screen', 'choices', 'stage', 'reference',
     'refbody', 'lms'].forEach(function (id) { el[id] = $(id); });
  }

  function buildReference() {
    var table = make('table', 'ref-table');
    var head = make('tr');
    ['Bond', 'Wavenumber (cm⁻¹)', 'Look for'].forEach(function (h) {
      head.appendChild(make('th', null, h));
    });
    table.appendChild(head);
    Object.keys(GROUPS).forEach(function (k) {
      var g = GROUPS[k];
      var tr = make('tr', g.fingerprint ? 'fingerprint-row' : null);
      tr.appendChild(make('td', null, g.label + (g.fingerprint ? ' †' : '')));
      tr.appendChild(make('td', 'num', g.range));
      tr.appendChild(make('td', 'note', g.hint));
      table.appendChild(tr);
    });
    el.refbody.appendChild(table);
    el.refbody.appendChild(make('p', 'ref-foot',
      '† Below 1500 cm⁻¹, in the fingerprint region. Worth knowing, and worth ' +
      'using as corroboration, but never one of the peaks you are asked to label here.'));
  }

  function start() {
    cacheDom();
    buildReference();

    var connected = SCORM.init();
    el.lms.textContent = connected ? 'Connected to the LMS' : 'Standalone — no LMS detected';
    el.lms.className = 'lms ' + (connected ? 'on' : 'off');

    var params = new URLSearchParams(location.search);
    var pin = params.get('molecule');
    var startLevel = parseInt(params.get('level'), 10);

    if (pin && byId(pin)) {
      state = newRun();
      state.pin = pin;
      state.unlocked = LEVELS.length;
      state.level = (startLevel >= 1 && startLevel <= LEVELS.length) ? startLevel : 2;
    } else {
      state = restore(SCORM.loadState()) || newRun();
      if (!state.plan || !state.plan[1] || !byId(state.plan[1][0])) state = newRun();
    }

    /* Write the run out before the first answer. Without this a discarded
       older save survives in storage until a student answers something, and a
       student who opens the activity and closes it again comes back to a
       different set of spectra. */
    persist();

    item = buildItem();
    render();

    el.tray.addEventListener('pointerdown', startDrag);
    el.tray.addEventListener('pointermove', moveDrag);
    el.tray.addEventListener('pointerup', endDrag);
    el.tray.addEventListener('pointercancel', endDrag);
    el.tray.addEventListener('click', onTrayClick);

    el.stage.addEventListener('click', onStageClick);
    el.choices.addEventListener('click', onStageClick);

    el.next.addEventListener('click', nextItem);
    el.tabs.addEventListener('click', function (ev) {
      var tab = ev.target.closest('.tab');
      if (tab && !tab.disabled) goToLevel(+tab.dataset.level);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') clearSelection();
    });

    var ro = new ResizeObserver(function () { paintSpectrum(); });
    ro.observe(el.plot.parentNode);

    showScreen('intro');
  }

  return { start: start };
})();

document.addEventListener('DOMContentLoaded', Game.start);

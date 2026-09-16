/* game.js — levels, drag-and-drop, feedback and progression.
 *
 * Level 1  orient to the axis: drop the four region labels onto the spectrum
 * Level 2  identify bands by family: "there is a C=O here"
 * Level 3  identify bands by specific group and then name the compound
 *
 * Every drop works three ways so it survives a Chromebook trackpad, a touch
 * screen and a keyboard: pointer drag, click-tile-then-click-slot, and tab +
 * Enter, which uses the same click path.
 */

var Game = (function () {
  'use strict';

  var REGIONS = [
    { id: 'xh',     lo: 2500, hi: 4000, label: 'X–H stretch',  sub: 'O–H, N–H, C–H' },
    { id: 'triple', lo: 2000, hi: 2500, label: 'Triple bonds',      sub: 'C≡N, C≡C' },
    { id: 'double', lo: 1500, hi: 2000, label: 'Double bonds',      sub: 'C=O, C=C' },
    { id: 'finger', lo: 400,  hi: 1500, label: 'Fingerprint',       sub: 'whole-molecule' }
  ];

  var LEVELS = [
    { n: 1, name: 'Regions',      items: 3, mode: 'region',
      blurb: 'Drag each region name onto the correct stretch of the wavenumber axis.' },
    { n: 2, name: 'Find the band', items: 6, mode: 'family', reference: true,
      blurb: 'The compound is named for you. Drag each bond type onto the peak it produced.' },
    { n: 3, name: 'Name the group', items: 6, mode: 'group', identify: true,
      blurb: 'The compound is hidden. Label every marked peak with the specific functional group, then name the compound.' }
  ];

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
    return shuffle(pool, rand).slice(0, count);
  }

  function newRun() {
    var seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    var rand = IR.rng(seed);
    return {
      seed: seed,
      unlocked: 1,
      level: 1,
      index: 0,
      done: [],
      stats: { attempts: 0, firstTry: 0, slots: 0 },
      plan: {
        1: pickMolecules('l2', LEVELS[0].items, rand).map(function (m) { return m.id; }),
        2: pickMolecules('l2', LEVELS[1].items, rand).map(function (m) { return m.id; }),
        3: pickMolecules('l3', LEVELS[2].items, rand).map(function (m) { return m.id; })
      }
    };
  }

  function persist() {
    if (state.pin) return;
    SCORM.saveState({
      s: state.seed, u: state.unlocked, l: state.level, i: state.index,
      d: state.done, st: state.stats, p: state.plan
    });
  }

  function restore(saved) {
    if (!saved || !saved.p) return null;
    try {
      return {
        seed: saved.s, unlocked: saved.u || 1, level: saved.l || 1, index: saved.i || 0,
        done: saved.d || [], stats: saved.st || { attempts: 0, firstTry: 0, slots: 0 },
        plan: saved.p
      };
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------- level build */

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

    var slots = [], tiles = [];

    if (cfg.mode === 'region') {
      slots = REGIONS.map(function (r, i) {
        return { key: r.id, lo: r.lo, hi: r.hi, filled: false, tries: 0, i: i };
      });
      tiles = shuffle(REGIONS, rand).map(function (r) {
        return { key: r.id, label: r.label, sub: r.sub, used: false };
      });
    } else {
      var targets = spec.bands.filter(function (b) { return b.t; });
      targets.sort(function (a, b) { return b.c - a.c; });

      slots = targets.map(function (b, i) {
        /* Sharp bands are anchored at the deepest point of their window. Broad
           ones are anchored at the envelope centre instead: the lowest point
           inside a carboxylic acid's 2500-3300 O-H is the C-H spike riding on
           top of it, which is not what the label is pointing at. */
        var peak = b.s === 'g'
          ? { v: b.c, t: IR.tAt(spec, b.c) }
          : IR.depthAt(spec, b.tol[0], b.tol[1]);
        var group = GROUPS[b.g];
        return {
          key: cfg.mode === 'family' ? group.family : b.g,
          group: b.g, v: peak.v, t: peak.t, band: b,
          filled: false, tries: 0, i: i
        };
      });

      /* One tile per SLOT, not per distinct answer. At family level a molecule
         can need the same label twice - toluene has sp2 and sp3 C-H, and both
         are marked - so the tray has to hold two "C-H" tiles or the item
         cannot be finished. */
      var needed = {};
      slots.forEach(function (s) { needed[s.key] = (needed[s.key] || 0) + 1; });

      var wanted = [];
      Object.keys(needed).forEach(function (k) {
        for (var i = 0; i < needed[k]; i++) wanted.push(k);
      });

      var universe = cfg.mode === 'family'
        ? Object.keys(FAMILIES)
        : Object.keys(GROUPS);

      var distractors = shuffle(universe.filter(function (k) { return !needed[k]; }), rand)
        .slice(0, cfg.mode === 'family' ? 2 : 3);

      tiles = shuffle(wanted.concat(distractors), rand).map(function (k) {
        var label = cfg.mode === 'family' ? FAMILIES[k].label : GROUPS[k].label;
        var sub = cfg.mode === 'family' ? FAMILIES[k].aka : GROUPS[k].range + ' cm⁻¹';
        return { key: k, label: label, sub: sub, used: false, distractor: !needed[k] };
      });
    }

    /* the multiple-choice compound question that closes out Level 3 */
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
    el.regions.innerHTML = '';

    if (item.cfg.mode === 'region') {
      item.slots.forEach(function (s) {
        var x0 = IR.xOfV(s.hi, rect), x1 = IR.xOfV(s.lo, rect);
        var strip = make('button', 'strip');
        strip.type = 'button';
        strip.style.left = x0 + 'px';
        strip.style.width = Math.max(10, x1 - x0) + 'px';
        strip.style.top = rect.y + 'px';
        strip.style.height = rect.h + 'px';
        strip.dataset.slot = String(s.i);
        strip.setAttribute('aria-label', 'Region from ' + s.hi + ' to ' + s.lo + ' wavenumbers');
        var tag = make('span', 'strip-tag', s.filled ? s.filledLabel : '?');
        if (s.filled) strip.classList.add('ok');
        strip.appendChild(tag);
        el.regions.appendChild(strip);
      });
      return;
    }

    var placed = [];
    item.slots.forEach(function (s) {
      var x = IR.xOfV(s.v, rect);
      var yPeak = IR.yOfT(s.t, rect);
      var below = yPeak + 16 < rect.y + rect.h - 12;
      var row = 0;
      placed.forEach(function (p) { if (Math.abs(p.x - x) < 96 && p.row === row) row++; });
      placed.push({ x: x, row: row });

      var y = below ? yPeak + 16 + row * 22 : yPeak - 18 - row * 22;
      y = Math.max(rect.y + 8, Math.min(rect.y + rect.h - 10, y));

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
    remaining.forEach(function (t, i) {
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
      say(correctNote(slot), 'good');
      paintTray();
      paintSpectrum();
      if (item.slots.every(function (s) { return s.filled; })) finishLabels();
    } else {
      say(wrongNote(slot, tile), 'bad');
      flash(slotIndex);
    }
    persist();
  }

  function correctNote(slot) {
    if (item.cfg.mode === 'region') {
      var r = REGIONS.filter(function (x) { return x.id === slot.key; })[0];
      return 'Yes — ' + r.lo + '–' + r.hi + ' cm⁻¹ is where ' +
             r.sub + ' show up.';
    }
    var g = GROUPS[slot.group];
    return 'Correct — ' + Math.round(slot.v) + ' cm⁻¹. ' + g.hint;
  }

  function wrongNote(slot, tile) {
    if (item.cfg.mode === 'region') {
      var r = REGIONS.filter(function (x) { return x.id === tile.key; })[0];
      return 'Not there. ' + tile.label + ' belong at ' + r.lo + '–' + r.hi +
             ' cm⁻¹.';
    }
    var where = Math.round(slot.v) + ' cm⁻¹';
    if (tile.distractor) {
      var range = item.cfg.mode === 'family'
        ? 'anywhere in this spectrum'
        : GROUPS[tile.key].range + ' cm⁻¹';
      return 'This compound has no ' + tile.label + ' — you would be looking for it at ' +
             range + ', and nothing is there.';
    }
    return 'Not at ' + where + '. ' + GROUPS[slot.group].hint;
  }

  function flash(slotIndex) {
    var sel = item.cfg.mode === 'region' ? '.strip' : '.slot';
    var nodes = (item.cfg.mode === 'region' ? el.regions : el.overlay).querySelectorAll(sel);
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
        'An IR spectrum below about 1500 cm⁻¹ is a fingerprint — unique, but ' +
        'hard to read. Above 1500 cm⁻¹ is the diagnostic region, where individual ' +
        'bonds announce themselves at predictable wavenumbers. Three levels, ' +
        'fifteen spectra.'));
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
      box.appendChild(make('h2', null, 'All three levels complete'));
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
    var hit = node.closest('.slot, .strip');
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
      var t = item.tiles[drag.index];
      var ghost = make('div', 'ghost', t.label);
      document.body.appendChild(ghost);
      drag.node = ghost;
      drag.from.classList.add('dragging');
    }
    drag.node.style.left = ev.clientX + 'px';
    drag.node.style.top = ev.clientY + 'px';

    var over = slotIndexAt(ev.clientX, ev.clientY);
    var nodes = document.querySelectorAll('.slot, .strip');
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
    var nodes = document.querySelectorAll('.slot, .strip');
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
    var hit = ev.target.closest && ev.target.closest('.slot, .strip');
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
    ['plot', 'overlay', 'regions', 'tray', 'card', 'feedback', 'next', 'tabs',
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
      var tr = make('tr');
      tr.appendChild(make('td', null, g.label));
      tr.appendChild(make('td', 'num', g.range));
      tr.appendChild(make('td', 'note', g.hint));
      table.appendChild(tr);
    });
    el.refbody.appendChild(table);
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
      state.level = (startLevel >= 1 && startLevel <= LEVELS.length) ? startLevel : 3;
    } else {
      state = restore(SCORM.loadState()) || newRun();
      if (!state.plan || !state.plan[1] || !byId(state.plan[1][0])) state = newRun();
    }

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

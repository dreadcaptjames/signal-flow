/* Signal Flow Trainer — UI */
(function () {
  const SF = window.SF;
  const L = SF.LAYOUT;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + n.toLocaleString();

  const DIFFS = {
    novice: { label: 'Novice', blockBad: true, glow: true, live: true, desc: 'Guided: compatible ports glow, bad connections are blocked and explained, live signal feedback.' },
    intermediate: { label: 'Intermediate', blockBad: false, glow: true, live: true, desc: 'Ports glow and feedback is live — but you\'re allowed to make mistakes.' },
    advanced: { label: 'Advanced', blockBad: false, glow: false, live: false, desc: 'No glow, no live feedback. Test to find out. Distances matter.' },
    pro: { label: 'Pro', blockBad: false, glow: false, live: false, desc: 'Advanced rules plus tight budgets and multi-fault troubleshooting.' },
  };

  // ---------------- Persistence ----------------
  const PKEY = 'sft.progress.v1';
  const SKEY = (id) => 'sft.save.v1.' + id;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const progress = () => store.get(PKEY, {});
  function recordStars(id, stars) {
    const p = progress();
    if (!p[id] || p[id] < stars) p[id] = stars;
    store.set(PKEY, p);
  }

  // ---------------- Toasts / modal ----------------
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), kind === 'error' ? 5200 : 3200);
    setTimeout(() => el.remove(), kind === 'error' ? 5800 : 3800);
  }
  function openModal(html, cls = '') {
    const card = $('#modal-card');
    card.className = 'modal-card ' + cls;
    card.innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function closeModal() { $('#modal').classList.add('hidden'); }
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });

  function confirmBox(title, text, okLabel, onOk) {
    openModal(`<h2>${title}</h2><p>${text}</p><div class="modal-actions"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="cf-ok">${okLabel}</button></div>`);
    $('#cf-ok').onclick = () => { closeModal(); onOk(); };
  }

  function legendHTML() {
    return '<div class="legend">' + Object.entries(SF.PORT_TYPES).map(([k, t]) =>
      `<div class="lg"><span class="dot" style="--c:${t.color}"></span><span>${esc(t.name)}</span><span class="muted">${t.maxLen < 100 || k === 'spk70' ? '≤' + t.maxLen + ' m' : ''}</span></div>`).join('') + '</div>';
  }

  function showGuide() {
    openModal(`<h2>📘 Field Guide</h2>
      <div class="guide">${SF.GUIDE.map((g, i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(g.title)}</summary>${g.body}</details>`).join('')}</div>
      <div class="modal-actions"><button class="btn primary" data-close>Close</button></div>`, 'wide');
    const lg = $('#guide-legend'); if (lg) lg.innerHTML = legendHTML();
  }
  function showHelp() {
    openModal(`<h2>🎮 How to Play</h2>${SF.HOWTO}<div class="modal-actions"><button class="btn primary" data-close>Got it</button></div>`, 'wide');
  }

  // ---------------- Home ----------------
  function showHome() {
    G = null;
    $('#game').classList.add('hidden');
    $('#home').classList.remove('hidden');
    const p = progress();
    const total = SF.SCENARIOS.length * 3;
    const got = SF.SCENARIOS.reduce((s, x) => s + (p[x.id] || 0), 0);
    const done = SF.SCENARIOS.filter((x) => p[x.id]).length;
    $('#hero-stats').innerHTML = `<div class="stat"><b>${done}/${SF.SCENARIOS.length}</b><span>systems commissioned</span></div><div class="stat"><b>${got}/${total}</b><span>stars</span></div>`;
    $('#levels').innerHTML = SF.DIFF_ORDER.map((dk) => {
      const list = SF.SCENARIOS.filter((s) => s.diff === dk);
      return `<div class="level-group diff-${dk}">
        <div class="level-head"><h2>${DIFFS[dk].label}</h2><p>${DIFFS[dk].desc}</p></div>
        <div class="cards">${list.map((s) => {
          const st = p[s.id] || 0;
          return `<button class="scn-card ${st ? 'done' : ''}" data-scn="${s.id}">
            <div class="scn-top"><span class="badge mode">${s.mode === 'troubleshoot' ? '🔧 Troubleshoot' : '🛠 Build'}</span><span class="stars">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></div>
            <h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p>
            ${s.budget ? `<div class="scn-meta">Budget ${money(s.budget)}</div>` : ''}
          </button>`;
        }).join('')}</div></div>`;
    }).join('');
  }
  $('#levels').addEventListener('click', (e) => {
    const c = e.target.closest('[data-scn]');
    if (c) openScenario(c.dataset.scn);
  });

  // ---------------- Game state ----------------
  let G = null;

  function openScenario(id) {
    const scn = SF.SCENARIOS.find((s) => s.id === id);
    const saved = store.get(SKEY(id), null);
    const base = saved && saved.devices ? saved : Object.assign(SF.initialState(scn), { hintsUsed: 0, tests: 0, sawSolution: false });
    G = Object.assign(
      { scn, diff: DIFFS[scn.diff], selected: null, pending: null, tested: false, analysis: null, paletteSel: null },
      { devices: base.devices, cables: base.cables, nextId: base.nextId || 1, nextCable: base.nextCable || base.cables.length + 1, hintsUsed: base.hintsUsed || 0, tests: base.tests || 0, sawSolution: !!base.sawSolution }
    );
    $('#toasts').innerHTML = '';
    $('#home').classList.add('hidden');
    $('#game').classList.remove('hidden');
    $('#g-title').textContent = scn.title;
    $('#g-diff').textContent = G.diff.label;
    $('#g-diff').className = 'badge diff-' + scn.diff;
    $('#g-mode').textContent = scn.mode === 'troubleshoot' ? '🔧 Troubleshoot' : '🛠 Build';
    G.analysis = SF.analyze(scn, G);
    renderAll();
    $('#canvas-wrap').scrollTo(0, 0);
    if (!saved && !store.get('sft.seenHelp', false)) { store.set('sft.seenHelp', true); showHelp(); }
  }

  function save() {
    if (!G) return;
    store.set(SKEY(G.scn.id), { devices: G.devices, cables: G.cables, nextId: G.nextId, nextCable: G.nextCable, hintsUsed: G.hintsUsed, tests: G.tests, sawSolution: G.sawSolution });
  }

  function afterChange() {
    G.tested = false;
    G.analysis = SF.analyze(G.scn, G);
    save();
    renderAll();
  }

  const visibleAnalysis = () => (G.diff.live || G.tested ? G.analysis : null);
  const dev = (uid) => G.devices.find((d) => d.uid === uid);
  const tpl = (d) => SF.DEVICES[d.type];
  const cablesAt = (uid, port) => G.cables.filter((c) => (c.a.uid === uid && c.a.port === port) || (c.b.uid === uid && c.b.port === port));
  const zoneName = (z) => (G.scn.zones.find((x) => x.id === z) || {}).name || z;

  // ---------------- Rendering ----------------
  function renderAll() {
    renderBar();
    renderLeft();
    renderCanvas();
    renderRight();
  }

  function renderBar() {
    const cost = SF.stateCost(G);
    const parts = [`<span class="muted">New gear</span> <b>${money(cost)}</b>`];
    if (G.scn.budget != null) parts.push(`<span class="${cost > G.scn.budget ? 'over' : 'muted'}">/ budget ${money(G.scn.budget)}</span>`);
    if (G.scn.par != null) parts.push(`<span class="muted">· par ${money(G.scn.par)}</span>`);
    $('#g-cost').innerHTML = parts.join(' ');
    const left = G.scn.hints.length - G.hintsUsed;
    $('#btn-hint').textContent = left > 0 ? `💡 Hint (${left})` : '💡 Hints used';
    $('#btn-hint').disabled = left <= 0;
    const canSol = G.sawSolution || progress()[G.scn.id] || G.tests >= 3;
    $('#btn-solution').classList.toggle('hidden', !canSol);
  }

  function renderLeft() {
    const s = G.scn;
    const zones = s.zones;
    let survey = '<table class="survey"><tr><th></th>' + zones.map((z) => `<th>${esc(z.name)}</th>`).join('') + '</tr>';
    for (const a of zones) {
      survey += `<tr><th>${esc(a.name)}</th>` + zones.map((b) => `<td>${SF.zoneDistance(s, a.id, b.id)} m</td>`).join('') + '</tr>';
    }
    survey += '</table>';

    const hints = s.hints.slice(0, G.hintsUsed).map((h, i) => `<div class="hint"><b>Hint ${i + 1}:</b> ${esc(h)}</div>`).join('');

    // palette
    const cats = {};
    for (const pe of s.palette) {
      const t = SF.DEVICES[pe.type];
      (cats[t.cat] = cats[t.cat] || []).push(pe);
    }
    const pal = SF.CAT_ORDER.filter((c) => cats[c]).map((c) => `<div class="pal-cat">${esc(c)}</div>` + cats[c].map((pe) => {
      const t = SF.DEVICES[pe.type];
      const used = G.devices.filter((d) => !d.owned && d.type === pe.type).length;
      const left = pe.qty - used;
      return `<div class="pal-item ${left <= 0 ? 'empty' : ''} ${G.paletteSel === pe.type ? 'sel' : ''}" draggable="${left > 0}" data-type="${pe.type}">
        <span class="pal-icon">${t.icon}</span>
        <span class="pal-name">${esc(t.name)}<small>${money(t.price)} · ${left} left</small></span>
        <button class="pal-add" data-add="${pe.type}" ${left <= 0 ? 'disabled' : ''} title="Add to system">+</button>
      </div>`;
    }).join('')).join('');

    $('#left').innerHTML = `
      <details class="sec" open><summary>${s.mode === 'troubleshoot' ? 'Ticket' : 'Client Brief'}</summary><div class="brief">${s.brief}</div></details>
      ${hints ? `<div class="sec hints">${hints}</div>` : ''}
      <details class="sec"><summary>Site Survey (cable distances)</summary>${survey}<p class="muted small">Cables between devices in the same zone are ~${s.sameZone != null ? s.sameZone : 3} m.</p></details>
      <div class="sec"><div class="sec-title">${s.mode === 'troubleshoot' ? 'Spare Parts' : 'Equipment'}</div><div class="palette">${pal}</div></div>`;
  }

  function renderRight() {
    renderChecklist();
    renderInspector();
  }

  function renderChecklist() {
    const an = visibleAnalysis();
    const ev = an ? SF.evaluate(G.scn, G, an) : null;
    const rows = G.scn.reqs.map((r, i) => {
      const res = ev ? ev.results[i] : null;
      const icon = res ? (res.pass ? '✅' : '❌') : '⬜';
      return `<li class="${res ? (res.pass ? 'ok' : 'no') : ''}"><span>${icon}</span><span>${esc(r.label)}${res && !res.pass ? `<small>${esc(res.detail)}</small>` : ''}</span></li>`;
    });
    if (G.scn.budget != null) {
      const res = ev ? ev.results[ev.results.length - 1] : null;
      rows.push(`<li class="${res ? (res.pass ? 'ok' : 'no') : ''}"><span>${res ? (res.pass ? '✅' : '❌') : '⬜'}</span><span>Within ${money(G.scn.budget)} budget</span></li>`);
    }
    const note = G.diff.live ? '<p class="muted small">Live feedback is on for this difficulty.</p>'
      : G.tested ? '<p class="muted small">Showing results from your last test.</p>' : '<p class="muted small">Press ▶ Test System to check.</p>';
    $('#checklist').innerHTML = `<div class="sec-title">Requirements</div><ul class="reqs">${rows.join('')}</ul>${note}`;
  }

  function signalList(cids, an) {
    if (!cids || !cids.size) return '<span class="muted">none</span>';
    return Array.from(cids).map((cid) => {
      const c = an.contents.get(cid);
      return `<span class="sig ${c.media}">${c.media === 'video' ? '🎞' : '♪'} ${esc(c.label)}</span>`;
    }).join(' ');
  }

  function renderInspector() {
    const el = $('#inspector');
    const an = visibleAnalysis();
    const sel = G.selected;
    if (sel && sel.kind === 'device' && dev(sel.uid)) {
      const d = dev(sel.uid), t = tpl(d);
      const ports = t.ports.map((p) => {
        const pt = SF.PORT_TYPES[p.type];
        const cs = cablesAt(d.uid, p.id);
        const peer = cs.map((c) => {
          const other = c.a.uid === d.uid && c.a.port === p.id ? c.b : c.a;
          const od = dev(other.uid);
          return od ? `${esc(od.name)} › ${esc(SF.portOf(od, other.port).label)}` : '';
        }).join(', ');
        const arr = an ? an.arrivals.get(d.uid + '|' + p.id) : null;
        const extra = [p.phantom ? '+48V' : '', p.poe ? 'PoE' : '', p.needsPhantom ? 'needs +48V' : '', p.needsPoE ? 'needs PoE' : ''].filter(Boolean).join(' · ');
        return `<div class="iport"><span class="dot" style="--c:${pt.color}"></span><div>
          <b>${p.dir === 'io' ? '⇄ ' : ''}${esc(p.label)}</b> <span class="muted">${p.dir === 'in' ? 'input' : p.dir === 'out' ? 'output' : 'two-way'} · ${esc(pt.name)}${extra ? ' · ' + extra : ''}</span>
          <div class="small">${peer ? '↔ ' + peer : '<span class="muted">not connected</span>'}</div>
          ${an && arr && arr.size ? `<div class="small">Arriving: ${signalList(arr, an)}</div>` : ''}
        </div></div>`;
      }).join('');
      let status = '';
      if (an) {
        if (!an.powered.get(d.uid)) status += `<div class="warnbox">⚠ No power — this device needs PoE from a PoE switch port.</div>`;
        if (t.consumes.length) status += `<div class="small"><b>${t.sinkName ? 'Sending to ' + esc(t.sinkName) : 'Playing / showing'}:</b> ${signalList(an.received.get(d.uid), an)}</div>`;
      } else {
        status = '<p class="muted small">Signal probe unlocks after you test (Advanced/Pro).</p>';
      }
      el.innerHTML = `<div class="sec-title">Inspector</div>
        <div class="insp-head"><span class="insp-icon">${t.icon}</span><div><b>${esc(d.name)}</b><div class="muted small">${esc(t.name)} · ${d.owned ? (d.fixed ? 'client-owned' : 'existing') : money(t.price)} · ${esc(zoneName(d.zone))}</div></div></div>
        <p class="small">${esc(t.desc)}</p>${status}<div class="iports">${ports}</div>
        ${d.fixed ? '<p class="muted small">🔒 Fixed in place by the client.</p>' : `<button class="btn danger small" id="insp-del">Remove device</button>`}`;
      const del = $('#insp-del'); if (del) del.onclick = () => deleteDevice(d.uid);
      return;
    }
    if (sel && sel.kind === 'cable') {
      const c = G.cables.find((x) => x.id === sel.id);
      if (c) {
        const da = dev(c.a.uid), db = dev(c.b.uid);
        const pa = SF.portOf(da, c.a.port), pb = SF.portOf(db, c.b.port);
        const pt = SF.PORT_TYPES[pa.type];
        const len = SF.zoneDistance(G.scn, da.zone, db.zone);
        const ci = an ? an.cables.get(c.id) : null;
        el.innerHTML = `<div class="sec-title">Cable</div>
          <p><b>${esc(da.name)}</b> › ${esc(pa.label)}<br>→ <b>${esc(db.name)}</b> › ${esc(pb.label)}</p>
          <p class="small"><span class="dot inline" style="--c:${pt.color}"></span>${esc(pt.cable)} · ~${len} m${pt.maxLen <= 100 ? ` (max ${pt.maxLen} m)` : ''}</p>
          ${ci ? (ci.status === 'ok' ? `<div class="okbox">✓ Good connection</div>` : `<div class="${ci.status === 'danger' ? 'dangerbox' : 'warnbox'}">${ci.status === 'danger' ? '🔥' : '⚠'} ${esc(ci.msg)}</div>`) : ''}
          ${ci ? `<div class="small"><b>Carrying:</b> ${signalList(ci.carries, an)}</div>` : '<p class="muted small">Test the system to diagnose this cable.</p>'}
          <button class="btn danger small" id="insp-del">Remove cable</button>`;
        $('#insp-del').onclick = () => removeCable(c.id);
        return;
      }
    }
    if (G.paletteSel) {
      const t = SF.DEVICES[G.paletteSel];
      el.innerHTML = `<div class="sec-title">Equipment info</div>
        <div class="insp-head"><span class="insp-icon">${t.icon}</span><div><b>${esc(t.name)}</b><div class="muted small">${money(t.price)} · ${esc(t.cat)}</div></div></div>
        <p class="small">${esc(t.desc)}</p>
        <div class="iports">${t.ports.map((p) => `<div class="iport"><span class="dot" style="--c:${SF.PORT_TYPES[p.type].color}"></span><div><b>${p.dir === 'io' ? '⇄ ' : ''}${esc(p.label)}</b> <span class="muted">${p.dir === 'in' ? 'in' : p.dir === 'out' ? 'out' : 'two-way'} · ${esc(SF.PORT_TYPES[p.type].name)}${p.phantom ? ' · +48V' : ''}${p.poe ? ' · PoE' : ''}${p.needsPhantom ? ' · needs +48V' : ''}${p.needsPoE ? ' · needs PoE' : ''}</span></div></div>`).join('')}</div>`;
      return;
    }
    el.innerHTML = `<div class="sec-title">Inspector</div><p class="muted small">Click a device or cable to inspect it. Click equipment in the list to read about it.</p>${legendHTML()}`;
  }

  function renderCanvas() {
    const cv = $('#canvas');
    const zones = G.scn.zones;
    const wrap = $('#canvas-wrap');
    const width = Math.max(zones.length * L.COLW, 300);
    const maxBottom = G.devices.reduce((m, d) => Math.max(m, d.y + SF.cardHeight(d.type)), 0);
    const height = Math.max(wrap.clientHeight - 4, maxBottom + 160, 600);
    cv.style.width = width + 'px';
    cv.style.height = height + 'px';
    const an = visibleAnalysis();

    let html = zones.map((z, i) => `<div class="zone" style="left:${i * L.COLW}px;width:${L.COLW}px"><div class="zone-label">${esc(z.name)}</div></div>`).join('');
    html += `<svg id="wires" width="${width}" height="${height}"></svg>`;
    for (const d of G.devices) {
      const t = tpl(d);
      const ins = t.ports.filter((p) => p.dir === 'in');
      const outs = t.ports.filter((p) => p.dir !== 'in');
      const unpowered = an && !an.powered.get(d.uid) && t.ports.some((p) => p.needsPoE);
      const portHTML = (p) => {
        const pt = SF.PORT_TYPES[p.type];
        const used = cablesAt(d.uid, p.id).length > 0;
        return `<div class="port ${p.dir} ${used ? 'used' : ''}" data-uid="${d.uid}" data-port="${p.id}" title="${esc(p.label)} — ${esc(pt.name)}${p.dir === 'io' ? ' (two-way)' : ''}">
          <span class="dot" style="--c:${pt.color}"></span><span class="plabel">${p.dir === 'io' ? '⇄ ' : ''}${esc(p.label)}</span></div>`;
      };
      const isSel = G.selected && G.selected.kind === 'device' && G.selected.uid === d.uid;
      const recv = an && t.consumes.length ? an.received.get(d.uid).size : 0;
      html += `<div class="device ${isSel ? 'selected' : ''} ${d.fixed ? 'fixed' : ''} ${unpowered ? 'unpowered' : ''} ${recv ? 'live' : ''}" data-uid="${d.uid}" style="left:${d.x}px;top:${d.y}px;width:${L.CARD_W}px">
        <div class="dev-head"><span class="dev-icon">${t.icon}</span><span class="dev-name">${esc(d.name)}</span>${d.fixed ? '<span class="lock" title="Client-owned, fixed">🔒</span>' : `<button class="dev-del" data-del="${d.uid}" title="Remove">×</button>`}</div>
        <div class="dev-body"><div class="col in">${ins.map(portHTML).join('')}</div><div class="col out">${outs.map(portHTML).join('')}</div></div>
      </div>`;
    }
    cv.innerHTML = html;
    renderWires();
  }

  function portCenter(uid, port) {
    const el = $(`.port[data-uid="${uid}"][data-port="${port}"] .dot`, $('#canvas'));
    if (!el) return null;
    const cr = $('#canvas').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top };
  }
  function pathD(p1, s1, p2, s2) {
    const dx = Math.max(50, Math.abs(p2.x - p1.x) / 2);
    return `M${p1.x},${p1.y} C${p1.x + s1 * dx},${p1.y} ${p2.x + s2 * dx},${p2.y} ${p2.x},${p2.y}`;
  }
  const side = (d, port) => (SF.portOf(d, port).dir === 'in' ? -1 : 1);

  function renderWires() {
    const svg = $('#wires');
    if (!svg) return;
    const an = visibleAnalysis();
    let out = '';
    for (const c of G.cables) {
      const da = dev(c.a.uid), db = dev(c.b.uid);
      if (!da || !db) continue;
      const p1 = portCenter(c.a.uid, c.a.port), p2 = portCenter(c.b.uid, c.b.port);
      if (!p1 || !p2) continue;
      const pa = SF.portOf(da, c.a.port);
      const color = SF.PORT_TYPES[pa.type].color;
      const d = pathD(p1, side(da, c.a.port), p2, side(db, c.b.port));
      const ci = an ? an.cables.get(c.id) : null;
      const st = ci ? ci.status : '';
      const flowing = ci && ci.carries.size > 0;
      const sel = G.selected && G.selected.kind === 'cable' && G.selected.id === c.id;
      out += `<g class="wire ${st} ${sel ? 'sel' : ''}" data-cable="${c.id}">
        <path class="w-base" d="${d}" style="stroke:${st === 'bad' || st === 'danger' ? '#ff4d5e' : color}"/>
        ${flowing ? `<path class="w-flow" d="${d}"/>` : ''}
        <path class="w-hit" d="${d}" data-cable="${c.id}"/>
      </g>`;
    }
    if (G.pending && G.mouse) {
      const pd = dev(G.pending.uid);
      const p1 = portCenter(G.pending.uid, G.pending.port);
      if (p1 && pd) {
        const pp = SF.portOf(pd, G.pending.port);
        const s1 = side(pd, G.pending.port);
        out += `<path class="w-temp" d="${pathD(p1, s1, G.mouse, -s1)}" style="stroke:${SF.PORT_TYPES[pp.type].color}"/>`;
      }
    }
    svg.innerHTML = out;
  }

  // ---------------- Connections ----------------
  function orient(s, t) {
    const ps = SF.portOf(dev(s.uid), s.port), pt = SF.portOf(dev(t.uid), t.port);
    const src = (p) => p.dir === 'out' || p.dir === 'io';
    const dst = (p) => p.dir === 'in' || p.dir === 'io';
    if (src(ps) && dst(pt)) return { a: s, b: t, pa: ps, pb: pt };
    if (src(pt) && dst(ps)) return { a: t, b: s, pa: pt, pb: ps };
    return null;
  }
  function linkPreview(s, t) {
    if (s.uid === t.uid) return { status: 'invalid', msg: "You can't connect a device to itself." };
    const o = orient(s, t);
    if (!o) {
      const ps = SF.portOf(dev(s.uid), s.port);
      return { status: 'invalid', msg: ps.dir === 'in' ? 'Both are inputs — connect an output to an input.' : 'Both are outputs — connect an output to an input.' };
    }
    return Object.assign({ o }, SF.checkLink(o.pa, o.pb));
  }

  function tryConnect(s, t) {
    G.pending = null; G.pendingClick = false; G.mouse = null;
    const bail = () => { applyGlow(); renderWires(); };
    if (s.uid === t.uid && s.port === t.port) return bail();
    const lp = linkPreview(s, t);
    if (lp.status === 'invalid') { toast('✋ ' + esc(lp.msg), 'error'); return bail(); }
    if ((lp.status === 'bad' || lp.status === 'danger') && G.diff.blockBad) {
      toast(`${lp.status === 'danger' ? '🔥' : '✋'} <b>Not allowed:</b> ${esc(lp.msg)}`, 'error');
      return bail();
    }
    const { a, b } = lp.o;
    const old = G.cables.filter((c) => [c.a, c.b].some((e) => (e.uid === a.uid && e.port === a.port) || (e.uid === b.uid && e.port === b.port)));
    if (old.length) {
      G.cables = G.cables.filter((c) => !old.includes(c));
      toast('Replaced the cable already in that jack.');
    }
    const c = { id: 'c' + G.nextCable++, a: { uid: a.uid, port: a.port }, b: { uid: b.uid, port: b.port } };
    G.cables.push(c);
    G.selected = { kind: 'cable', id: c.id };
    afterChange();
  }

  function removeCable(id) {
    G.cables = G.cables.filter((c) => c.id !== id);
    if (G.selected && G.selected.id === id) G.selected = null;
    afterChange();
  }

  function deleteDevice(uid) {
    const d = dev(uid);
    if (!d) return;
    if (d.fixed) { toast('🔒 That is client-owned and fixed in place.'); return; }
    G.devices = G.devices.filter((x) => x.uid !== uid);
    G.cables = G.cables.filter((c) => c.a.uid !== uid && c.b.uid !== uid);
    G.selected = null;
    afterChange();
  }

  function addDevice(type, pos) {
    const pe = G.scn.palette.find((p) => p.type === type);
    const used = G.devices.filter((d) => !d.owned && d.type === type).length;
    if (!pe || used >= pe.qty) { toast('None of those left.'); return; }
    let x, y, zone;
    if (pos) {
      x = Math.max(4, pos.x); y = Math.max(40, pos.y);
      zone = zoneAt(x);
    } else {
      zone = pe.zone || G.scn.zones[0].id;
      x = SF.zoneX(G.scn, zone);
      const inZone = G.devices.filter((d) => d.zone === zone);
      y = inZone.reduce((m, d) => Math.max(m, d.y + SF.cardHeight(d.type) + L.GAP), L.TOP);
    }
    const uid = 'd' + G.nextId++;
    G.devices.push({ uid, type, zone, x, y, name: SF.autoName(G.devices, type), fixed: false, owned: false });
    G.selected = { kind: 'device', uid };
    G.paletteSel = null;
    afterChange();
    if (!pos) {
      const el = $(`.device[data-uid="${uid}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  function zoneAt(x) {
    const n = G.scn.zones.length;
    const i = Math.max(0, Math.min(n - 1, Math.floor((x + L.CARD_W / 2) / L.COLW)));
    return G.scn.zones[i].id;
  }

  function applyGlow() {
    const ports = $$('.port', $('#canvas'));
    ports.forEach((p) => p.classList.remove('compat', 'incompat', 'source'));
    if (!G.pending) return;
    const src = $(`.port[data-uid="${G.pending.uid}"][data-port="${G.pending.port}"]`);
    if (src) src.classList.add('source');
    if (!G.diff.glow) return;
    for (const p of ports) {
      const t = { uid: p.dataset.uid, port: p.dataset.port };
      if (t.uid === G.pending.uid && t.port === G.pending.port) continue;
      const lp = linkPreview(G.pending, t);
      p.classList.add(lp.status === 'ok' ? 'compat' : 'incompat');
    }
  }

  // ---------------- Pointer interaction ----------------
  const canvas = $('#canvas');
  let drag = null; // {kind:'wire'|'device', ...}
  let raf = 0;
  const schedule = (fn) => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fn(); }); };
  const canvasPt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  canvas.addEventListener('pointerdown', (e) => {
    if (!G || e.button > 0) return;
    const portEl = e.target.closest('.port');
    const delEl = e.target.closest('[data-del]');
    const headEl = e.target.closest('.dev-head');
    const devEl = e.target.closest('.device');
    const wireEl = e.target.closest('[data-cable]');
    if (portEl) {
      e.preventDefault();
      const t = { uid: portEl.dataset.uid, port: portEl.dataset.port };
      if (G.pending && G.pendingClick) {
        const s = G.pending;
        G.pending = null; G.pendingClick = false; G.mouse = null;
        if (s.uid === t.uid && s.port === t.port) { applyGlow(); renderWires(); return; }
        tryConnect(s, t);
        return;
      }
      G.pending = t; G.pendingClick = false; G.mouse = canvasPt(e);
      drag = { kind: 'wire', start: G.mouse, moved: false };
      applyGlow();
      renderWires();
      return;
    }
    if (delEl) { e.preventDefault(); deleteDevice(delEl.dataset.del); return; }
    if (G.pending) { cancelPending(); }
    if (headEl && devEl) {
      e.preventDefault();
      const d = dev(devEl.dataset.uid);
      const p = canvasPt(e);
      drag = { kind: 'device', uid: d.uid, el: devEl, dx: p.x - d.x, dy: p.y - d.y, moved: false, start: p };
      select({ kind: 'device', uid: d.uid }, true);
      return;
    }
    if (devEl) { select({ kind: 'device', uid: devEl.dataset.uid }); return; }
    if (wireEl) { select({ kind: 'cable', id: wireEl.dataset.cable }); return; }
    select(null);
  });

  window.addEventListener('pointermove', (e) => {
    if (!G) return;
    if (drag && drag.kind === 'device') {
      const p = canvasPt(e);
      if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) < 3) return;
      drag.moved = true;
      const d = dev(drag.uid);
      d.x = Math.max(0, Math.min(canvas.clientWidth - L.CARD_W, p.x - drag.dx));
      d.y = Math.max(36, p.y - drag.dy);
      drag.el.style.left = d.x + 'px';
      drag.el.style.top = d.y + 'px';
      schedule(renderWires);
      return;
    }
    if (G.pending) {
      G.mouse = canvasPt(e);
      if (drag && drag.kind === 'wire' && Math.hypot(G.mouse.x - drag.start.x, G.mouse.y - drag.start.y) > 6) drag.moved = true;
      schedule(renderWires);
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!G || !drag) return;
    const dr = drag; drag = null;
    if (dr.kind === 'device') {
      if (dr.moved) {
        const d = dev(dr.uid);
        d.zone = zoneAt(d.x);
        afterChange();
      }
      return;
    }
    if (dr.kind === 'wire') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const portEl = el && el.closest('.port');
      const s = G.pending;
      if (portEl && s && !(portEl.dataset.uid === s.uid && portEl.dataset.port === s.port)) {
        G.pending = null; G.mouse = null;
        tryConnect(s, { uid: portEl.dataset.uid, port: portEl.dataset.port });
        return;
      }
      if (!dr.moved && s) {
        // click-to-connect mode: wait for a second click
        G.pendingClick = true;
        const pd = dev(s.uid);
        G.selected = { kind: 'device', uid: s.uid };
        renderRight();
        toast(`Now click the port to connect <b>${esc(pd.name)} › ${esc(SF.portOf(pd, s.port).label)}</b> to. <span class="muted">(Esc to cancel)</span>`);
        return;
      }
      cancelPending();
    }
  });

  function cancelPending() {
    G.pending = null; G.pendingClick = false; G.mouse = null;
    applyGlow();
    renderWires();
  }

  function select(sel, quiet) {
    G.selected = sel;
    if (sel) G.paletteSel = null;
    $$('.device', canvas).forEach((el) => el.classList.toggle('selected', !!sel && sel.kind === 'device' && el.dataset.uid === sel.uid));
    renderWires();
    renderInspector();
    if (!quiet) $$('.pal-item.sel').forEach((el) => el.classList.remove('sel'));
  }

  canvas.addEventListener('dblclick', (e) => {
    const w = e.target.closest('[data-cable]');
    if (w) removeCable(w.dataset.cable);
  });

  // palette
  $('#left').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { addDevice(add.dataset.add); return; }
    const item = e.target.closest('.pal-item');
    if (item) {
      G.paletteSel = item.dataset.type;
      G.selected = null;
      $$('.pal-item').forEach((el) => el.classList.toggle('sel', el === item));
      $$('.device', canvas).forEach((el) => el.classList.remove('selected'));
      renderWires();
      renderInspector();
    }
  });
  $('#left').addEventListener('dragstart', (e) => {
    const item = e.target.closest('.pal-item');
    if (!item) return;
    e.dataTransfer.setData('text/plain', item.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  });
  canvas.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type || !SF.DEVICES[type]) return;
    const p = canvasPt(e);
    addDevice(type, { x: p.x - L.CARD_W / 2, y: p.y - 15 });
  });

  window.addEventListener('keydown', (e) => {
    if (!G || !$('#modal').classList.contains('hidden')) { if (e.key === 'Escape') closeModal(); return; }
    if (e.key === 'Escape') { cancelPending(); select(null); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && G.selected && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      if (G.selected.kind === 'cable') removeCable(G.selected.id);
      else deleteDevice(G.selected.uid);
    }
  });
  window.addEventListener('resize', () => { if (G) renderCanvas(); });

  // ---------------- Buttons ----------------
  $('#btn-back').onclick = showHome;
  $('#brand').onclick = showHome;
  $('#nav-home').onclick = () => { closeModal(); showHome(); };
  $('#nav-guide').onclick = showGuide;
  $('#nav-help').onclick = showHelp;

  $('#btn-hint').onclick = () => {
    if (G.hintsUsed >= G.scn.hints.length) return;
    G.hintsUsed++;
    save();
    renderBar();
    renderLeft();
    toast('💡 ' + esc(G.scn.hints[G.hintsUsed - 1]));
  };

  $('#btn-reset').onclick = () => confirmBox('Start over?', 'This clears your design for this scenario and puts everything back the way it started.', 'Reset', () => {
    const fresh = SF.initialState(G.scn);
    Object.assign(G, fresh, { selected: null, pending: null, hintsUsed: G.hintsUsed, tests: G.tests });
    afterChange();
  });

  $('#btn-solution').onclick = () => confirmBox('Load the reference design?', 'This replaces your current design with one working solution (there are often several). You can still test it, but stars are only awarded for your own designs.', 'Show me', () => {
    const sol = SF.solutionState(G.scn);
    Object.assign(G, sol, { selected: null, pending: null, sawSolution: true });
    afterChange();
    toast('📐 Reference design loaded. Click around to see how the signal flows.');
  });

  $('#btn-test').onclick = runTest;

  function runTest() {
    cancelPending();
    G.tests++;
    G.analysis = SF.analyze(G.scn, G);
    G.tested = true;
    const ev = SF.evaluate(G.scn, G, G.analysis);
    save();
    renderAll();

    let stars = 0;
    if (ev.pass) {
      stars = 3;
      if (G.hintsUsed > 0) stars--;
      if (G.scn.par != null && ev.cost > G.scn.par) stars--;
      stars = Math.max(1, stars);
      if (!G.sawSolution) recordStars(G.scn.id, stars);
    }
    const issues = ev.an.issues.filter((i) => i.level !== 'info');
    const infos = ev.an.issues.filter((i) => i.level === 'info');
    const idx = SF.SCENARIOS.indexOf(G.scn);
    const next = SF.SCENARIOS[idx + 1];
    const reqRows = ev.results.map((r) => `<li class="${r.pass ? 'ok' : 'no'}"><span>${r.pass ? '✅' : '❌'}</span><span>${esc(r.req.label)}<small>${esc(r.detail)}</small></span></li>`).join('');
    const hideCauses = G.scn.diff === 'pro';
    const issueRows = hideCauses
      ? (issues.length ? `<li class="${ev.danger ? 'danger' : ''}"><span>${ev.danger ? '🔥' : '⚠'}</span><span>${issues.length} problem(s) detected${ev.danger ? ', including a safety hazard' : ''}. Pro mode doesn't tell you where — inspect the red cables and dimmed devices.</span></li>` : '')
      : issues.map((i) => `<li class="${i.level}"><span>${i.level === 'danger' ? '🔥' : '⚠'}</span><span>${esc(i.text)}</span></li>`).join('');
    const head = ev.pass
      ? `<div class="result-head pass">${G.sawSolution ? '<div class="big-stars">📐</div>' : `<div class="big-stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></div>`}<h2>System commissioned!</h2>
         <p>${G.sawSolution ? 'Reference design — no stars awarded.' : [G.hintsUsed ? 'Used hints (−1★).' : 'No hints.', G.scn.par != null ? (ev.cost > G.scn.par ? `Over par cost of ${money(G.scn.par)} (−1★).` : `At or under par (${money(G.scn.par)}).`) : ''].join(' ')}</p></div>`
      : `<div class="result-head fail"><h2>${ev.danger ? '🔥 Safety stop!' : '❌ Not there yet'}</h2><p>${ev.danger ? 'Something in this system would damage equipment. Fix it before anything else.' : 'Some requirements aren\'t met. Check the cables and devices marked in red.'}</p></div>`;
    openModal(`${head}
      <h3>Requirements</h3><ul class="reqs big">${reqRows}</ul>
      ${issueRows ? `<h3>Problems found</h3><ul class="issues">${issueRows}</ul>` : ''}
      ${infos.length ? `<details class="infos"><summary>${infos.length} note(s)</summary><ul>${infos.map((i) => `<li>${esc(i.text)}</li>`).join('')}</ul></details>` : ''}
      <p class="muted small">Tests run: ${G.tests} · New gear: ${money(ev.cost)}${G.scn.budget != null ? ' / ' + money(G.scn.budget) : ''}</p>
      <div class="modal-actions">
        <button class="btn ghost" data-close>${ev.pass ? 'Keep looking' : 'Back to work'}</button>
        ${!ev.pass && G.hintsUsed < G.scn.hints.length ? '<button class="btn" id="res-hint">💡 Take a hint</button>' : ''}
        ${ev.pass && next ? `<button class="btn primary" id="res-next">Next: ${esc(next.title)} →</button>` : ''}
        ${ev.pass && !next ? '<button class="btn primary" id="res-home">All scenarios</button>' : ''}
      </div>`, ev.pass ? 'pass' : 'fail');
    const rh = $('#res-hint'); if (rh) rh.onclick = () => { closeModal(); $('#btn-hint').click(); };
    const rn = $('#res-next'); if (rn) rn.onclick = () => { closeModal(); openScenario(next.id); };
    const rho = $('#res-home'); if (rho) rho.onclick = () => { closeModal(); showHome(); };
  }

  // expose for debugging/tests
  window.SFApp = { get state() { return G; }, openScenario, runTest, showHome };

  showHome();
})();

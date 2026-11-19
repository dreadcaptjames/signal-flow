/* Signal-flow simulation and grading */
(function () {
  const SF = (window.SF = window.SF || {});

  SF.zoneDistance = function (scn, z1, z2) {
    if (z1 === z2) return scn.sameZone != null ? scn.sameZone : 3;
    const d = scn.distances || {};
    const v = d[z1 + '|' + z2] != null ? d[z1 + '|' + z2] : d[z2 + '|' + z1];
    return v != null ? v : 10;
  };

  SF.portOf = (dev, pid) => SF.DEVICES[dev.type].ports.find((p) => p.id === pid);

  SF.contentLabel = function (dev, media) {
    const t = SF.DEVICES[dev.type];
    const e = t.emits.find((x) => x.media === media);
    if (e && e.label) return e.label;
    return `${dev.name} ${media}`;
  };

  /** Run the simulation. state = { devices:[{uid,type,zone,name}], cables:[{id,a:{uid,port},b:{uid,port}}] } */
  SF.analyze = function (scn, state) {
    const devs = new Map(state.devices.map((d) => [d.uid, d]));
    const cables = new Map();
    const byPort = new Map();
    const issues = [];
    const pk = (uid, port) => uid + '|' + port;

    for (const c of state.cables) {
      const da = devs.get(c.a.uid), db = devs.get(c.b.uid);
      if (!da || !db) continue;
      const pa = SF.portOf(da, c.a.port), pb = SF.portOf(db, c.b.port);
      if (!pa || !pb) continue;
      const link = SF.checkLink(pa, pb);
      let status = link.status === 'invalid' ? 'bad' : link.status;
      let msg = link.msg;
      const len = SF.zoneDistance(scn, da.zone, db.zone);
      const max = SF.PORT_TYPES[pa.type].maxLen;
      if (status === 'ok' && len > max) {
        status = 'bad';
        msg = `This ${SF.PORT_TYPES[pa.type].name} run is about ${len} m, but ${SF.PORT_TYPES[pa.type].name} is only reliable to ${max} m. ${SF.lengthAdvice(pa.type)}`;
      }
      const info = { cable: c, da, db, pa, pb, status, msg, len, max, carries: new Set() };
      cables.set(c.id, info);
      for (const k of [pk(c.a.uid, c.a.port), pk(c.b.uid, c.b.port)]) {
        if (!byPort.has(k)) byPort.set(k, []);
        byPort.get(k).push(info);
      }
      if (status !== 'ok') {
        issues.push({ level: status, where: { cable: c.id }, text: `${da.name} › ${pa.label} → ${db.name} › ${pb.label}: ${msg}` });
      }
    }

    // ---- Power (PoE) ----
    const powered = new Map();
    for (const d of state.devices) {
      const t = SF.DEVICES[d.type];
      let ok = true;
      for (const p of t.ports.filter((p) => p.needsPoE)) {
        const list = byPort.get(pk(d.uid, p.id)) || [];
        const good = list.some((ci) => {
          if (ci.status !== 'ok') return false;
          const other = ci.cable.a.uid === d.uid && ci.cable.a.port === p.id ? ci.pb : ci.pa;
          return !!other.poe;
        });
        if (!good) {
          ok = false;
          if (list.length && list.every((ci) => ci.status === 'ok'))
            issues.push({ level: 'bad', where: { uid: d.uid }, text: `${d.name} has no power: it's PoE-powered, but it's plugged into a port that doesn't supply PoE.` });
        }
      }
      powered.set(d.uid, ok);
    }

    // ---- Propagation ----
    const contents = new Map();
    const arrivals = new Map(); // port key -> Set(cid)
    const seen = new Set();
    const queue = [];

    const emit = (uid, port, cid) => queue.push({ kind: 'emit', uid, port, cid });
    for (const d of state.devices) {
      if (!powered.get(d.uid)) continue;
      const t = SF.DEVICES[d.type];
      for (const e of t.emits) {
        const cid = d.uid + ':' + e.media;
        contents.set(cid, { cid, media: e.media, src: d.uid, label: SF.contentLabel(d, e.media) });
        for (const p of e.ports) emit(d.uid, p, cid);
      }
    }

    let guard = 0;
    while (queue.length && guard++ < 200000) {
      const ev = queue.shift();
      const media = contents.get(ev.cid).media;
      if (ev.kind === 'emit') {
        const dev = devs.get(ev.uid);
        const port = SF.portOf(dev, ev.port);
        if (!SF.PORT_TYPES[port.type].media.includes(media)) continue;
        for (const ci of byPort.get(pk(ev.uid, ev.port)) || []) {
          if (ci.status !== 'ok') continue;
          const c = ci.cable;
          let to = null;
          if (c.a.uid === ev.uid && c.a.port === ev.port) to = c.b;
          else if (ci.pa.dir === 'io' && ci.pb.dir === 'io') to = c.a;
          if (!to) continue;
          const toPort = to === c.b ? ci.pb : ci.pa;
          if (!SF.PORT_TYPES[toPort.type].media.includes(media)) continue;
          ci.carries.add(ev.cid);
          queue.push({ kind: 'arrive', uid: to.uid, port: to.port, cid: ev.cid });
        }
      } else {
        const key = pk(ev.uid, ev.port) + '|' + ev.cid;
        if (seen.has(key)) continue;
        seen.add(key);
        const ak = pk(ev.uid, ev.port);
        if (!arrivals.has(ak)) arrivals.set(ak, new Set());
        arrivals.get(ak).add(ev.cid);
        if (!powered.get(ev.uid)) continue;
        const t = SF.DEVICES[devs.get(ev.uid).type];
        for (const r of t.routes) {
          if (!r.from.includes(ev.port) || !r.media.includes(media)) continue;
          for (const out of r.to) if (out !== ev.port) emit(ev.uid, out, ev.cid);
        }
      }
    }

    // ---- What each sink actually receives ----
    const received = new Map();
    for (const d of state.devices) {
      const t = SF.DEVICES[d.type];
      const set = new Set();
      if (t.consumes.length && powered.get(d.uid)) {
        for (const p of t.ports) {
          if (p.dir === 'out') continue;
          if (t.consumePorts && !t.consumePorts.includes(p.id)) continue;
          for (const cid of arrivals.get(pk(d.uid, p.id)) || []) {
            const c = contents.get(cid);
            if (c.src !== d.uid && t.consumes.includes(c.media)) set.add(cid);
          }
        }
      }
      received.set(d.uid, set);
    }

    // ---- Unconnected gear ----
    for (const d of state.devices) {
      const t = SF.DEVICES[d.type];
      const any = t.ports.some((p) => (byPort.get(pk(d.uid, p.id)) || []).length);
      if (!any) issues.push({ level: 'info', where: { uid: d.uid }, text: `${d.name} isn't connected to anything.` });
    }

    return { cables, byPort, powered, contents, arrivals, received, issues };
  };

  SF.resolveSel = function (sel, state) {
    if (sel.ref) return state.devices.filter((d) => d.uid === sel.ref);
    return state.devices.filter((d) => sel.types.includes(d.type));
  };

  SF.selLabel = function (sel, state, plural) {
    if (sel.label) return sel.label + (plural && !/s$/.test(sel.label) ? 's' : '');
    if (sel.ref) {
      const d = state.devices.find((x) => x.uid === sel.ref);
      return d ? d.name : sel.ref;
    }
    if (sel.types.length === 1) return SF.DEVICES[sel.types[0]].name + (plural ? 's' : '');
    return 'matching device' + (plural ? 's' : '');
  };

  SF.stateCost = (state) => state.devices.reduce((s, d) => s + (d.owned ? 0 : SF.DEVICES[d.type].price), 0);

  /** Grade a state against a scenario. */
  SF.evaluate = function (scn, state, an) {
    an = an || SF.analyze(scn, state);
    const results = [];
    for (const r of scn.reqs) {
      if (r.kind === 'count') {
        const n = SF.resolveSel(r.sel, state).length;
        const pass = n >= (r.min || 0) && (r.max == null || n <= r.max);
        results.push({ req: r, pass, detail: pass ? `${n} in the system.` : `Found ${n}; need ${r.min}${r.max != null ? '–' + r.max : ''}.` });
        continue;
      }
      // reach
      const srcs = SF.resolveSel(r.from, state);
      const tgts = SF.resolveSel(r.to, state);
      const minTo = r.minTo || 1;
      if (!srcs.length) {
        results.push({ req: r, pass: false, detail: `No ${SF.selLabel(r.from, state)} in the system yet.` });
        continue;
      }
      const per = srcs.map((s) => {
        const cid = s.uid + ':' + r.media;
        const hits = tgts.filter((t) => an.received.get(t.uid).has(cid));
        return { s, n: hits.length };
      });
      const okSrc = per.filter((p) => p.n >= minTo);
      const pass = r.all ? okSrc.length === per.length : okSrc.length > 0;
      let detail;
      const tl = SF.selLabel(r.to, state, minTo > 1);
      if (pass) {
        detail = per.map((p) => `${p.s.name}: ${p.n} ✓`).join(', ');
      } else {
        const bad = per.filter((p) => p.n < minTo);
        detail = bad.map((p) => `${SF.contentLabel(p.s, r.media)} reaches ${p.n}/${minTo} ${tl}`).join('; ');
        if (!tgts.length) detail = `There's no ${SF.selLabel(r.to, state)} in the system.`;
      }
      results.push({ req: r, pass, detail });
    }
    const cost = SF.stateCost(state);
    if (scn.budget != null) {
      const pass = cost <= scn.budget;
      results.push({ req: { label: `Stay within the $${scn.budget.toLocaleString()} budget` }, pass, detail: `New equipment: $${cost.toLocaleString()}` });
    }
    const danger = an.issues.some((i) => i.level === 'danger');
    const pass = results.every((r) => r.pass) && !danger;
    return { results, cost, danger, pass, an };
  };
})();

/* State construction & layout helpers (shared by the UI and tests) */
(function () {
  const SF = window.SF;
  const L = (SF.LAYOUT = { COLW: 300, CARD_W: 220, ROW_H: 22, HEAD_H: 34, TOP: 64, GAP: 20 });

  SF.cardHeight = function (type) {
    const t = SF.DEVICES[type];
    const ins = t.ports.filter((p) => p.dir === 'in').length;
    const outs = t.ports.length - ins;
    return L.HEAD_H + Math.max(ins, outs, 1) * L.ROW_H + 12;
  };

  SF.autoName = function (devices, type) {
    const short = SF.DEVICES[type].short;
    const used = new Set(devices.map((d) => d.name));
    for (let i = 1; ; i++) if (!used.has(`${short} ${i}`)) return `${short} ${i}`;
  };

  SF.zoneX = (scn, zone) => Math.max(0, scn.zones.findIndex((z) => z.id === zone)) * L.COLW + (L.COLW - L.CARD_W) / 2;

  SF.buildState = function (scn, specs, cableSpecs) {
    const ycur = {};
    const devices = [];
    for (const s of specs) {
      const y = ycur[s.zone] != null ? ycur[s.zone] : L.TOP;
      ycur[s.zone] = y + SF.cardHeight(s.type) + L.GAP;
      devices.push({
        uid: s.ref, type: s.type, zone: s.zone, x: SF.zoneX(scn, s.zone), y,
        name: s.name || SF.autoName(devices, s.type), fixed: !!s.fixed, owned: !!s.owned,
      });
    }
    const cables = (cableSpecs || []).map((c, i) => {
      const [au, ap] = c[0].split('.');
      const [bu, bp] = c[1].split('.');
      return { id: 'c' + (i + 1), a: { uid: au, port: ap }, b: { uid: bu, port: bp } };
    });
    return { devices, cables, nextId: 1, nextCable: cables.length + 1 };
  };

  SF.baseSpecs = function (scn) {
    return [
      ...(scn.fixed || []).map((f) => Object.assign({}, f, { fixed: true, owned: true })),
      ...((scn.preset && scn.preset.devices) || []).map((f) => Object.assign({}, f, { owned: true })),
    ];
  };

  SF.initialState = function (scn) {
    return SF.buildState(scn, SF.baseSpecs(scn), scn.preset ? scn.preset.cables : []);
  };

  SF.solutionState = function (scn) {
    const sol = scn.solution;
    const remove = new Set(sol.remove || []);
    const specs = [...SF.baseSpecs(scn).filter((s) => !remove.has(s.ref)), ...(sol.add || [])];
    return SF.buildState(scn, specs, sol.cables);
  };
})();

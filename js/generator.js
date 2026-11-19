/* Random scenario generator.
 * Builds a room, a set of requirements and a working reference design together,
 * then (for troubleshooting) breaks the design with realistic faults.
 * Every generated scenario is verified with the simulation engine before use.
 * IDs look like: rnd-<difficulty>-<build|troubleshoot|mix>-<seed>
 */
(function () {
  const SF = window.SF;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- Rooms
  // roles: where each kind of equipment lives.
  const ROOMS = [
    {
      key: 'huddle', minD: 0, maxD: 1,
      names: ['Huddle Room', 'Focus Room', 'Small Meeting Room', 'Team Corner'],
      intros: ['A startup wants its small meeting room made usable.', 'A dental office is turning a storage room into a huddle space.', 'A co-working space is upgrading one of its bookable rooms.'],
      zones: [{ id: 'table', name: 'Table' }, { id: 'wall', name: 'Display Wall' }, { id: 'cred', name: 'Credenza' }],
      ranges: { 'table|wall': [3, 6], 'table|cred': [2, 5], 'wall|cred': [2, 4] },
      roles: { user: 'table', display: 'wall', speakers: 'wall', rack: 'cred', camera: 'wall', ceiling: 'wall', mics: 'table' },
      plan(h, D) {
        if (D === 0) return { video: h.chance(0.5) ? ['laptop'] : ['laptop', h.pick(['wpg', 'doc-cam'])], dest: 'display', destFixed: h.chance(0.5), displayAudio: true };
        return { video: ['laptop'], dest: 'display', conf: true, mics: h.many(h.ri(1, 2), 'boundary-mic', false), speakers: { type: 'powered', count: 2 } };
      },
    },
    {
      key: 'conference', minD: 1, maxD: 3,
      names: ['Boardroom', 'Conference Room', 'Executive Meeting Room', 'Client Briefing Room'],
      intros: ['A law firm wants its main boardroom ready for hybrid meetings.', 'A hospital admin team needs a reliable video-conference room.', 'A regional bank is refitting its executive meeting room.', 'An engineering firm wants client calls to stop being embarrassing.'],
      zones: [{ id: 'table', name: 'Conference Table' }, { id: 'front', name: 'Front Wall' }, { id: 'ceiling', name: 'Ceiling' }, { id: 'rack', name: 'AV Closet' }],
      ranges: { 'table|front': [4, 9], 'table|ceiling': [3, 5], 'table|rack': [6, 25], 'front|ceiling': [3, 6], 'front|rack': [4, 20], 'ceiling|rack': [6, 25] },
      roles: { user: 'table', display: 'front', speakers: 'ceiling', rack: 'rack', camera: 'front', ceiling: 'ceiling', mics: 'table' },
      plan(h, D) {
        const ceilingMics = D >= 2 && h.chance(0.55) ? h.ri(1, 2) : 0;
        const mics = ceilingMics ? [] : h.many(h.ri(2, D >= 2 ? 4 : 3), h.pick(['boundary-mic', 'gooseneck']), h.chance(0.5));
        return {
          video: h.chance(0.4) ? ['laptop', 'wpg'] : ['laptop'], dest: 'display', conf: true, mics, ceilingMics,
          speakers: D >= 2 ? { type: '70v', count: h.ri(4, 6), fixed: h.chance(0.3) } : { type: h.pick(['powered', 'passive']), count: 2, fixed: h.chance(0.3) },
          als: D >= 3 && h.chance(0.4),
        };
      },
    },
    {
      key: 'classroom', minD: 0, maxD: 2,
      names: ['Classroom', 'Training Room', 'Science Lab', 'Seminar Room'],
      intros: ['A middle school is modernising one of its classrooms.', 'A community college needs a training room for evening courses.', 'A corporate training team wants their room to just work.'],
      zones: [{ id: 'desk', name: 'Teacher Desk' }, { id: 'front', name: 'Front / Screen' }, { id: 'walls', name: 'Side Walls' }, { id: 'rack', name: 'Equipment Rack' }],
      ranges: { 'desk|front': [5, 20], 'desk|walls': [5, 12], 'desk|rack': [2, 6], 'front|walls': [4, 8], 'front|rack': [5, 20], 'walls|rack': [5, 15] },
      roles: { user: 'desk', display: 'front', speakers: 'walls', rack: 'rack', camera: 'front', ceiling: 'front', mics: 'desk' },
      plan(h, D) {
        const video = D === 0 ? ['laptop'] : ['laptop', 'doc-cam', ...(D === 2 && h.chance(0.4) ? ['wpg'] : [])];
        const mics = D >= 1 && h.chance(0.5) ? h.many(1, 'wireless-mic', false) : [];
        return {
          video, dest: D === 0 ? 'display' : 'projector', programAudio: true, mics,
          speakers: D === 2 && h.chance(0.5) ? { type: '70v', count: h.ri(3, 5) } : { type: h.pick(['powered', 'passive']), count: 2, fixed: h.chance(0.3) },
          als: D === 2 && mics.length > 0 && h.chance(0.6),
        };
      },
    },
    {
      key: 'cafe', minD: 0, maxD: 1,
      names: ['Café', 'Retail Store', 'Restaurant Dining Room', 'Gym Floor'],
      intros: ['A café owner wants background music, and a way to call out orders.', 'A boutique wants music throughout the shop floor.', 'A small gym wants music and announcements.'],
      zones: [{ id: 'counter', name: 'Counter' }, { id: 'floor', name: 'Floor / Dining' }, { id: 'office', name: 'Back Office' }],
      ranges: { 'counter|floor': [6, 20], 'counter|office': [3, 10], 'floor|office': [8, 25] },
      roles: { user: 'counter', display: 'floor', speakers: 'floor', rack: 'office', camera: 'floor', ceiling: 'floor', mics: 'counter' },
      plan(h, D) {
        return {
          bgm: true,
          mics: h.chance(0.5) ? [{ type: 'wired-mic', fixed: true, name: 'Paging Mic' }] : [],
          speakers: D === 0 ? { type: h.pick(['powered', 'passive']), count: 2, fixed: h.chance(0.5) } : { type: '70v', count: h.ri(3, 6), fixed: h.chance(0.4) },
        };
      },
    },
    {
      key: 'lecture', minD: 2, maxD: 3,
      names: ['Lecture Hall', 'Auditorium Classroom', 'Council Chamber', 'Courtroom'],
      intros: ['A university is refitting a 200-seat lecture hall.', 'A county needs its public meeting room to meet accessibility rules.', 'A medical school wants every lecture recorded.'],
      zones: [{ id: 'lectern', name: 'Lectern' }, { id: 'ceiling', name: 'Ceiling' }, { id: 'front', name: 'Front / Screen' }, { id: 'booth', name: 'Control Booth' }],
      ranges: { 'lectern|ceiling': [6, 12], 'lectern|front': [3, 15], 'lectern|booth': [20, 45], 'ceiling|front': [5, 10], 'ceiling|booth': [15, 40], 'front|booth': [20, 45] },
      roles: { user: 'lectern', display: 'front', speakers: 'ceiling', rack: 'booth', camera: 'booth', ceiling: 'ceiling', mics: 'lectern' },
      plan(h, D) {
        return {
          video: h.chance(0.5) ? ['laptop', 'doc-cam'] : ['laptop'], dest: 'projector', programAudio: true,
          mics: [{ type: 'gooseneck', fixed: true, name: 'Lectern Mic' }, ...h.many(h.ri(1, 2), 'wireless-mic', false)],
          speakers: { type: '70v', count: h.ri(4, 8), fixed: h.chance(0.3) }, als: true, capture: h.chance(0.6),
        };
      },
    },
    {
      key: 'hall', minD: 1, maxD: 3,
      names: ['Multipurpose Hall', 'Church Fellowship Hall', 'Event Space', 'Company Town Hall'],
      intros: ['A church wants its fellowship hall ready for events.', 'A company hosts monthly all-hands meetings here.', 'A community centre rents this hall out for events.'],
      zones: [{ id: 'stage', name: 'Stage' }, { id: 'house', name: 'House (Audience)' }, { id: 'foh', name: 'FOH / Tech Desk' }],
      ranges: { 'stage|house': [8, 20], 'stage|foh': [20, 40], 'house|foh': [8, 20] },
      roles: { user: 'foh', display: 'house', speakers: 'house', rack: 'foh', camera: 'foh', ceiling: 'house', mics: 'stage' },
      plan(h, D) {
        const live = D === 3 && h.chance(0.6);
        return {
          mics: h.many(h.ri(2, D >= 2 ? 4 : 3), 'wireless-mic', false),
          speakers: { type: h.pick(['powered', 'passive']), count: 2, fixed: h.chance(0.3) },
          video: D >= 2 ? ['laptop'] : [], dest: 'projector', programAudio: D >= 2 && h.chance(0.5),
          als: D >= 2 && h.chance(0.5), live, capture: !live && D === 2 && h.chance(0.4),
        };
      },
    },
  ];

  const NAMES = { laptop: 'Presenter Laptop', 'doc-cam': 'Document Camera', wpg: 'Wireless Share', display: 'Display', projector: 'Projector', 'room-pc': 'Room PC', bgm: 'Music Streamer' };
  const MIC_NAME = { 'boundary-mic': 'Table Mic', gooseneck: 'Gooseneck', 'wired-mic': 'Mic', 'wireless-mic': 'Wireless Mic', 'ceiling-mic': 'Ceiling Mic' };
  const SPK_TYPE = { powered: 'spk-powered', passive: 'spk-passive', '70v': 'ceil-70v' };
  const PROC = {
    'mixer-4': { ins: ['ch1', 'ch2', 'ch3', 'ch4'], outs: ['mainL', 'mainR', 'aux'] },
    'dsp-usb': { ins: ['in1', 'in2', 'in3', 'in4'], outs: ['out1', 'out2'] },
    'dsp-dante': { ins: ['in1', 'in2', 'in3', 'in4'], outs: ['out1', 'out2', 'out3', 'out4'] },
  };

  // ---------------------------------------------------------------- Builder
  class Builder {
    constructor(scn) { this.scn = scn; this.devs = []; this.cables = []; this.used = new Set(); this.notes = []; this.count = {}; }
    add(type, zone, opts = {}) {
      const base = type.replace(/[^a-z]/g, '').slice(0, 5);
      let ref;
      do { this.count[base] = (this.count[base] || 0) + 1; ref = base + this.count[base]; } while (this.devs.some((d) => d.ref === ref));
      this.devs.push({ ref, type, zone, name: opts.name, fixed: !!opts.fixed });
      return ref;
    }
    dev(ref) { return this.devs.find((d) => d.ref === ref); }
    port(ep) { const [r, p] = ep.split('.'); return SF.DEVICES[this.dev(r).type].ports.find((x) => x.id === p); }
    label(ref) { const d = this.dev(ref); return d.name || SF.DEVICES[d.type].short; }
    free(ref, ids) { for (const id of ids) if (!this.used.has(ref + '.' + id)) return ref + '.' + id; return null; }
    dist(a, b) { return SF.zoneDistance(this.scn, this.dev(a).zone, this.dev(b).zone); }
    note(t) { if (!this.notes.includes(t)) this.notes.push(t); }
    wire(a, b) {
      if (!a || !b) throw new Error('no free port');
      if (this.used.has(a) || this.used.has(b)) throw new Error('port reused ' + a + ' ' + b);
      this.cables.push([a, b]); this.used.add(a); this.used.add(b);
    }
    conn(a, b) {
      if (!a || !b) throw new Error('no free port');
      const ar = a.split('.')[0], br = b.split('.')[0];
      const pa = this.port(a);
      const len = this.dist(ar, br);
      if (len <= SF.PORT_TYPES[pa.type].maxLen) return this.wire(a, b);
      if (pa.type === 'hdmi') {
        this.note(`The ${this.label(ar)} → ${this.label(br)} run is about ${len} m — HDMI is only good to 10 m.`);
        const tx = this.add('hdbt-tx', this.dev(ar).zone);
        this.wire(a, tx + '.in');
        if (this.dev(br).type === 'projector' && this.free(br, ['hdbt'])) return this.wire(tx + '.hdbt', br + '.hdbt');
        const rx = this.add('hdbt-rx', this.dev(br).zone);
        this.wire(tx + '.hdbt', rx + '.hdbt');
        return this.wire(rx + '.hdmi', b);
      }
      if (pa.type === 'usb') {
        this.note(`The ${this.label(ar)} → ${this.label(br)} USB run is about ${len} m — USB is only good to 5 m.`);
        const e1 = this.add('usb-ext-tx', this.dev(ar).zone), e2 = this.add('usb-ext-rx', this.dev(br).zone);
        this.wire(a, e1 + '.usb'); this.wire(e1 + '.link', e2 + '.link'); return this.wire(e2 + '.usb', b);
      }
      throw new Error('run too long ' + a + ' ' + b);
    }
  }

  // ---------------------------------------------------------------- Build a working system
  function buildSystem(h, D, room, scn) {
    const Z = room.roles;
    const F = room.plan(h, D);
    F.video = F.video || [];
    F.mics = F.mics || [];
    F.ceilingMics = F.ceilingMics || 0;

    // --- Fit the plan to what one processor can handle
    const spkFeeds = () => (F.speakers ? (F.speakers.type === 'passive' ? F.speakers.count : 1) : 0);
    const analogIn = () => F.mics.length + (F.programAudio ? 1 : 0) + (F.bgm ? 1 : 0);
    const outsNeeded = () => spkFeeds() + (F.als ? 1 : 0) + (F.capture || F.live ? 1 : 0);
    while (analogIn() > 4) {
      if (F.programAudio) F.programAudio = false;
      else F.mics.splice(F.mics.findIndex((m) => !m.fixed), 1);
    }
    let proc = null;
    if (F.conf) proc = F.ceilingMics || outsNeeded() > 2 ? 'dsp-dante' : 'dsp-usb';
    else if (F.mics.length || analogIn() > 1 || outsNeeded() > 2) proc = 'mixer-4';
    const cap = proc ? PROC[proc].outs.length : 2;
    while (outsNeeded() > cap) {
      if (F.als) F.als = false; else if (F.capture) F.capture = false; else if (F.live) F.live = false; else break;
    }
    if (F.programAudio && !F.speakers) F.programAudio = false;
    if (F.programAudio && !F.video.includes('laptop')) F.programAudio = false;

    const B = new Builder(scn);
    const reqs = [];
    const spkName = { powered: 'Speaker', passive: 'Speaker', '70v': 'Ceiling Speaker' };

    // --- Video
    let dest = null, sw = null, de = null;
    const srcRefs = [];
    if (F.video.length || F.conf) {
      const destType = F.conf ? 'display' : F.dest || 'display';
      dest = B.add(destType, Z.display, { fixed: F.destFixed !== false, name: F.destFixed !== false ? NAMES[destType] : undefined });
    }
    const destSel = () => (B.dev(dest).fixed ? { ref: dest } : { types: ['display', 'projector'], label: 'screen' });
    const destLabel = () => (B.dev(dest).fixed ? NAMES[B.dev(dest).type].toLowerCase() : 'screen');
    const videoOut = (src) => {
      const sr = src.split('.')[0];
      const t = B.dev(dest).type;
      if (t === 'projector') {
        if (B.dev(sr).type === 'switcher' && B.dist(sr, dest) > 10) {
          B.note(`The projector is ${B.dist(sr, dest)} m from the switcher — too far for HDMI, but both have HDBaseT.`);
          return B.wire(sr + '.hdbtOut', dest + '.hdbt');
        }
        return B.conn(src, B.free(dest, ['hdmi']));
      }
      return B.conn(src, B.free(dest, ['hdmi1', 'hdmi2']));
    };
    if (F.video.length) {
      for (const t of F.video) {
        const r = B.add(t, Z.user, { fixed: true, name: NAMES[t] });
        srcRefs.push(r);
        reqs.push({ kind: 'reach', from: { ref: r }, media: 'video', to: destSel(), label: `${NAMES[t]} shows on the ${destLabel()}` });
      }
      const n = srcRefs.length;
      const destIsProj = B.dev(dest).type === 'projector';
      const needSwitch = n > 2 || (n === 2 && (destIsProj || F.conf)) || (F.programAudio && n > 1);
      if (needSwitch) {
        sw = B.add('switcher', Z.user);
        srcRefs.forEach((r, i) => B.wire(r + '.hdmi', sw + '.in' + (i + 1)));
        B.note(`${n} video sources need to share one screen input — that's a switcher's job.`);
        videoOut(sw + '.hdmiOut');
      } else if (F.programAudio) {
        de = B.add('de-embed', Z.user);
        B.wire(srcRefs[0] + '.hdmi', de + '.in');
        B.note('The laptop\'s audio is embedded in HDMI. To send it to an amp or speakers you need to pull it out as line level (an audio extractor, or a switcher\'s audio output).');
        videoOut(de + '.hdmiOut');
      } else {
        srcRefs.forEach((r) => videoOut(r + '.hdmi'));
      }
      if (F.displayAudio) {
        reqs.push({ kind: 'reach', from: { ref: srcRefs[0] }, media: 'audio', to: B.dev(dest).fixed ? { ref: dest } : { types: ['display', ...SF.SPEAKER_TYPES], label: 'display or speaker' }, label: 'Laptop audio is heard in the room' });
        B.note('HDMI carries audio too, and a flat panel has built-in speakers.');
      }
    }

    // --- Audio sources
    const micRefs = [];
    let micsFixed = true;
    F.mics.forEach((m, i) => {
      const zone = m.type === 'wireless-mic' ? Z.rack : Z.mics;
      const name = m.name || `${MIC_NAME[m.type]} ${i + 1}`;
      micRefs.push(B.add(m.type, zone, { fixed: m.fixed, name: m.fixed ? name : undefined }));
      if (!m.fixed) micsFixed = false;
    });
    if (F.mics.some((m) => SF.DEVICES[m.type].ports[0].needsPhantom)) B.note('Gooseneck and boundary mics are condensers — the input they plug into must supply +48V phantom power.');
    if (F.mics.some((m) => m.type === 'wired-mic' || m.type === 'wireless-mic')) B.note('Mics put out mic level. They need a preamp (mixer or DSP input) before anything else.');
    const ceilRefs = [];
    for (let i = 0; i < F.ceilingMics; i++) ceilRefs.push(B.add('ceiling-mic', Z.ceiling));
    let bgm = null;
    if (F.bgm) bgm = B.add('bgm', Z.user, { fixed: true, name: NAMES.bgm });

    // --- Processor
    let feeds = [];
    let pr = null;
    if (proc) {
      pr = B.add(proc, Z.rack);
      const ins = PROC[proc].ins.slice();
      micRefs.forEach((m) => B.conn(m + '.out', pr + '.' + ins.shift()));
      if (F.programAudio) B.conn((sw || de) + '.audioL', pr + '.' + ins.shift());
      if (bgm) B.conn(bgm + '.outL', pr + '.' + ins.shift());
      feeds = PROC[proc].outs.map((o) => pr + '.' + o);
      if (proc === 'mixer-4' && outsNeeded() > 1) B.note(`You need ${outsNeeded()} separate line-level feeds (speakers${F.als ? ', assistive listening' : ''}${F.capture || F.live ? ', the stream/recording' : ''}). Count the outputs on your processor.`);
    } else if (F.programAudio) feeds = [(sw || de) + '.audioL', (sw || de) + '.audioR'];
    else if (bgm) feeds = [bgm + '.outL', bgm + '.outR'];

    // --- Conferencing
    let pc = null;
    if (F.conf) {
      pc = B.add('room-pc', Z.rack, { fixed: true, name: NAMES['room-pc'] });
      videoOut(pc + '.hdmi');
      const cam = B.add('usb-cam', Z.camera);
      B.conn(cam + '.usb', B.free(pc, ['usb1', 'usb2', 'usb3']));
      B.conn(pr + '.usb', B.free(pc, ['usb1', 'usb2', 'usb3']));
      B.note('The room PC only takes USB. The DSP\'s USB link is two-way: room mics go up to the far end, far-end audio comes back down to the speakers.');
      if (ceilRefs.length) {
        const ps = B.add('poe-switch', Z.rack);
        ceilRefs.forEach((c) => B.conn(c + '.net', B.free(ps, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])));
        B.conn(pr + '.dante', B.free(ps, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']));
        B.note('Ceiling mic arrays send Dante audio and are powered by PoE from the switch port.');
      }
      reqs.push({ kind: 'reach', from: { types: SF.MIC_TYPES, label: 'microphone' }, media: 'audio', to: { ref: pc, label: 'the far end' }, all: true, label: 'The far end hears every mic' });
      reqs.push({ kind: 'reach', from: { types: SF.CAM_TYPES, label: 'camera' }, media: 'video', to: { ref: pc, label: 'the far end' }, label: 'The far end sees the room' });
      reqs.push({ kind: 'reach', from: { ref: pc }, media: 'video', to: { ref: dest }, label: 'Far-end video on the display' });
    }

    // --- Speakers
    let spkRefs = [];
    let spkSel = null;
    if (F.speakers) {
      const S = F.speakers;
      const t = SPK_TYPE[S.type];
      for (let i = 0; i < S.count; i++) spkRefs.push(B.add(t, Z.speakers, { fixed: S.fixed, name: S.fixed ? `${spkName[S.type]} ${i + 1}` : undefined }));
      if (S.type === 'powered') {
        B.conn(feeds.shift(), spkRefs[0] + '.in');
        for (let i = 1; i < spkRefs.length; i++) B.wire(spkRefs[i - 1] + '.thru', spkRefs[i] + '.in');
        B.note('Powered speakers take line level and have a Thru jack to chain the next one.');
      } else if (S.type === 'passive') {
        const amp = B.add('amp-2', Z.rack);
        B.conn(feeds.shift(), amp + '.in1');
        if (spkRefs.length > 1) B.conn(feeds.shift(), amp + '.in2');
        spkRefs.forEach((s, i) => B.conn(amp + '.out' + (i + 1), s + '.in'));
        B.note('Passive speakers need an amplifier channel each — and amp input 1 only feeds output 1.');
      } else {
        const amp = B.add('amp-70v', Z.rack);
        B.conn(feeds.shift(), amp + '.in');
        B.conn(amp + '.out', spkRefs[0] + '.in');
        for (let i = 1; i < spkRefs.length; i++) B.wire(spkRefs[i - 1] + '.loop', spkRefs[i] + '.in');
        B.note('Lots of ceiling speakers = a 70V system: one 70V amp, speakers daisy-chained via Loop Out.');
      }
      spkSel = S.fixed ? { types: [t], label: spkName[S.type].toLowerCase() } : { types: SF.SPEAKER_TYPES, label: 'speaker' };
      const n = S.count;
      if (micRefs.length || ceilRefs.length) reqs.push({ kind: 'reach', from: { types: SF.MIC_TYPES, label: 'microphone' }, media: 'audio', to: spkSel, minTo: n, all: true, label: `Every mic is heard on ${n} speakers` });
      if (F.programAudio) reqs.push({ kind: 'reach', from: { ref: srcRefs[0] }, media: 'audio', to: spkSel, minTo: n, label: `Laptop audio plays on ${n} speakers` });
      if (bgm) reqs.push({ kind: 'reach', from: { ref: bgm }, media: 'audio', to: spkSel, minTo: n, label: `Music plays on ${n} speakers` });
      if (pc) {
        // in a conference room the mics aren't required in the room speakers
        const i = reqs.findIndex((r) => r.label.startsWith('Every mic is heard on'));
        if (i >= 0) reqs.splice(i, 1);
        reqs.push({ kind: 'reach', from: { ref: pc }, media: 'audio', to: spkSel, minTo: n, label: `Far-end audio on ${n} room speakers` });
      }
    }

    // --- Assistive listening
    if (F.als) {
      const als = B.add('als', Z.rack);
      B.conn(feeds.shift(), als + '.in');
      reqs.push({ kind: 'reach', from: { types: SF.MIC_TYPES, label: 'microphone' }, media: 'audio', to: { types: ['als'], label: 'assistive listening TX' }, all: true, label: 'Every mic feeds assistive listening' });
      B.note('The assistive listening transmitter needs its own line-level feed.');
    }

    // --- Recording / streaming
    if (F.capture) {
      const cam = B.add('ptz-cam', Z.camera, { fixed: true, name: 'Capture Camera' });
      const enc = B.add('encoder', Z.rack);
      B.conn(cam + '.sdi', enc + '.sdi');
      B.conn(feeds.shift(), enc + '.audio');
      reqs.push({ kind: 'reach', from: { ref: cam }, media: 'video', to: { types: ['encoder'], label: 'encoder' }, label: 'Capture camera is recorded' });
      if (micRefs.length) reqs.push({ kind: 'reach', from: { types: SF.MIC_TYPES, label: 'microphone' }, media: 'audio', to: { types: ['encoder'], label: 'encoder' }, all: true, label: 'Every mic is recorded' });
    }
    if (F.live) {
      const ls = B.add('live-switcher', Z.rack);
      const enc = B.add('encoder', Z.rack);
      for (let i = 1; i <= 2; i++) B.conn(B.add('ptz-cam', Z.camera) + '.sdi', ls + '.sdi' + i);
      B.wire(ls + '.pgmSdi', enc + '.sdi');
      B.conn(feeds.shift(), ls + '.audio');
      B.note('The live switcher embeds its audio input into its program output — which can feed the encoder.');
      reqs.push({ kind: 'count', sel: { types: ['ptz-cam'] }, min: 2, label: 'Two PTZ cameras' });
      reqs.push({ kind: 'reach', from: { types: ['ptz-cam'], label: 'PTZ camera' }, media: 'video', to: { types: ['encoder'], label: 'livestream' }, all: true, label: 'Both cameras can go to the livestream' });
      reqs.push({ kind: 'reach', from: { types: SF.MIC_TYPES, label: 'microphone' }, media: 'audio', to: { types: ['encoder'], label: 'livestream' }, all: true, label: 'Every mic is in the livestream' });
    }

    // --- Counts for mics the player has to supply
    if (!micsFixed || ceilRefs.length) {
      const types = [...new Set([...F.mics.filter((m) => !m.fixed).map((m) => m.type), ...(ceilRefs.length ? ['ceiling-mic'] : [])])];
      const n = F.mics.filter((m) => !m.fixed).length + ceilRefs.length;
      const nm = types.length > 1 ? 'microphones' : MIC_NAME[types[0]].toLowerCase() + (n > 1 ? 's' : '');
      reqs.unshift({ kind: 'count', sel: { types: types.length > 1 ? SF.MIC_TYPES : types }, min: n, label: `Provide ${n} ${nm}` });
    }

    if (!reqs.length) throw new Error('empty plan');
    return { B, reqs, F, proc };
  }

  // ---------------------------------------------------------------- Palette & money
  const DECOY_RULES = [
    [(t) => t.has('mixer-4'), ['mixer-np', 'dsp-usb']],
    [(t) => t.has('poe-switch'), ['switch-np']],
    [(t) => t.has('amp-70v'), ['amp-2', 'spk-passive']],
    [(t) => t.has('amp-2'), ['amp-70v', 'spk-powered']],
    [(t) => t.has('spk-powered'), ['spk-passive', 'amp-70v']],
    [(t) => t.has('dsp-dante'), ['dsp-usb', 'switch-np']],
    [(t) => t.has('dsp-usb'), ['mixer-4']],
    [(t) => t.has('usb-cam'), ['ptz-cam']],
    [(t) => t.has('switcher'), ['hdmi-da', 'de-embed']],
    [(t) => t.has('de-embed'), ['hdmi-da', 'switcher']],
    [(t) => t.has('hdbt-tx'), ['hdmi-da']],
    [(t) => t.has('encoder'), ['live-switcher', 'room-pc']],
    [(t) => t.has('room-pc'), ['usb-ext-tx', 'hdbt-tx']],
    [() => true, ['hdbt-tx', 'hdbt-rx', 'hdmi-da', 'de-embed', 'mixer-np', 'switch-np']],
  ];
  function decoys(h, D, typesUsed, n) {
    const pool = [];
    for (const [test, list] of DECOY_RULES) if (test(typesUsed)) list.forEach((x) => { if (!pool.includes(x)) pool.push(x); });
    return h.shuffle(pool).slice(0, n);
  }

  function zoneFor(room, type) {
    const cat = SF.DEVICES[type].cat;
    const Z = room.roles;
    if (cat === 'Speakers' && type !== 'als') return Z.speakers;
    if (type === 'ceiling-mic') return Z.ceiling;
    if (cat === 'Microphones') return type === 'wireless-mic' ? Z.rack : Z.mics;
    if (cat === 'Cameras') return Z.camera;
    if (cat === 'Displays') return Z.display;
    if (type === 'hdbt-rx' || type === 'usb-ext-tx') return Z.display;
    if (type === 'switcher' || type === 'de-embed' || type === 'hdmi-da' || type === 'hdbt-tx') return Z.user;
    return Z.rack;
  }

  function makePalette(h, D, room, need, extra) {
    const pal = new Map();
    for (const d of need) {
      if (!pal.has(d.type)) pal.set(d.type, { type: d.type, qty: 0, zone: d.zone });
      pal.get(d.type).qty++;
    }
    for (const t of extra) {
      if (pal.has(t)) pal.get(t).qty++;
      else pal.set(t, { type: t, qty: 1, zone: zoneFor(room, t) });
    }
    return h.shuffle([...pal.values()]);
  }

  const roundUp = (n, step) => Math.ceil(n / step) * step;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------------------------------------------------------------- Faults (troubleshooting)
  function breakSystem(h, D, B, nFaults) {
    const devs = B.devs.map((d) => Object.assign({}, d));
    let cables = B.cables.map((c) => c.slice());
    const swaps = {};
    const removed = [];
    const fixes = [];
    const dv = (ref) => devs.find((d) => d.ref === ref);
    const refOf = (ep) => ep.split('.')[0];
    const cableAt = (ep) => cables.find((c) => c[0] === ep || c[1] === ep);
    const usedPorts = () => new Set(cables.flat());
    const portMap = (ep, map) => { const [r, p] = ep.split('.'); return map[p] ? r + '.' + map[p] : ep; };

    const swap = (fromType, toType, map, why) => {
      const d = devs.find((x) => x.type === fromType && !swaps[x.ref]);
      if (!d) return null;
      swaps[d.ref] = fromType;
      d.type = toType;
      if (map) cables = cables.map((c) => c.map((ep) => (refOf(ep) === d.ref ? portMap(ep, map) : ep)));
      return why;
    };

    const FAULTS = {
      missing: () => {
        const c = h.pick(cables);
        cables = cables.filter((x) => x !== c);
        return `Look for a connection that should be there but isn't (around ${B.label(refOf(c[0]))}).`;
      },
      bypass: () => {
        const mic = devs.find((d) => ['wired-mic', 'wireless-mic'].includes(d.type) && cableAt(d.ref + '.out'));
        const spk = devs.find((d) => d.type === 'spk-powered' && cableAt(d.ref + '.in'));
        if (!mic || !spk) return null;
        const a = cableAt(mic.ref + '.out'), b = cableAt(spk.ref + '.in');
        cables = cables.filter((x) => x !== a && x !== b);
        cables.push([mic.ref + '.out', spk.ref + '.in']);
        return 'A mic is plugged straight into a powered speaker. What level does a mic put out?';
      },
      phantom: () => {
        const mix = devs.find((d) => d.type === 'mixer-4');
        if (!mix || !cables.some((c) => refOf(c[1]) === mix.ref && SF.DEVICES[dv(refOf(c[0])).type].ports[0].needsPhantom)) return null;
        return swap('mixer-4', 'mixer-np', null, 'Somebody saved money on the mixer. Do the condenser mics have phantom power?');
      },
      amp70: () => swap('amp-70v', 'amp-2', { in: 'in1', out: 'out1' }, 'The amplifier driving the ceiling speakers is the wrong kind for a 70V line.'),
      poe: () => swap('poe-switch', 'switch-np', null, 'The ceiling mics are dark. How are they powered?'),
      collapse: () => {
        const tx = devs.find((d) => (d.type === 'hdbt-tx' || d.type === 'usb-ext-tx') && !removed.includes(d.ref));
        if (tx) {
          const inPort = tx.type === 'hdbt-tx' ? tx.ref + '.in' : tx.ref + '.usb';
          const outPort = tx.type === 'hdbt-tx' ? tx.ref + '.hdbt' : tx.ref + '.link';
          const c1 = cableAt(inPort), c2 = cableAt(outPort);
          if (!c1 || !c2) return null;
          const a = c1[0] === inPort ? c1[1] : c1[0];
          let far = c2[0] === outPort ? c2[1] : c2[0];
          const drop = [c1, c2];
          const gone = [tx.ref];
          let b;
          const farDev = dv(refOf(far));
          if (farDev.type === 'hdbt-rx' || farDev.type === 'usb-ext-rx') {
            const op = farDev.type === 'hdbt-rx' ? farDev.ref + '.hdmi' : farDev.ref + '.usb';
            const c3 = cableAt(op);
            if (!c3) return null;
            b =c3[0] === op ? c3[1] : c3[0];
            drop.push(c3); gone.push(farDev.ref);
          } else if (farDev.type === 'projector') {
            if (usedPorts().has(farDev.ref + '.hdmi')) return null;
            b = farDev.ref + '.hdmi';
          } else return null;
          cables = cables.filter((x) => !drop.includes(x));
          devs.splice(0, devs.length, ...devs.filter((d) => !gone.includes(d.ref)));
          removed.push(...gone);
          cables.push(tx.type === 'hdbt-tx' ? [a, b] : (SF.DEVICES[dv(refOf(a)).type].ports.find((p) => p.id === a.split('.')[1]).dir === 'out' ? [a, b] : [b, a]));
          return tx.type === 'hdbt-tx' ? 'Measure the HDMI run. Is it within HDMI\'s range?' : 'How long is that USB run?';
        }
        const sw = devs.find((d) => d.type === 'switcher' && cableAt(d.ref + '.hdbtOut'));
        if (!sw) return null;
        const c = cableAt(sw.ref + '.hdbtOut');
        const proj = dv(refOf(c[1]));
        if (!proj || proj.type !== 'projector' || usedPorts().has(sw.ref + '.hdmiOut') || usedPorts().has(proj.ref + '.hdmi')) return null;
        cables = cables.filter((x) => x !== c);
        cables.push([sw.ref + '.hdmiOut', proj.ref + '.hdmi']);
        return 'Measure the switcher → projector run. Is it within HDMI\'s range?';
      },
      danger: () => {
        const amp = devs.find((d) => d.type === 'amp-2' && cableAt(d.ref + '.out2'));
        const als = devs.find((d) => d.type === 'als' && cableAt(d.ref + '.in'));
        if (!amp || !als) return null;
        const a = cableAt(amp.ref + '.out2'), b = cableAt(als.ref + '.in');
        cables = cables.filter((x) => x !== a && x !== b);
        cables.push([amp.ref + '.out2', als.ref + '.in']);
        return 'Safety first: what is plugged into the assistive listening transmitter?';
      },
      hdbtNet: () => {
        const nsw = devs.find((d) => d.type === 'poe-switch' || d.type === 'switch-np');
        const c = cables.find((x) => SF.DEVICES[dv(refOf(x[0])).type].ports.find((p) => p.id === x[0].split('.')[1]).type === 'hdbt');
        if (!nsw || !c) return null;
        const used = usedPorts();
        const free = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((p) => nsw.ref + '.' + p).find((p) => !used.has(p));
        if (!free) return null;
        cables = cables.filter((x) => x !== c);
        cables.push([c[0], free]);
        return 'An HDBaseT cable ended up in the network switch. HDBaseT is not Ethernet.';
      },
    };
    const allowed = [['missing', 'bypass'], ['missing', 'bypass', 'phantom', 'collapse', 'amp70'], ['missing', 'bypass', 'phantom', 'collapse', 'amp70', 'poe', 'danger', 'hdbtNet'], ['missing', 'bypass', 'phantom', 'collapse', 'amp70', 'poe', 'danger', 'hdbtNet']][D];
    const order = h.shuffle(allowed.slice());
    for (const f of order) {
      if (fixes.length >= nFaults) break;
      if (f === 'missing' && fixes.length && h.chance(0.5)) continue;
      const r = FAULTS[f]();
      if (r) fixes.push(r);
    }
    while (fixes.length < nFaults) fixes.push(FAULTS.missing());
    return { devs, cables, swaps, removed, fixes };
  }

  // ---------------------------------------------------------------- Assemble a scenario
  function attempt(diff, modeReq, seed, n) {
    const R = mulberry32((seed * 2654435761 + n * 97 + 12345) >>> 0);
    const h = {
      R, chance: (p) => R() < p, ri: (a, b) => a + Math.floor(R() * (b - a + 1)), pick: (arr) => arr[Math.floor(R() * arr.length)],
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      many: (k, type, fixed) => Array.from({ length: k }, () => ({ type, fixed })),
    };
    const D = SF.DIFF_ORDER.indexOf(diff);
    const mode = modeReq === 'mix' ? (h.chance(0.5) ? 'build' : 'troubleshoot') : modeReq;
    const room = h.pick(ROOMS.filter((r) => r.minD <= D && D <= r.maxD));
    const capLen = [8, 20, 999, 999][D];
    const distances = {};
    for (const k of Object.keys(room.ranges)) { const [a, b] = room.ranges[k]; distances[k] = Math.min(capLen, h.ri(a, b)); }
    const roomName = h.pick(room.names);
    const scn = {
      diff, mode, random: true, randomMode: modeReq, seed,
      title: `🎲 ${roomName}${mode === 'troubleshoot' ? ' — Service Call' : ''}`,
      blurb: 'Randomly generated.', zones: room.zones, distances, sameZone: 2,
    };

    const { B, reqs } = buildSystem(h, D, room, scn);
    scn.reqs = reqs;
    const typesUsed = new Set(B.devs.map((d) => d.type));

    if (mode === 'build') {
      const fixed = B.devs.filter((d) => d.fixed);
      const need = B.devs.filter((d) => !d.fixed);
      scn.fixed = fixed.map((d) => ({ ref: d.ref, type: d.type, zone: d.zone, name: d.name }));
      scn.palette = makePalette(h, D, room, need, decoys(h, D, typesUsed, 2 + D));
      scn.solution = { add: need.map((d) => ({ ref: d.ref, type: d.type, zone: d.zone })), cables: B.cables };
      const cost = need.reduce((s, d) => s + SF.DEVICES[d.type].price, 0);
      scn.par = roundUp(cost, 100);
      if (D >= 2) scn.budget = roundUp(cost * (D === 3 ? 1.08 : 1.15), 500);
      const owned = fixed.map((d) => `<li>${esc(d.name || SF.DEVICES[d.type].name)}</li>`).join('');
      scn.brief = `<p>${esc(h.pick(room.intros))}</p>
        ${owned ? `<p>Already installed / supplied by the client:</p><ul>${owned}</ul>` : ''}
        <p>Design the system so everything on the requirements checklist works.${D >= 1 ? ' Check the site survey — cable distances matter.' : ''}</p>
        ${scn.budget ? `<p>Budget: <b>$${scn.budget.toLocaleString()}</b>.</p>` : ''}`;
      const notes = h.shuffle(B.notes);
      const parts = {};
      need.forEach((d) => { const nm = SF.DEVICES[d.type].name; parts[nm] = (parts[nm] || 0) + 1; });
      const partList = Object.entries(parts).map(([k, v]) => (v > 1 ? `${v}× ` : '') + k).join(', ');
      const nameOf = (ref) => { const d = B.dev(ref); return d.name || SF.DEVICES[d.type].short; };
      const conns = B.cables.slice(0, 6).map(([a, b]) => `${nameOf(a.split('.')[0])} → ${nameOf(b.split('.')[0])}`).join('; ');
      scn.hints = [
        notes[0] || 'Trace each requirement from its source to its destination, one cable at a time.',
        notes.slice(1, 3).join(' ') || 'Watch signal levels: mic → preamp → line → amp → passive speaker.',
        (partList ? `One working parts list: ${partList}. ` : 'No extra gear needed beyond what\'s listed — it\'s all about the wiring. ') + `Key runs: ${conns}${B.cables.length > 6 ? '; …' : ''}.`,
      ];
    } else {
      scn.reqs.forEach((r) => { if (r.kind === 'count') r.label = r.label.replace(/^Provide (\d+) (.*)$/, '$1 $2 in service'); });
      const nFaults = [1, 2, h.ri(2, 3), h.ri(3, 4)][D];
      const br = breakSystem(h, D, B, nFaults);
      scn.preset = { devices: br.devs.map((d) => ({ ref: d.ref, type: d.type, zone: d.zone, name: d.name })), cables: br.cables };
      const add = [];
      const rename = {};
      for (const [ref, origType] of Object.entries(br.swaps)) {
        const d = B.dev(ref);
        rename[ref] = ref + 'x';
        add.push({ ref: ref + 'x', type: origType, zone: d.zone });
      }
      for (const ref of br.removed) { const d = B.dev(ref); add.push({ ref, type: d.type, zone: d.zone }); }
      scn.solution = {
        remove: Object.keys(br.swaps), add,
        cables: B.cables.map((c) => c.map((ep) => { const [r, p] = ep.split('.'); return (rename[r] || r) + '.' + p; })),
      };
      scn.palette = makePalette(h, D, room, add, decoys(h, D, typesUsed, 1 + Math.min(D, 2)));
      const cost = add.reduce((s, d) => s + SF.DEVICES[d.type].price, 0);
      scn.par = cost;
      if (D >= 2) scn.budget = cost + 1000;
      // Symptoms come from what actually fails
      const pre = SF.evaluate(scn, SF.initialState(scn));
      const symptoms = pre.results.filter((r) => !r.pass && r.req.label).map((r) => `<li>❌ ${esc(r.req.label)}</li>`).join('');
      scn.brief = `<p class="ticket">🎫 <b>Service call — ${esc(roomName)}:</b> "It worked when it was installed. Now it doesn't."</p>
        <p>What users report:</p><ul>${symptoms}</ul>
        ${pre.danger ? '<p>Also: <b>a loud buzz and a hot smell</b> from the rack.</p>' : ''}
        <p>${D >= 2 ? `There are <b>${br.fixes.length}</b> separate faults.` : 'Find the fault and fix it.'}${scn.budget ? ` Spare parts budget: <b>$${scn.budget.toLocaleString()}</b>.` : ''}</p>`;
      scn.hints = [
        'Test the system, then click on the red cables and dimmed devices to read their diagnosis.',
        br.fixes[0],
        br.fixes.length > 1 ? 'Also: ' + br.fixes.slice(1).join(' ') : 'Use the reference design afterwards to compare.',
      ];
    }

    // ---- Verify: the reference passes, the starting point doesn't, the palette covers the reference
    const sol = SF.solutionState(scn);
    const ev = SF.evaluate(scn, sol);
    if (!ev.pass) throw new Error('reference fails: ' + ev.results.filter((r) => !r.pass).map((r) => r.req.label + ' / ' + r.detail).join('; '));
    if (SF.evaluate(scn, SF.initialState(scn)).pass) throw new Error('start already passes');
    for (const d of sol.devices.filter((x) => !x.owned)) {
      const pe = scn.palette.find((p) => p.type === d.type);
      if (!pe || sol.devices.filter((x) => !x.owned && x.type === d.type).length > pe.qty) throw new Error('palette short ' + d.type);
    }
    return scn;
  }

  const cache = new Map();
  SF.genStats = { attempts: 0, errors: {} };
  SF.parseRandomId = (id) => {
    const m = /^rnd-(novice|intermediate|advanced|pro)-(build|troubleshoot|mix)-(\d+)$/.exec(id || '');
    return m ? { diff: m[1], mode: m[2], seed: +m[3] } : null;
  };
  SF.randomId = (diff, mode, seed) => `rnd-${diff}-${mode}-${seed != null ? seed : Math.floor(Math.random() * 1e9)}`;
  SF.generateScenario = function (id) {
    if (cache.has(id)) return cache.get(id);
    const p = SF.parseRandomId(id);
    if (!p) return null;
    let lastErr = null;
    for (let n = 0; n < 60; n++) {
      try {
        SF.genStats.attempts++;
        const scn = attempt(p.diff, p.mode, p.seed, n);
        scn.id = id;
        cache.set(id, scn);
        return scn;
      } catch (e) {
        lastErr = e;
        const k = String(e.message).split(':')[0].slice(0, 40);
        SF.genStats.errors[k] = (SF.genStats.errors[k] || 0) + 1;
      }
    }
    if (SF.DEBUG) console.warn('generator gave up', id, lastErr);
    return null;
  };
})();

/* Scenario / level data */
(function () {
  const SF = (window.SF = window.SF || {});
  const MICS = { types: SF.MIC_TYPES, label: 'microphone' };
  const SPKS = { types: SF.SPEAKER_TYPES, label: 'speaker' };
  const CAMS = { types: SF.CAM_TYPES, label: 'camera' };
  const C70 = { types: ['ceil-70v'], label: '70V ceiling speaker' };
  const loop = (prefix, n) => Array.from({ length: n - 1 }, (_, i) => [`${prefix}${i + 1}.loop`, `${prefix}${i + 2}.in`]);
  const many = (prefix, n, type, zone) => Array.from({ length: n }, (_, i) => ({ ref: prefix + (i + 1), type, zone }));

  const BOARDROOM_ZONES = [
    { id: 'table', name: 'Boardroom Table' },
    { id: 'ceiling', name: 'Ceiling' },
    { id: 'front', name: 'Front Wall' },
    { id: 'rack', name: 'AV Closet (Rack)' },
  ];
  const BOARDROOM_DIST = { 'table|ceiling': 4, 'table|front': 6, 'table|rack': 12, 'ceiling|front': 5, 'ceiling|rack': 12, 'front|rack': 14 };
  const CLASS_ZONES = [{ id: 'desk', name: 'Teacher Desk' }, { id: 'ceiling', name: 'Ceiling (Projector)' }, { id: 'walls', name: 'Side Walls' }];
  const CLASS_DIST = { 'desk|ceiling': 15, 'desk|walls': 8, 'ceiling|walls': 6 };

  SF.SCENARIOS = [
    // ======================= NOVICE =======================
    {
      id: 'huddle-display', diff: 'novice', mode: 'build', title: 'First Light: Huddle Display',
      blurb: 'Get a guest laptop up on a screen — picture and sound.',
      brief: `<p>A small huddle room needs a screen. Guests will plug their laptop in at the table.</p>
        <p>The client wants to <b>see the laptop's picture</b> and <b>hear its audio</b>. Keep it simple — they hate clutter.</p>`,
      zones: [{ id: 'table', name: 'Huddle Table' }, { id: 'wall', name: 'Display Wall' }],
      distances: { 'table|wall': 4 }, sameZone: 2,
      fixed: [{ ref: 'laptop', type: 'laptop', zone: 'table', name: 'Guest Laptop' }],
      palette: [{ type: 'display', qty: 1, zone: 'wall' }, { type: 'projector', qty: 1, zone: 'wall' }, { type: 'spk-passive', qty: 2, zone: 'wall' }],
      reqs: [
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { types: ['display', 'projector'], label: 'screen' }, label: "The laptop's picture appears on a screen" },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'audio', to: { types: ['display', ...SF.SPEAKER_TYPES], label: 'speaker or display' }, label: "The laptop's audio is heard in the room" },
      ],
      par: 2000,
      hints: [
        'Click a device in the Equipment list to read what it does — look for which ones consume audio.',
        'HDMI carries both video AND audio. A flat panel display has built-in speakers.',
        'Add the Flat Panel Display, then drag from Laptop › HDMI Out to Display › HDMI In 1.',
      ],
      solution: { add: [{ ref: 'disp', type: 'display', zone: 'wall' }], cables: [['laptop.hdmi', 'disp.hdmi1']] },
    },
    {
      id: 'simple-pa', diff: 'novice', mode: 'build', title: 'Say Something: Simple PA',
      blurb: 'One mic, two speakers. Why can\'t you just plug them together?',
      brief: `<p>A community hall wants a basic PA for announcements. There's a <b>wired dynamic mic</b> at the podium.</p>
        <p>The mic must be heard through <b>two speakers</b> in the room.</p>`,
      zones: [{ id: 'podium', name: 'Podium' }, { id: 'room', name: 'Meeting Room' }],
      distances: { 'podium|room': 8 }, sameZone: 2,
      fixed: [{ ref: 'mic', type: 'wired-mic', zone: 'podium', name: 'Podium Mic' }],
      palette: [{ type: 'mixer-4', qty: 1, zone: 'podium' }, { type: 'amp-2', qty: 1, zone: 'podium' }, { type: 'spk-powered', qty: 2, zone: 'room' }, { type: 'spk-passive', qty: 2, zone: 'room' }],
      reqs: [{ kind: 'reach', from: { ref: 'mic' }, media: 'audio', to: SPKS, minTo: 2, label: 'The podium mic is heard on at least 2 speakers' }],
      par: 1700,
      hints: [
        'A mic makes a tiny MIC-level signal. Speakers want LINE level (powered speakers) or SPEAKER level (passive speakers).',
        'A mixer channel has a preamp: mic level in, line level out.',
        'Mic → Mixer Ch 1. Mixer Main L → Powered Speaker 1, Main R → Powered Speaker 2. (Or Main L/R → Amp → two passive speakers.)',
      ],
      solution: {
        add: [{ ref: 'mix', type: 'mixer-4', zone: 'podium' }, ...many('s', 2, 'spk-powered', 'room')],
        cables: [['mic.out', 'mix.ch1'], ['mix.mainL', 's1.in'], ['mix.mainR', 's2.in']],
      },
    },
    {
      id: 'cafe-bgm', diff: 'novice', mode: 'build', title: 'Café Background Music',
      blurb: 'The owner bought passive speakers. Make them play.',
      brief: `<p>A café owner already mounted two <b>passive speakers</b> in the dining room and has a music streamer at the counter.</p>
        <p>They plugged the streamer straight into the speakers and got silence. Get <b>music playing on both speakers</b>.</p>`,
      zones: [{ id: 'counter', name: 'Service Counter' }, { id: 'dining', name: 'Dining Room' }],
      distances: { 'counter|dining': 12 }, sameZone: 2,
      fixed: [
        { ref: 'bgm', type: 'bgm', zone: 'counter', name: 'Music Streamer' },
        { ref: 'spkL', type: 'spk-passive', zone: 'dining', name: 'Dining Speaker L' },
        { ref: 'spkR', type: 'spk-passive', zone: 'dining', name: 'Dining Speaker R' },
      ],
      palette: [{ type: 'amp-2', qty: 1, zone: 'counter' }, { type: 'mixer-4', qty: 1, zone: 'counter' }, { type: 'hdmi-da', qty: 1, zone: 'counter' }],
      reqs: [{ kind: 'reach', from: { ref: 'bgm' }, media: 'audio', to: { types: ['spk-passive'], label: 'passive speakers' }, minTo: 2, label: 'Music plays on both dining speakers' }],
      par: 700,
      hints: [
        '"Passive" means no amplifier inside. Something has to supply speaker-level power.',
        'A power amp turns line level into speaker level. Watch the channel numbers: In 1 feeds Out 1, In 2 feeds Out 2.',
        'Streamer L → Amp In 1, Streamer R → Amp In 2, Amp Out 1 → Speaker L, Amp Out 2 → Speaker R.',
      ],
      solution: {
        add: [{ ref: 'amp', type: 'amp-2', zone: 'counter' }],
        cables: [['bgm.outL', 'amp.in1'], ['bgm.outR', 'amp.in2'], ['amp.out1', 'spkL.in'], ['amp.out2', 'spkR.in']],
      },
    },
    {
      id: 'ts-quiet-mic', diff: 'novice', mode: 'troubleshoot', title: 'Ticket #1042: "The mic is SO quiet"',
      blurb: 'Someone wired the PA. You can barely hear it.',
      brief: `<p class="ticket">🎫 <b>Trouble ticket:</b> "We can barely hear the podium mic, even with the speakers turned all the way up. Please fix before Thursday's meeting."</p>
        <p>Inspect the system, find the fault, and fix it. Requirement: the mic is heard on both speakers.</p>`,
      zones: [{ id: 'podium', name: 'Podium' }, { id: 'room', name: 'Meeting Room' }],
      distances: { 'podium|room': 8 }, sameZone: 2,
      preset: {
        devices: [
          { ref: 'mic', type: 'wired-mic', zone: 'podium', name: 'Podium Mic' },
          { ref: 's1', type: 'spk-powered', zone: 'room', name: 'Speaker Left' },
          { ref: 's2', type: 'spk-powered', zone: 'room', name: 'Speaker Right' },
        ],
        cables: [['mic.out', 's1.in'], ['s1.thru', 's2.in']],
      },
      palette: [{ type: 'mixer-4', qty: 1, zone: 'podium' }, { type: 'amp-2', qty: 1, zone: 'podium' }],
      reqs: [{ kind: 'reach', from: { ref: 'mic' }, media: 'audio', to: SPKS, minTo: 2, label: 'The podium mic is heard on both speakers' }],
      par: 400,
      hints: [
        'Click the red cable and read its diagnosis.',
        'What level does a mic put out? What level does a powered speaker input expect?',
        'Insert a mixer: Mic → Mixer Ch 1, Mixer Main L → Speaker Left. Keep the Thru link to the right speaker.',
      ],
      solution: { add: [{ ref: 'mix', type: 'mixer-4', zone: 'podium' }], cables: [['mic.out', 'mix.ch1'], ['mix.mainL', 's1.in'], ['s1.thru', 's2.in']] },
    },

    // ======================= INTERMEDIATE =======================
    {
      id: 'classroom', diff: 'intermediate', mode: 'build', title: 'Classroom Upgrade',
      blurb: 'Laptop + doc cam to a ceiling projector 15 m away, with program audio.',
      brief: `<p>A high-school classroom has a new <b>ceiling projector</b>. The teacher wants to switch between their <b>laptop</b> and a <b>document camera</b> at the desk.</p>
        <p>Laptop audio (videos!) must play through <b>two wall speakers</b>. Check the site survey — the projector is far from the desk.</p>`,
      zones: CLASS_ZONES, distances: CLASS_DIST, sameZone: 2,
      fixed: [
        { ref: 'laptop', type: 'laptop', zone: 'desk', name: 'Teacher Laptop' },
        { ref: 'doccam', type: 'doc-cam', zone: 'desk', name: 'Document Camera' },
        { ref: 'proj', type: 'projector', zone: 'ceiling', name: 'Ceiling Projector' },
      ],
      palette: [
        { type: 'switcher', qty: 1, zone: 'desk' }, { type: 'hdmi-da', qty: 1, zone: 'desk' }, { type: 'de-embed', qty: 1, zone: 'desk' },
        { type: 'hdbt-tx', qty: 1, zone: 'desk' }, { type: 'hdbt-rx', qty: 1, zone: 'ceiling' }, { type: 'wpg', qty: 1, zone: 'desk' },
        { type: 'amp-2', qty: 1, zone: 'desk' }, { type: 'spk-passive', qty: 2, zone: 'walls' }, { type: 'spk-powered', qty: 2, zone: 'walls' },
      ],
      reqs: [
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'proj' }, label: 'Laptop shows on the projector' },
        { kind: 'reach', from: { ref: 'doccam' }, media: 'video', to: { ref: 'proj' }, label: 'Document camera shows on the projector' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'audio', to: SPKS, minTo: 2, label: 'Laptop audio plays on 2 wall speakers' },
      ],
      par: 2900,
      hints: [
        'Two video sources, one projector input… you need something that switches.',
        'HDMI is only good to ~10 m here, and the projector is 15 m away. This projector has an HDBaseT input.',
        'Switcher: Laptop → In 1, Doc Cam → In 2, HDBaseT Out → Projector HDBaseT In. Audio Out L/R → Amp → 2 passive speakers (or → powered speakers).',
      ],
      solution: {
        add: [{ ref: 'sw', type: 'switcher', zone: 'desk' }, { ref: 'amp', type: 'amp-2', zone: 'desk' }, ...many('s', 2, 'spk-passive', 'walls')],
        cables: [['laptop.hdmi', 'sw.in1'], ['doccam.hdmi', 'sw.in2'], ['sw.hdbtOut', 'proj.hdbt'], ['sw.audioL', 'amp.in1'], ['sw.audioR', 'amp.in2'], ['amp.out1', 's1.in'], ['amp.out2', 's2.in']],
      },
    },
    {
      id: 'council', diff: 'intermediate', mode: 'build', title: 'Council Chamber',
      blurb: 'Four condenser goosenecks, room speakers, and assistive listening.',
      brief: `<p>City council meetings need voice reinforcement. Four <b>condenser gooseneck mics</b> are already mounted on the dais.</p>
        <p>Every mic must be heard on <b>at least two speakers</b>, and every mic must feed the <b>assistive listening system</b> (it's the law).</p>`,
      zones: [{ id: 'dais', name: 'Council Dais' }, { id: 'rack', name: 'AV Rack' }, { id: 'room', name: 'Chamber Walls' }],
      distances: { 'dais|rack': 15, 'rack|room': 20, 'dais|room': 10 }, sameZone: 2,
      fixed: [1, 2, 3, 4].map((i) => ({ ref: 'm' + i, type: 'gooseneck', zone: 'dais', name: 'Councilor Mic ' + i })),
      palette: [
        { type: 'mixer-np', qty: 1, zone: 'rack' }, { type: 'mixer-4', qty: 1, zone: 'rack' }, { type: 'dsp-usb', qty: 1, zone: 'rack' },
        { type: 'amp-2', qty: 1, zone: 'rack' }, { type: 'spk-passive', qty: 2, zone: 'room' }, { type: 'spk-powered', qty: 2, zone: 'room' }, { type: 'als', qty: 1, zone: 'rack' },
      ],
      reqs: [
        { kind: 'reach', from: MICS, media: 'audio', to: SPKS, minTo: 2, all: true, label: 'Every councilor mic is heard on at least 2 speakers' },
        { kind: 'reach', from: MICS, media: 'audio', to: { types: ['als'], label: 'assistive listening TX' }, all: true, label: 'Every mic feeds assistive listening' },
      ],
      par: 2800,
      hints: [
        'Gooseneck mics are condensers. What do condensers need from the input they plug into?',
        'You need 3 separate feeds: two speaker feeds and one for the ALS. Count the mixer\'s outputs.',
        'Mics → 4-Ch Mixer (with phantom). Main L/R → Amp → 2 passive speakers. Aux → ALS.',
      ],
      solution: {
        add: [{ ref: 'mix', type: 'mixer-4', zone: 'rack' }, { ref: 'amp', type: 'amp-2', zone: 'rack' }, { ref: 'als', type: 'als', zone: 'rack' }, ...many('s', 2, 'spk-passive', 'room')],
        cables: [['m1.out', 'mix.ch1'], ['m2.out', 'mix.ch2'], ['m3.out', 'mix.ch3'], ['m4.out', 'mix.ch4'], ['mix.mainL', 'amp.in1'], ['mix.mainR', 'amp.in2'], ['amp.out1', 's1.in'], ['amp.out2', 's2.in'], ['mix.aux', 'als.in']],
      },
    },
    {
      id: 'teams-huddle', diff: 'intermediate', mode: 'build', title: 'Video Conference Huddle',
      blurb: 'A Teams/Zoom room: camera, table mics, DSP, speakers.',
      brief: `<p>Turn a small room into a video-conference room. The <b>Room PC</b> and <b>display</b> are already on the front wall.</p>
        <p>The far end must <b>see the room</b> and <b>hear every table mic</b> (at least two). People in the room must <b>see</b> the far end on the display and <b>hear</b> them on two room speakers — routed through a DSP so echo cancellation works.</p>`,
      zones: [{ id: 'table', name: 'Table' }, { id: 'front', name: 'Front Wall' }],
      distances: { 'table|front': 4 }, sameZone: 2,
      fixed: [{ ref: 'pc', type: 'room-pc', zone: 'front', name: 'Room PC' }, { ref: 'disp', type: 'display', zone: 'front', name: 'Display' }],
      palette: [
        { type: 'usb-cam', qty: 1, zone: 'front' }, { type: 'ptz-cam', qty: 1, zone: 'front' }, { type: 'boundary-mic', qty: 2, zone: 'table' },
        { type: 'dsp-usb', qty: 1, zone: 'front' }, { type: 'mixer-4', qty: 1, zone: 'front' }, { type: 'amp-2', qty: 1, zone: 'front' },
        { type: 'spk-powered', qty: 2, zone: 'front' }, { type: 'spk-passive', qty: 2, zone: 'front' },
      ],
      reqs: [
        { kind: 'count', sel: MICS, min: 2, label: 'At least 2 table mics' },
        { kind: 'reach', from: MICS, media: 'audio', to: { ref: 'pc', label: 'the far end' }, all: true, label: 'The far end hears every mic' },
        { kind: 'reach', from: CAMS, media: 'video', to: { ref: 'pc', label: 'the far end' }, label: 'The far end sees the room (camera)' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'video', to: { ref: 'disp' }, label: 'Far-end video on the display' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'audio', to: SPKS, minTo: 2, label: 'Far-end audio on 2 room speakers' },
      ],
      par: 4900,
      hints: [
        'The Room PC only has USB inputs. Which camera and which audio processor speak USB?',
        'The DSP\'s USB port is two-way: mics go up to the PC, far-end audio comes back down to the DSP outputs.',
        'USB cam → PC USB 1. Table mics → DSP In 1/2. DSP USB ↔ PC USB 2. PC HDMI → Display. DSP Out 1/2 → powered speakers.',
      ],
      solution: {
        add: [{ ref: 'cam', type: 'usb-cam', zone: 'front' }, ...many('b', 2, 'boundary-mic', 'table'), { ref: 'dsp', type: 'dsp-usb', zone: 'front' }, ...many('s', 2, 'spk-powered', 'front')],
        cables: [['cam.usb', 'pc.usb1'], ['b1.out', 'dsp.in1'], ['b2.out', 'dsp.in2'], ['dsp.usb', 'pc.usb2'], ['pc.hdmi', 'disp.hdmi1'], ['dsp.out1', 's1.in'], ['dsp.out2', 's2.in']],
      },
    },
    {
      id: 'ts-no-signal', diff: 'intermediate', mode: 'troubleshoot', title: 'Ticket #2210: "No Signal"',
      blurb: 'The projector is blank and one speaker is dead.',
      brief: `<p class="ticket">🎫 <b>Trouble ticket:</b> "Projector just says NO SIGNAL. Also, the right-hand speaker never makes any sound. The installer swore it all worked."</p>
        <p>Find and fix both faults. Check the site survey for distances.</p>`,
      zones: CLASS_ZONES, distances: CLASS_DIST, sameZone: 2,
      preset: {
        devices: [
          { ref: 'laptop', type: 'laptop', zone: 'desk', name: 'Teacher Laptop' },
          { ref: 'sw', type: 'switcher', zone: 'desk', name: 'Switcher' },
          { ref: 'amp', type: 'amp-2', zone: 'desk', name: 'Amp' },
          { ref: 'proj', type: 'projector', zone: 'ceiling', name: 'Ceiling Projector' },
          { ref: 's1', type: 'spk-passive', zone: 'walls', name: 'Left Speaker' },
          { ref: 's2', type: 'spk-passive', zone: 'walls', name: 'Right Speaker' },
        ],
        cables: [['laptop.hdmi', 'sw.in1'], ['sw.hdmiOut', 'proj.hdmi'], ['sw.audioL', 'amp.in1'], ['amp.out1', 's1.in'], ['amp.out2', 's2.in']],
      },
      palette: [{ type: 'hdbt-tx', qty: 1, zone: 'desk' }, { type: 'hdbt-rx', qty: 1, zone: 'ceiling' }, { type: 'hdmi-da', qty: 1, zone: 'desk' }],
      reqs: [
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'proj' }, label: 'Laptop shows on the projector' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'audio', to: { types: ['spk-passive'], label: 'speakers' }, minTo: 2, label: 'Laptop audio on BOTH speakers' },
      ],
      par: 0,
      hints: [
        'How long is the desk-to-ceiling run? How far can HDMI go?',
        'The amp has two channels. Is channel 2 getting any input?',
        'Use the switcher\'s HDBaseT Out → Projector HDBaseT In. Connect Switcher Audio R → Amp In 2.',
      ],
      solution: { cables: [['laptop.hdmi', 'sw.in1'], ['sw.hdbtOut', 'proj.hdbt'], ['sw.audioL', 'amp.in1'], ['sw.audioR', 'amp.in2'], ['amp.out1', 's1.in'], ['amp.out2', 's2.in']] },
    },

    // ======================= ADVANCED =======================
    {
      id: 'boardroom', diff: 'advanced', mode: 'build', title: 'Executive Boardroom',
      blurb: 'Dante ceiling mics, a 70V ceiling system, and long runs everywhere.',
      brief: `<p>The CEO wants a clean, modern Teams boardroom. <b>No mics on the table</b> — use two <b>ceiling mic arrays</b>. All electronics live in the AV closet.</p>
        <ul><li>Far end hears every mic and sees the room</li><li>Far-end video on the display; far-end audio on <b>at least four 70V ceiling speakers</b></li><li>A presenter laptop at the table shows on the display too</li></ul>
        <p>Budget: <b>$17,000</b>. Read the site survey carefully.</p>`,
      zones: BOARDROOM_ZONES, distances: BOARDROOM_DIST, sameZone: 2,
      fixed: [
        { ref: 'laptop', type: 'laptop', zone: 'table', name: 'Presenter Laptop' },
        { ref: 'disp', type: 'display', zone: 'front', name: '85" Display' },
        { ref: 'pc', type: 'room-pc', zone: 'rack', name: 'Room PC' },
      ],
      palette: [
        { type: 'ceiling-mic', qty: 2, zone: 'ceiling' }, { type: 'boundary-mic', qty: 2, zone: 'table' },
        { type: 'poe-switch', qty: 1, zone: 'rack' }, { type: 'switch-np', qty: 1, zone: 'rack' },
        { type: 'dsp-dante', qty: 1, zone: 'rack' }, { type: 'dsp-usb', qty: 1, zone: 'rack' },
        { type: 'usb-cam', qty: 1, zone: 'front' }, { type: 'usb-ext-tx', qty: 1, zone: 'front' }, { type: 'usb-ext-rx', qty: 1, zone: 'rack' },
        { type: 'hdbt-tx', qty: 1, zone: 'rack' }, { type: 'hdbt-rx', qty: 1, zone: 'front' }, { type: 'switcher', qty: 1, zone: 'rack' },
        { type: 'amp-70v', qty: 1, zone: 'rack' }, { type: 'amp-2', qty: 1, zone: 'rack' },
        { type: 'ceil-70v', qty: 6, zone: 'ceiling' }, { type: 'spk-passive', qty: 2, zone: 'ceiling' },
      ],
      reqs: [
        { kind: 'count', sel: { types: ['ceiling-mic'] }, min: 2, label: 'Two ceiling mic arrays (clean table)' },
        { kind: 'reach', from: MICS, media: 'audio', to: { ref: 'pc', label: 'the far end' }, all: true, label: 'The far end hears every mic' },
        { kind: 'reach', from: CAMS, media: 'video', to: { ref: 'pc', label: 'the far end' }, label: 'The far end sees the room' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'video', to: { ref: 'disp' }, label: 'Far-end video on the display' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'audio', to: C70, minTo: 4, label: 'Far-end audio on at least 4 ceiling speakers' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'disp' }, label: 'Presenter laptop shows on the display' },
      ],
      budget: 17000, par: 15500,
      hints: [
        'Ceiling mics talk Dante and are powered over the network cable. Which switch can power them?',
        'Front wall ↔ rack is 14 m. That\'s too far for both USB (camera) and HDMI (display).',
        'Mics → PoE switch ← Dante DSP. DSP USB ↔ PC. Camera → USB extender pair → PC. PC HDMI → HDBT TX → HDBT RX → Display. Laptop → Display HDMI 2 (6 m is fine). DSP Out → 70V amp → chain 4 ceiling speakers via Loop Out.',
      ],
      solution: {
        add: [
          ...many('cm', 2, 'ceiling-mic', 'ceiling'), { ref: 'sw', type: 'poe-switch', zone: 'rack' }, { ref: 'dsp', type: 'dsp-dante', zone: 'rack' },
          { ref: 'cam', type: 'usb-cam', zone: 'front' }, { ref: 'ux1', type: 'usb-ext-tx', zone: 'front' }, { ref: 'ux2', type: 'usb-ext-rx', zone: 'rack' },
          { ref: 'tx', type: 'hdbt-tx', zone: 'rack' }, { ref: 'rx', type: 'hdbt-rx', zone: 'front' }, { ref: 'amp', type: 'amp-70v', zone: 'rack' },
          ...many('c', 4, 'ceil-70v', 'ceiling'),
        ],
        cables: [
          ['cm1.net', 'sw.p1'], ['cm2.net', 'sw.p2'], ['dsp.dante', 'sw.p3'], ['dsp.usb', 'pc.usb1'],
          ['cam.usb', 'ux1.usb'], ['ux1.link', 'ux2.link'], ['ux2.usb', 'pc.usb2'],
          ['pc.hdmi', 'tx.in'], ['tx.hdbt', 'rx.hdbt'], ['rx.hdmi', 'disp.hdmi1'], ['laptop.hdmi', 'disp.hdmi2'],
          ['dsp.out1', 'amp.in'], ['amp.out', 'c1.in'], ...loop('c', 4),
        ],
      },
    },
    {
      id: 'lecture-hall', diff: 'advanced', mode: 'build', title: 'Lecture Hall with Capture',
      blurb: 'Voice lift on 6 ceiling speakers, ALS, and lecture recording.',
      brief: `<p>A university lecture hall. At the lectern: a <b>gooseneck mic</b> and the <b>lecture laptop</b>. Add <b>two wireless mics</b> for Q&amp;A. All electronics go in the control booth at the back, except anything that must sit at the lectern.</p>
        <ul><li>Laptop on the ceiling projector</li><li>All mics + laptop audio on at least <b>six 70V ceiling speakers</b></li><li>All mics on the <b>assistive listening</b> system</li><li>Lecture capture: the booth camera and the lectern mic go to a <b>streaming encoder</b></li></ul>
        <p>Budget: <b>$10,000</b>.</p>`,
      zones: [{ id: 'lectern', name: 'Lectern' }, { id: 'ceiling', name: 'Ceiling' }, { id: 'booth', name: 'Control Booth' }],
      distances: { 'lectern|ceiling': 10, 'lectern|booth': 35, 'ceiling|booth': 30 }, sameZone: 2,
      fixed: [
        { ref: 'laptop', type: 'laptop', zone: 'lectern', name: 'Lectern Laptop' },
        { ref: 'lmic', type: 'gooseneck', zone: 'lectern', name: 'Lectern Mic' },
        { ref: 'proj', type: 'projector', zone: 'ceiling', name: 'Projector' },
        { ref: 'cam', type: 'ptz-cam', zone: 'booth', name: 'Capture Camera' },
      ],
      palette: [
        { type: 'wireless-mic', qty: 2, zone: 'booth' }, { type: 'mixer-4', qty: 1, zone: 'booth' }, { type: 'mixer-np', qty: 1, zone: 'booth' },
        { type: 'dsp-usb', qty: 1, zone: 'booth' }, { type: 'switcher', qty: 1, zone: 'lectern' }, { type: 'hdmi-da', qty: 1, zone: 'lectern' },
        { type: 'hdbt-tx', qty: 1, zone: 'lectern' }, { type: 'hdbt-rx', qty: 1, zone: 'ceiling' }, { type: 'de-embed', qty: 1, zone: 'lectern' },
        { type: 'amp-70v', qty: 1, zone: 'booth' }, { type: 'amp-2', qty: 1, zone: 'booth' }, { type: 'ceil-70v', qty: 8, zone: 'ceiling' },
        { type: 'spk-passive', qty: 2, zone: 'ceiling' }, { type: 'encoder', qty: 1, zone: 'booth' }, { type: 'als', qty: 1, zone: 'booth' }, { type: 'live-switcher', qty: 1, zone: 'booth' },
      ],
      reqs: [
        { kind: 'count', sel: { types: ['wireless-mic'] }, min: 2, label: 'Two wireless mics for Q&A' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'proj' }, label: 'Laptop on the projector' },
        { kind: 'reach', from: MICS, media: 'audio', to: C70, minTo: 6, all: true, label: 'Every mic on at least 6 ceiling speakers' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'audio', to: C70, minTo: 6, label: 'Laptop audio on at least 6 ceiling speakers' },
        { kind: 'reach', from: MICS, media: 'audio', to: { types: ['als'], label: 'assistive listening TX' }, all: true, label: 'Every mic on assistive listening' },
        { kind: 'reach', from: { ref: 'cam' }, media: 'video', to: { types: ['encoder'], label: 'encoder' }, label: 'Capture camera → encoder' },
        { kind: 'reach', from: { ref: 'lmic' }, media: 'audio', to: { types: ['encoder'], label: 'encoder' }, label: 'Lectern mic → encoder' },
      ],
      budget: 10000, par: 8000,
      hints: [
        'Analog audio is happy on long runs (100 m) — HDMI is not. Lectern → projector is only 10 m.',
        'Count outputs: speakers, ALS, and encoder audio all need their own feed. A 4-ch mixer has Main L, Main R and Aux.',
        'Laptop → Switcher (at lectern) → HDBT Out → Projector. Switcher Audio L, lectern mic, 2 wireless → Mixer (phantom!). Main L → 70V amp → 6 speakers chained. Main R → Encoder audio. Aux → ALS. Camera SDI → Encoder.',
      ],
      solution: {
        add: [
          ...many('wm', 2, 'wireless-mic', 'booth'), { ref: 'sw', type: 'switcher', zone: 'lectern' }, { ref: 'mix', type: 'mixer-4', zone: 'booth' },
          { ref: 'amp', type: 'amp-70v', zone: 'booth' }, ...many('c', 6, 'ceil-70v', 'ceiling'), { ref: 'enc', type: 'encoder', zone: 'booth' }, { ref: 'als', type: 'als', zone: 'booth' },
        ],
        cables: [
          ['laptop.hdmi', 'sw.in1'], ['sw.hdbtOut', 'proj.hdbt'], ['sw.audioL', 'mix.ch4'], ['lmic.out', 'mix.ch1'], ['wm1.out', 'mix.ch2'], ['wm2.out', 'mix.ch3'],
          ['mix.mainL', 'amp.in'], ['amp.out', 'c1.in'], ...loop('c', 6), ['mix.mainR', 'enc.audio'], ['cam.sdi', 'enc.sdi'], ['mix.aux', 'als.in'],
        ],
      },
    },
    {
      id: 'ts-far-end', diff: 'advanced', mode: 'troubleshoot', title: 'Ticket #3307: "Can you hear us?"',
      blurb: 'A boardroom where the far end can\'t hear, can\'t see, and the room hears nothing.',
      brief: `<p class="ticket">🎫 <b>Trouble ticket:</b> "Every Teams call in the boardroom is a disaster. The far end can't hear us, they can't see us, and we can't hear THEM. The picture on our display is fine."</p>
        <p>There are <b>three</b> separate faults. Spares budget: <b>$2,000</b>.</p>`,
      zones: BOARDROOM_ZONES, distances: BOARDROOM_DIST, sameZone: 2,
      preset: {
        devices: [
          ...many('cm', 2, 'ceiling-mic', 'ceiling'), ...many('c', 4, 'ceil-70v', 'ceiling'),
          { ref: 'cam', type: 'usb-cam', zone: 'front', name: 'Camera' }, { ref: 'rx', type: 'hdbt-rx', zone: 'front' }, { ref: 'disp', type: 'display', zone: 'front', name: 'Display' },
          { ref: 'nsw', type: 'switch-np', zone: 'rack', name: 'Network Switch' }, { ref: 'dsp', type: 'dsp-dante', zone: 'rack', name: 'DSP' },
          { ref: 'pc', type: 'room-pc', zone: 'rack', name: 'Room PC' }, { ref: 'tx', type: 'hdbt-tx', zone: 'rack' }, { ref: 'amp', type: 'amp-70v', zone: 'rack', name: '70V Amp' },
        ],
        cables: [
          ['cm1.net', 'nsw.p1'], ['cm2.net', 'nsw.p2'], ['dsp.dante', 'nsw.p3'], ['cam.usb', 'pc.usb1'],
          ['pc.hdmi', 'tx.in'], ['tx.hdbt', 'rx.hdbt'], ['rx.hdmi', 'disp.hdmi1'], ['dsp.out1', 'amp.in'], ['amp.out', 'c1.in'], ...loop('c', 4),
        ],
      },
      palette: [
        { type: 'poe-switch', qty: 1, zone: 'rack' }, { type: 'usb-ext-tx', qty: 1, zone: 'front' }, { type: 'usb-ext-rx', qty: 1, zone: 'rack' },
        { type: 'hdbt-tx', qty: 1, zone: 'rack' }, { type: 'hdbt-rx', qty: 1, zone: 'front' }, { type: 'dante-avio', qty: 1, zone: 'rack' },
      ],
      reqs: [
        { kind: 'reach', from: MICS, media: 'audio', to: { ref: 'pc', label: 'the far end' }, all: true, label: 'The far end hears every mic' },
        { kind: 'reach', from: CAMS, media: 'video', to: { ref: 'pc', label: 'the far end' }, label: 'The far end sees the room' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'video', to: { ref: 'disp' }, label: 'Far-end video on the display' },
        { kind: 'reach', from: { ref: 'pc' }, media: 'audio', to: C70, minTo: 4, label: 'Far-end audio on all 4 ceiling speakers' },
      ],
      budget: 2000, par: 1200,
      hints: [
        'Select each ceiling mic. Is it getting power? How are ceiling mics powered?',
        'The camera is on the front wall and the PC is in the rack. How long is that USB run?',
        'Is there any path for audio between the DSP and the PC? Swap in a PoE switch, add a USB extender pair, and connect DSP USB ↔ PC USB.',
      ],
      solution: {
        remove: ['nsw'],
        add: [{ ref: 'psw', type: 'poe-switch', zone: 'rack' }, { ref: 'ux1', type: 'usb-ext-tx', zone: 'front' }, { ref: 'ux2', type: 'usb-ext-rx', zone: 'rack' }],
        cables: [
          ['cm1.net', 'psw.p1'], ['cm2.net', 'psw.p2'], ['dsp.dante', 'psw.p3'], ['dsp.usb', 'pc.usb2'],
          ['cam.usb', 'ux1.usb'], ['ux1.link', 'ux2.link'], ['ux2.usb', 'pc.usb1'],
          ['pc.hdmi', 'tx.in'], ['tx.hdbt', 'rx.hdbt'], ['rx.hdmi', 'disp.hdmi1'], ['dsp.out1', 'amp.in'], ['amp.out', 'c1.in'], ...loop('c', 4),
        ],
      },
    },

    // ======================= PRO =======================
    {
      id: 'town-hall', diff: 'pro', mode: 'build', title: 'Hybrid Town Hall',
      blurb: 'Live production: 4 wireless mics, 2 cameras, slides, PA and livestream.',
      brief: `<p>A company town hall in a multipurpose room, <b>live-streamed</b> to remote staff. The production desk (FOH) is at the back; cameras are on a rear riser.</p>
        <ul><li><b>Four wireless mics</b> for the panel, heard on at least two house speakers</li><li>Every mic in the livestream</li><li><b>Two PTZ cameras</b>, both able to go to the stream</li><li>The slides laptop (at FOH) on the house projector <i>and</i> available to the stream</li></ul>
        <p>Budget: <b>$18,000</b>. This is a production, not a Teams meeting — think like a broadcast engineer.</p>`,
      zones: [{ id: 'stage', name: 'Stage' }, { id: 'house', name: 'House (Audience)' }, { id: 'foh', name: 'FOH Production' }, { id: 'rear', name: 'Rear Camera Riser' }],
      distances: { 'stage|house': 15, 'stage|foh': 30, 'stage|rear': 40, 'house|foh': 15, 'house|rear': 20, 'foh|rear': 12 }, sameZone: 2,
      fixed: [{ ref: 'laptop', type: 'laptop', zone: 'foh', name: 'Slides Laptop' }, { ref: 'proj', type: 'projector', zone: 'house', name: 'House Projector' }],
      palette: [
        { type: 'wireless-mic', qty: 4, zone: 'foh' }, { type: 'mixer-4', qty: 1, zone: 'foh' }, { type: 'dsp-dante', qty: 1, zone: 'foh' },
        { type: 'spk-powered', qty: 2, zone: 'house' }, { type: 'spk-passive', qty: 2, zone: 'house' }, { type: 'amp-2', qty: 1, zone: 'foh' },
        { type: 'ptz-cam', qty: 2, zone: 'rear' }, { type: 'usb-cam', qty: 1, zone: 'rear' }, { type: 'live-switcher', qty: 1, zone: 'foh' },
        { type: 'encoder', qty: 1, zone: 'foh' }, { type: 'hdmi-da', qty: 1, zone: 'foh' }, { type: 'hdbt-tx', qty: 1, zone: 'foh' },
        { type: 'hdbt-rx', qty: 1, zone: 'house' }, { type: 'room-pc', qty: 1, zone: 'foh' },
      ],
      reqs: [
        { kind: 'count', sel: { types: ['wireless-mic'] }, min: 4, label: 'Four wireless mics' },
        { kind: 'reach', from: MICS, media: 'audio', to: SPKS, minTo: 2, all: true, label: 'Every mic on at least 2 house speakers' },
        { kind: 'reach', from: MICS, media: 'audio', to: { types: ['encoder'], label: 'livestream' }, all: true, label: 'Every mic in the livestream' },
        { kind: 'count', sel: { types: ['ptz-cam'] }, min: 2, label: 'Two PTZ cameras' },
        { kind: 'reach', from: { types: ['ptz-cam'], label: 'PTZ camera' }, media: 'video', to: { types: ['encoder'], label: 'livestream' }, all: true, label: 'Both cameras can go to the stream' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'proj' }, label: 'Slides on the house projector' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { types: ['encoder'], label: 'livestream' }, label: 'Slides available to the stream' },
      ],
      budget: 18000, par: 17000,
      hints: [
        'The laptop has ONE HDMI output but needs to feed two places, one of them 15 m away.',
        'The live switcher embeds its line-level audio input into its program output, which can feed the encoder.',
        '4 wireless → Mixer. Main L → powered speaker → Thru → powered speaker. Main R → Live Switcher audio in. Cameras SDI → Live Switcher. Laptop → HDMI splitter → Live Switcher HDMI 5 + HDBT TX → Projector HDBT. PGM SDI → Encoder.',
      ],
      solution: {
        add: [
          ...many('wm', 4, 'wireless-mic', 'foh'), { ref: 'mix', type: 'mixer-4', zone: 'foh' }, ...many('s', 2, 'spk-powered', 'house'),
          ...many('cam', 2, 'ptz-cam', 'rear'), { ref: 'ls', type: 'live-switcher', zone: 'foh' }, { ref: 'enc', type: 'encoder', zone: 'foh' },
          { ref: 'da', type: 'hdmi-da', zone: 'foh' }, { ref: 'tx', type: 'hdbt-tx', zone: 'foh' },
        ],
        cables: [
          ['wm1.out', 'mix.ch1'], ['wm2.out', 'mix.ch2'], ['wm3.out', 'mix.ch3'], ['wm4.out', 'mix.ch4'],
          ['mix.mainL', 's1.in'], ['s1.thru', 's2.in'], ['mix.mainR', 'ls.audio'],
          ['cam1.sdi', 'ls.sdi1'], ['cam2.sdi', 'ls.sdi2'], ['laptop.hdmi', 'da.in'], ['da.out1', 'ls.hdmi5'], ['da.out2', 'tx.in'], ['tx.hdbt', 'proj.hdbt'],
          ['ls.pgmSdi', 'enc.sdi'],
        ],
      },
    },
    {
      id: 'ts-punch-list', diff: 'pro', mode: 'troubleshoot', title: 'Ticket #4001: The Punch List',
      blurb: 'A rushed install with four faults — one of them is about to smoke something.',
      brief: `<p class="ticket">🎫 <b>Commissioning punch list:</b> "Lectern mic: dead. Ceiling speakers: faint and distorted. Projector: no signal. Hearing-assist users report a horrible loud buzz and now the ALS won't turn on."</p>
        <p>The subcontractor left in a hurry. Find <b>all four</b> faults. Spares budget: <b>$2,500</b>.</p>`,
      zones: [{ id: 'stage', name: 'Stage / Lectern' }, { id: 'ceiling', name: 'Ceiling' }, { id: 'rack', name: 'AV Rack' }],
      distances: { 'stage|ceiling': 8, 'stage|rack': 25, 'ceiling|rack': 20 }, sameZone: 2,
      preset: {
        devices: [
          { ref: 'lmic', type: 'gooseneck', zone: 'stage', name: 'Lectern Mic' },
          { ref: 'laptop', type: 'laptop', zone: 'stage', name: 'Lectern Laptop' },
          { ref: 'sw', type: 'switcher', zone: 'stage', name: 'Switcher' },
          { ref: 'proj', type: 'projector', zone: 'ceiling', name: 'Projector' },
          ...many('c', 4, 'ceil-70v', 'ceiling'),
          { ref: 'wm', type: 'wireless-mic', zone: 'rack', name: 'Wireless Mic' },
          { ref: 'mix', type: 'mixer-np', zone: 'rack', name: 'Mixer' },
          { ref: 'amp', type: 'amp-2', zone: 'rack', name: 'Amplifier' },
          { ref: 'als', type: 'als', zone: 'rack', name: 'Assistive Listening TX' },
          { ref: 'nsw', type: 'switch-np', zone: 'rack', name: 'Control Network Switch' },
        ],
        cables: [
          ['laptop.hdmi', 'sw.in1'], ['sw.hdbtOut', 'nsw.p1'], ['sw.audioL', 'mix.ch3'], ['lmic.out', 'mix.ch1'], ['wm.out', 'mix.ch2'],
          ['mix.mainL', 'amp.in1'], ['amp.out1', 'c1.in'], ...loop('c', 4), ['mix.mainR', 'amp.in2'], ['amp.out2', 'als.in'],
        ],
      },
      palette: [
        { type: 'mixer-4', qty: 1, zone: 'rack' }, { type: 'amp-70v', qty: 1, zone: 'rack' }, { type: 'hdbt-rx', qty: 1, zone: 'ceiling' },
        { type: 'hdbt-tx', qty: 1, zone: 'stage' }, { type: 'de-embed', qty: 1, zone: 'stage' }, { type: 'dante-avio', qty: 1, zone: 'rack' },
      ],
      reqs: [
        { kind: 'reach', from: MICS, media: 'audio', to: C70, minTo: 4, all: true, label: 'Every mic on all 4 ceiling speakers' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'audio', to: C70, minTo: 4, label: 'Laptop audio on all 4 ceiling speakers' },
        { kind: 'reach', from: MICS, media: 'audio', to: { types: ['als'], label: 'assistive listening TX' }, all: true, label: 'Every mic on assistive listening' },
        { kind: 'reach', from: { ref: 'laptop' }, media: 'video', to: { ref: 'proj' }, label: 'Laptop on the projector' },
      ],
      budget: 2500, par: 1300,
      hints: [
        'Start with the safety issue: what is plugged into the ALS input?',
        'Look at the mixer model and the amplifier model. Do they match the mic and speakers they serve?',
        'Replace the mixer with the phantom-powered one, replace the 8Ω amp with the 70V amp, feed the ALS from Mixer Aux, and run Switcher HDBaseT Out straight to the Projector HDBaseT In.',
      ],
      solution: {
        remove: ['mix', 'amp'],
        add: [{ ref: 'mix2', type: 'mixer-4', zone: 'rack' }, { ref: 'amp2', type: 'amp-70v', zone: 'rack' }],
        cables: [
          ['laptop.hdmi', 'sw.in1'], ['sw.hdbtOut', 'proj.hdbt'], ['sw.audioL', 'mix2.ch3'], ['lmic.out', 'mix2.ch1'], ['wm.out', 'mix2.ch2'],
          ['mix2.mainL', 'amp2.in'], ['amp2.out', 'c1.in'], ...loop('c', 4), ['mix2.aux', 'als.in'],
        ],
      },
    },
  ];

  SF.DIFF_ORDER = ['novice', 'intermediate', 'advanced', 'pro'];
})();

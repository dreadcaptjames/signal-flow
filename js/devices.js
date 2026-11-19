/* Equipment catalog */
(function () {
  const SF = (window.SF = window.SF || {});
  const P = (id, label, type, dir, extra) => Object.assign({ id, label, type, dir }, extra || {});
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
  const ids = (ports) => ports.map((p) => p.id);
  const D = {};
  const def = (t) => { D[t.type] = Object.assign({ routes: [], emits: [], consumes: [] }, t); };

  // ---------- Sources ----------
  def({
    type: 'laptop', name: 'Laptop', short: 'Laptop', icon: '💻', cat: 'Sources', price: 0,
    desc: 'A presenter laptop. Its HDMI output carries video and embedded audio.',
    ports: [P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    emits: [{ media: 'video', ports: ['hdmi'] }, { media: 'audio', ports: ['hdmi'] }],
  });
  def({
    type: 'wired-mic', name: 'Dynamic Mic (wired)', short: 'Wired Mic', icon: '🎤', cat: 'Microphones', price: 150,
    desc: 'Handheld dynamic mic. Needs no phantom power. Puts out a very low mic-level signal on XLR.',
    ports: [P('out', 'XLR Out', 'mic', 'out')],
    emits: [{ media: 'audio', ports: ['out'] }],
  });
  def({
    type: 'wireless-mic', name: 'Wireless Mic System', short: 'Wireless Mic', icon: '🎙️', cat: 'Microphones', price: 900,
    desc: 'Handheld transmitter + receiver. The receiver lives in the rack/booth; its XLR output is set to mic level.',
    ports: [P('out', 'XLR Out', 'mic', 'out')],
    emits: [{ media: 'audio', ports: ['out'] }],
  });
  def({
    type: 'gooseneck', name: 'Gooseneck Mic (condenser)', short: 'Gooseneck', icon: '🎤', cat: 'Microphones', price: 300,
    desc: 'Condenser gooseneck for lecterns and daises. Needs +48V phantom power from the input it plugs into. Mic-level output.',
    ports: [P('out', 'XLR Out', 'mic', 'out', { needsPhantom: true })],
    emits: [{ media: 'audio', ports: ['out'] }],
  });
  def({
    type: 'boundary-mic', name: 'Boundary Mic (condenser)', short: 'Table Mic', icon: '🎤', cat: 'Microphones', price: 350,
    desc: 'Low-profile table boundary mic (condenser). Needs +48V phantom power. Mic-level XLR output.',
    ports: [P('out', 'XLR Out', 'mic', 'out', { needsPhantom: true })],
    emits: [{ media: 'audio', ports: ['out'] }],
  });
  def({
    type: 'ceiling-mic', name: 'Ceiling Mic Array (Dante)', short: 'Ceiling Mic', icon: '🛸', cat: 'Microphones', price: 3000,
    desc: 'Beamforming ceiling microphone. Sends audio as Dante over the network and is powered by PoE (Power over Ethernet) from the switch port.',
    ports: [P('net', 'Dante / PoE', 'net', 'io', { needsPoE: true })],
    emits: [{ media: 'audio', ports: ['net'] }],
  });
  def({
    type: 'bgm', name: 'Music Streamer', short: 'Streamer', icon: '🎵', cat: 'Sources', price: 400,
    desc: 'Background music player with stereo line-level outputs.',
    ports: [P('outL', 'Line Out L', 'line', 'out'), P('outR', 'Line Out R', 'line', 'out')],
    emits: [{ media: 'audio', ports: ['outL', 'outR'] }],
  });
  def({
    type: 'wpg', name: 'Wireless Presentation Gateway', short: 'Wireless Share', icon: '📶', cat: 'Sources', price: 1000,
    desc: 'Lets guests share their screen wirelessly. Outputs HDMI (video + audio).',
    ports: [P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    emits: [{ media: 'video', ports: ['hdmi'] }, { media: 'audio', ports: ['hdmi'] }],
  });
  def({
    type: 'doc-cam', name: 'Document Camera', short: 'Doc Cam', icon: '📄', cat: 'Sources', price: 800,
    desc: 'Overhead document camera. HDMI video output.',
    ports: [P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    emits: [{ media: 'video', ports: ['hdmi'] }],
  });
  def({
    type: 'usb-cam', name: 'USB Conference Camera', short: 'USB Camera', icon: '📷', cat: 'Cameras', price: 1200,
    desc: 'Plug-and-play USB camera for the room PC. Plain USB is only reliable to about 5 m.',
    ports: [P('usb', 'USB Out', 'usb', 'out')],
    emits: [{ media: 'video', ports: ['usb'] }],
  });
  def({
    type: 'ptz-cam', name: 'PTZ Camera (SDI + HDMI)', short: 'PTZ Cam', icon: '🎥', cat: 'Cameras', price: 3500,
    desc: 'Pan-tilt-zoom production camera. Same picture on its 3G-SDI and HDMI outputs. No USB.',
    ports: [P('sdi', 'SDI Out', 'sdi', 'out'), P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    emits: [{ media: 'video', ports: ['sdi', 'hdmi'] }],
  });
  def({
    type: 'room-pc', name: 'Room PC (Teams/Zoom)', short: 'Room PC', icon: '🖧', cat: 'Conferencing', price: 1500,
    desc: 'Runs the video-conference app. Anything arriving on its USB ports (camera video, DSP audio) is sent to the FAR END. Its HDMI output shows the far-end video (far-end audio embedded); far-end audio also plays out its USB audio device. No video inputs besides USB.',
    ports: [P('usb1', 'USB 1', 'usb', 'io'), P('usb2', 'USB 2', 'usb', 'io'), P('usb3', 'USB 3', 'usb', 'io'), P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    emits: [{ media: 'video', ports: ['hdmi'], label: 'Far-end video' }, { media: 'audio', ports: ['hdmi', 'usb1', 'usb2', 'usb3'], label: 'Far-end audio' }],
    consumes: ['audio', 'video'], consumePorts: ['usb1', 'usb2', 'usb3'], sinkName: 'the far end',
  });

  // ---------- Audio processing ----------
  const mixerPorts = (phantom) => [
    ...range(4, (i) => P('ch' + i, 'Ch ' + i + ' In', 'micline', 'in', { phantom })),
    P('mainL', 'Main L', 'line', 'out'), P('mainR', 'Main R', 'line', 'out'), P('aux', 'Aux Out', 'line', 'out'),
  ];
  const allTo = (ports, media) => {
    const ins = ports.filter((p) => p.dir !== 'out').map((p) => p.id);
    const outs = ports.filter((p) => p.dir !== 'in').map((p) => p.id);
    return [{ from: ins, to: outs, media }];
  };
  const m4 = mixerPorts(true);
  def({
    type: 'mixer-4', name: '4-Ch Mixer (with phantom)', short: 'Mixer', icon: '🎚️', cat: 'Audio Processing', price: 400,
    desc: 'Analog mixer. Each channel has a mic preamp (accepts mic or line) with +48V phantom power. Main L/R and Aux outputs are line level. Any channel can feed any output.',
    ports: m4, routes: allTo(m4, ['audio']),
  });
  const mnp = mixerPorts(false);
  def({
    type: 'mixer-np', name: '4-Ch Mixer (no phantom)', short: 'Mixer', icon: '🎚️', cat: 'Audio Processing', price: 200,
    desc: 'Budget mixer with mic/line preamps — but NO phantom power. Line-level outputs.',
    ports: mnp, routes: allTo(mnp, ['audio']),
  });
  const dspU = [
    ...range(4, (i) => P('in' + i, 'Mic/Line ' + i, 'micline', 'in', { phantom: true })),
    P('out1', 'Line Out 1', 'line', 'out'), P('out2', 'Line Out 2', 'line', 'out'),
    P('usb', 'USB Audio', 'usb', 'io'),
  ];
  def({
    type: 'dsp-usb', name: 'Conferencing DSP (USB)', short: 'DSP', icon: '🧠', cat: 'Audio Processing', price: 1800,
    desc: 'DSP with 4 mic/line inputs (+48V), 2 line outputs and a USB audio port to the room PC. Provides acoustic echo cancellation (AEC) — far-end audio must pass through it to the speakers so AEC has a reference.',
    ports: dspU, routes: allTo(dspU, ['audio']),
  });
  const dspD = [
    ...range(4, (i) => P('in' + i, 'Mic/Line ' + i, 'micline', 'in', { phantom: true })),
    ...range(4, (i) => P('out' + i, 'Line Out ' + i, 'line', 'out')),
    P('usb', 'USB Audio', 'usb', 'io'),
    P('dante', 'Dante', 'net', 'io'),
  ];
  def({
    type: 'dsp-dante', name: 'Networked DSP (Dante + USB)', short: 'Dante DSP', icon: '🧠', cat: 'Audio Processing', price: 4500,
    desc: 'Conferencing DSP with AEC, 4 analog inputs (+48V), 4 line outputs, USB audio to a PC and a Dante network port for networked mics. Self-powered (no PoE needed).',
    ports: dspD, routes: allTo(dspD, ['audio']),
  });
  def({
    type: 'dante-avio', name: 'Dante AVIO Adapter (out)', short: 'AVIO', icon: '🔌', cat: 'Audio Processing', price: 250,
    desc: 'Pulls 2 channels of Dante network audio out as analog line level. Powered by PoE.',
    ports: [P('dante', 'Dante / PoE', 'net', 'io', { needsPoE: true }), P('out1', 'Line Out 1', 'line', 'out'), P('out2', 'Line Out 2', 'line', 'out')],
    routes: [{ from: ['dante'], to: ['out1', 'out2'], media: ['audio'] }],
  });
  def({
    type: 'amp-2', name: '2-Ch Power Amp (8Ω)', short: 'Amp', icon: '⚡', cat: 'Amplifiers', price: 700,
    desc: 'Line-level in, speaker-level out. In 1 drives Out 1; In 2 drives Out 2. For low-impedance (8Ω) passive speakers.',
    ports: [P('in1', 'In 1', 'line', 'in'), P('in2', 'In 2', 'line', 'in'), P('out1', 'Out 1', 'spk', 'out'), P('out2', 'Out 2', 'spk', 'out')],
    routes: [{ from: ['in1'], to: ['out1'], media: ['audio'] }, { from: ['in2'], to: ['out2'], media: ['audio'] }],
  });
  def({
    type: 'amp-70v', name: '70V Power Amp', short: '70V Amp', icon: '⚡', cat: 'Amplifiers', price: 900,
    desc: 'Line-level in, 70V distributed speaker line out. One 70V line can daisy-chain many transformer-tapped speakers over long distances.',
    ports: [P('in', 'Line In', 'line', 'in'), P('out', '70V Out', 'spk70', 'out')],
    routes: [{ from: ['in'], to: ['out'], media: ['audio'] }],
  });

  // ---------- Video ----------
  def({
    type: 'switcher', name: 'Presentation Switcher', short: 'Switcher', icon: '🔀', cat: 'Video', price: 1600,
    desc: '3 HDMI inputs. Sends the selected source out HDMI and HDBaseT at the same time, and de-embeds its audio to stereo line-level outputs.',
    ports: [
      P('in1', 'HDMI In 1', 'hdmi', 'in'), P('in2', 'HDMI In 2', 'hdmi', 'in'), P('in3', 'HDMI In 3', 'hdmi', 'in'),
      P('hdmiOut', 'HDMI Out', 'hdmi', 'out'), P('hdbtOut', 'HDBaseT Out', 'hdbt', 'out'),
      P('audioL', 'Audio Out L', 'line', 'out'), P('audioR', 'Audio Out R', 'line', 'out'),
    ],
    routes: [{ from: ['in1', 'in2', 'in3'], to: ['hdmiOut', 'hdbtOut', 'audioL', 'audioR'], media: ['audio', 'video'] }],
  });
  def({
    type: 'hdmi-da', name: '1×2 HDMI Splitter', short: 'HDMI Splitter', icon: '🔱', cat: 'Video', price: 150,
    desc: 'One HDMI in, two identical HDMI outs.',
    ports: [P('in', 'HDMI In', 'hdmi', 'in'), P('out1', 'HDMI Out 1', 'hdmi', 'out'), P('out2', 'HDMI Out 2', 'hdmi', 'out')],
    routes: [{ from: ['in'], to: ['out1', 'out2'], media: ['audio', 'video'] }],
  });
  def({
    type: 'de-embed', name: 'HDMI Audio Extractor', short: 'Extractor', icon: '🪝', cat: 'Video', price: 120,
    desc: 'Passes HDMI straight through and pulls the embedded audio out as stereo line level.',
    ports: [P('in', 'HDMI In', 'hdmi', 'in'), P('hdmiOut', 'HDMI Out', 'hdmi', 'out'), P('audioL', 'Audio Out L', 'line', 'out'), P('audioR', 'Audio Out R', 'line', 'out')],
    routes: [{ from: ['in'], to: ['hdmiOut', 'audioL', 'audioR'], media: ['audio', 'video'] }],
  });
  def({
    type: 'hdbt-tx', name: 'HDBaseT Transmitter', short: 'HDBT TX', icon: '📤', cat: 'Extension', price: 400,
    desc: 'Converts HDMI to HDBaseT on a single Cat6 cable (up to 100 m). Must run point-to-point to an HDBaseT receiver or an HDBaseT input.',
    ports: [P('in', 'HDMI In', 'hdmi', 'in'), P('hdbt', 'HDBaseT Out', 'hdbt', 'out')],
    routes: [{ from: ['in'], to: ['hdbt'], media: ['audio', 'video'] }],
  });
  def({
    type: 'hdbt-rx', name: 'HDBaseT Receiver', short: 'HDBT RX', icon: '📥', cat: 'Extension', price: 400,
    desc: 'Receives HDBaseT from a transmitter and outputs HDMI.',
    ports: [P('hdbt', 'HDBaseT In', 'hdbt', 'in'), P('hdmi', 'HDMI Out', 'hdmi', 'out')],
    routes: [{ from: ['hdbt'], to: ['hdmi'], media: ['audio', 'video'] }],
  });
  const usbExt = [P('usb', 'USB', 'usb', 'io'), P('link', 'Cat Link', 'usbx', 'io')];
  def({
    type: 'usb-ext-tx', name: 'USB Extender (device end)', short: 'USB Ext (dev)', icon: '🧷', cat: 'Extension', price: 300,
    desc: 'Half of a USB-over-Cat extender pair (up to 100 m). Plug the USB device in here, then run Cat6 point-to-point to the host end.',
    ports: usbExt, routes: [{ from: ['usb'], to: ['link'], media: ['audio', 'video'] }, { from: ['link'], to: ['usb'], media: ['audio', 'video'] }],
  });
  def({
    type: 'usb-ext-rx', name: 'USB Extender (host end)', short: 'USB Ext (host)', icon: '🧷', cat: 'Extension', price: 300,
    desc: 'Host half of a USB-over-Cat extender pair. Connects to the PC\'s USB port.',
    ports: usbExt, routes: [{ from: ['usb'], to: ['link'], media: ['audio', 'video'] }, { from: ['link'], to: ['usb'], media: ['audio', 'video'] }],
  });
  const poePorts = range(6, (i) => P('p' + i, 'Port ' + i + ' (PoE)', 'net', 'io', { poe: true }));
  def({
    type: 'poe-switch', name: 'PoE Network Switch', short: 'PoE Switch', icon: '🌐', cat: 'Network', price: 600,
    desc: '6-port gigabit switch with Power over Ethernet on every port. Dante devices on the same switch can all exchange audio.',
    ports: poePorts, routes: [{ from: ids(poePorts), to: ids(poePorts), media: ['audio'] }],
  });
  const npPorts = range(6, (i) => P('p' + i, 'Port ' + i, 'net', 'io'));
  def({
    type: 'switch-np', name: 'Basic Network Switch', short: 'Switch', icon: '🌐', cat: 'Network', price: 120,
    desc: '6-port unmanaged switch. Passes Dante audio, but provides NO PoE.',
    ports: npPorts, routes: [{ from: ids(npPorts), to: ids(npPorts), media: ['audio'] }],
  });
  const lsPorts = [
    ...range(4, (i) => P('sdi' + i, 'SDI In ' + i, 'sdi', 'in')),
    P('hdmi5', 'HDMI In 5', 'hdmi', 'in'), P('hdmi6', 'HDMI In 6', 'hdmi', 'in'),
    P('audio', 'Audio In (line)', 'line', 'in'),
    P('pgmSdi', 'PGM SDI Out', 'sdi', 'out'), P('pgmHdmi', 'PGM HDMI Out', 'hdmi', 'out'),
  ];
  def({
    type: 'live-switcher', name: 'Live Production Switcher', short: 'Live Switcher', icon: '🎬', cat: 'Video', price: 2500,
    desc: 'Cuts between 4 SDI + 2 HDMI video sources. Its line-level audio input is embedded into the program (PGM) outputs.',
    ports: lsPorts, routes: allTo(lsPorts, ['audio', 'video']),
  });
  def({
    type: 'encoder', name: 'Streaming Encoder', short: 'Encoder', icon: '📡', cat: 'Video', price: 1200,
    desc: 'Encodes the live stream / recording. Takes SDI or HDMI video (with embedded audio) and an analog line input.',
    ports: [P('sdi', 'SDI In', 'sdi', 'in'), P('hdmi', 'HDMI In', 'hdmi', 'in'), P('audio', 'Audio In (line)', 'line', 'in')],
    consumes: ['audio', 'video'], sinkName: 'the live stream',
  });

  // ---------- Destinations ----------
  def({
    type: 'display', name: 'Flat Panel Display', short: 'Display', icon: '🖥️', cat: 'Displays', price: 2000,
    desc: 'Two HDMI inputs. Built-in speakers play embedded HDMI audio.',
    ports: [P('hdmi1', 'HDMI In 1', 'hdmi', 'in'), P('hdmi2', 'HDMI In 2', 'hdmi', 'in')],
    consumes: ['audio', 'video'],
  });
  def({
    type: 'projector', name: 'Laser Projector', short: 'Projector', icon: '📽️', cat: 'Displays', price: 4000,
    desc: 'HDMI and HDBaseT inputs. Video only — treat it as having no usable speaker.',
    ports: [P('hdmi', 'HDMI In', 'hdmi', 'in'), P('hdbt', 'HDBaseT In', 'hdbt', 'in')],
    consumes: ['video'],
  });
  def({
    type: 'spk-passive', name: 'Passive Speaker (8Ω)', short: 'Speaker', icon: '🔈', cat: 'Speakers', price: 300,
    desc: 'No built-in amp. Needs speaker-level power from an 8Ω amplifier channel.',
    ports: [P('in', 'Speaker In', 'spk', 'in')],
    consumes: ['audio'],
  });
  def({
    type: 'spk-powered', name: 'Powered Speaker', short: 'Powered Spkr', icon: '🔊', cat: 'Speakers', price: 600,
    desc: 'Built-in amplifier. Line-level input, plus a Thru output to daisy-chain another powered speaker.',
    ports: [P('in', 'Line In', 'line', 'in'), P('thru', 'Thru Out', 'line', 'out')],
    routes: [{ from: ['in'], to: ['thru'], media: ['audio'] }],
    consumes: ['audio'],
  });
  def({
    type: 'ceil-70v', name: 'Ceiling Speaker (70V)', short: 'Ceiling Spkr', icon: '⭕', cat: 'Speakers', price: 150,
    desc: 'Transformer-tapped ceiling speaker for 70V distributed systems. Loop Out daisy-chains the 70V line to the next speaker.',
    ports: [P('in', '70V In', 'spk70', 'in'), P('loop', 'Loop Out', 'spk70', 'out')],
    routes: [{ from: ['in'], to: ['loop'], media: ['audio'] }],
    consumes: ['audio'],
  });
  def({
    type: 'als', name: 'Assistive Listening TX', short: 'ALS', icon: '🦻', cat: 'Speakers', price: 1100,
    desc: 'Assistive listening transmitter — broadcasts program audio to hearing-assist receivers (an ADA requirement in many venues). Line-level input.',
    ports: [P('in', 'Line In', 'line', 'in')],
    consumes: ['audio'],
  });

  SF.DEVICES = D;
  SF.CAT_ORDER = ['Sources', 'Microphones', 'Cameras', 'Conferencing', 'Audio Processing', 'Amplifiers', 'Video', 'Extension', 'Network', 'Displays', 'Speakers'];
  SF.MIC_TYPES = ['wired-mic', 'wireless-mic', 'gooseneck', 'boundary-mic', 'ceiling-mic'];
  SF.SPEAKER_TYPES = ['spk-passive', 'spk-powered', 'ceil-70v'];
  SF.CAM_TYPES = ['usb-cam', 'ptz-cam'];
})();

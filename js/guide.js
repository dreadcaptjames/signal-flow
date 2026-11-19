/* Field guide (reference) and how-to-play text */
(function () {
  const SF = (window.SF = window.SF || {});

  SF.GUIDE = [
    {
      title: 'Signal levels: mic, line, speaker',
      body: `<p>Analog audio comes in three very different strengths:</p>
      <ul>
        <li><b>Mic level</b> (≈ −60 to −40 dBu): tiny. Must go into a <b>preamp</b> (mixer/DSP mic input) to be raised to line level.</li>
        <li><b>Line level</b> (≈ +4 dBu): the "working" level between mixers, DSPs, amps, powered speakers, recorders and ALS transmitters.</li>
        <li><b>Speaker level</b>: amplified power — many volts. Only goes from an <b>amp output</b> to a <b>passive speaker</b>.</li>
      </ul>
      <p>Mic → line input = almost silent. Line → passive speaker = silent (no power). Speaker → line input = <b>damage</b>.</p>`,
    },
    {
      title: 'Phantom power (+48V)',
      body: `<p><b>Condenser</b> mics (goosenecks, boundary mics, most choir/overhead mics) need +48V phantom power, supplied down the XLR cable by the input they plug into. <b>Dynamic</b> mics don't need it. A mixer with no phantom = a dead condenser mic.</p>`,
    },
    {
      title: 'Amplifiers, passive & powered speakers',
      body: `<p><b>Passive</b> speakers have no amp inside — they need an external power amp channel. <b>Powered</b> (active) speakers have their own amp and take line level directly, often with a <b>Thru</b> jack to daisy-chain more.</p>
      <p>On a multi-channel amp, each input feeds its own output: In 1 → Out 1, In 2 → Out 2.</p>`,
    },
    {
      title: '70V distributed systems',
      body: `<p>For many speakers over long distances (ceilings, retail, schools), a <b>70V amplifier</b> drives a high-voltage, low-current line. Each <b>70V speaker</b> has a step-down transformer and taps; you daisy-chain them in parallel (In → Loop Out → next In).</p>
      <p>Don't mix systems: an 8Ω amp can't drive a 70V line, and a 70V line will destroy an 8Ω speaker with no transformer. Low-impedance (8Ω) runs also lose power quickly over long wire.</p>`,
    },
    {
      title: 'HDMI and distance',
      body: `<p>HDMI carries video <i>and</i> embedded audio, but passive HDMI cables are only dependable to roughly <b>7–10 m</b> at high resolutions. (This game uses 10 m.) For longer runs, use <b>HDBaseT</b> or AV-over-IP.</p>
      <p>An <b>audio extractor / de-embedder</b> (or a switcher's audio output) pulls the HDMI audio out as line level so it can go to a DSP or amp.</p>`,
    },
    {
      title: 'HDBaseT',
      body: `<p>Sends HDMI (plus audio, often control and power) up to <b>100 m</b> over one Cat6 cable. It uses an RJ45 jack but it is <b>not Ethernet</b>: it must run point-to-point from a transmitter (or HDBaseT output) to a receiver (or HDBaseT input on a display/projector). Never plug it into a network switch.</p>`,
    },
    {
      title: 'SDI',
      body: `<p>Broadcast-style video on coax with BNC connectors. 3G-SDI runs ~100 m, locks on, and carries embedded audio. The standard for production cameras, live switchers and encoders.</p>`,
    },
    {
      title: 'USB conferencing & extenders',
      body: `<p>In a Teams/Zoom room the <b>Room PC</b> is the codec. USB cameras and USB audio (from a DSP) plug into it; whatever goes in is sent to the <b>far end</b>. A DSP's USB link is two-way: room mics go up, far-end audio comes back down to the speakers.</p>
      <p>USB 2/3 is only good to about <b>5 m</b>. Use a <b>USB-over-Cat extender pair</b> for longer runs (point-to-point, not through a switch).</p>`,
    },
    {
      title: 'Echo cancellation (AEC)',
      body: `<p>When far-end audio plays in the room, the mics pick it up and send it back — the far end hears themselves. A conferencing DSP removes that echo, but only if the far-end audio it plays to the speakers <b>passes through it</b> (the AEC "reference"). That's why far-end audio should go PC → DSP → amp/speakers, not PC → display speakers.</p>`,
    },
    {
      title: 'Dante / AV-over-IP and PoE',
      body: `<p><b>Dante</b> sends many channels of audio over a standard Ethernet network. Dante devices connect to a <b>network switch</b>; any Dante device on that network can route audio to any other (in a real system you set routes in Dante Controller).</p>
      <p>Many Dante endpoints (ceiling mics, small adapters) are powered by <b>PoE</b> — Power over Ethernet — from the switch port. A non-PoE switch passes data but leaves them dark.</p>`,
    },
    {
      title: 'Assistive listening (ALS)',
      body: `<p>Many public venues are legally required to provide assistive listening for people with hearing loss. The ALS transmitter needs a clean <b>line-level</b> feed of program audio — usually its own mixer/DSP output.</p>`,
    },
    {
      title: 'Reading this game',
      body: `<p>Inputs are on the <b>left</b> of each device, outputs on the <b>right</b>. <b>⇄</b> marks two-way ports (USB, network). Port colors:</p><div id="guide-legend"></div>
      <p>Cable length = the distance between the zones the two devices sit in (see the Site Survey). Devices in the same zone are a couple of meters apart.</p>`,
    },
  ];

  SF.HOWTO = `
    <ol class="howto">
      <li><b>Read the brief</b> and the requirement checklist. Check the <b>Site Survey</b> for distances between zones.</li>
      <li><b>Add equipment</b> from the Equipment list — drag it onto a zone, or click <b>+</b>. Click any item to read about it first.</li>
      <li><b>Wire it</b>: drag from one port to another (or click a port, then click another). Outputs (right side) go to inputs (left side). Each jack takes one cable.</li>
      <li><b>Move</b> devices by dragging their title bar — the zone they sit in sets cable length.</li>
      <li><b>Inspect</b>: click a device or cable to see what it is and which signals are present.</li>
      <li>Press <b>▶ Test System</b>. Pass every requirement to earn stars: ★ pass, ★★ no hints, ★★★ no hints and at or under par cost.</li>
    </ol>
    <h4>Difficulty</h4>
    <ul class="howto">
      <li><b>Novice</b> — compatible ports glow, wrong connections are blocked and explained, live signal feedback.</li>
      <li><b>Intermediate</b> — ports still glow and feedback is live, but you're allowed to make mistakes.</li>
      <li><b>Advanced</b> — no glow, no live feedback. You find out when you test. Distances really matter.</li>
      <li><b>Pro</b> — like Advanced, with tight budgets and multi-fault troubleshooting tickets.</li>
    </ul>
    <h4>On a phone or tablet</h4>
    <ul class="howto">
      <li>Use the tabs at the bottom: <b>System</b> (the wiring canvas), <b>Brief</b>, <b>Gear</b> and <b>Checks</b>.</li>
      <li>Tap a port, then tap the port you want to connect it to.</li>
      <li>Drag empty space to pan; use <b>− ⤢ +</b> to zoom. Drag a device by its title bar.</li>
      <li>Tap a device or cable, then <b>Details</b> or <b>Remove</b> in the bar that pops up.</li>
    </ul>
    <p class="muted">Desktop shortcuts: <kbd>Ctrl</kbd>+scroll zooms · <kbd>Delete</kbd> removes the selected device/cable · <kbd>Esc</kbd> cancels a cable in progress.</p>`;
})();

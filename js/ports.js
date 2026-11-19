/* Port / signal types and connection rules */
(function () {
  const SF = (window.SF = window.SF || {});

  SF.PORT_TYPES = {
    mic:     { name: 'Mic level',          family: 'analog', media: ['audio'],          color: '#5aa9ff', maxLen: 100, cable: 'XLR mic cable' },
    line:    { name: 'Line level',         family: 'analog', media: ['audio'],          color: '#4cd18a', maxLen: 100, cable: 'Balanced line cable' },
    micline: { name: 'Mic/Line input',     family: 'analog', media: ['audio'],          color: '#3cc9c0', maxLen: 100, cable: 'XLR cable' },
    spk:     { name: 'Speaker level (8Ω)', family: 'analog', media: ['audio'],          color: '#ff9f43', maxLen: 50,  cable: 'Speaker wire' },
    spk70:   { name: '70V speaker line',   family: 'analog', media: ['audio'],          color: '#ff6b5a', maxLen: 300, cable: '70V speaker wire' },
    hdmi:    { name: 'HDMI',               family: 'hdmi',   media: ['video', 'audio'], color: '#b57bff', maxLen: 10,  cable: 'HDMI cable' },
    hdbt:    { name: 'HDBaseT',            family: 'rj45',   media: ['video', 'audio'], color: '#ff6fb5', maxLen: 100, cable: 'Cat6 (HDBaseT)' },
    sdi:     { name: 'SDI',                family: 'sdi',    media: ['video', 'audio'], color: '#ffd24d', maxLen: 100, cable: 'Coax / BNC' },
    net:     { name: 'Network / Dante',    family: 'rj45',   media: ['audio'],          color: '#3fd0e8', maxLen: 100, cable: 'Cat6 (Ethernet)' },
    usb:     { name: 'USB',                family: 'usb',    media: ['video', 'audio'], color: '#c3ccd6', maxLen: 5,   cable: 'USB cable' },
    usbx:    { name: 'USB-over-Cat link',  family: 'rj45',   media: ['video', 'audio'], color: '#8fa3b8', maxLen: 100, cable: 'Cat6 (USB extender link)' },
  };

  SF.CONNECTOR = { analog: 'XLR / Phoenix / speaker terminal', hdmi: 'HDMI', rj45: 'RJ45', sdi: 'BNC', usb: 'USB' };

  const LOW_IN = ['mic', 'line', 'micline'];
  const SPK = ['spk', 'spk70'];

  /**
   * Check a link from source-side port `a` (out/io) to destination-side port `b` (in/io).
   * Returns { status: 'ok' | 'bad' | 'danger' | 'invalid', msg }
   *  invalid = physically impossible (different connector family) — always blocked.
   *  bad     = plugs in, but the signal won't work.
   *  danger  = plugs in and can damage equipment.
   */
  SF.checkLink = function (a, b) {
    const A = SF.PORT_TYPES[a.type], B = SF.PORT_TYPES[b.type];
    if (A.family !== B.family) {
      return { status: 'invalid', msg: `${A.name} (${SF.CONNECTOR[A.family]}) can't physically plug into ${B.name} (${SF.CONNECTOR[B.family]}).` };
    }
    const t1 = a.type, t2 = b.type;
    if (A.family === 'analog') {
      if (SPK.includes(t1) && LOW_IN.includes(t2))
        return { status: 'danger', msg: 'Speaker-level amplifier output into a low-level (mic/line) input! That much voltage can destroy the input stage.' };
      if (t1 === 'spk70' && t2 === 'spk')
        return { status: 'danger', msg: '70V line into an 8Ω speaker with no transformer — you will cook the speaker (and likely trip the amp).' };
      if (t1 === 'spk' && t2 === 'spk70')
        return { status: 'bad', msg: 'Low-impedance (8Ω) amp output into 70V transformer speakers. The amp can\'t produce a 70V line — level will be tiny and distorted. Use a 70V amplifier.' };
      if ((t1 === 'mic' || t1 === 'line') && SPK.includes(t2))
        return { status: 'bad', msg: 'Passive speakers need speaker-level power. A mic/line signal must go through a power amplifier first.' };
      if (t1 === 'mic' && t2 === 'line')
        return { status: 'bad', msg: 'Mic-level signal into a line-level input — it will be barely audible. A mic needs a preamp first (a mixer or DSP mic input).' };
      if (t1 === 'line' && t2 === 'mic')
        return { status: 'bad', msg: 'Line-level signal into a mic-only input — it will be far too hot and distort.' };
      if (a.needsPhantom && (t2 === 'micline' || t2 === 'mic') && !b.phantom)
        return { status: 'bad', msg: 'Condenser mic needs +48V phantom power, and this input doesn\'t provide it. No power = no signal.' };
      return { status: 'ok', msg: '' };
    }
    if (A.family === 'rj45' && t1 !== t2) {
      const names = [t1, t2];
      if (names.includes('hdbt'))
        return { status: 'bad', msg: 'HDBaseT uses Cat cable and an RJ45 jack, but it is NOT Ethernet. It must run point-to-point to an HDBaseT receiver (or an HDBaseT-equipped display/projector).' };
      if (names.includes('usbx'))
        return { status: 'bad', msg: 'A USB-over-Cat extender link is point-to-point. It must go straight to the other half of the extender pair, not a switch or other port.' };
    }
    return { status: 'ok', msg: '' };
  };

  SF.lengthAdvice = function (type) {
    switch (type) {
      case 'hdmi': return 'For long HDMI runs use HDBaseT (a transmitter/receiver pair, or an HDBaseT output into an HDBaseT input).';
      case 'usb': return 'Use a USB-over-Cat extender pair (device end + host end).';
      case 'spk': return 'Long 8Ω speaker runs lose too much power in the wire — move the amp closer or use a 70V system.';
      default: return 'Shorten the run or use an extension technology.';
    }
  };
})();

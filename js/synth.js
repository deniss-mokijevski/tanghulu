/* =====================================================================
   synth.js — sound effects made in code.

   These play when there is no recorded file in assets/sounds/fx/.
   Each effect is a few short beeps or noise bursts. The pitch is a
   little random every time, so repeated crunches don't sound robotic.
   ===================================================================== */

var Synth = {
  noise: null, // one second of random "shhh" noise, made once and reused

  // ---- Building blocks ------------------------------------------------

  // A short musical tone that fades out.
  //   freq = start pitch, to = end pitch (optional), start = delay in seconds,
  //   length = seconds, volume = 0..1, type = "sine" | "triangle" | "square"
  tone: function (ctx, out, o) {
    var t = ctx.currentTime + (o.start || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.length);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.volume || 0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + o.length + 0.05);
  },

  // A short burst of filtered noise (crunchy, splashy or whooshy).
  //   freq = filter pitch, to = end filter pitch, q = how narrow,
  //   filter = "bandpass" | "lowpass" | "highpass"
  burst: function (ctx, out, o) {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var data = this.noise.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    var t = ctx.currentTime + (o.start || 0);
    var src = ctx.createBufferSource();
    src.buffer = this.noise;
    var filter = ctx.createBiquadFilter();
    filter.type = o.filter || "bandpass";
    filter.frequency.setValueAtTime(o.freq, t);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t + o.length);
    filter.Q.value = o.q || 1;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.volume || 0.5, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.length);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.length + 0.05);
  },

  // ---- The effects ----------------------------------------------------

  // Biting into sugar-coated fruit: 3–5 crackly bursts, random pitch.
  crunch: function (ctx, out) {
    var bursts = 3 + Math.floor(Math.random() * 3);
    var time = 0;
    for (var i = 0; i < bursts; i++) {
      this.burst(ctx, out, {
        start: time,
        length: randomBetween(0.03, 0.07),
        volume: randomBetween(0.5, 0.9),
        freq: randomBetween(1200, 3800),
        q: randomBetween(0.8, 2.5),
      });
      time += randomBetween(0.035, 0.08);
    }
    this.tone(ctx, out, { freq: randomBetween(140, 190), to: 60, length: 0.08, volume: 0.3 });
  },

  // The thin sugar shell cracks like glass (layered over the crunch).
  crack: function (ctx, out) {
    this.burst(ctx, out, { freq: randomBetween(5000, 7000), q: 3, filter: "bandpass", length: 0.035, volume: 0.6 });
    this.tone(ctx, out, { freq: randomBetween(2600, 3400), to: randomBetween(1800, 2200), length: 0.12, volume: 0.12, type: "triangle" });
    this.tone(ctx, out, { start: 0.02, freq: randomBetween(4200, 5200), length: 0.08, volume: 0.06, type: "sine" });
  },

  // Syrup bubbling in the pot: "blub, blub".
  bubble: function (ctx, out) {
    for (var i = 0; i < 3; i++) {
      this.tone(ctx, out, {
        start: i * randomBetween(0.08, 0.14), freq: randomBetween(160, 240), to: randomBetween(420, 620),
        length: 0.07, volume: 0.3,
      });
    }
  },

  // The syrup is golden and ready: a bright little bell.
  pling: function (ctx, out) {
    this.tone(ctx, out, { freq: 1760, length: 0.7, volume: 0.16, type: "triangle" });
    this.tone(ctx, out, { start: 0.06, freq: 2637, length: 0.6, volume: 0.1, type: "triangle" });
  },

  // The sugar wing snaps off: a sharp, glassy "klõps".
  snap: function (ctx, out) {
    this.burst(ctx, out, { freq: 4500, q: 2, filter: "highpass", length: 0.05, volume: 0.6 });
    this.tone(ctx, out, { freq: 3800, to: 2900, length: 0.18, volume: 0.12, type: "triangle" });
    this.tone(ctx, out, { start: 0.05, freq: 5200, length: 0.12, volume: 0.06 });
  },

  // A closed bowl's lid rattles: two quick little china "tink"s.
  clink: function (ctx, out) {
    for (var i = 0; i < 2; i++) {
      var pitch = randomBetween(2500, 2900) + i * 380;
      this.tone(ctx, out, { start: i * 0.09, freq: pitch, to: pitch * 0.97, length: 0.16, volume: 0.13, type: "triangle" });
      this.burst(ctx, out, { start: i * 0.09, freq: 6000, q: 3, filter: "bandpass", length: 0.03, volume: 0.25 });
    }
  },

  // A bowl's lid lifts off: a soft "plop", then the china rings.
  lid: function (ctx, out) {
    this.tone(ctx, out, { freq: 300, to: 620, length: 0.12, volume: 0.25 });
    this.tone(ctx, out, { start: 0.1, freq: 2093, length: 0.5, volume: 0.1, type: "triangle" });
    this.tone(ctx, out, { start: 0.14, freq: 3136, length: 0.4, volume: 0.06, type: "triangle" });
  },

  // Food jumps onto the stick.
  pop: function (ctx, out) {
    this.tone(ctx, out, {
      freq: randomBetween(380, 460), to: randomBetween(900, 1150),
      length: 0.1, volume: 0.35,
    });
  },

  // Stick goes into the syrup: bubbly bloops.
  dip: function (ctx, out) {
    for (var i = 0; i < 3; i++) {
      this.tone(ctx, out, {
        start: i * 0.12, freq: randomBetween(200, 260), to: randomBetween(80, 110),
        length: 0.16, volume: 0.35,
      });
    }
    this.burst(ctx, out, { freq: 500, to: 200, filter: "lowpass", length: 0.45, volume: 0.25 });
  },

  // The shine sweep on the glossy stick.
  shine: function (ctx, out) {
    [1568, 2093, 2637, 3136].forEach(function (freq, i) {
      Synth.tone(ctx, out, { start: i * 0.06, freq: freq, length: 0.35, volume: 0.1, type: "triangle" });
    });
  },

  // Little twinkles (sparkles around the jar).
  sparkle: function (ctx, out) {
    var notes = [1319, 1568, 1760, 2093, 2349, 2637];
    for (var i = 0; i < 6; i++) {
      this.tone(ctx, out, {
        start: i * 0.07, freq: randomItem(notes), length: 0.25, volume: 0.08, type: "triangle",
      });
    }
  },

  // The jar lock pops open.
  unlock: function (ctx, out) {
    this.burst(ctx, out, { freq: 3000, q: 4, length: 0.04, volume: 0.5 });
    [523, 659, 784, 1047].forEach(function (freq, i) {
      Synth.tone(ctx, out, { start: 0.05 + i * 0.08, freq: freq, length: 0.3, volume: 0.2, type: "triangle" });
    });
  },

  // A happy little fanfare (finished stick, new place).
  cheer: function (ctx, out) {
    [523, 659, 784].forEach(function (freq, i) {
      Synth.tone(ctx, out, { start: i * 0.11, freq: freq, length: 0.2, volume: 0.2, type: "triangle" });
    });
    [523, 659, 784, 1047].forEach(function (freq) {
      Synth.tone(ctx, out, { start: 0.38, freq: freq, length: 0.8, volume: 0.12, type: "triangle" });
    });
  },

  // Something flies across the screen.
  whoosh: function (ctx, out) {
    this.burst(ctx, out, { freq: 300, to: 2500, q: 1.5, length: 0.45, volume: 0.3 });
  },

  // A soft, friendly "boing" (stick is full, or "do this first").
  boing: function (ctx, out) {
    this.tone(ctx, out, { freq: 330, to: 180, length: 0.22, volume: 0.25 });
    this.tone(ctx, out, { start: 0.12, freq: 260, to: 300, length: 0.18, volume: 0.15 });
  },

  // Sour lemon face: a wobbly sliding sound.
  sour: function (ctx, out) {
    for (var i = 0; i < 4; i++) {
      this.tone(ctx, out, {
        start: i * 0.09, freq: i % 2 ? 420 : 560, to: i % 2 ? 560 : 420,
        length: 0.1, volume: 0.15, type: "triangle",
      });
    }
  },

  // A star appears.
  star: function (ctx, out) {
    this.tone(ctx, out, { freq: 1568, length: 0.18, volume: 0.15, type: "triangle" });
    this.tone(ctx, out, { start: 0.1, freq: 2349, length: 0.4, volume: 0.15, type: "triangle" });
  },
};

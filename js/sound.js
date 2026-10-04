/* =====================================================================
   sound.js — everything you hear.

   Every sound first looks for a recorded file. If there is none, it
   falls back to something that always works:
     letter sounds  assets/sounds/letters/s.mp3   → browser voice "s, like strawberry"
     food words     assets/sounds/words/apple.mp3 → browser voice "apple"
     sentences      assets/sounds/voice/yay.mp3   → browser voice (text from config.js)
     effects        assets/sounds/fx/crunch.mp3   → made in code (synth.js)
     music          assets/music/theme.mp3        → no music
   Files can be .mp3 or .m4a.
   ===================================================================== */

var Sound = {
  ctx: null,          // the Web Audio "mixer" (plays recordings and effects)
  master: null,       // overall volume knob
  musicGain: null,    // music volume knob (quiet)
  volume: 0.8,        // 0 … 1, set from the parent screen
  musicOn: true,
  voiceName: "",      // browser voice picked on the parent screen ("" = automatic)

  clips: {},          // "sounds/letters/s" → Promise of the recording (or null)
  found: {},          // "sounds/letters/s" → the recording once we know (or null)
  voiceToken: 0,      // goes up each time a new sentence starts; older ones stop
  voiceStop: null,    // stops the sentence that is playing right now
  speaking: false,
  voice: null,        // chosen browser voice
  utterances: [],     // keeps sentences alive until they finish (Safari needs this)

  FX: ["pop", "crunch", "dip", "shine", "sparkle", "unlock", "cheer",
       "whoosh", "boing", "sour", "star"],

  /* -------------------------------------------------------------------
     Setup (runs when the page opens — no sound yet)
     ------------------------------------------------------------------- */
  init: function () {
    var self = this;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.25; // music stays quiet
        this.musicGain.connect(this.master);
      } catch (error) {
        this.ctx = null;
      }
    }

    // Browser voices arrive a moment after the page loads.
    if (window.speechSynthesis) {
      this.loadVoices();
      if (speechSynthesis.addEventListener) {
        speechSynthesis.addEventListener("voiceschanged", function () { self.loadVoices(); });
      } else {
        speechSynthesis.onvoiceschanged = function () { self.loadVoices(); };
      }
    }

    // Tablets sometimes pause sound (after switching apps, a call…).
    // Any touch wakes it up again.
    ["touchend", "pointerup", "click", "keydown"].forEach(function (name) {
      document.addEventListener(name, function () { self.wake(); }, true);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        self.silence(); // stop talking, including the rest of a sentence
        if (self.musicEl) self.musicEl.pause();
      } else {
        self.wake();
      }
    });
  },

  // Called by the first ▶ tap. Browsers only allow sound after a tap.
  unlock: function () {
    if (navigator.audioSession) {
      // Newer iPads: play even when the tablet is on "silent".
      try { navigator.audioSession.type = "playback"; } catch (error) { /* ignore */ }
    }
    if (this.ctx) {
      this.ctx.resume();
      // Play one silent moment (older iPads need this).
      var silent = this.ctx.createBuffer(1, 1, 22050);
      var source = this.ctx.createBufferSource();
      source.buffer = silent;
      source.connect(this.ctx.destination);
      source.start(0);
    }
    if (window.speechSynthesis) {
      // The iPad wants the first spoken sentence to start from a tap.
      var hello = new SpeechSynthesisUtterance(" ");
      hello.volume = 0;
      speechSynthesis.speak(hello);
    }
    this.prepareMusic();
    this.unlocked = true;
  },

  // Make sure sound is running (after the tablet paused it).
  wake: function () {
    if (!this.unlocked) return;
    if (this.ctx && this.ctx.state !== "running") {
      try { this.ctx.resume(); } catch (error) { /* ignore */ }
    }
    this.updateMusic();
  },

  setVolume: function (volume) {
    this.volume = volume;
    if (this.master) this.master.gain.value = volume;
    this.updateMusic();
  },

  setMusic: function (on) {
    this.musicOn = on;
    this.updateMusic();
  },

  /* -------------------------------------------------------------------
     Finding recordings
     ------------------------------------------------------------------- */

  // Look for a recording, e.g. find("sounds/letters/s") tries s.mp3 then s.m4a.
  find: function (base) {
    var self = this;
    if (!this.clips[base]) {
      this.clips[base] = this.tryTypes(base, ["mp3", "m4a"], 0).then(function (clip) {
        self.found[base] = clip;
        return clip;
      });
    }
    return this.clips[base];
  },

  // Like find(), but don't wait longer than a moment (then use the fallback).
  findQuick: function (base) {
    if (base in this.found) return Promise.resolve(this.found[base]);
    return Promise.race([this.find(base), wait(1500).then(function () { return null; })]);
  },

  tryTypes: function (base, types, index) {
    if (index >= types.length) return Promise.resolve(null);
    var self = this;
    var url = "assets/" + base.split("/").map(encodeURIComponent).join("/") + "." + types[index];
    var isMusic = base.indexOf("music/") === 0;
    return this.loadClip(url, isMusic).then(function (clip) {
      return clip || self.tryTypes(base, types, index + 1);
    });
  },

  // Load one sound file. Gives back a clip, or null if it does not exist.
  loadClip: function (url, isMusic) {
    var self = this;
    var fromFile = location.protocol === "file:";
    if (fromFile || !window.fetch || !this.ctx) return this.probeWithElement(url);

    return fetch(url, { method: isMusic ? "HEAD" : "GET" }).then(function (response) {
      var type = response.headers.get("content-type") || "";
      if (!response.ok || type.indexOf("text/html") === 0) return null;
      if (isMusic) return { url: url }; // music streams, no need to load it all now
      return response.arrayBuffer()
        .then(function (data) { return self.decode(data); })
        .then(function (buffer) { return buffer ? { url: url, buffer: buffer } : null; });
    }).catch(function () {
      return self.probeWithElement(url);
    });
  },

  // Turn the downloaded file into playable sound.
  decode: function (data) {
    var ctx = this.ctx;
    return new Promise(function (resolve) {
      try {
        var result = ctx.decodeAudioData(data,
          function (buffer) { resolve(buffer); },
          function () { resolve(null); });
        if (result && result.catch) result.catch(function () { resolve(null); });
      } catch (error) {
        resolve(null);
      }
    });
  },

  // Used when the game is opened straight from a file (no web server):
  // ask an <audio> element whether the file can be played.
  probeWithElement: function (url) {
    return new Promise(function (resolve) {
      var audio = new Audio();
      var finished = false;
      function done(ok) {
        if (finished) return;
        finished = true;
        audio.removeAttribute("src");
        resolve(ok ? { url: url } : null);
      }
      audio.addEventListener("loadedmetadata", function () { done(true); });
      audio.addEventListener("canplaythrough", function () { done(true); });
      audio.addEventListener("error", function () { done(false); });
      setTimeout(function () { done(false); }, 4000);
      audio.preload = "auto";
      audio.src = url;
      audio.load();
    });
  },

  // Start looking for every recording right away.
  preloadAll: function () {
    var self = this;
    var names = [];
    Object.keys(CONFIG.phrases).forEach(function (key) { names.push("sounds/voice/" + key); });
    levelLetters().forEach(function (letter) { names.push("sounds/letters/" + letter); });
    allFoods().forEach(function (food) { names.push("sounds/words/" + food.id); });
    CONFIG.levels.forEach(function (level) { names.push("sounds/voice/place-" + level.id); });
    this.FX.forEach(function (name) { names.push("sounds/fx/" + name); });
    names.push("music/theme");

    // Look for 4 files at a time so we don't flood the tablet.
    var next = 0;
    function worker() {
      if (next >= names.length) return Promise.resolve();
      var name = names[next++];
      return self.find(name).then(worker);
    }
    return Promise.all([worker(), worker(), worker(), worker()]);
  },

  /* -------------------------------------------------------------------
     Playing
     ------------------------------------------------------------------- */

  // Play a recording. Gives back { promise (ends when done), stop() }.
  playClip: function (clip, options) {
    options = options || {};
    var gainValue = options.gain === undefined ? 1 : options.gain;
    var finish;
    var promise = new Promise(function (resolve) { finish = resolve; });

    if (clip.buffer && this.ctx) {
      var source = this.ctx.createBufferSource();
      source.buffer = clip.buffer;
      if (options.rate) source.playbackRate.value = options.rate;
      var gain = this.ctx.createGain();
      gain.gain.value = gainValue;
      source.connect(gain);
      gain.connect(this.master);
      source.onended = function () { finish(); };
      setTimeout(finish, (clip.buffer.duration / (options.rate || 1)) * 1000 + 500);
      source.start(0);
      return {
        promise: promise,
        stop: function () { try { source.stop(); } catch (error) { /* ignore */ } finish(); },
      };
    }

    // Opened from a file: use a plain <audio> element.
    var audio = new Audio(clip.url);
    audio.volume = Math.min(1, this.volume * gainValue);
    if (options.rate) audio.playbackRate = options.rate;
    audio.onended = function () { finish(); };
    audio.onerror = function () { finish(); };
    var playing = audio.play();
    if (playing && playing.catch) playing.catch(function () { finish(); });
    setTimeout(finish, 20000);
    return {
      promise: promise,
      stop: function () { audio.pause(); finish(); },
    };
  },

  // Play a sound effect right away (recording if there is one, else made in code).
  fx: function (name) {
    if (!this.unlocked) return;
    var clip = this.found["sounds/fx/" + name];
    if (clip) {
      var rate = name === "crunch" ? randomBetween(0.9, 1.12) : 1; // a bit different every bite
      this.playClip(clip, { rate: rate, gain: 0.9 });
      return;
    }
    if (this.ctx && Synth[name]) {
      try { Synth[name](this.ctx, this.master); } catch (error) { /* ignore */ }
    }
  },

  /* -------------------------------------------------------------------
     Talking
     A sentence is a list of "parts". Each part has a recording to look
     for (file) and words for the browser voice if there is none (text).
     ------------------------------------------------------------------- */

  // The letter riddle: recording "sss", or the voice says "s, like strawberry".
  letterPart: function (food) {
    return {
      file: "sounds/letters/" + food.letter,
      text: fillIn(CONFIG.letterSpeech, { letter: food.letter, word: food.word }),
    };
  },

  // Just the letter sound (recording "sss", or the voice says "s").
  letterOnlyPart: function (food) {
    return { file: "sounds/letters/" + food.letter, text: food.letter };
  },

  // The food's name: recording, or the voice says "strawberry".
  wordPart: function (food) {
    return { file: "sounds/words/" + food.id, text: food.word };
  },

  // A sentence from config.js "phrases".
  phrasePart: function (key) {
    return { file: "sounds/voice/" + key, text: CONFIG.phrases[key] || "" };
  },

  // What is said when she arrives in a new place ("Welcome to the beach!").
  placePart: function (level) {
    return { file: "sounds/voice/place-" + level.id, text: level.say || "" };
  },

  // Say the parts one after another. Starting a new sentence stops
  // the old one. Gives back a promise that ends when everything was said.
  // While the game is paused (parent screen, tablet upright) it stays
  // quiet, unless "always" is true (the parent screen's test button).
  speak: async function (parts, always) {
    var token = ++this.voiceToken;
    this.stopVoice();
    if (!always && Game.paused()) {
      this.speaking = false;
      return false;
    }
    this.speaking = true;
    for (var i = 0; i < parts.length; i++) {
      // Tablet turned upright in the middle of a sentence: stop here.
      if (!always && Game.paused()) {
        if (token === this.voiceToken) this.speaking = false;
        return false;
      }
      var part = parts[i];
      var clip = part.file ? await this.findQuick(part.file) : null;
      if (token !== this.voiceToken) return false;
      var playing = clip ? this.playClip(clip) : await this.speakText(part.text);
      if (token !== this.voiceToken) { playing.stop(); return false; }
      this.voiceStop = playing.stop;
      await playing.promise;
      if (token !== this.voiceToken) return false;
      if (i < parts.length - 1) await wait(part.pause || 200);
    }
    if (token === this.voiceToken) {
      this.speaking = false;
      this.voiceStop = null;
    }
    return true;
  },

  // Stop whatever is being said right now.
  stopVoice: function () {
    if (this.voiceStop) {
      var stop = this.voiceStop;
      this.voiceStop = null;
      stop();
    }
    if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) {
      speechSynthesis.cancel();
    }
    this.speaking = false;
  },

  // Stop talking and forget any sentence that was about to start.
  silence: function () {
    this.voiceToken++;
    this.stopVoice();
  },

  // Let the browser voice say some words.
  speakText: async function (text) {
    var synth = window.speechSynthesis;
    var finish;
    var promise = new Promise(function (resolve) { finish = resolve; });
    var nothing = { promise: wait(300), stop: function () {} };
    if (!synth || !window.SpeechSynthesisUtterance || !text || !String(text).trim()) {
      return nothing;
    }
    if (synth.speaking || synth.pending) {
      synth.cancel();
      await wait(80); // Safari needs a breath between stop and start
    }
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageTag();
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = CONFIG.speechRate || 1;
    utterance.pitch = CONFIG.speechPitch || 1;
    utterance.volume = this.volume;
    var self = this;
    utterance.onend = function () { finish(); };
    utterance.onerror = function () { finish(); };
    this.utterances.push(utterance);
    promise.then(function () {
      self.utterances = self.utterances.filter(function (u) { return u !== utterance; });
    });
    // Some tablets forget to say "I'm done", so we also guess how long it takes.
    setTimeout(finish, 1500 + String(text).length * 130 / (CONFIG.speechRate || 1));
    synth.speak(utterance);
    return {
      promise: promise,
      stop: function () { synth.cancel(); finish(); },
    };
  },

  /* -------------------------------------------------------------------
     Choosing the browser voice
     ------------------------------------------------------------------- */
  loadVoices: function () {
    this.voices = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    this.voice = this.pickVoice();
  },

  // Voices that sound silly or robotic (Apple's joke voices and old voices).
  SILLY_VOICES: ["albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
    "deranged", "good news", "hysterical", "jester", "organ", "superstar", "trinoids",
    "whisper", "wobble", "zarvox", "fred", "ralph", "junior", "kathy", "grandma",
    "grandpa", "rocko", "eddy", "flo", "reed", "sandy", "shelley", "princess"],

  // The voices that speak the game's language, best first.
  voicesForLanguage: function () {
    var wanted = languageTag().toLowerCase();
    var short = wanted.split("-")[0];
    var self = this;
    return this.voices
      .map(function (voice) {
        var lang = String(voice.lang).toLowerCase().replace("_", "-");
        var name = String(voice.name).toLowerCase();
        var score = 0;
        if (lang === wanted) score += 10;
        else if (lang.split("-")[0] === short) score += 5;
        else return null;
        if (self.SILLY_VOICES.some(function (silly) { return name.indexOf(silly) === 0; })) score -= 20;
        if (/enhanced|premium|natural|neural/.test(name)) score += 4;
        if (/samantha|google|aria|jenny|ava|allison|karen|daniel|moira|serena|zira/.test(name)) score += 3;
        if (voice.localService) score += 1;
        return { voice: voice, score: score };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (entry) { return entry.voice; });
  },

  pickVoice: function () {
    var list = this.voicesForLanguage();
    var name = this.voiceName;
    if (name) {
      var chosen = this.voices.filter(function (voice) { return voice.name === name; })[0];
      if (chosen) return chosen;
    }
    return list[0] || null;
  },

  /* -------------------------------------------------------------------
     Music (assets/music/theme.mp3, quiet, on a loop)
     ------------------------------------------------------------------- */
  prepareMusic: function () {
    if (this.musicEl) return;
    var self = this;
    var music = new Audio();
    // Start a tiny silent sound now (during the tap) so the iPad allows
    // this player to play music later.
    music.src = silentSoundUrl();
    var started = music.play();
    if (started && started.catch) started.catch(function () {});
    this.musicEl = music;
    // Route the music through the volume knob. iPads ignore the normal
    // volume setting of a player, so this is the only way to make it quiet.
    if (this.ctx && location.protocol.indexOf("http") === 0) {
      try {
        this.ctx.createMediaElementSource(music).connect(this.musicGain);
        this.musicRouted = true;
      } catch (error) {
        this.musicRouted = false;
      }
    }
    this.find("music/theme").then(function (clip) {
      if (clip) {
        self.musicUrl = clip.url;
        self.updateMusic();
      }
    });
  },

  // Start or stop the music to match the settings.
  updateMusic: function () {
    var music = this.musicEl;
    if (!music || !this.musicUrl) return;
    if (this.musicOn && !document.hidden && this.volume > 0) {
      if (music.dataset.song !== this.musicUrl) {
        music.src = this.musicUrl;
        music.dataset.song = this.musicUrl;
        music.loop = true;
      }
      if (!this.musicRouted) music.volume = Math.min(1, 0.25 * this.volume);
      if (music.paused) {
        var playing = music.play();
        if (playing && playing.catch) playing.catch(function () {});
      }
    } else if (!music.paused) {
      music.pause();
    }
  },
};

// A tiny silent sound file made in code (used to unlock the music player).
function silentSoundUrl() {
  var samples = 800;
  var bytes = new Uint8Array(44 + samples);
  var view = new DataView(bytes.buffer);
  function text(offset, value) {
    for (var i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i);
  }
  text(0, "RIFF"); view.setUint32(4, 36 + samples, true); text(8, "WAVE");
  text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 8000, true); view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, "data"); view.setUint32(40, samples, true);
  for (var i = 0; i < samples; i++) bytes[44 + i] = 128; // 128 = silence
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

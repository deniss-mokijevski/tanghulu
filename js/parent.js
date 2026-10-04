/* =====================================================================
   parent.js — the parent screen (for grown-ups).

   Opens when you hold the ⚙️ corner for 3 seconds. It shows:
     • which letters she knows
     • which pictures are still placeholders
     • volume, music, voice
     • lowercase / UPPERCASE letters
     • reset progress
   ===================================================================== */

var Parent = {
  isOpen: false,
  holdTimer: null,

  init: function () {
    var self = this;
    var corner = $("#parent-corner");
    var ring = $("#parent-ring");
    var seconds = CONFIG.parentHoldSeconds || 3;

    // Holding the corner fills a ring; letting go early cancels.
    function start(event) {
      if (event.cancelable) event.preventDefault();
      if (self.isOpen) return;
      corner.classList.add("holding");
      ring.style.transition = "stroke-dashoffset " + seconds + "s linear";
      ring.style.strokeDashoffset = "0";
      clearTimeout(self.holdTimer);
      self.holdTimer = setTimeout(function () {
        stop();
        self.open();
      }, seconds * 1000);
    }
    function stop() {
      clearTimeout(self.holdTimer);
      corner.classList.remove("holding");
      ring.style.transition = "none";
      ring.style.strokeDashoffset = "176";
    }
    if (window.PointerEvent) {
      corner.addEventListener("pointerdown", start);
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        corner.addEventListener(name, stop);
      });
    } else {
      corner.addEventListener("touchstart", start, { passive: false });
      corner.addEventListener("mousedown", start);
      ["touchend", "touchcancel", "mouseup", "mouseleave"].forEach(function (name) {
        corner.addEventListener(name, stop);
      });
    }

    $("#parent-close").addEventListener("click", function () { self.close(); });
  },

  open: function () {
    this.isOpen = true;
    document.body.classList.add("parent-open");
    Sound.silence();
    Hint.hide();
    $("#parent-screen").classList.remove("hidden");
    $("#parent-screen").scrollTop = 0;
    this.render();
  },

  close: function () {
    this.isOpen = false;
    document.body.classList.remove("parent-open");
    $("#parent-screen").classList.add("hidden");
    $("#parent-content").innerHTML = "";
    Jar.refreshLetters(); // in case lowercase/UPPERCASE changed
    Hint.restart();
  },

  /* -------------------------------------------------------------------
     Building the screen
     ------------------------------------------------------------------- */
  render: async function () {
    var box = $("#parent-content");
    box.innerHTML = "<p class='note'>Checking pictures and sounds…</p>";
    // Wait until we know which drawings and recordings exist.
    await Promise.all([Assets.preloadAll(), Sound.preloadAll()]);
    if (!this.isOpen) return;
    box.innerHTML = "";
    this.renderLetters(box);
    this.renderPictures(box);
    this.renderSound(box);
    this.renderLetterCase(box);
    this.renderReset(box);
    var help = make("p", "note");
    help.innerHTML = "To change foods, words, the title or the artist name, edit <code>config.js</code>. " +
      "README.md explains how to add drawings and recordings.";
    box.appendChild(help);
  },

  heading: function (box, text) {
    box.appendChild(make("h3", null, text));
  },

  // 1. Which letters she knows (3 first-try answers in a row).
  renderLetters: function (box) {
    this.heading(box, "Letters");
    var need = CONFIG.knownAfter || 3;
    var foods = [];
    CONFIG.levels.forEach(function (level) {
      level.foods.forEach(function (food) {
        if (food.letter && !foods.some(function (f) { return f.letter === food.letter; })) foods.push(food);
      });
    });
    var known = foods.filter(function (food) { return Progress.knows(food.letter); }).length;
    box.appendChild(make("p", null, "She knows " + known + " of " + foods.length + " letters. " +
      "A letter counts as known after " + need + " right answers in a row on the first try."));

    var grid = make("div", "parent-grid");
    foods.forEach(function (food) {
      var stats = Progress.letter(food.letter);
      var unlocked = Progress.isUnlocked(food.id);
      var card = make("div", "parent-card");
      var letter = make("span", "big", Game.showLetter(food.letter));
      letter.style.fontFamily = CONFIG.letterFont;
      card.appendChild(letter);
      var info = make("div");
      info.appendChild(make("div", null, food.emoji + " " + food.word));
      var status;
      if (Progress.knows(food.letter)) {
        status = "✅ knows it";
        card.classList.add("known");
      } else if (!unlocked) {
        status = "🔒 not unlocked yet";
        card.classList.add("locked");
      } else {
        var dots = "";
        for (var i = 0; i < need; i++) dots += i < stats.streak ? "●" : "○";
        status = dots + " " + stats.streak + " of " + need + " in a row";
      }
      info.appendChild(make("div", "small", status));
      var extra = [];
      if (stats.right || stats.wrong) extra.push(stats.right + " right, " + stats.wrong + " wrong taps");
      if (Progress.stars(food.id)) extra.push("⭐ " + Progress.stars(food.id));
      if (extra.length) info.appendChild(make("div", "small", extra.join(" · ")));
      card.appendChild(info);
      grid.appendChild(card);
    });
    box.appendChild(grid);
  },

  // 2. Which pictures are still placeholders.
  renderPictures: function (box) {
    this.heading(box, "Drawings");
    var items = [];
    allFoods().forEach(function (food) {
      items.push({ folder: "foods", item: food, label: food.word });
    });
    items.push({ folder: "characters", item: CONFIG.customer, label: "customer (" + CONFIG.customer.word + ")" });
    CONFIG.levels.forEach(function (level) {
      items.push({ folder: "backgrounds", item: { id: level.id, emoji: level.icon || "🖼️" }, label: "background: " + level.id });
    });

    var drawn = items.filter(function (entry) { return Assets.results[entry.folder + "/" + entry.item.id]; });
    var foodCount = allFoods().length;
    var foodsDrawn = drawn.filter(function (entry) { return entry.folder === "foods"; }).length;
    box.appendChild(make("p", null, foodsDrawn + " of " + foodCount + " foods have a drawing. " +
      (drawn.length - foodsDrawn) + " of " + (items.length - foodCount) + " other pictures (customer, backgrounds) have a drawing."));

    var missing = items.filter(function (entry) { return !Assets.results[entry.folder + "/" + entry.item.id]; });
    if (missing.length === 0) {
      box.appendChild(make("p", null, "🖍️ Every picture is her drawing. Wonderful!"));
      return;
    }
    box.appendChild(make("p", null, "Still placeholders ✏️ (save her drawing with exactly this name):"));
    var grid = make("div", "parent-grid wide");
    missing.forEach(function (entry) {
      var card = make("div", "parent-card");
      card.appendChild(make("span", "big emoji", entry.item.emoji));
      var info = make("div");
      info.appendChild(make("div", null, entry.label));
      var path = make("code", null, "assets/" + entry.folder + "/" + entry.item.id + ".png");
      info.appendChild(path);
      card.appendChild(info);
      grid.appendChild(card);
    });
    box.appendChild(grid);
    box.appendChild(make("p", "note", "Tip: print drawing-sheets.html for empty squares to draw in."));
  },

  // 3. Volume, music and voice.
  renderSound: function (box) {
    var settings = Progress.settings();
    this.heading(box, "Sound");

    // Volume
    var row = make("div", "parent-row");
    var label = make("label", null, "Volume");
    label.htmlFor = "volume-slider";
    row.appendChild(label);
    var slider = make("input");
    slider.type = "range";
    slider.id = "volume-slider";
    slider.min = "0";
    slider.max = "100";
    slider.step = "5";
    slider.value = String(Math.round(settings.volume * 100));
    var shown = make("span", null, slider.value + "%");
    slider.addEventListener("input", function () {
      var volume = Number(slider.value) / 100;
      shown.textContent = slider.value + "%";
      Sound.setVolume(volume);
      Progress.setSetting("volume", volume);
    });
    slider.addEventListener("change", function () { Sound.fx("pop"); });
    row.appendChild(slider);
    row.appendChild(shown);
    box.appendChild(row);

    // Music on / off
    row = make("div", "parent-row");
    row.appendChild(make("label", null, "Music"));
    row.appendChild(this.toggle(["On", "Off"], settings.music ? 0 : 1, function (index) {
      Progress.setSetting("music", index === 0);
      Sound.setMusic(index === 0);
    }));
    if (!Sound.found["music/theme"]) {
      row.appendChild(make("span", "note", "No music file yet — add assets/music/theme.mp3"));
    }
    box.appendChild(row);

    // Browser voice (used for everything that has no recording)
    row = make("div", "parent-row");
    row.appendChild(make("label", null, "Voice"));
    var voices = Sound.voicesForLanguage();
    if (voices.length === 0) {
      row.appendChild(make("span", "note", "No built-in voice found for \"" + CONFIG.language +
        "\" on this device. Recordings still work."));
    } else {
      var select = make("select");
      var auto = make("option", null, "Automatic (" + voices[0].name + ")");
      auto.value = "";
      select.appendChild(auto);
      voices.forEach(function (voice) {
        var option = make("option", null, voice.name + " (" + voice.lang + ")");
        option.value = voice.name;
        if (voice.name === settings.voice) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        Progress.setSetting("voice", select.value);
        Sound.voiceName = select.value;
        Sound.voice = Sound.pickVoice();
        Sound.speak([Sound.phrasePart("yay")], true);
      });
      row.appendChild(select);
    }
    var test = make("button", "parent-button secondary", "🔈 Test");
    test.type = "button";
    test.addEventListener("click", function () {
      Sound.unlock();
      Sound.speak([Sound.phrasePart("welcome")], true);
    });
    row.appendChild(test);
    box.appendChild(row);
    box.appendChild(make("p", "note",
      "iPad tip: nicer voices can be downloaded in Settings → Accessibility → Spoken Content → Voices. " +
      "Android: Settings → Text-to-speech."));

    // Which recordings were found
    var names = Object.keys(Sound.clips).filter(function (name) { return name.indexOf("music/") !== 0; });
    var found = names.filter(function (name) { return Sound.found[name]; });
    box.appendChild(make("p", null, "Recordings found: " + found.length + " of " + names.length +
      ". Everything without a recording uses the browser voice or built-in effects."));
    var details = make("details");
    details.appendChild(make("summary", null, "Show missing recordings"));
    var list = make("ul", "missing-list");
    names.filter(function (name) { return !Sound.found[name]; }).forEach(function (name) {
      list.appendChild(make("li", null, "assets/" + name + ".mp3"));
    });
    details.appendChild(list);
    box.appendChild(details);
  },

  // 4. lowercase / UPPERCASE letters.
  renderLetterCase: function (box) {
    this.heading(box, "Letters on the buttons");
    var row = make("div", "parent-row");
    row.appendChild(this.toggle(["a b c  lowercase", "A B C  UPPERCASE"], Progress.settings().uppercase ? 1 : 0, function (index) {
      Progress.setSetting("uppercase", index === 1);
    }));
    box.appendChild(row);
  },

  // 5. Reset progress (asks first).
  renderReset: function (box) {
    this.heading(box, "Start over");
    var row = make("div", "parent-row");
    var reset = make("button", "parent-button secondary", "Reset progress…");
    reset.type = "button";
    var confirmRow = make("div", "parent-row hidden");
    confirmRow.appendChild(make("span", null, "This forgets all unlocked foods, stars and letters. Sure?"));
    var yes = make("button", "parent-button danger", "Yes, start over");
    yes.type = "button";
    var no = make("button", "parent-button secondary", "Cancel");
    no.type = "button";
    confirmRow.appendChild(yes);
    confirmRow.appendChild(no);
    reset.addEventListener("click", function () { confirmRow.classList.remove("hidden"); });
    no.addEventListener("click", function () { confirmRow.classList.add("hidden"); });
    yes.addEventListener("click", function () {
      Progress.reset();
      location.reload(); // start fresh from the title screen
    });
    row.appendChild(reset);
    box.appendChild(row);
    box.appendChild(confirmRow);
  },

  // Two (or more) buttons where one is "on".
  toggle: function (labels, selected, onChange) {
    var group = make("div", "toggle");
    labels.forEach(function (text, index) {
      var button = make("button", index === selected ? "on" : "", text);
      button.type = "button";
      button.addEventListener("click", function () {
        var all = group.querySelectorAll("button");
        for (var i = 0; i < all.length; i++) all[i].classList.toggle("on", i === index);
        onChange(index);
      });
      group.appendChild(button);
    });
    return group;
  },
};

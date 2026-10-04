/* =====================================================================
   main.js — starts the game and connects all the parts.
   ===================================================================== */

var Game = {
  screen: "title",  // "title" | "shop" | "jar"
  busy: false,      // true while an animation runs (taps are ignored)
  step: 0,          // goes up whenever "what to do next" changes

  start: function () {
    // config.js has a typo (a missing comma or quote): tell the grown-up.
    if (typeof CONFIG === "undefined") {
      document.body.innerHTML =
        "<p style='font:24px sans-serif;padding:40px;line-height:1.5;background:#fff'>" +
        "⚠️ config.js has a typo, so the game can't start.<br>" +
        "Usually a comma or a quote mark is missing. Undo your last change in config.js and reload.</p>";
      return;
    }
    this.checkConfig();
    Progress.load();
    Stage.init();
    Effects.init();
    Sound.init();
    this.applySettings();

    // Start looking for drawings and recordings straight away.
    Assets.preloadAll();
    Sound.preloadAll();

    Shop.init();
    Jar.init();
    Parent.init();
    Hint.init();

    this.showTitle();
    this.stopBrowserGestures();

    var self = this;
    // The ▶ button. "click"/"touchend" (not "pointerdown") because
    // iPads only switch sound on from these.
    var play = $("#play-button");
    play.addEventListener("click", function () { self.play(); });
    play.addEventListener("touchend", function () { self.play(); });
    onTap($("#repeat-button"), function () { self.sayInstruction(); });
  },

  // Fix up config.js values the game can't use, and warn about mistakes
  // (warnings show in the browser's developer console).
  checkConfig: function () {
    // The stick has room for 1 to 5 foods.
    CONFIG.maxOnStick = Math.max(1, Math.min(5, Math.round(CONFIG.maxOnStick) || 5));
    CONFIG.levels.forEach(function (level) {
      level.foods.forEach(function (food) {
        if (!food.letter) {
          console.warn("config.js: the food \"" + food.id + "\" in level \"" + level.id +
            "\" has no letter, so it is on the shelf from the start.");
        }
      });
    });
  },

  // Volume, music, letters and voice from the parent screen.
  applySettings: function () {
    var settings = Progress.settings();
    Sound.voiceName = settings.voice;
    Sound.loadVoices();
    Sound.setVolume(settings.volume);
    Sound.setMusic(settings.music);
    document.documentElement.style.setProperty("--letter-font", CONFIG.letterFont);
  },

  /* -------------------------------------------------------------------
     Title screen
     ------------------------------------------------------------------- */
  showTitle: function () {
    document.body.classList.add("on-title");
    document.title = CONFIG.title;
    $("#game-title").textContent = CONFIG.title;
    document.documentElement.lang = languageTag();
    var artBy = CONFIG.artBy !== undefined ? CONFIG.artBy : "Art by";
    $("#artist-line").textContent = [artBy, CONFIG.artist, "🖍️"].filter(Boolean).join(" ");

    // A finished candy stick with the starter foods, and the customer.
    var stick = $("#title-stick");
    stick.innerHTML = "";
    var rod = make("div");
    rod.id = "title-rod";
    stick.appendChild(rod);
    var foods = make("div");
    foods.id = "title-foods";
    CONFIG.starterFoods.slice(0, 3).forEach(function (food) {
      foods.appendChild(Shop.makeStickFood(food));
    });
    stick.appendChild(foods);
    var customer = $("#title-customer");
    customer.innerHTML = "";
    customer.appendChild(Assets.picture("characters", CONFIG.customer, { framed: false }));

    this.renderRoom();
  },

  // ▶ pressed: switch on sound and open the shop.
  play: function () {
    if (this.screen !== "title") return;
    Sound.unlock();
    this.screen = "shop";
    document.body.classList.remove("on-title");
    $("#title-screen").classList.add("hidden");
    $("#shop-screen").classList.remove("hidden");
    $("#repeat-button").classList.remove("hidden");
    this.renderLevelBar();
    Shop.enter();
    this.step++;
    Hint.restart();
    if (!document.querySelector("#shelf-grid .food-button")) {
      // No foods to start with (empty starterFoods): go straight to a jar.
      Sound.speak([Sound.phrasePart("welcome")]);
      this.afterStick();
      return;
    }
    Sound.speak([Sound.phrasePart("welcome"), Sound.phrasePart("tapFood")]);
  },

  /* -------------------------------------------------------------------
     Talking: what should she do now?
     ------------------------------------------------------------------- */

  // Say one sentence from config.js phrases.
  say: function (key) {
    return Sound.speak([Sound.phrasePart(key)]);
  },

  // The current instruction, as parts that Sound.speak() understands.
  instruction: function () {
    if (this.screen === "jar") return Jar.instruction();
    if (Shop.stick.length === 0) return [Sound.phrasePart("tapFood")];
    if (!Shop.coated && Shop.stick.length >= CONFIG.maxOnStick) return [Sound.phrasePart("stickFull")];
    if (!Shop.coated) return [Sound.phrasePart("tapPot")];
    if (!Shop.eating) return [Sound.phrasePart("tapStick")];
    return [Sound.phrasePart("keepGoing")];
  },

  // The 🔊 button (and the idle hint) say the instruction again.
  // (Not during animations, so it never cuts off "sss… strawberry!")
  sayInstruction: function () {
    if (this.screen === "title" || this.busy || this.paused()) return;
    var parts = this.instruction();
    if (!parts.length) return;
    var button = $("#repeat-button");
    var turn = this.talkTurn = (this.talkTurn || 0) + 1;
    var self = this;
    button.classList.add("talking");
    Sound.speak(parts).then(function () {
      if (self.talkTurn === turn) button.classList.remove("talking");
    });
  },

  // Is the game on hold? (parent screen open, page hidden, or the
  // tablet held upright so the "please turn me" picture shows)
  paused: function () {
    if (Parent.isOpen || document.hidden) return true;
    return getComputedStyle($("#turn-notice")).display !== "none";
  },

  // Which thing should the 👆 hand point at?
  hintTarget: function () {
    if (this.screen === "title") return $("#play-button");
    if (this.screen === "jar") return Jar.hintTarget();
    if (this.screen !== "shop") return null;
    var buttons = document.querySelectorAll("#shelf-grid .food-button");
    var newest = buttons[buttons.length - 1];
    if (Shop.stick.length === 0) return newest;
    if (!Shop.coated) {
      return Shop.stick.length >= Math.min(3, CONFIG.maxOnStick) ? $("#pot-button") : newest;
    }
    return $("#stick-foods").lastElementChild || $("#stick-area");
  },

  /* -------------------------------------------------------------------
     After every finished stick: a letter jar
     ------------------------------------------------------------------- */
  afterStick: async function () {
    // Wait while a grown-up is on the parent screen (or the tablet is upright).
    while (this.paused()) await wait(500);
    var jar = Levels.nextJar();
    if (jar) {
      Jar.open(jar);
    } else {
      this.say("again");
    }
  },

  // Back to the shop after the jar.
  backToShop: function () {
    this.screen = "shop";
    this.step++;
    Hint.restart();
  },

  /* -------------------------------------------------------------------
     Places (levels)
     ------------------------------------------------------------------- */

  // The room: her background drawing, or wall/floor colors + emoji.
  renderRoom: function () {
    var level = Levels.current();
    var colors = level.colors || {};
    $("#room-wall").style.background = colors.wall || "#ffe7c4";
    $("#room-floor").style.background = colors.floor || "#e5a96f";
    document.body.classList.toggle("dark-room", isDark(colors.wall || "#ffe7c4"));
    document.body.classList.toggle("dark-floor", isDark(colors.floor || "#e5a96f"));

    // Emoji decorations in free spots around the shop.
    var spots = [
      { x: 205, y: 58, size: 62 }, { x: 790, y: 60, size: 64 },
      { x: 655, y: 245, size: 72 }, { x: 960, y: 480, size: 58 },
      { x: -70, y: 200, size: 80 }, { x: 1070, y: 260, size: 80 },
      { x: -60, y: 480, size: 70 }, { x: 1060, y: 520, size: 64 },
    ];
    var box = $("#decorations");
    box.innerHTML = "";
    var decorations = level.decorations || [];
    spots.forEach(function (spot, i) {
      if (!decorations.length) return;
      var bit = make("span", "decoration" + (spot.y < 100 ? " top" : ""), decorations[i % decorations.length]);
      bit.style.left = spot.x + "px";
      bit.style.top = spot.y + "px";
      bit.style.fontSize = spot.size + "px";
      box.appendChild(bit);
    });

    // Her drawing of the place, if there is one.
    var drawing = $("#background-drawing");
    var badge = $("#background-badge");
    badge.textContent = "✏️";
    drawing.classList.add("hidden");
    box.classList.remove("hidden");
    var levelId = level.id;
    Assets.find("backgrounds", level.id).then(function (found) {
      if (Levels.current().id !== levelId) return; // she moved on already
      if (found) {
        drawing.src = found.src;
        drawing.classList.remove("hidden");
        box.classList.add("hidden");
        badge.textContent = "🖍️";
      }
    });
  },

  // The bar at the top: the place's icon and its 4 foods
  // (dark until unlocked).
  //   levelIndex = which place to show (normally the current one)
  //   justWonId  = a food that was just unlocked (it pops in)
  renderLevelBar: function (levelIndex, justWonId) {
    if (levelIndex === undefined) levelIndex = Levels.currentIndex();
    var level = CONFIG.levels[levelIndex];
    $("#level-icon").textContent = level.icon || "⭐";
    var slots = $("#level-slots");
    slots.innerHTML = "";
    level.foods.forEach(function (food) {
      var slot = make("div", "level-slot");
      slot.dataset.id = food.id;
      if (!Progress.isUnlocked(food.id)) slot.classList.add("locked");
      if (food.id === justWonId) slot.classList.add("just-won");
      slot.appendChild(Assets.picture("foods", food, { framed: false }));
      slots.appendChild(slot);
    });
  },

  // All 4 jars of a place are open: party, then off to the next place.
  levelComplete: async function (levelIndex) {
    var next = CONFIG.levels[levelIndex + 1];
    Sound.fx("cheer");
    Effects.confetti();
    replayClass($("#customer-body"), "happy", 800);

    if (!next) {
      // That was the last place. From now on every jar is a review.
      await Promise.race([this.say("allDone"), wait(7000)]);
      Effects.confetti();
      return;
    }

    await Promise.race([this.say("newPlace"), wait(7000)]);

    // A curtain with the new place's icon, then the new room.
    var curtain = make("div");
    curtain.id = "place-curtain";
    curtain.appendChild(make("span", null, next.icon || "⭐"));
    document.body.appendChild(curtain);
    Sound.fx("whoosh");
    await wait(1000);              // the curtain now hides the screen
    this.renderRoom();
    this.renderLevelBar();
    await wait(1700);
    curtain.remove();
    Sound.fx("sparkle");
    await Promise.race([Sound.speak([Sound.placePart(next)]), wait(6000)]);
  },

  // How a letter is shown: lowercase (default) or uppercase.
  showLetter: function (letter) {
    var text = String(letter);
    var upper = Progress.settings().uppercase;
    try {
      return upper ? text.toLocaleUpperCase(languageTag()) : text.toLocaleLowerCase(languageTag());
    } catch (error) {
      // The language in config.js is not one the browser knows.
      return upper ? text.toUpperCase() : text.toLowerCase();
    }
  },

  // Stop pinch-zoom, long-press menus and double-tap zoom.
  stopBrowserGestures: function () {
    ["gesturestart", "gesturechange", "dblclick", "contextmenu"].forEach(function (name) {
      document.addEventListener(name, function (event) {
        if (Parent.isOpen && name === "contextmenu") return;
        event.preventDefault();
      });
    });
    document.addEventListener("touchmove", function (event) {
      if (!Parent.isOpen && event.cancelable) event.preventDefault();
    }, { passive: false });
  },
};

// Is a color dark? (Then text on it gets a light style.)
// Works with any CSS color: "#2b2d6e", "#123", "navy", "rgb(0, 0, 80)".
function isDark(color) {
  var probe = make("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  var rgb = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 255, 255];
  probe.remove();
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) < 110;
}

// Go!
Game.start();

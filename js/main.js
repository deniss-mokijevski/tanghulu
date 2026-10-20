/* =====================================================================
   main.js — starts the game and connects all the parts.
   ===================================================================== */

var Game = {
  screen: "title",  // "title" | "shop" | "jar" | "pole"
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
    try {
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
      Pole.init();
      Parent.init();
      Hint.init();

      this.showTitle();
      this.stopBrowserGestures();
      this.watchOrientation();

      var self = this;
      // The ▶ button. "click"/"touchend" (not "pointerdown") because
      // iPads only switch sound on from these.
      var play = $("#play-button");
      play.addEventListener("click", function () { self.play(); });
      play.addEventListener("touchend", function () { self.play(); });
      onTap($("#repeat-button"), function () { self.sayInstruction(); });
    } catch (error) {
      // Something in config.js has the wrong shape: tell the grown-up.
      document.body.innerHTML =
        "<p style='font:24px sans-serif;padding:40px;line-height:1.5;background:#fff'>" +
        "⚠️ Something in config.js is not right, so the game can't start.<br>" +
        "Undo your last change in config.js and reload.<br>" +
        "<small>(" + String(error.message).replace(/</g, "&lt;") + ")</small></p>";
    }
  },

  // Fix up config.js values the game can't use, and warn about mistakes
  // (warnings show in the browser's developer console).
  checkConfig: function () {
    // Numbers the game can use: 1 to 5 foods on a stick, 1 to 10 pot taps.
    CONFIG.maxOnStick = Math.max(1, Math.min(5, Math.round(Number(CONFIG.maxOnStick)) || 5));
    var warn = function (text) { console.warn("config.js: " + text); };
    var raw = CONFIG.potTaps;
    var isNumber = typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "");
    var taps = isNumber ? Math.round(Number(raw)) : NaN;
    if (raw == null || isNaN(taps)) {
      if (CONFIG.potTaps != null) warn("potTaps should be a number like 3.");
      taps = 3;
    }
    CONFIG.potTaps = Math.max(1, Math.min(10, taps));
    var seen = {};
    CONFIG.starterFoods.forEach(function (food) {
      if (!food) return;
      if (seen[food.id]) warn("the food id \"" + food.id + "\" is used twice.");
      seen[food.id] = true;
      if (food.letter) warn("the starter food \"" + food.id + "\" has a letter; starter foods never get a jar.");
    });
    var letters = [];
    CONFIG.levels.forEach(function (level) {
      level.foods.forEach(function (food) {
        if (!food) return;
        if (seen[food.id]) warn("the food id \"" + food.id + "\" is used twice.");
        seen[food.id] = true;
        if (!food.letter) {
          warn("the food \"" + food.id + "\" in level \"" + level.id + "\" has no letter, so it is on the shelf from the start.");
        } else {
          letters.push(String(food.letter).toLowerCase());
        }
      });
    });
    // Letters that sound alike at the start of an Estonian word.
    [["i", "j"], ["b", "p"], ["d", "t"], ["g", "k"], ["z", "s"]].forEach(function (pair) {
      if (letters.indexOf(pair[0]) !== -1 && letters.indexOf(pair[1]) !== -1) {
        warn("the letters " + pair[0] + " and " + pair[1] + " sound alike at the start of a word; use only one of them.");
      }
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
    this.goFullscreen();
    this.screen = "shop";
    document.body.classList.remove("on-title");
    $("#title-screen").classList.add("hidden");
    $("#shop-screen").classList.remove("hidden");
    $("#repeat-button").classList.remove("hidden");
    this.renderLevelBar();
    Shop.enter();
    Pole.renderButton();
    this.step++;
    Hint.restart();
    if (!document.querySelector("#shelf-grid .food-button")) {
      // No foods to start with (empty starterFoods): say hello, then
      // go straight to a jar.
      var self = this;
      this.busy = true;
      Promise.race([Sound.speak([Sound.phrasePart("call"), Sound.phrasePart("welcome")]), wait(7000)]).then(function () {
        self.busy = false;
        self.afterStick();
      });
      return;
    }
    // The street seller's call, what to do, then the bear's wish.
    Sound.speak([Sound.phrasePart("call"), Sound.phrasePart("tapFood")].concat(Shop.wishParts()));
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
    if (this.screen === "pole") return Pole.instruction();
    if (Shop.stick.length === 0) return [Sound.phrasePart("tapFood")].concat(Shop.wishParts());
    if (!Shop.coated) {
      var cooked = Shop.cookSteps() > 0 && Shop.syrupReady();
      // (With potTaps 1 the syrup is always golden: once the hand points at the pot.)
      var alwaysReady = Shop.cookSteps() === 0 && Shop.stick.length >= Math.min(3, CONFIG.maxOnStick);
      if (cooked || alwaysReady) return [Sound.phrasePart("syrupReady")];
      if (Shop.stick.length >= CONFIG.maxOnStick) return [Sound.phrasePart("stickFull")];
      if (Shop.syrup > 0) return [Sound.phrasePart("cook")];
      return [Sound.phrasePart("tapPot")];
    }
    if (!Shop.eating) return [Sound.phrasePart("tapStick")];
    return [Sound.phrasePart("keepGoing")];
  },

  // The 🔊 button (and the idle hint) say the instruction again.
  // (Not during animations, so it never cuts off "sss… strawberry!")
  sayInstruction: function () {
    if (this.screen === "title" || this.busy || this.paused()) return;
    var parts = this.instruction();
    if (!parts.length) return;
    if (this.screen === "jar") clearTimeout(Jar.introTimer); // she asked already: say it once
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
    if (this.screen === "pole") return Pole.hintTarget();
    if (this.screen !== "shop") return null;
    var buttons = document.querySelectorAll("#shelf-grid .food-button");
    var newest = buttons[buttons.length - 1];
    // The food the bear wishes for (until it is on the stick).
    var wished = Shop.wish && !Shop.wishMet && Shop.stick.indexOf(Shop.wish) === -1
      ? Shop.shelfButton(Shop.wish.id) : null;
    if (Shop.stick.length === 0) return wished || newest;
    if (!Shop.coated) {
      var potTime = Shop.syrup > 0 || Shop.stick.length >= Math.min(3, CONFIG.maxOnStick);
      return potTime ? $("#pot-button") : (wished || newest);
    }
    return Shop.topPiece() || $("#stick-area");
  },

  /* -------------------------------------------------------------------
     After every finished stick: a letter jar
     ------------------------------------------------------------------- */
  afterStick: async function () {
    // Wait while a grown-up is on the parent screen (or the tablet is upright).
    // Taps stay blocked meanwhile, so nothing starts before the jar.
    this.busy = true;
    while (this.paused()) await wait(500);
    this.busy = false;
    var jar = Levels.nextJar();
    if (jar) {
      Jar.open(jar);
    } else {
      this.newRound();
    }
  },

  // Back to the shop after the jar, with a new round (the bear's next
  // wish). noNewRound: from the straw pole, or when the pole is shown first.
  backToShop: function (noNewRound) {
    this.screen = "shop";
    this.step++;
    Hint.restart();
    if (!noNewRound) this.newRound();
  },

  // A new candy stick: the bear makes a new wish.
  newRound: function () {
    Shop.newWish();
    Sound.speak([Sound.phrasePart("again")].concat(Shop.wishParts()));
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
      { x: 610, y: 50, size: 54 }, { x: 714, y: 46, size: 54 },
      { x: 655, y: 245, size: 72 }, { x: -70, y: 370, size: 64 },
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
    // Keep the bar left of the stick (236px for the slots), even when a
    // place has many foods: then two rows of slots, so they stay big enough.
    var count = Math.max(1, level.foods.length);
    var oneRow = Math.min(54, Math.floor((236 - (count - 1) * 8) / count));
    var perRow = Math.ceil(count / 2);
    var twoRows = Math.min(32, Math.floor(236 / perRow) - 8);
    var size = Math.max(oneRow, twoRows);
    slots.classList.toggle("two-rows", twoRows > oneRow);
    slots.style.width = twoRows > oneRow ? perRow * (size + 8) + "px" : "";
    slots.style.setProperty("--slot", size + "px");
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

  // Android tablets: go fullscreen when ▶ is tapped (hides the browser's
  // bars, so everything is bigger) and keep the screen sideways.
  // Not on iPads: there the fullscreen "X" button would sit on top of 🔊.
  goFullscreen: function () {
    if (!CONFIG.fullscreenOnAndroid || !/Android/i.test(navigator.userAgent)) return;
    var page = document.documentElement;
    var request = page.requestFullscreen || page.webkitRequestFullscreen;
    if (!request || document.fullscreenElement) return;
    try {
      var result = request.call(page);
      if (result && result.then) {
        result.then(function () {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock("landscape").catch(function () {});
          }
        }).catch(function () {});
      }
    } catch (error) { /* fullscreen not allowed: play in the normal tab */ }
  },

  // Held upright? Say "please turn the tablet" (the picture shows too).
  watchOrientation: function () {
    if (!window.matchMedia) return;
    var portrait = window.matchMedia("(orientation: portrait)");
    var handler = function () {
      if (portrait.matches && Sound.unlocked && !Parent.isOpen) {
        Sound.speak([Sound.phrasePart("turnTablet")], true);
      }
    };
    if (portrait.addEventListener) portrait.addEventListener("change", handler);
    else if (portrait.addListener) portrait.addListener(handler); // older iPads
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
      if (Parent.isOpen || !event.cancelable) return;
      // The shelf of bowls may scroll sideways (only in the shop, so it
      // can't move while a won food flies into its bowl); nothing else moves.
      if (Game.screen === "shop" && event.target.closest && event.target.closest(".scroller")) return;
      event.preventDefault();
    }, { passive: false });
  },
};

// Is a color dark? (Then text on it gets a light style.)
// Works with any CSS color: "#2b2d6e", "#123", "navy", "rgb(0, 0, 80)".
function isDark(color) {
  var probe = make("span");
  probe.style.color = color;
  if (!probe.style.color) return false; // not a real color: keep the light look
  document.body.appendChild(probe);
  var rgb = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 255, 255];
  probe.remove();
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) < 110;
}

// Go!
Game.start();

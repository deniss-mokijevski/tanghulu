/* =====================================================================
   jar.js — the letter riddle.

   After every finished stick a locked jar appears. Inside is a food,
   shown as a dark outline. The game plays a letter sound and shows
   big letter buttons.
     • Right letter → the jar pops open, the voice says "sss… strawberry!",
                      and the food flies onto the shelf.
     • Wrong letter → that letter says its own sound and wiggles, the
                      right one glows softly, and she tries again.
   No buzzers, no losing, no timers.
   ===================================================================== */

var Jar = {
  current: null,  // { food, review, letters } from Levels.nextJar()
  missed: false,  // did she tap a wrong letter in this jar?
  done: false,    // has the right letter been tapped?

  init: function () {
    var self = this;
    // Tapping the jar plays the sound again.
    onTap($("#jar"), function () {
      if (Game.screen !== "jar" || self.done) return;
      replayClass($("#jar"), "shake", 500);
      Sound.speak([Sound.letterPart(self.current.food)]);
    });
  },

  // Show a new jar.
  open: function (jar) {
    var self = this;
    this.current = jar;
    this.missed = false;
    this.done = false;
    Game.screen = "jar";
    Game.step++;

    // The hidden food (a dark outline).
    var foodBox = $("#jar-food");
    foodBox.className = "";
    foodBox.innerHTML = "";
    foodBox.appendChild(Assets.picture("foods", jar.food, { framed: false }));
    $("#jar-lid").className = "";
    $("#jar-lock").className = "";

    // The big letter buttons.
    var row = $("#letter-buttons");
    row.innerHTML = "";
    jar.letters.forEach(function (letter) {
      var button = make("button", "letter-button", Game.showLetter(letter));
      button.type = "button";
      button.dataset.letter = letter;
      button.style.fontFamily = CONFIG.letterFont;
      onTap(button, function () { self.tapLetter(letter, button); });
      row.appendChild(button);
    });

    $("#jar-screen").classList.remove("hidden");
    replayClass($("#jar"), "drop-in", 700);
    Sound.fx("whoosh");
    Hint.restart();
    setTimeout(function () {
      if (self.current === jar && !self.done) Sound.speak(self.instruction());
    }, 650);
  },

  // What the 🔊 button says: "Which letter makes this sound? … sss"
  instruction: function () {
    if (!this.current || this.done) return [];
    var key = this.current.review ? "review" : "jar";
    return [Sound.phrasePart(key), Sound.letterPart(this.current.food)];
  },

  // The 👆 hand points at 🔊 (pointing at the right letter would give it away).
  hintTarget: function () {
    if (this.done) return null;
    return $("#repeat-button");
  },

  // Redraw the letters (after lowercase/UPPERCASE changed on the parent screen).
  refreshLetters: function () {
    var buttons = document.querySelectorAll("#letter-buttons .letter-button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].textContent = Game.showLetter(buttons[i].dataset.letter);
    }
  },

  rightButton: function () {
    var buttons = document.querySelectorAll("#letter-buttons .letter-button");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.letter === this.current.food.letter) return buttons[i];
    }
    return null;
  },

  tapLetter: function (letter, button) {
    if (this.done || Game.screen !== "jar") return;
    var food = this.current.food;

    if (letter === food.letter) {
      // RIGHT!
      this.done = true;
      Hint.hide();
      Progress.recordAnswer(food.letter, !this.missed);
      this.openJar(button);
      return;
    }

    // Not this one: it says its own sound and wiggles, the right one glows.
    this.missed = true;
    Progress.recordMiss(food.letter);
    replayClass(button, "wiggle", 500);
    button.classList.add("tried");
    var right = this.rightButton();
    if (right) right.classList.add("glow");
    var other = Levels.foodForLetter(letter) || { letter: letter, word: letter };
    Sound.speak([
      Sound.letterPart(other),
      Sound.phrasePart("listen"),
      Sound.letterPart(food),
    ]);
  },

  // The jar pops open and the food flies onto the shelf.
  openJar: async function (button) {
    var food = this.current.food;
    var review = this.current.review;
    var levelIndex = Levels.currentIndex(); // remember before unlocking
    Game.busy = true;

    button.classList.remove("glow");
    button.classList.add("right");
    Sound.fx("unlock");
    $("#jar-lock").classList.add("pop");
    await wait(250);
    $("#jar-lid").classList.add("off");
    $("#jar-food").classList.add("revealed");
    var jarAt = Stage.where($("#jar-glass"));
    Effects.sparkles(jarAt.x, jarAt.y, 16);
    Sound.fx("sparkle");

    // "sss… strawberry!"
    await Promise.race([
      Sound.speak([Sound.letterOnlyPart(food), Sound.wordPart(food)]),
      wait(6000),
    ]);
    await wait(250);

    // Save it, then fly the food to its place on the shelf.
    var from = Stage.where($("#jar-food"));
    if (!review) Progress.unlock(food.id);
    $("#jar-screen").classList.add("hidden");
    Shop.renderShelf(review ? null : food.id);
    var target = Shop.shelfButton(food.id);
    var flyer = make("div");
    flyer.style.fontSize = "100px";
    flyer.appendChild(Assets.picture("foods", food, { framed: false }));
    Sound.fx("whoosh");
    if (target) {
      var to = Stage.where(target);
      to.scale = 0.75;
      await Effects.fly(flyer, from, to, 900, 130);
      target.classList.remove("arriving");
      target.classList.add("new-food");
      setTimeout(function () { target.classList.remove("new-food"); }, 5000);
      replayClass(target, "wiggle", 500);
    }
    Sound.fx("pop");

    if (review) {
      // Review jar: she earns a star on that food.
      Progress.addStar(food.id);
      if (target) {
        Shop.showStars(target, Progress.stars(food.id));
        var at = Stage.where(target);
        Effects.sparkles(at.x, at.y, 10);
      }
      Sound.fx("star");
      await Promise.race([Game.say("star"), wait(4000)]);
    } else {
      Game.renderLevelBar(levelIndex, food.id);
    }

    if (!review && Levels.isDone(levelIndex)) {
      await Game.levelComplete(levelIndex);
    } else {
      Game.say("again");
    }
    this.current = null;
    Game.busy = false;
    Game.backToShop();
  },
};

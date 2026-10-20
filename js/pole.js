/* =====================================================================
   pole.js — the straw pole (草把子).

   Real tanghulu sellers carry a pole with a fat bundle of straw on top,
   with the candy sticks pushed into it. Here every food she has won from
   a letter jar gets a stick in the straw, with its letter on a little
   flag. Tap a stick to hear its sound and word again ("sss… sidrun"):
   she can practise her letters whenever she likes.
   ===================================================================== */

var Pole = {
  tapped: false,  // has she tapped a stick since opening the pole?
  changedAt: 0,   // when the pole last opened or closed (to ignore double taps)

  init: function () {
    var self = this;
    onTap($("#pole-button"), function () { self.open(); });
    onTap($("#pole-close"), function () { self.close(); });
    onTap($("#pole-backdrop"), function () { self.close(); });
  },

  // The foods with a letter that she has won (in the order of config.js).
  foods: function () {
    var list = [];
    CONFIG.levels.forEach(function (level) {
      level.foods.forEach(function (food) {
        if (food.letter && Progress.isUnlocked(food.id)) list.push(food);
      });
    });
    return list;
  },

  // The little pole in the shop: one tiny candy ball per won stick.
  renderButton: function () {
    var foods = this.foods();
    $("#pole-button").classList.toggle("hidden", foods.length === 0);
    var balls = $("#mini-balls");
    balls.innerHTML = "";
    foods.forEach(function (food, i) {
      var angle = -Math.PI / 2 + (i / Math.max(foods.length, 1)) * Math.PI * 2;
      var ball = make("span", "mini-ball");
      ball.style.left = 50 + Math.cos(angle) * 38 + "%";
      ball.style.top = 36 + Math.sin(angle) * 28 + "%";
      balls.appendChild(ball);
    });
  },

  // A new stick was won: the pole wiggles and sparkles.
  // Gives back true the very first time (then the game tells her about it).
  celebrateNew: function () {
    var first = $("#pole-button").classList.contains("hidden");
    this.renderButton();
    var button = $("#pole-button");
    if (button.classList.contains("hidden")) return false;
    replayClass(button, "wiggle", 500);
    var at = Stage.where(button);
    Effects.sparkles(at.x, at.y - 30, 8);
    return first;
  },

  // A quick double tap must not open and close (or close and reopen) it.
  tooSoon: function () {
    return Date.now() - this.changedAt < 600;
  },

  open: function () {
    if (Game.busy || Game.screen !== "shop" || this.tooSoon()) return;
    this.changedAt = Date.now();
    Game.screen = "pole";
    Game.step++;
    this.tapped = false;
    this.render();
    $("#pole-screen").classList.remove("hidden");
    Sound.fx("whoosh");
    Hint.restart();
    Sound.speak([Sound.phrasePart("pole")]);
  },

  close: function () {
    if (Game.screen !== "pole" || this.tooSoon()) return;
    this.changedAt = Date.now();
    $("#pole-screen").classList.add("hidden");
    Sound.silence();
    Game.backToShop(true);
    Game.sayInstruction(); // back in the shop: what to do next
  },

  // The big pole: the sticks point out of the straw in a circle.
  render: function () {
    var self = this;
    var box = $("#pole-sticks");
    box.innerHTML = "";
    var foods = this.foods();
    var centerX = 500, centerY = 330;
    // More sticks → a wider circle, so they don't overlap.
    var radiusX = Math.max(215, Math.min(330, foods.length * 120 / (2 * Math.PI) * 1.15));
    var radiusY = 205;
    foods.forEach(function (food, i) {
      var angle = -Math.PI / 2 + (i / foods.length) * Math.PI * 2;
      var x = centerX + Math.cos(angle) * radiusX;
      var y = centerY + Math.sin(angle) * radiusY;

      // The wooden stick from the straw to the food.
      var rod = make("div", "pole-rod-stick");
      rod.style.left = centerX + "px";
      rod.style.top = centerY + "px";
      rod.style.width = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY)) + "px";
      rod.style.transform = "rotate(" + (Math.atan2(y - centerY, x - centerX) * 180 / Math.PI) + "deg)";
      box.appendChild(rod);

      // The candy-coated food with a little letter flag.
      var button = make("button", "pole-food");
      button.type = "button";
      button.dataset.id = food.id;
      button.setAttribute("aria-label", food.word);
      button.style.left = x + "px";
      button.style.top = y + "px";
      button.appendChild(Shop.makeStickFood(food));
      // The letter flag sits on the outer side, away from the other sticks.
      var flag = make("span", "pole-flag", Game.showLetter(food.letter));
      flag.style.fontFamily = CONFIG.letterFont;
      flag.style.left = 52 + Math.cos(angle) * 62 + "px";
      flag.style.top = 52 + Math.sin(angle) * 62 + "px";
      if (String(food.letter).length > 1) flag.style.fontSize = "22px";
      button.appendChild(flag);
      onTap(button, function () { self.tapFood(food, button); });
      box.appendChild(button);
    });
  },

  tapFood: function (food, button) {
    if (Game.screen !== "pole") return;
    this.tapped = true;
    Game.step++;
    replayClass(button, "wiggle", 500);
    replayClass(button.querySelector(".pole-flag"), "flag-glow", 900);
    Sound.fx("pop");
    Sound.speak(Sound.letterAndWord(food));
  },

  // The 👆 hand: first a stick, then (after she listened) the way back.
  hintTarget: function () {
    if (this.tapped) return $("#pole-close");
    return $("#pole-sticks .pole-food");
  },

  instruction: function () {
    return [Sound.phrasePart(this.tapped ? "poleBack" : "pole")];
  },
};

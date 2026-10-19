/* =====================================================================
   pole.js — the straw pole (草把子).

   Real tanghulu sellers carry a pole with a fat bundle of straw on top,
   with the candy sticks pushed into it. Here every food she has won from
   a letter jar gets a stick in the straw, with its letter on a little
   flag. Tap a stick to hear its sound and word again ("sss… sidrun"):
   she can practise her letters whenever she likes.
   ===================================================================== */

var Pole = {
  tapped: false, // has she tapped a stick since opening the pole?

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
  celebrateNew: function () {
    this.renderButton();
    var button = $("#pole-button");
    if (button.classList.contains("hidden")) return;
    replayClass(button, "wiggle", 500);
    var at = Stage.where(button);
    Effects.sparkles(at.x, at.y - 30, 8);
  },

  open: function () {
    if (Game.busy || Game.screen !== "shop") return;
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
    if (Game.screen !== "pole") return;
    $("#pole-screen").classList.add("hidden");
    Sound.silence();
    Game.backToShop(true);
  },

  // The big pole: the sticks point out of the straw in a circle.
  render: function () {
    var self = this;
    var box = $("#pole-sticks");
    box.innerHTML = "";
    var foods = this.foods();
    var centerX = 500, centerY = 320, radius = 215;
    foods.forEach(function (food, i) {
      var angle = -Math.PI / 2 + (i / foods.length) * Math.PI * 2;
      var x = centerX + Math.cos(angle) * radius;
      var y = centerY + Math.sin(angle) * radius;

      // The wooden stick from the straw to the food.
      var rod = make("div", "pole-rod-stick");
      rod.style.left = centerX + "px";
      rod.style.top = centerY + "px";
      rod.style.width = radius + "px";
      rod.style.transform = "rotate(" + (angle * 180 / Math.PI) + "deg)";
      box.appendChild(rod);

      // The candy-coated food with a little letter flag.
      var button = make("button", "pole-food");
      button.type = "button";
      button.dataset.id = food.id;
      button.setAttribute("aria-label", food.word);
      button.style.left = x + "px";
      button.style.top = y + "px";
      button.appendChild(Shop.makeStickFood(food));
      var flag = make("span", "pole-flag", Game.showLetter(food.letter));
      flag.style.fontFamily = CONFIG.letterFont;
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
    var letterSound = Sound.letterSound(food);
    Sound.speak(letterSound ? [letterSound, Sound.wordPart(food)] : [Sound.wordPart(food)]);
  },

  // The 👆 hand: first a stick, then (after she listened) the way back.
  hintTarget: function () {
    if (this.tapped) return $("#pole-close");
    return $("#pole-sticks .pole-food");
  },

  instruction: function () {
    return [Sound.phrasePart("pole")];
  },
};

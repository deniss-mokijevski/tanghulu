/* =====================================================================
   effects.js — flying sugar, hearts, sparkles and confetti.
   All positions are in stage pixels (the 1000 × 640 game area).
   ===================================================================== */

var Effects = {
  layer: null,

  init: function () {
    this.layer = $("#fx-layer");
  },

  // Animate one element along a list of steps, then remove it.
  // Gives back a promise that ends when the animation is done.
  animate: function (element, steps, duration, easing) {
    this.layer.appendChild(element);
    if (!element.animate) {                 // very old browsers: no animation
      return wait(duration).then(function () { element.remove(); });
    }
    var animation = element.animate(steps, {
      duration: duration,
      easing: easing || "linear",
      fill: "forwards",
    });
    return new Promise(function (resolve) {
      animation.onfinish = function () { element.remove(); resolve(); };
      setTimeout(function () { element.remove(); resolve(); }, duration + 200);
    });
  },

  // Something thrown into the air that falls down again (gravity).
  //   vx, vy = speed in pixels per second, spin = degrees, time = ms
  throwPiece: function (element, x, y, vx, vy, spin, time) {
    element.style.left = x + "px";
    element.style.top = y + "px";
    var gravity = 1400;
    var steps = [];
    for (var i = 0; i <= 6; i++) {
      var t = (i / 6) * (time / 1000);
      var dx = vx * t;
      var dy = vy * t + 0.5 * gravity * t * t;
      steps.push({
        transform: "translate(-50%, -50%) translate(" + dx + "px," + dy + "px) rotate(" + (spin * i / 6) + "deg)",
        opacity: i < 4 ? 1 : 1 - (i - 3) / 3,
      });
    }
    return this.animate(element, steps, time);
  },

  // Sugar pieces flying off when the bear bites.
  sugar: function (x, y) {
    var colors = ["#fff4cf", "#ffd27a", "#ffb84d", "#ffffff", "#ffe29a"];
    for (var i = 0; i < 16; i++) {
      var piece = make("div", "fx-shard");
      var size = randomBetween(8, 18);
      piece.style.width = size + "px";
      piece.style.height = size * randomBetween(0.6, 1.2) + "px";
      piece.style.background = randomItem(colors);
      var angle = randomBetween(-Math.PI, 0); // mostly upwards
      var speed = randomBetween(250, 520);
      this.throwPiece(piece, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        randomBetween(-540, 540), randomBetween(700, 1000));
    }
  },

  // Emoji that float up and fade (hearts, sour drops…).
  floatUp: function (x, y, emojis, count) {
    for (var i = 0; i < count; i++) {
      var bit = make("div", "fx-emoji", randomItem(emojis));
      bit.style.left = x + randomBetween(-60, 60) + "px";
      bit.style.top = y + randomBetween(-20, 20) + "px";
      bit.style.fontSize = randomBetween(28, 48) + "px";
      var sway = randomBetween(-50, 50);
      this.animate(bit, [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
        { transform: "translate(-50%, -50%) translate(" + sway / 2 + "px, -60px) scale(1)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -50%) translate(" + sway + "px, -190px) scale(1.1)", opacity: 0 },
      ], randomBetween(1100, 1600) + i * 90, "ease-out");
    }
  },

  hearts: function (x, y) {
    this.floatUp(x, y, ["❤️", "💖", "💕", "💗"], 6);
  },

  // Sparkles bursting out from a point.
  sparkles: function (x, y, count) {
    count = count || 14;
    for (var i = 0; i < count; i++) {
      var bit = make("div", "fx-emoji", randomItem(["✨", "⭐", "🌟", "✨"]));
      bit.style.left = x + "px";
      bit.style.top = y + "px";
      bit.style.fontSize = randomBetween(22, 44) + "px";
      var angle = (i / count) * Math.PI * 2 + randomBetween(-0.2, 0.2);
      var distance = randomBetween(90, 200);
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance;
      this.animate(bit, [
        { transform: "translate(-50%, -50%) scale(0.2)", opacity: 1 },
        { transform: "translate(-50%, -50%) translate(" + dx + "px," + dy + "px) scale(1.2) rotate(90deg)", opacity: 1, offset: 0.7 },
        { transform: "translate(-50%, -50%) translate(" + dx * 1.15 + "px," + dy * 1.15 + "px) scale(0.6) rotate(140deg)", opacity: 0 },
      ], randomBetween(800, 1200), "ease-out");
    }
  },

  // Confetti falling over the whole stage.
  confetti: function () {
    var colors = ["#ff5d8f", "#ffd23f", "#3bceac", "#5e9cff", "#ff9f45", "#c77dff"];
    for (var i = 0; i < 46; i++) {
      var piece = make("div", "fx-confetti");
      piece.style.background = randomItem(colors);
      var x = randomBetween(0, Stage.width);
      this.throwPiece(piece, x, randomBetween(-60, -10), randomBetween(-80, 80),
        randomBetween(0, 200), randomBetween(-720, 720), randomBetween(1500, 2300));
    }
    for (var j = 0; j < 6; j++) {
      var party = make("div", "fx-emoji", randomItem(["🎉", "🎊", "⭐", "🍬"]));
      party.style.fontSize = "44px";
      this.throwPiece(party, randomBetween(100, Stage.width - 100), Stage.height + 20,
        randomBetween(-120, 120), randomBetween(-1150, -850), randomBetween(-360, 360), 1700);
    }
  },

  // Drops of syrup dripping from a point.
  drips: function (x, y) {
    for (var i = 0; i < 4; i++) {
      var drop = make("div", "fx-drop");
      this.throwPiece(drop, x + randomBetween(-25, 25), y, randomBetween(-10, 10),
        randomBetween(0, 60), 0, randomBetween(500, 800));
    }
  },

  // Fly a copy of an element from one spot to another (stage pixels).
  // Gives back a promise that ends when it lands.
  fly: function (element, from, to, time, size) {
    element.classList.add("fx-flyer");
    element.style.left = from.x + "px";
    element.style.top = from.y + "px";
    if (size) {
      element.style.width = size + "px";
      element.style.height = size + "px";
    }
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var lift = -Math.min(160, Math.abs(dx) * 0.35 + 60); // arc upwards
    var endScale = to.scale || 1;
    return this.animate(element, [
      { transform: "translate(-50%, -50%) scale(1)" },
      { transform: "translate(-50%, -50%) translate(" + dx * 0.5 + "px," + (dy * 0.5 + lift) + "px) scale(" + (1 + endScale) / 1.6 + ") rotate(-15deg)", offset: 0.5 },
      { transform: "translate(-50%, -50%) translate(" + dx + "px," + dy + "px) scale(" + endScale + ")" },
    ], time || 800, "ease-in-out");
  },
};

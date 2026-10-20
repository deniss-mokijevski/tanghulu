/* =====================================================================
   hint.js — the bouncing 👆 hand.

   If she doesn't tap anything for a few seconds (5 by default), a hand
   bounces next to the thing to tap next. The first time it appears for
   a step, the instruction is also spoken again.
   ===================================================================== */

var Hint = {
  hand: null,
  timer: null,
  spokenStep: -1, // the game step we last repeated the instruction for

  init: function () {
    this.hand = $("#hint-hand");
    var self = this;
    // Any touch anywhere hides the hand and restarts the countdown.
    var eventName = window.PointerEvent ? "pointerdown" : "touchstart";
    document.addEventListener(eventName, function () { self.restart(); }, true);
    this.restart();
  },

  restart: function () {
    this.hide();
    clearTimeout(this.timer);
    var self = this;
    this.timer = setTimeout(function () { self.show(); }, (CONFIG.idleHintSeconds || 5) * 1000);
  },

  hide: function () {
    if (this.hand) this.hand.classList.add("hidden");
  },

  // Try again a little later (for example while an animation is playing).
  later: function () {
    clearTimeout(this.timer);
    var self = this;
    this.timer = setTimeout(function () { self.show(); }, 1000);
  },

  show: function () {
    if (Game.busy || Game.paused()) {
      this.later();
      return;
    }
    var target = Game.hintTarget();
    if (!target || !target.getBoundingClientRect().width) {
      this.later();
      return;
    }
    this.pointAt(target);

    // Say the instruction again — only once per step, so it doesn't nag.
    if (Sound.unlocked && Game.step !== this.spokenStep && !Sound.speaking) {
      this.spokenStep = Game.step;
      Game.sayInstruction();
    }
  },

  // Show the hand next to one thing (until the next touch).
  pointAt: function (target) {
    // Point up at things in the top half, down at things in the bottom half.
    // (Shelf foods always get the hand below them, so it doesn't cover
    // the food in the row above.)
    var where = Stage.where(target);
    var pointUp = where.y < Stage.height * 0.55 || target.classList.contains("food-button");
    this.hand.textContent = pointUp ? "👆" : "👇";
    this.hand.classList.toggle("down", !pointUp);
    this.hand.style.left = where.x + "px";
    this.hand.style.top = (pointUp ? where.y + where.height / 2 : where.y - where.height / 2) + "px";
    this.hand.classList.remove("hidden");
  },
};

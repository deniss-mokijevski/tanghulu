/* =====================================================================
   shop.js — the candy stick shop.

   1. Tap a food  → it jumps onto the stick (up to 5, repeats allowed)
   2. Tap the pot → the stick dips into syrup and comes out glossy
   3. Tap the stick → the bear bites the top food (crunch!)
   4. Empty stick → a little party, then a letter jar appears
   ===================================================================== */

var Shop = {
  stick: [],      // the foods on the stick, bottom one first
  coated: false,  // has the stick been dipped in syrup?
  eating: false,  // has the bear started eating this stick?
  landing: [],    // foods still flying onto the stick

  init: function () {
    var self = this;
    onTap($("#pot-button"), function () { self.tapPot(); });
    onTap($("#stick-area"), function () { self.tapStick(); });
    onTap($("#customer"), function () { self.tapCustomer(); });
  },

  // Show the shop (called when she presses ▶ and after each jar).
  enter: function () {
    this.renderShelf();
    this.renderCustomer();
    this.renderStick();
  },

  /* -------------------------------------------------------------------
     Drawing things
     ------------------------------------------------------------------- */

  // The shelf shows every food she has unlocked.
  //   hiddenId = a food that is about to fly in (kept invisible for now)
  renderShelf: function (hiddenId) {
    var self = this;
    var grid = $("#shelf-grid");
    grid.innerHTML = "";
    var foods = allFoods().filter(function (food) { return Progress.isUnlocked(food.id); });
    grid.classList.toggle("small", foods.length > 16); // lots of foods → smaller buttons
    foods.forEach(function (food) {
      var button = make("button", "food-button");
      button.type = "button";
      button.dataset.id = food.id;
      button.setAttribute("aria-label", food.word);
      button.appendChild(Assets.picture("foods", food, { framed: true }));
      self.showStars(button, Progress.stars(food.id));
      if (food.id === hiddenId) button.classList.add("arriving");
      onTap(button, function () { self.tapFood(food, button); });
      grid.appendChild(button);
    });
  },

  // A small ⭐ on foods she reviewed (with a number when there are more).
  showStars: function (button, count) {
    var old = button.querySelector(".star-badge");
    if (old) old.remove();
    if (!count) return;
    var badge = make("span", "star-badge", "⭐");
    if (count > 1) badge.appendChild(make("b", null, String(count)));
    button.appendChild(badge);
  },

  // Find a food's button on the shelf.
  shelfButton: function (foodId) {
    var buttons = document.querySelectorAll("#shelf-grid .food-button");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.id === foodId) return buttons[i];
    }
    return null;
  },

  renderCustomer: function () {
    var body = $("#customer-body");
    body.innerHTML = "";
    body.appendChild(Assets.picture("characters", CONFIG.customer, { framed: true }));
    body.className = "idle";
  },

  // Draw the foods on the stick (used when the shop opens).
  renderStick: function () {
    var box = $("#stick-foods");
    box.innerHTML = "";
    var self = this;
    this.stick.forEach(function (food) { box.appendChild(self.makeStickFood(food)); });
    $("#stick").classList.toggle("coated", this.coated);
  },

  // One food on the stick, with its (hidden until dipped) sugar coat.
  makeStickFood: function (food) {
    var piece = make("div", "stick-food");
    piece.appendChild(Assets.picture("foods", food, { framed: false }));
    var coat = make("div", "coat");
    coat.appendChild(make("div", "sweep"));
    piece.appendChild(coat);
    return piece;
  },

  /* -------------------------------------------------------------------
     Tapping a food on the shelf
     ------------------------------------------------------------------- */
  tapFood: function (food, button) {
    if (Game.busy || Game.screen !== "shop") return;

    // The stick is already dipped: feed the bear first.
    if (this.coated || this.eating) {
      replayClass(button, "wiggle", 500);
      Sound.fx("boing");
      Game.say("feedFirst");
      return;
    }
    // The stick is full.
    if (this.stick.length >= CONFIG.maxOnStick) {
      replayClass(button, "wiggle", 500);
      replayClass($("#stick"), "wiggle", 500);
      Sound.fx("boing");
      Game.say("stickFull");
      return;
    }

    this.stick.push(food);
    Game.step++;
    Sound.fx("pop");

    // Say the food's name ("cherry!"). When the stick becomes full,
    // also say what to do next.
    var parts = [Sound.wordPart(food)];
    if (this.stick.length >= CONFIG.maxOnStick) parts.push(Sound.phrasePart("stickFull"));
    Sound.speak(parts);

    // Put the food on the stick (invisible), fly a copy there, then show it.
    var piece = this.makeStickFood(food);
    piece.style.visibility = "hidden";
    $("#stick-foods").appendChild(piece);
    var from = Stage.where(button);
    var to = Stage.where(piece);
    var flyer = make("div");
    flyer.style.fontSize = "62px";
    flyer.appendChild(Assets.picture("foods", food, { framed: false }));
    var flight = Effects.fly(flyer, from, to, 380, 84)
      .then(function () {
        piece.style.visibility = "";
        replayClass(piece, "landing", 400);
      });
    var self = this;
    this.landing.push(flight);
    flight.then(function () {
      self.landing = self.landing.filter(function (f) { return f !== flight; });
    });
  },

  /* -------------------------------------------------------------------
     Tapping the pot: dip the stick in syrup
     ------------------------------------------------------------------- */
  tapPot: function () {
    if (Game.busy || Game.screen !== "shop") return;
    if (this.stick.length === 0) {
      // Nothing to dip yet.
      replayClass($("#pot-front"), "wiggle", 500);
      replayClass($("#syrup"), "splash", 500);
      Sound.fx("boing");
      Game.say("tapFood");
      return;
    }
    this.dip();
  },

  dip: async function () {
    Game.busy = true;
    Hint.hide();
    await Promise.all(this.landing); // let flying foods land first
    var stick = $("#stick");
    var self = this;

    // Where is the pot compared to the stick?
    var stickAt = Stage.where(stick);
    var potAt = Stage.where($("#syrup"));
    var dx = potAt.x - stickAt.x;
    // After turning the stick upside down, push it down until all the
    // food is inside the pot.
    var down = 290;
    var up = -110;
    function pose(x, y, turn) {
      return { transform: "translate(" + x + "px," + y + "px) rotate(" + turn + "deg)" };
    }

    Sound.fx("whoosh");
    var steps = [
      pose(0, 0, 0),
      Object.assign(pose(dx, up, 180), { offset: 0.28 }),
      Object.assign(pose(dx, down, 180), { offset: 0.45 }),
      Object.assign(pose(dx - 14, down, 186), { offset: 0.54 }),
      Object.assign(pose(dx + 14, down, 174), { offset: 0.63 }),
      Object.assign(pose(dx, down, 180), { offset: 0.7 }),
      Object.assign(pose(dx, up, 180), { offset: 0.86 }),
      pose(0, 0, 0),
    ];
    var time = 2100;
    if (stick.animate) stick.animate(steps, { duration: time, easing: "ease-in-out" });

    // Splash when it goes in…
    setTimeout(function () {
      Sound.fx("dip");
      replayClass($("#syrup"), "splash", 500);
    }, time * 0.43);
    // …and it is coated while it is inside.
    setTimeout(function () {
      self.coated = true;
      stick.classList.add("coated");
    }, time * 0.6);
    setTimeout(function () {
      Effects.drips(potAt.x, potAt.y - 40);
    }, time * 0.8);

    await wait(time + 50);
    this.coated = true;
    stick.classList.add("coated");

    // One shine sweep up the glossy stick.
    var coats = stick.querySelectorAll(".coat");
    for (var i = 0; i < coats.length; i++) {
      coats[i].style.setProperty("--delay", (i * 0.08) + "s");
    }
    replayClass(stick, "shining", 1400);
    Sound.fx("shine");
    await wait(450);

    Game.busy = false;
    Game.step++;
    Game.say("tapStick");
  },

  /* -------------------------------------------------------------------
     Tapping the stick: the bear takes a bite
     ------------------------------------------------------------------- */
  tapStick: function () {
    if (Game.busy || Game.screen !== "shop") return;
    if (this.stick.length === 0) {
      replayClass($("#stick"), "wiggle", 500);
      Sound.fx("boing");
      Game.say("tapFood");
      return;
    }
    if (!this.coated) {
      // Not dipped yet: the pot wiggles to show where to go.
      replayClass($("#pot-front"), "wiggle", 500);
      replayClass($("#pot-back"), "wiggle", 500);
      Sound.fx("boing");
      Game.say("dipFirst");
      return;
    }
    this.bite();
  },

  // Tapping the bear works like tapping the stick once it is dipped.
  tapCustomer: function () {
    if (Game.busy || Game.screen !== "shop") return;
    if (this.coated && this.stick.length > 0) {
      this.bite();
      return;
    }
    replayClass($("#customer-body"), "chomp", 300);
    Sound.fx("pop");
  },

  bite: async function () {
    Game.busy = true;
    Hint.hide();
    this.eating = true;
    var food = this.stick[this.stick.length - 1];
    var piece = $("#stick-foods").lastElementChild;
    var foodAt = Stage.where(piece);
    var customer = $("#customer");
    var body = $("#customer-body");
    var bearAt = Stage.where(customer);

    // The bear leans over to the top food…
    var dx = foodAt.x + 125 - bearAt.x;
    var dy = foodAt.y - 20 - bearAt.y;
    if (customer.animate) {
      customer.animate([
        { transform: "translate(0, 0) rotate(0)" },
        { transform: "translate(" + dx + "px," + dy + "px) rotate(-14deg)", offset: 0.45 },
        { transform: "translate(" + dx + "px," + dy + "px) rotate(-10deg)", offset: 0.6 },
        { transform: "translate(0, 0) rotate(0)" },
      ], { duration: 560, easing: "ease-in-out" });
    }
    await wait(250);

    // …CRUNCH!
    Sound.fx("crunch");
    Effects.sugar(foodAt.x, foodAt.y);
    piece.classList.add("eaten");
    this.stick.pop();
    Game.step++;
    await wait(260);
    piece.remove();

    if (food.sour) {
      // Sour lemon: pucker and shake!
      replayClass(body, "sour", 1200);
      Sound.fx("sour");
      Effects.floatUp(bearAt.x, bearAt.y - 90, ["💦", "💫", "🍋"], 5);
      await wait(900);
    } else {
      replayClass(body, "happy", 800);
      Effects.hearts(bearAt.x, bearAt.y - 110);
      await wait(150);
    }

    if (this.stick.length === 0) {
      await this.celebrate();
    } else {
      Game.busy = false;
    }
  },

  // The stick is empty: a short party, then the letter jar.
  celebrate: async function () {
    Game.busy = true;
    this.coated = false;
    this.eating = false;
    $("#stick").classList.remove("coated");
    var bearAt = Stage.where($("#customer"));
    await wait(200);
    Sound.fx("cheer");
    Effects.confetti();
    replayClass($("#customer-body"), "happy", 800);
    Effects.hearts(bearAt.x, bearAt.y - 110);
    await Promise.race([Sound.speak([Sound.phrasePart("yay")]), wait(4000)]);
    await wait(300);
    Game.busy = false;
    Game.step++;
    Game.afterStick();
  },
};

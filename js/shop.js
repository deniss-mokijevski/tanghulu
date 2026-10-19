/* =====================================================================
   shop.js — the candy stick shop.

   1. Tap a food  → it jumps onto the stick (up to 5, repeats allowed)
   2. Tap the pot → the fire melts the sugar: it bubbles and turns
                    golden (like the real tanghulu sellers' copper pot),
                    then the stick dips in and comes out glossy
   3. A thin sugar "wing" forms on the tip. Tap it: snap! (just for fun)
   4. Tap the stick → the bear bites the top food (crack! crunch!)
   5. Empty stick → a little party, then a letter jar appears
   The bear also wishes for one food (a picture in a bubble). Putting it
   on the stick makes the bear extra happy, but every stick is fine.
   ===================================================================== */

var Shop = {
  stick: [],      // the foods on the stick, bottom one first
  coated: false,  // has the stick been dipped in syrup?
  eating: false,  // has the bear started eating this stick?
  landing: [],    // foods still flying onto the stick
  syrup: 0,       // how far the sugar has cooked (0 = cold)
  wish: null,     // the food the bear would like (or null)
  wishMet: false, // has the bear eaten its wish this round?

  init: function () {
    var self = this;
    onTap($("#pot-button"), function () { self.tapPot(); });
    onTap($("#stick-area"), function () { self.tapStick(); });
    onTap($("#customer"), function () { self.tapCustomer(); });
    onTap($("#wish-bubble"), function () { self.tapWish(); });
  },

  // Show the shop (called when she presses ▶ and after each jar).
  enter: function () {
    this.renderShelf();
    this.renderCustomer();
    this.renderStick();
    this.renderPot();
    this.newWish();
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
    this.fitShelf(foods.length);
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

  // Pick the button size so that every food fits on the shelf.
  // Up to 16 foods get big 92 px buttons; more foods make them smaller.
  fitShelf: function (count) {
    var width = 386, height = 420;  // the inside of the shelf, in pixels
    var gap = 6, rowGap = 12;
    var cols, cell, rows;
    for (cols = 4; cols < 12; cols++) {
      if (cols > 4) rowGap = 8;        // pack a little tighter when it's crowded
      cell = Math.min(92, Math.floor((width - (cols - 1) * gap) / cols));
      rows = Math.ceil(count / cols);
      if (rows * (cell + 4) + (rows - 1) * rowGap <= height) break;
    }
    var shelf = $("#shelf");
    shelf.style.setProperty("--cols", cols);
    shelf.style.setProperty("--cell", cell + "px");
    shelf.style.setProperty("--row", (cell + 4 + rowGap) + "px");
    $("#shelf-grid").classList.toggle("small", cell < 80);
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

  // The food at the top of the stick (the next one the bear eats).
  topPiece: function () {
    var pieces = document.querySelectorAll("#stick-foods .stick-food");
    return pieces[pieces.length - 1] || null;
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
    if (this.wish && food.id === this.wish.id) {
      // The food the bear wished for is on the stick: the bubble nods.
      $("#wish-bubble").classList.add("granted");
      replayClass($("#wish-bubble"), "wiggle", 500);
    }

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
     Tapping the pot: melt the sugar, then dip the stick in the syrup
     (config.js potTaps: 3 = two taps to cook, the third one dips)
     ------------------------------------------------------------------- */
  cookSteps: function () {
    return Math.max(0, Math.round(CONFIG.potTaps || 1) - 1);
  },

  syrupReady: function () {
    return this.syrup >= this.cookSteps();
  },

  // Show how far the syrup has cooked: cold → bubbling → golden.
  renderPot: function () {
    var state = this.syrupReady() ? "ready" : (this.syrup > 0 ? "warm" : "cold");
    $("#pot-back").setAttribute("data-syrup", state);
    $("#pot-fire").classList.toggle("on", this.syrup > 0 || this.cookSteps() === 0);
  },

  tapPot: function () {
    if (Game.busy || Game.screen !== "shop") return;
    if (!this.syrupReady()) {
      this.cook();
      return;
    }
    if (this.stick.length === 0) {
      // The syrup is ready, but there is nothing to dip yet.
      replayClass($("#pot-front"), "wiggle", 500);
      replayClass($("#syrup"), "splash", 500);
      Sound.fx("boing");
      Game.say("tapFood");
      return;
    }
    this.dip();
  },

  // One tap of cooking: more heat, smaller bubbles, a more golden color.
  cook: function () {
    this.syrup++;
    Game.step++;
    this.renderPot();
    Sound.fx("bubble");
    replayClass($("#syrup"), "splash", 500);
    if (this.syrupReady()) {
      Sound.fx("pling");
      var potAt = Stage.where($("#syrup"));
      Effects.sparkles(potAt.x, potAt.y, 8);
      Game.say(this.stick.length ? "syrupReady" : "tapFood");
    } else {
      Game.say("cook");
    }
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

    // The bear steps back while the stick swings past.
    var customer = $("#customer");
    customer.style.zIndex = "1";

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
    customer.style.zIndex = "";
    this.coated = true;
    stick.classList.add("coated");

    // One shine sweep up the glossy stick.
    var coats = stick.querySelectorAll(".coat");
    for (var i = 0; i < coats.length; i++) {
      coats[i].style.setProperty("--delay", (i * 0.08) + "s");
    }
    replayClass(stick, "shining", 1400);
    Sound.fx("shine");
    this.addWing();
    await wait(450);

    Game.busy = false;
    Game.step++;
    Game.say("tapStick");
  },

  /* -------------------------------------------------------------------
     The sugar wing (糖风): a thin sheet of sugar on the tip of the stick,
     like the real sellers make on their stone slab. Tap it: snap!
     ------------------------------------------------------------------- */
  addWing: function () {
    this.removeWing();
    var self = this;
    var wing = make("div", "sugar-wing");
    wing.appendChild(make("span", "wing-glass"));
    onTap(wing, function (event) {
      event.stopPropagation(); // it's on the stick, but it is not a bite
      self.snapWing(wing);
    });
    $("#stick-foods").appendChild(wing); // it sits on top of the top food
  },

  removeWing: function () {
    var wing = $("#stick-foods .sugar-wing");
    if (wing) wing.remove();
    return wing;
  },

  snapWing: async function (wing) {
    if (Game.busy || Game.screen !== "shop" || !wing.parentNode) return;
    Game.busy = true;
    Hint.hide();
    var at = Stage.where(wing);
    Sound.fx("snap");
    Effects.glass(at.x, at.y);
    wing.remove();
    // The little piece of sugar flies to the bear: a tiny treat.
    var flyer = make("div", "wing-flyer");
    flyer.appendChild(make("span", "wing-glass"));
    var bearAt = Stage.where($("#customer"));
    await Effects.fly(flyer, at, { x: bearAt.x - 20, y: bearAt.y - 10, scale: 0.6 }, 650, 80);
    Sound.fx("crunch");
    replayClass($("#customer-body"), "chomp", 300);
    Effects.floatUp(bearAt.x, bearAt.y - 110, ["✨", "💛"], 4);
    Game.busy = false;
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
    var piece = this.topPiece();
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

    // …CRACK! CRUNCH! (the glassy sugar shell breaks)
    Sound.fx("crack");
    Sound.fx("crunch");
    Effects.sugar(foodAt.x, foodAt.y);
    Effects.glass(foodAt.x, foodAt.y);
    var wing = this.removeWing(); // the sugar wing breaks off with the first bite
    if (wing) Effects.glass(foodAt.x, foodAt.y - 40);
    piece.classList.add("eaten");
    this.stick.pop();
    Game.step++;
    await wait(260);
    piece.remove();

    if (food.sour) {
      // Sour lemon: pucker and shake!
      replayClass(body, "sour", 1200);
      Sound.fx("sour");
      Effects.floatUp(bearAt.x, bearAt.y - 90, ["💦", "💫", food.emoji || "🍋"], 5);
      await wait(900);
    } else {
      replayClass(body, "happy", 800);
      Effects.hearts(bearAt.x, bearAt.y - 110);
      await wait(150);
    }

    // The food the bear wished for: extra happy!
    if (this.wish && food.id === this.wish.id && !this.wishMet) {
      this.wishMet = true;
      var bubble = $("#wish-bubble");
      var bubbleAt = Stage.where(bubble);
      Effects.sparkles(bubbleAt.x, bubbleAt.y, 12);
      Effects.hearts(bearAt.x, bearAt.y - 110);
      Sound.fx("star");
      replayClass(body, "happy", 800);
      bubble.classList.add("hidden");
      var thanks = Sound.speak([Sound.phrasePart("wishYes")]);
      if (this.stick.length === 0) await Promise.race([thanks, wait(3000)]);
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
    this.syrup = 0;          // the fire goes out; next stick, the sugar melts again
    this.renderPot();
    $("#wish-bubble").classList.add("hidden");
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

  /* -------------------------------------------------------------------
     The bear's wish: one food in a thought bubble
     ------------------------------------------------------------------- */
  newWish: function () {
    this.wishMet = false;
    var bubble = $("#wish-bubble");
    bubble.innerHTML = "";
    bubble.classList.remove("granted");
    var foods = allFoods().filter(function (food) { return Progress.isUnlocked(food.id); });
    if (!CONFIG.bearWishes || foods.length === 0) {
      this.wish = null;
      bubble.classList.add("hidden");
      return;
    }
    // Not the same food twice in a row.
    var last = this.wish;
    var choices = foods.filter(function (food) { return !last || food.id !== last.id; });
    this.wish = randomItem(choices.length ? choices : foods);
    bubble.appendChild(make("span", "wish-dot small"));
    bubble.appendChild(make("span", "wish-dot"));
    var picture = make("div", "wish-food");
    picture.appendChild(Assets.picture("foods", this.wish, { framed: false }));
    bubble.appendChild(picture);
    bubble.classList.remove("hidden");
    replayClass(bubble, "pop-in", 700);
  },

  // What the bear says: "maasikas, palun!"
  wishParts: function () {
    if (!this.wish || this.wishMet) return [];
    return [Sound.wordPart(this.wish), Sound.phrasePart("please")];
  },

  // Tapping the bubble: the bear says its wish again.
  tapWish: function () {
    if (Game.screen !== "shop" || !this.wish) return;
    replayClass($("#wish-bubble"), "wiggle", 500);
    Sound.speak(this.wishParts());
  },
};

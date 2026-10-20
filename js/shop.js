/* =====================================================================
   shop.js — the candy stick shop.

   1. Tap a food in its bowl → it hops out onto the stick (up to 5,
                    repeats allowed; a bowl never runs out). A food she
                    hasn't won yet has a closed bowl. The shelf of bowls
                    scrolls sideways when there are many.
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
  glideTurn: 0,   // counts the shelf's slides (a newer one or a finger stops the old one)
  closedSaidAt: 0, // when "this bowl is still closed" was last said
  touchedAt: 0,   // when she last touched the screen

  init: function () {
    var self = this;
    onTap($("#pot-button"), function () { self.tapPot(); });
    onTap($("#stick-area"), function () { self.tapStick(); });
    onTap($("#customer"), function () { self.tapCustomer(); });
    onTap($("#wish-bubble"), function () { self.tapWish(); });

    // The shelf: her finger always wins over our own slides.
    var box = $("#shelf-scroll");
    var touchName = window.PointerEvent ? "pointerdown" : "touchstart";
    watchScroller(box);
    box.addEventListener(touchName, function () { self.stopGlide(); }, true);
    // A mouse wheel scrolls it sideways too (for grown-ups on a computer).
    box.addEventListener("wheel", function (event) {
      self.stopGlide();
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        box.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    }, { passive: false });
    document.addEventListener(touchName, function () { self.touchedAt = Date.now(); }, true);
  },

  // Show the shop (called when she presses ▶ and after each jar).
  enter: function () {
    this.renderShelf();
    // Start with her newest food in the middle (and the next closed bowls beside it).
    var open = document.querySelectorAll("#shelf-grid .food-button");
    var newest = open[open.length - 1];
    var box = $("#shelf-scroll");
    if (newest) box.scrollLeft = newest.offsetLeft + newest.offsetWidth / 2 - box.clientWidth / 2;
    this.renderCustomer();
    this.renderStick();
    this.renderPot();
    this.newWish();
    this.nudgeShelf();
  },

  /* -------------------------------------------------------------------
     Drawing things
     ------------------------------------------------------------------- */

  // The shelf: every food in config.js has its own bowl, 3 to a column,
  // in the order written there. A food she has won is in an open bowl;
  // the others have a closed bowl with a lid.
  //   arrivingId = a food just won in the jar: its bowl still looks
  //                closed until the food flies in (see jar.js)
  renderShelf: function (arrivingId) {
    var self = this;
    var box = $("#shelf-scroll");
    var grid = $("#shelf-grid");
    var keep = box.scrollLeft;
    var foods = allFoods();
    grid.innerHTML = "";
    grid.style.width = Math.ceil(foods.length / 3) * 118 + 16 + "px";
    foods.forEach(function (food) {
      grid.appendChild(self.makeBowl(food, food.id === arrivingId));
    });
    box.scrollLeft = keep; // keep the shelf where she left it
  },

  // One bowl. The order of its parts is also the order they are drawn in:
  // the inside of the bowl, the food, the front of the bowl, the lid.
  makeBowl: function (food, arriving) {
    var self = this;
    var open = Progress.isUnlocked(food.id);
    var place = this.placeIndex(food.id);
    var button = make("button", "bowl glaze-" + (place < 0 ? 0 : 1 + place % 4));
    button.type = "button";
    button.dataset.id = food.id;
    button.appendChild(make("span", "bowl-inside"));
    if (open) {
      // "food-button" = a food she can take (the hints and the jar look for it).
      button.classList.add("food-button");
      if (arriving) button.classList.add("arriving");
      button.setAttribute("aria-label", food.word);
      button.appendChild(Assets.picture("foods", food, { framed: true }));
    } else {
      button.classList.add("closed");
      button.setAttribute("aria-label", "kinni");
    }
    button.appendChild(make("span", "bowl-body"));
    if (!open || arriving) {
      // The lid, with the icon of the place where the food is won.
      var level = CONFIG.levels[place];
      var lid = make("span", "bowl-lid");
      lid.appendChild(make("span", "lid-knob"));
      lid.appendChild(make("span", "lid-icon emoji", (level && level.icon) || "⭐"));
      button.appendChild(lid);
    }
    if (open) this.showStars(button, Progress.stars(food.id));
    onTapNoSwipe(button, function () { self.tapBowl(food, button); });
    return button;
  },

  // Which place (level) a food belongs to: -1 for the starter foods.
  placeIndex: function (foodId) {
    var isStarter = CONFIG.starterFoods.some(function (food) { return food && food.id === foodId; });
    if (isStarter) return -1;
    for (var i = 0; i < CONFIG.levels.length; i++) {
      var foods = CONFIG.levels[i].foods || [];
      for (var j = 0; j < foods.length; j++) {
        if (foods[j] && foods[j].id === foodId) return i;
      }
    }
    return -1;
  },

  /* -------------------------------------------------------------------
     Sliding the shelf sideways (when a bowl is out of sight)
     ------------------------------------------------------------------- */

  // Slide the shelf so that a bowl is fully in sight. Gives back a promise
  // (true when it got there). Anything that isn't a bowl: nothing to do.
  showBowl: function (button, instant) {
    var box = $("#shelf-scroll");
    if (!button || !box.contains(button)) return Promise.resolve(true);
    var left = button.offsetLeft;
    var right = left + button.offsetWidth;
    var goal = box.scrollLeft;
    if (left - 16 < goal) goal = left - 16;
    else if (right + 16 > goal + box.clientWidth) goal = right + 16 - box.clientWidth;
    if (instant) {
      box.scrollLeft = goal;
      return Promise.resolve(true);
    }
    return this.glideShelf(goal);
  },

  // Slide the shelf smoothly to "goal" (made here, so it works the same
  // on every tablet). Gives back a promise: false if a finger stopped it.
  glideShelf: function (goal) {
    var self = this;
    var box = $("#shelf-scroll");
    var from = box.scrollLeft;
    goal = Math.max(0, Math.min(Math.round(goal), box.scrollWidth - box.clientWidth));
    var turn = ++this.glideTurn;
    if (Math.abs(goal - from) < 2) return Promise.resolve(true);
    var time = Math.min(600, 250 + Math.abs(goal - from) * 0.6);
    var started = null;
    var done = false;
    box.gliding = true;
    return new Promise(function (resolve) {
      function finish(ok) {
        if (done) return;
        done = true;
        if (self.glideTurn === turn) {
          box.gliding = false;
          box.glideEnd = Date.now();
        }
        resolve(ok);
      }
      function step(now) {
        if (done) return;
        if (self.glideTurn !== turn) { finish(false); return; } // a finger took over
        if (started === null) started = now;
        var t = Math.min(1, (now - started) / time);
        box.scrollLeft = Math.round(from + (goal - from) * (1 - Math.pow(1 - t, 3))); // slows down at the end
        if (t < 1) requestAnimationFrame(step);
        else finish(true);
      }
      requestAnimationFrame(step);
      // A hidden page gets no animation frames: jump there and finish anyway
      // (but never after a finger stopped it, or the shelf would jump back).
      setTimeout(function () {
        if (done) return;
        var ok = self.glideTurn === turn;
        if (ok) box.scrollLeft = goal;
        finish(ok);
      }, time + 300);
    });
  },

  // Her finger (or a mouse wheel) stops any slide at once.
  stopGlide: function () {
    var box = $("#shelf-scroll");
    this.glideTurn++;
    if (box.gliding) {
      box.gliding = false;
      box.glideEnd = Date.now();
    }
  },

  // Once per visit: if she doesn't touch anything, the shelf slides a
  // little towards the hidden bowls and back ("there is more here").
  nudgeShelf: function () {
    var self = this;
    var box = $("#shelf-scroll");
    var since = Date.now();
    setTimeout(function () {
      var home = box.scrollLeft;
      var room = box.scrollWidth - box.clientWidth - home;
      if (self.touchedAt > since || Game.busy || Game.screen !== "shop" || room < 40) return;
      self.glideShelf(home + Math.min(80, room)).then(function (ok) {
        if (!ok) return;
        wait(250).then(function () {
          if (self.touchedAt <= since) self.glideShelf(home);
        });
      });
    }, 1500);
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
     Tapping a bowl on the shelf
     ------------------------------------------------------------------- */
  tapBowl: function (food, button) {
    if (Game.busy || Game.screen !== "shop") return;
    // A bowl that only peeks out at the edge: slide it in first.
    var box = $("#shelf-scroll");
    var middle = button.offsetLeft + button.offsetWidth / 2 - box.scrollLeft;
    if (middle < 0 || middle > box.clientWidth) {
      this.showBowl(button);
      return;
    }
    if (button.classList.contains("closed")) this.tapClosed(button);
    else this.tapFood(food, button);
  },

  // A closed bowl (a food she hasn't won yet): the lid rattles.
  tapClosed: function (button) {
    replayClass(button, "rattle", 450);
    Sound.fx("clink");
    // The words only now and then, and never over other speech.
    if (!Sound.speaking && Date.now() - this.closedSaidAt > 8000) {
      this.closedSaidAt = Date.now();
      Game.say("bowlClosed");
    }
  },

  // The lid of a new food's bowl pops off (while the food flies in).
  openBowl: function (button) {
    var lid = button.querySelector(".bowl-lid");
    if (!lid) return;
    var at = Stage.where(lid);
    Sound.fx("lid");
    Effects.sparkles(at.x, at.y, 6);
    lid.classList.add("opening");
    setTimeout(function () { lid.remove(); }, 600);
  },

  tapFood: function (food, button) {
    if (Game.busy || Game.screen !== "shop") return;

    // The stick is already dipped: feed the bear first.
    if (this.coated || this.eating) {
      replayClass(button, "wiggle", 500);
      Sound.fx("boing");
      if (!Sound.speaking) Game.say("feedFirst"); // don't cut off the bear's thanks
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

    // Put the food on the stick (invisible), fly a copy there from the
    // bowl, then show it. The bowl fills up again (it never runs out).
    var piece = this.makeStickFood(food);
    piece.style.visibility = "hidden";
    $("#stick-foods").appendChild(piece);
    var from = Stage.where(button.querySelector(".picture") || button);
    var to = Stage.where(piece);
    replayClass(button, "took", 350);
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
    if (this.coated || this.eating) {
      // Already dipped: now it's the bear's turn.
      replayClass($("#stick"), "wiggle", 500);
      Sound.fx("boing");
      if (!Sound.speaking) Game.say("feedFirst"); // don't cut off the bear's thanks
      return;
    }
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
    }
    if (this.stick.length === 0) {
      // The sugar is melting, but there is nothing on the stick yet.
      Sound.speak([Sound.phrasePart("tapFood")].concat(this.wishParts()));
    } else {
      Game.say(this.syrupReady() ? "syrupReady" : "cook");
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

  // What she hears: "Karu soov on… maasikas".
  wishParts: function () {
    if (!this.wish || this.wishMet) return [];
    return [Sound.phrasePart("wish"), Sound.wordPart(this.wish)];
  },

  // Tapping the bubble: the bear says its wish again.
  tapWish: function () {
    if (Game.screen !== "shop" || !this.wish) return;
    replayClass($("#wish-bubble"), "wiggle", 500);
    Sound.speak(this.wishParts());
    // Show where that food's bowl is on the shelf.
    var bowl = this.shelfButton(this.wish.id);
    if (bowl) this.showBowl(bowl).then(function () { replayClass(bowl, "wiggle", 500); });
  },
};

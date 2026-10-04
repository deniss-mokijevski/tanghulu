/* =====================================================================
   levels.js — which place she is in, and what the next jar holds.
   ===================================================================== */

var Levels = {

  // The place she is in: the first place that still has a locked food.
  // (When everything is unlocked she stays in the last place.)
  currentIndex: function () {
    for (var i = 0; i < CONFIG.levels.length; i++) {
      if (!this.isDone(i)) return i;
    }
    return CONFIG.levels.length - 1;
  },

  current: function () {
    return CONFIG.levels[this.currentIndex()];
  },

  // Are all foods of this place unlocked?
  isDone: function (index) {
    var level = CONFIG.levels[index];
    if (!level) return false;
    return level.foods.every(function (food) { return Progress.isUnlocked(food.id); });
  },

  // Is every place finished?
  allDone: function () {
    for (var i = 0; i < CONFIG.levels.length; i++) {
      if (!this.isDone(i)) return false;
    }
    return true;
  },

  // The next locked food of a place (in the order written in config.js).
  nextLockedFood: function (index) {
    var level = CONFIG.levels[index];
    if (!level) return null;
    for (var i = 0; i < level.foods.length; i++) {
      if (!Progress.isUnlocked(level.foods[i].id)) return level.foods[i];
    }
    return null;
  },

  // All letters taught in places 0 … index (no repeats).
  lettersUpTo: function (index) {
    var letters = [];
    for (var i = 0; i <= index && i < CONFIG.levels.length; i++) {
      CONFIG.levels[i].foods.forEach(function (food) {
        if (food.letter && letters.indexOf(food.letter) === -1) letters.push(food.letter);
      });
    }
    return letters;
  },

  // The first food that teaches this letter (used for its sound).
  foodForLetter: function (letter) {
    for (var i = 0; i < CONFIG.levels.length; i++) {
      var foods = CONFIG.levels[i].foods;
      for (var j = 0; j < foods.length; j++) {
        if (foods[j].letter === letter) return foods[j];
      }
    }
    return null;
  },

  /* -------------------------------------------------------------------
     What goes in the next jar?
       • normally: the next locked food of the current place
       • after level 1, every 3rd jar: a review of a letter she already has
         (letters she missed come up more often)
       • when every place is finished: always a review
     Gives back { food, review: true/false, letters: [...] }
     ------------------------------------------------------------------- */
  nextJar: function () {
    var index = this.currentIndex();
    var every = CONFIG.reviewEvery || 0;
    var review = false;

    if (this.allDone()) {
      review = true;
    } else if (this.isDone(0) && every >= 2) {
      Progress.data.jarsAfterLevel1 += 1;
      Progress.save();
      review = Progress.data.jarsAfterLevel1 % every === 0;
    }

    var food = review ? this.pickReviewFood() : this.nextLockedFood(index);
    if (!food) {                      // safety net
      review = !review;
      food = review ? this.pickReviewFood() : this.nextLockedFood(index);
    }
    if (!food) return null;
    return { food: food, review: review, letters: this.choicesFor(food, index) };
  },

  // Pick an unlocked food to review. Missed letters get more "tickets".
  pickReviewFood: function () {
    var candidates = [];
    CONFIG.levels.forEach(function (level) {
      level.foods.forEach(function (food) {
        if (food.letter && Progress.isUnlocked(food.id)) candidates.push(food);
      });
    });
    if (candidates.length === 0) return null;
    // Try not to ask the same food twice in a row.
    if (candidates.length > 1) {
      candidates = candidates.filter(function (food) { return food.id !== Progress.data.lastReview; });
    }
    var tickets = [];
    candidates.forEach(function (food) {
      var count = 1 + 2 * Progress.letter(food.letter).misses;
      for (var i = 0; i < count; i++) tickets.push(food);
    });
    var chosen = randomItem(tickets);
    Progress.data.lastReview = chosen.id;
    Progress.save();
    return chosen;
  },

  // The letter buttons: the right one plus wrong ones from this and
  // earlier places, in random order.
  choicesFor: function (food, index) {
    var level = CONFIG.levels[index];
    var count = Math.max(2, (level && level.choices) || 2);
    var others = this.lettersUpTo(index).filter(function (letter) { return letter !== food.letter; });
    var wrong = shuffle(others).slice(0, count - 1);
    return shuffle([food.letter].concat(wrong));
  },
};

// Every letter taught anywhere in the game (no repeats).
function levelLetters() {
  return Levels.lettersUpTo(CONFIG.levels.length - 1);
}

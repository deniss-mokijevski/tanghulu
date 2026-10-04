/* =====================================================================
   progress.js — remembers what she has unlocked.

   Everything is saved in this browser only (localStorage).
   Nothing is ever sent anywhere.
   ===================================================================== */

var Progress = {
  KEY: "candy-stick-shop-v1",
  data: null,

  // A brand-new game.
  fresh: function () {
    return {
      unlocked: [],        // ids of foods won from jars
      stars: {},           // food id → number of stars
      letters: {},         // letter → { streak, misses, right, wrong }
      jarsAfterLevel1: 0,  // counts jars after level 1, for the review jars
      lastReview: "",      // food id of the last review jar
      settings: {
        volume: 0.8,
        music: true,
        uppercase: false,
        voice: "",
      },
    };
  },

  load: function () {
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.KEY) || "null");
    } catch (error) {
      saved = null; // broken or blocked storage → start fresh
    }
    var data = this.fresh();
    if (saved && typeof saved === "object") {
      if (Array.isArray(saved.unlocked)) data.unlocked = saved.unlocked.filter(function (id) { return typeof id === "string"; });
      if (saved.stars && typeof saved.stars === "object") data.stars = saved.stars;
      if (saved.letters && typeof saved.letters === "object") data.letters = saved.letters;
      if (typeof saved.jarsAfterLevel1 === "number") data.jarsAfterLevel1 = saved.jarsAfterLevel1;
      if (typeof saved.lastReview === "string") data.lastReview = saved.lastReview;
      if (saved.settings && typeof saved.settings === "object") {
        for (var key in data.settings) {
          if (typeof saved.settings[key] === typeof data.settings[key]) {
            data.settings[key] = saved.settings[key];
          }
        }
      }
    }
    this.data = data;
  },

  save: function () {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (error) {
      // Private browsing can block saving. The game still works.
    }
  },

  // Forget all progress (settings like volume are kept).
  reset: function () {
    var settings = this.data.settings;
    this.data = this.fresh();
    this.data.settings = settings;
    this.save();
  },

  settings: function () {
    return this.data.settings;
  },

  setSetting: function (name, value) {
    this.data.settings[name] = value;
    this.save();
  },

  // Foods without a letter (like the starter foods) are always unlocked.
  // The others are unlocked by opening their jar.
  isUnlocked: function (foodId) {
    var food = foodById(foodId);
    if (food && !food.letter) return true;
    return this.data.unlocked.indexOf(foodId) !== -1;
  },

  unlock: function (foodId) {
    if (!this.isUnlocked(foodId)) this.data.unlocked.push(foodId);
    this.save();
  },

  stars: function (foodId) {
    return this.data.stars[foodId] || 0;
  },

  addStar: function (foodId) {
    this.data.stars[foodId] = this.stars(foodId) + 1;
    this.save();
  },

  // How she is doing with one letter.
  letter: function (letter) {
    var stats = this.data.letters[letter];
    if (!stats || typeof stats !== "object") {
      stats = { streak: 0, misses: 0, right: 0, wrong: 0 };
      this.data.letters[letter] = stats;
    }
    return stats;
  },

  // Remember how a jar went.
  //   firstTry = true when she picked the right letter straight away.
  recordAnswer: function (letter, firstTry) {
    var stats = this.letter(letter);
    if (firstTry) {
      stats.streak += 1;
      stats.right += 1;
      stats.misses = Math.max(0, stats.misses - 1); // missed letters slowly calm down
    } else {
      stats.streak = 0;
    }
    this.save();
  },

  // A wrong tap while this letter was the answer.
  recordMiss: function (letter) {
    var stats = this.letter(letter);
    stats.misses += 1;
    stats.wrong += 1;
    this.save();
  },

  // "Known" = the last few answers (3 by default) were right first time.
  knows: function (letter) {
    return this.letter(letter).streak >= (CONFIG.knownAfter || 3);
  },
};

/* =====================================================================
   CANDY STICK SHOP — SETTINGS
   =====================================================================

   This is the ONLY file you need to edit.

   Everything the game shows or says lives here: the title, the artist,
   the foods, the letters, the places (levels) and every spoken sentence.

   A few rules so nothing breaks:
     • Keep the quotes "..." around words.
     • Keep the commas at the end of lines inside { } and [ ].
     • After saving, reload the game page in the browser.

   PICTURES (her drawings)
     Each food's "id" is also its file name. For example the food
     with id "strawberry" uses:   assets/foods/strawberry.png
     If that file exists, the game shows it. If not, it shows the emoji
     in a dashed frame with a little ✏️ (meaning: "a drawing goes here").
     The same works for:
       the customer:  assets/characters/bear.png
       each place:    assets/backgrounds/kitchen.png  (beach.png, space.png)
     Use lowercase file names. .png is best (see-through background),
     but .jpg/.jpeg/.webp also work, and drawings on white paper are fine.

   SOUNDS (your recordings) — all optional, the game talks without them
     Letter sounds:  assets/sounds/letters/s.mp3   (or s.m4a)
     Food words:     assets/sounds/words/strawberry.mp3
     Sentences:      assets/sounds/voice/<name>.mp3   (names: see "phrases" below)
     Effects:        assets/sounds/fx/crunch.mp3 ...  (see README.md)
     Music:          assets/music/theme.mp3
     The full checklist of what to record is in README.md.
   ===================================================================== */

var CONFIG = {

  // ---------------------------------------------------------------
  // TITLE SCREEN
  // ---------------------------------------------------------------
  title: "Candy Stick Shop",       // (the name under a home-screen icon is in manifest.json,
                                  //  or simply type it when you add the icon)
  artist: "Little Artist",        // her name or nickname, shown under the title
  artBy: "Art by",                // the words before her name ("Art by Little Artist");
                                  // use "" to show only her name

  // ---------------------------------------------------------------
  // LANGUAGE AND VOICE
  // Used when there is no recording. The browser's built-in voice
  // reads the words below out loud.
  // ---------------------------------------------------------------
  language: "en-US",              // e.g. "en-GB", "es-ES", "de-DE", "fr-FR", "lv-LV"
  speechRate: 0.85,               // 1 = normal speed, smaller = slower
  speechPitch: 1.1,               // 1 = normal pitch

  // How the browser voice says a letter when there is no recording.
  // {letter} and {word} are filled in: "s, like strawberry"
  letterSpeech: "{letter}, like {word}",

  // ---------------------------------------------------------------
  // GAME RULES (numbers you can tweak)
  // ---------------------------------------------------------------
  maxOnStick: 5,                  // how many foods fit on one stick (1 to 5)
  idleHintSeconds: 5,             // show the pointing hand 👆 after this many quiet seconds
  reviewEvery: 3,                 // after level 1, every 3rd jar repeats a letter she already has
                                  // (2 = every other jar, 0 = never; 1 also means never,
                                  //  because then she would never get new foods)
  knownAfter: 3,                  // a letter counts as "known" after this many first-try answers in a row
  parentHoldSeconds: 3,           // hold the ⚙️ corner this long to open the parent screen
  cleanUpPaper: true,             // make white paper behind a drawing see-through (true / false)
  imageTypes: ["png", "jpg", "jpeg", "webp"],   // picture file types the game looks for
  // Font for the big letters on the jar buttons. The tablet uses the first
  // one it has. These are school-like fonts with a round "a" (casual = Android).
  letterFont: "'Andika', 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', casual, 'Trebuchet MS', sans-serif",

  // ---------------------------------------------------------------
  // THE CUSTOMER
  // Drawing: assets/characters/bear.png  (file name = id)
  // ---------------------------------------------------------------
  customer: { id: "bear", emoji: "🐻", word: "bear" },

  // ---------------------------------------------------------------
  // FOODS SHE HAS FROM THE START (no letter riddle needed)
  // Keep at least one, so she can make her first candy stick.
  //   id    = file name of the drawing and the recorded word
  //   emoji = placeholder until there is a drawing
  //   word  = what the voice says
  // ---------------------------------------------------------------
  starterFoods: [
    { id: "cherry", emoji: "🍒", word: "cherry" },
    { id: "grape",  emoji: "🍇", word: "grape"  },
    { id: "orange", emoji: "🍊", word: "orange" },
  ],

  // ---------------------------------------------------------------
  // LEVELS (PLACES)
  // Each place has 4 new foods. Each food teaches one letter sound.
  // Opening all the jars of a place takes her to the next place.
  //
  //   id          = background drawing: assets/backgrounds/<id>.png
  //   say         = spoken when she arrives
  //                 (recording: assets/sounds/voice/place-<id>.mp3)
  //   icon        = small picture for the place (top of the screen)
  //   choices     = how many letter buttons the jar shows (2, 3 or 4)
  //   colors      = wall and floor colors used until there is a drawing
  //                 (any CSS color, e.g. "#ffe7c4" or "lightblue")
  //   decorations = emojis placed around the room until there is a drawing
  //                 (very new emojis can show as empty boxes on older tablets)
  //   foods       = the 4 foods of this place:
  //                   letter = the sound it starts with (shown on the button);
  //                            a food without a letter is on the shelf from the start
  //                   sour: true = the bear puckers when eating it
  //
  // Wrong-answer letters are taken from this place and earlier places.
  // The shelf fits about 16 foods at full size; more foods make the
  // buttons smaller.
  // ---------------------------------------------------------------
  levels: [
    {
      id: "kitchen",
      say: "Welcome to the kitchen!",
      icon: "🍳",
      choices: 2,
      colors: { wall: "#ffe7c4", floor: "#e5a96f" },
      decorations: ["☕", "🥄", "🍰", "🍯", "🍳", "🥛"],
      foods: [
        { id: "strawberry", emoji: "🍓", word: "strawberry", letter: "s" },
        { id: "apple",      emoji: "🍎", word: "apple",      letter: "a" },
        { id: "tomato",     emoji: "🍅", word: "tomato",     letter: "t" },
        { id: "peach",      emoji: "🍑", word: "peach",      letter: "p" },
      ],
    },
    {
      id: "beach",
      say: "Welcome to the beach!",
      icon: "🏖️",
      choices: 3,
      colors: { wall: "#bfe9ff", floor: "#f7dc9c" },
      decorations: ["🌴", "🐚", "⛱️", "🦀", "🌊", "☀️"],
      foods: [
        { id: "mango",  emoji: "🥭", word: "mango",  letter: "m" },
        { id: "banana", emoji: "🍌", word: "banana", letter: "b" },
        { id: "kiwi",   emoji: "🥝", word: "kiwi",   letter: "k" },
        { id: "lemon",  emoji: "🍋", word: "lemon",  letter: "l", sour: true },
      ],
    },
    {
      id: "space",
      say: "Welcome to space!",
      icon: "🚀",
      choices: 4,
      colors: { wall: "#2b2d6e", floor: "#5b4b9a" },
      decorations: ["🌍", "🌙", "⭐", "🛸", "🚀", "☄️"],
      foods: [
        { id: "watermelon", emoji: "🍉", word: "watermelon", letter: "w" },
        { id: "donut",      emoji: "🍩", word: "donut",      letter: "d" },
        { id: "hotdog",     emoji: "🌭", word: "hot dog",    letter: "h" },
        { id: "nuts",       emoji: "🥜", word: "nuts",       letter: "n" },
      ],
    },
  ],

  // ---------------------------------------------------------------
  // EVERYTHING THE GAME SAYS
  // To use your own voice, record a file with the same name, e.g.
  //   tapFood  →  assets/sounds/voice/tapFood.mp3
  // "yay" is the cheer after every finished stick.
  // ---------------------------------------------------------------
  phrases: {
    welcome:   "Welcome to the candy stick shop!",
    tapFood:   "Tap a food to put it on the stick!",
    tapPot:    "Add more food, or tap the pot to dip the stick in sugar syrup!",
    stickFull: "The stick is full! Tap the pot to dip it in syrup.",
    tapStick:  "So shiny! Tap the stick to feed the bear!",
    dipFirst:  "Dip it in the syrup first! Tap the pot.",
    feedFirst: "Feed the bear first! Tap the stick.",
    keepGoing: "Tap the stick again!",
    yay:       "Yay! The bear loves it!",
    jar:       "A secret jar! Which letter makes this sound?",
    review:    "Do you remember? Which letter makes this sound?",
    listen:    "Listen.",
    star:      "You got a star!",
    again:     "Let's make another candy stick!",
    newPlace:  "You opened all the jars! Let's go somewhere new!",
    allDone:   "Wow! You know all the letters! You are a candy star!",
  },
};

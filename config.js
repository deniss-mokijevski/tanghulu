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

   LANGUAGE
     Everything the child sees and hears is in Estonian. The ids (file
     names) stay in plain English letters, so they work on every computer.

   PICTURES (her drawings)
     Each food's "id" is also its file name. For example the food
     with id "strawberry" (maasikas) uses:   assets/foods/strawberry.png
     If that file exists, the game shows it. If not, it shows the emoji
     in a dashed frame with a little ✏️ (meaning: "a drawing goes here").
     The same works for:
       the customer:  assets/characters/bear.png
       each place:    assets/backgrounds/kitchen.png  (beach.png, space.png)
     Use lowercase file names. .png is best (see-through background),
     but .jpg/.jpeg also work (.webp only on iPadOS 14 or newer),
     and drawings on white paper are fine.

   SOUNDS (your recordings) — all optional, the game talks without them
     The game has its own Estonian voice clips (assets/sounds/builtin/).
     Your recordings always win over them.
     Letter sounds:  assets/sounds/letters/s.mp3   (or s.m4a; õ → õ.mp3)
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
  title: "Kommipulgapood",        // (the name under a home-screen icon is in manifest.json,
                                  //  or simply type it when you add the icon)
  artist: "Väike kunstnik",       // her name or nickname, shown under the title
  artBy: "Joonistanud",           // the words before her name ("Joonistanud Mia");
                                  // use "" to show only her name

  // ---------------------------------------------------------------
  // LANGUAGE AND VOICE
  // Without a recording, the game first uses its built-in Estonian
  // voice clips (assets/sounds/builtin/, made with tools/make-voice.js).
  // For a sentence with no clip, the tablet's own voice is used, but
  // ONLY if the tablet has a voice in this language (iPads have no
  // Estonian voice). It never reads Estonian with an English voice.
  // ---------------------------------------------------------------
  language: "et-EE",              // Estonian; e.g. "en-US", "fi-FI", "lv-LV" for other languages
  speechRate: 0.85,               // tablet voice: 1 = normal speed, smaller = slower
  speechPitch: 1.1,               // tablet voice: 1 = normal pitch
  builtinVoice: true,             // use the built-in Estonian voice clips (true / false)

  // Letter sounds. In Estonian a letter's NAME ("ess", "emm") is not its
  // SOUND ("sss", "mmm"), and a computer voice can only say names.
  // So until you record the letter sounds, the jar asks for the first
  // letter of the word instead: "Millise tähega algab see sõna? … sidrun".
  // If you prefer the letter names, write e.g. "{letter} nagu {word}"
  // ("ess nagu sidrun") here; leave "" for the first-letter question.
  letterSpeech: "",

  // ---------------------------------------------------------------
  // GAME RULES (numbers you can tweak)
  // ---------------------------------------------------------------
  maxOnStick: 5,                  // how many foods fit on one stick (1 to 5)
  potTaps: 3,                     // taps on the pot: the sugar melts, turns golden, then the dip
                                  // (1 = dip straight away)
  bearWishes: true,               // the bear shows a picture of the food it would like (true / false)
  idleHintSeconds: 5,             // show the pointing hand 👆 after this many quiet seconds
  reviewEvery: 3,                 // after level 1, every 3rd jar repeats a letter she already has
                                  // (2 = every other jar, 0 = never; 1 also means never,
                                  //  because then she would never get new foods)
  knownAfter: 3,                  // a letter counts as "known" after this many first-try answers in a row
  parentHoldSeconds: 3,           // hold the ⚙️ corner this long to open the parent screen
  cleanUpPaper: true,             // make white paper behind a drawing see-through (true / false)
  fullscreenOnAndroid: true,      // Android tablets: fullscreen + sideways after tapping ▶ (true / false)
  imageTypes: ["png", "jpg", "jpeg", "webp"],   // picture file types the game looks for
  // Font for the big letters on the jar buttons. The tablet uses the first
  // one it has. These are school-like fonts with a round "a" (casual = Android).
  letterFont: "'Andika', 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', casual, 'Trebuchet MS', sans-serif",

  // ---------------------------------------------------------------
  // THE CUSTOMER
  // Drawing: assets/characters/bear.png  (file name = id)
  // ---------------------------------------------------------------
  customer: { id: "bear", emoji: "🐻", word: "karu" },

  // ---------------------------------------------------------------
  // FOODS SHE HAS FROM THE START (no letter riddle needed)
  // Keep at least one, so she can make her first candy stick.
  //   id    = file name of the drawing and the recorded word
  //   emoji = placeholder until there is a drawing
  //   word  = what the voice says
  // The hawthorn berry (viirpuumari) is the fruit of the original
  // Chinese tanghulu. There is no emoji for it, so it starts as a red
  // dot: a perfect first thing for her to draw!
  // ---------------------------------------------------------------
  starterFoods: [
    { id: "hawthorn", emoji: "🔴", word: "viirpuumari", sour: true },
    { id: "cherry",   emoji: "🍒", word: "kirss" },
    { id: "grape",    emoji: "🍇", word: "viinamari" },
    { id: "mandarin", emoji: "🍊", word: "mandariin" },
  ],

  // ---------------------------------------------------------------
  // LEVELS (PLACES)
  // Each place has 4 new foods. Each food teaches one letter sound.
  // Opening all the jars of a place takes her to the next place.
  // The places go from easy sounds (a, m, s, l: you can hold them
  // long) to hard ones (k, p, t: short sounds), as Estonian teachers do.
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
  //                   letter = the first letter AND first sound of the word;
  //                            a food without a letter is on the shelf from the start
  //                   sour: true = the bear puckers when eating it
  //
  // Wrong-answer letters are taken from this place and earlier places.
  // Use each letter only once in the whole game, and never put both
  // "i" and "j" in the game: in Estonian they sound alike at the start.
  // The shelf fits about 16 foods at full size; more foods make the
  // buttons smaller.
  // ---------------------------------------------------------------
  levels: [
    {
      id: "kitchen",                       // Köök
      say: "Tere tulemast kööki!",
      icon: "🍳",
      choices: 2,
      colors: { wall: "#ffe7c4", floor: "#e5a96f" },
      decorations: ["☕", "🥄", "🍰", "🍯", "🍳", "🥛"],
      foods: [
        { id: "watermelon", emoji: "🍉", word: "arbuus",   letter: "a" },
        { id: "strawberry", emoji: "🍓", word: "maasikas", letter: "m" },
        { id: "lemon",      emoji: "🍋", word: "sidrun",   letter: "s", sour: true },
        { id: "bread",      emoji: "🍞", word: "leib",     letter: "l" },
      ],
    },
    {
      id: "beach",                         // Rand
      say: "Tere tulemast randa!",
      icon: "🏖️",
      choices: 3,
      colors: { wall: "#bfe9ff", floor: "#f7dc9c" },
      decorations: ["🌴", "🐚", "⛱️", "🦀", "🌊", "☀️"],
      foods: [
        { id: "apple",    emoji: "🍎", word: "õun",     letter: "õ" },
        { id: "peach",    emoji: "🍑", word: "virsik",  letter: "v" },
        { id: "icecream", emoji: "🍦", word: "jäätis",  letter: "j" },
        { id: "noodles",  emoji: "🍜", word: "nuudlid", letter: "n" },
      ],
    },
    {
      id: "space",                         // Kosmos
      say: "Tere tulemast kosmosesse!",
      icon: "🚀",
      choices: 4,
      colors: { wall: "#2b2d6e", floor: "#5b4b9a" },
      decorations: ["🌍", "🌙", "⭐", "🛸", "🚀", "☄️"],
      foods: [
        { id: "hotdog", emoji: "🌭", word: "hot dog", letter: "h" },
        { id: "kiwi",   emoji: "🥝", word: "kiivi",   letter: "k" },
        { id: "pear",   emoji: "🍐", word: "pirn",    letter: "p" },
        { id: "tomato", emoji: "🍅", word: "tomat",   letter: "t" },
      ],
    },
  ],

  // ---------------------------------------------------------------
  // EVERYTHING THE GAME SAYS
  // To use your own voice, record a file with the same name, e.g.
  //   tapFood  →  assets/sounds/voice/tapFood.mp3
  // "yay" is the cheer after every finished stick.
  // If you change a sentence, its built-in clip no longer matches:
  // record it yourself, or run tools/make-voice.js (see README.md).
  // ---------------------------------------------------------------
  phrases: {
    call:       "Kommipulgad! Värskelt kastetud!",          // the street seller's call (when the shop opens)
    welcome:    "Tere tulemast kommipulgapoodi!",
    tapFood:    "Puuduta mõnda toitu ja see läheb pulga otsa!",
    tapPot:     "Lisa veel toitu või puuduta potti, et suhkur sulaks!",
    cook:       "Suhkur sulab ja mullitab! Puuduta potti veel!",
    syrupReady: "Siirup on kuldne! Puuduta potti ja kasta pulk sisse!",
    stickFull:  "Pulk on täis! Nüüd puuduta potti.",
    tapStick:   "Oi, kui läikiv! Puuduta pulka ja anna see karule!",
    dipFirst:   "Kõigepealt kasta pulk siirupisse! Puuduta potti.",
    feedFirst:  "Kõigepealt anna karule süüa! Puuduta pulka.",
    keepGoing:  "Puuduta pulka veel!",
    please:     "palun!",                                    // the bear's wish: "maasikas, palun!"
    wishYes:    "Just seda ma tahtsingi!",
    yay:        "Hurraa! Karule maitseb väga!",
    jar:        "Salapurk! Milline täht nii kõlab?",         // when the letter sound is recorded
    jarWord:    "Salapurk! Millise tähega algab see sõna?",  // when it is not (then the word follows)
    review:     "Kas mäletad? Milline täht nii kõlab?",
    reviewWord: "Kas mäletad? Millise tähega algab see sõna?",
    listen:     "Kuula!",
    star:       "Said kuldtähe!",
    again:      "Teeme veel ühe kommipulga!",
    pole:       "Siin on kõik sinu kommipulgad! Puuduta pulka ja kuula!",
    newPlace:   "Sa tegid kõik purgid lahti! Lähme nüüd uude kohta!",
    allDone:    "Vau! Sa tunned juba nii palju tähti! Sa oled tõeline kommistaar!",
    turnTablet: "Palun keera tahvelarvuti külili!",
  },
};

# 🍡 Candy Stick Shop

A tablet game for a child who can't read yet. She runs a candy-skewer shop
(like *tanghulu*: fruit on a stick, coated in shiny sugar syrup) and learns
letter sounds along the way.

- **Shop:** tap foods to put them on the stick, tap the pot to dip it in syrup, tap the stick so the bear can eat it.
- **Letter jar:** after every finished stick, a locked jar appears. The game plays a letter sound; she taps the matching letter to open the jar and win a new food.
- **Places:** the kitchen, then the beach, then space. Each place has 4 new letters.
- **Nothing to read:** every instruction is spoken, 🔊 repeats it, and a bouncing 👆 shows what to tap after 5 quiet seconds. There are no timers, no buzzers and no way to lose.
- **Her own art:** every food, the bear and the backgrounds start as placeholders. Drop her drawings into the `assets` folder and they replace the placeholders. No code changes needed.

It is plain HTML, CSS and JavaScript: no installing, no build step, no internet
needed. Progress is saved only on the device (in the browser), and the game never
connects to the internet.

---

## Contents

1. [Run the game on your computer](#1-run-the-game-on-your-computer)
2. [Play on the tablet over home Wi-Fi](#2-play-on-the-tablet-over-home-wi-fi)
3. [Put it online for free](#3-put-it-online-for-free)
4. [Add her drawings](#4-add-her-drawings)
5. [Change names, foods and words (config.js)](#5-change-names-foods-and-words-configjs)
6. [Switch to another language](#6-switch-to-another-language)
7. [Record your own voice: the checklist](#7-record-your-own-voice-the-checklist)
8. [The parent screen](#8-the-parent-screen)
9. [Troubleshooting](#9-troubleshooting)
10. [What each file does](#10-what-each-file-does)

---

## 1. Run the game on your computer

### Quick look: double-click

Double-click `index.html`. It opens in your browser and the whole game works.

One limitation: when the game is opened like this, browsers don't allow it to
remove the white paper behind her drawings, so drawings show up on their paper
rectangle. Use a small web server (below) to see drawings properly.

### Better: a small web server (recommended)

This is also what you need for the tablet. It uses Python, which is free.

**Mac**

1. Open **Terminal** (press ⌘ Space and type "Terminal").
2. Type `cd ` (with a space after it), drag the game folder onto the Terminal window, and press Enter.
3. Type this and press Enter:
   ```
   python3 -m http.server 8000
   ```
   (If the Mac offers to install "command line developer tools", click Install and try again.)
4. Open **http://localhost:8000** in Safari or Chrome.

**Windows**

1. Install Python from <https://www.python.org/downloads/>. During setup, tick **"Add python.exe to PATH"**.
2. Open the game folder in File Explorer, click the address bar, type `cmd` and press Enter.
3. In the black window type this and press Enter:
   ```
   py -m http.server 8000
   ```
4. Open **http://localhost:8000** in Edge or Chrome.

Leave the Terminal / black window open while playing. Close it to stop the server.

Tip: in Chrome or Edge you can see the game at tablet size. Press F12, then click the
phone/tablet icon and choose "iPad", for example.

---

## 2. Play on the tablet over home Wi-Fi

1. Start the web server on your computer (see above).
2. Find your computer's address on the home network:
   - **Mac:** System Settings → Wi-Fi → click **Details…** next to your network → look for **IP address** (something like `192.168.1.23`).
   - **Windows:** open a second black window the same way (type `cmd` in the folder's address bar), type `ipconfig` and press Enter. Look for **IPv4 Address**.
3. Make sure the tablet is on the **same Wi-Fi**.
4. On the tablet, open **Safari** (iPad) or **Chrome** (Android) and type the address with `:8000` at the end, for example:
   ```
   http://192.168.1.23:8000
   ```
5. If your computer asks whether to allow incoming connections (firewall), click **Allow**.
6. Turn the tablet sideways (landscape) and tap the big ▶ button. That first tap also turns the sound on.

**Make it feel like an app (fullscreen, no address bar):**

- **iPad (Safari):** tap the Share button → **Add to Home Screen**, then always start the game
  from that icon. Do this **before** she starts playing: the icon keeps its own progress,
  separate from Safari tabs.
- **Android (Chrome):** over home Wi-Fi (`http://192.168…`) Chrome can only add a normal
  shortcut, which still opens with the address bar. For a real fullscreen app on Android, use
  the online version (section 3) and tap ⋮ → **Install app** there.

**Keep her inside the game (optional):**

- **iPad:** Settings → Accessibility → **Guided Access**. Turn it on, open the game, and triple-click the top (or home) button to lock the iPad to the game.
- **Android:** Settings → Security → **App pinning** (or "Screen pinning").

Notes:
- Progress is saved **on the tablet**, in that browser. Your computer only serves the files.
- Progress belongs to the **exact address**. If the address changes (for example `.23` becomes
  `.24` after a router restart), the game opens fresh, as if she had never played. To avoid
  this, give the computer a fixed address in your router (often called "DHCP reservation"),
  or use the online version.
- In Safari tabs, the iPad may delete a website's saved data after about a week without
  visiting it. Games started from a Home Screen icon don't have this limit.
- The computer must be on and the server running while she plays. If you want to play
  without the computer, put the game online (next section).

---

## 3. Put it online for free

Any service that hosts plain files works. Two easy ones:

### Option A: Netlify Drop (no account needed to try)

1. Go to <https://app.netlify.com/drop>.
2. Drag the whole game folder onto the page.
3. You get a link like `https://something-random.netlify.app`. Open it on the tablet.
   (Create a free account if you want the link to stay up for good and to update it later.)

To update after adding drawings: in your Netlify site, open **Deploys** and drag the folder again.

### Option B: GitHub Pages

1. Create a free account on <https://github.com> and a new **public** repository.
2. Click **Add file → Upload files** and upload everything in the game folder (keep the folders).
3. Open **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and Save.
4. After a minute your game is at `https://YOUR-NAME.github.io/REPOSITORY-NAME/`.

**Before you put it online:**
- Anyone with the link can see her drawings and hear your recordings. Use a nickname
  for the artist name, and don't include anything private.
- Online, file names are **case-sensitive**: `strawberry.png` works, `Strawberry.PNG` does not.

---

## 4. Add her drawings

Every picture starts as a **placeholder**: the emoji in a dashed "empty frame" with a
small ✏️ badge, so she can see that a drawing goes there. When a drawing is found, it is
shown instead, with a small 🖍️ crayon badge.

1. **Print the drawing sheets.** Open `drawing-sheets.html` (double-click it, or go to
   `http://localhost:8000/drawing-sheets.html`) and press **🖨️ Print**. Each page has four
   big empty squares, each with the food's emoji and name above it, so she knows what to draw.
   Tick "Only pictures that are still missing" to print only what's left.
2. **She draws.** Crayons, markers, anything.
3. **Take a photo or scan** of each drawing. Crop it roughly around the drawing.
   The exact size doesn't matter: the game scales drawings to fit and trims empty margins.
4. **Save it with the right name** in the right folder:

   | What | Folder | File name |
   |---|---|---|
   | Foods | `assets/foods/` | the food's id: `cherry.png`, `strawberry.png`, `hotdog.png` … |
   | The bear | `assets/characters/` | `bear.png` |
   | Places | `assets/backgrounds/` | `kitchen.png`, `beach.png`, `space.png` (wide pictures) |

   All names are listed on the parent screen (and in `config.js`). Use **lowercase** names.
5. **Reload the game page.** The placeholder is replaced. No code change needed.

**About the white paper:** see-through PNGs look best, but a drawing on white paper is
fine too. When the game runs from a web server (or online), it removes the paper around the
drawing automatically. Paper enclosed by lines (like a white shine inside a cherry) stays.

Ways to get a see-through PNG:
- **iPhone/iPad:** in Photos, touch and hold the drawing until it lifts → **Copy** (or Share → Save Image).
- **Mac:** open the photo in **Preview** → Tools → **Remove Background**, then File → Export as PNG.

Also good to know:
- `.png`, `.jpg` and `.jpeg` work everywhere; `.webp` needs iPadOS 14 or newer. Keep each file
  under ~2 MB so the game loads fast.
- To turn the paper removal off, set `cleanUpPaper: false` in `config.js`.
- If you **replace** a drawing and still see the old one, the browser remembered it.
  Reload once more (on a computer: Ctrl+Shift+R / ⌘⇧R; on a tablet: close the tab and reopen it).

---

## 5. Change names, foods and words (config.js)

`config.js` is the only file you need to edit. Open it with any text editor
(TextEdit on Mac in plain-text mode, Notepad on Windows, or a free editor like VS Code).

You can change:
- `title` and `artist` (a nickname is fine): shown on the title screen.
- `customer`: the bear's emoji and name (its drawing is `assets/characters/<id>.png`).
- `starterFoods`: the foods she has from the start.
- `levels`: each place's foods and letters, how many letter buttons (`choices`), colors and emoji decorations.
- `phrases`: everything the game says.
- Game rules: how many foods fit on a stick, how long until the 👆 hint, how often a review jar comes, etc.

Keep the quotes and commas as they are. After saving, reload the game.
If the game shows a "config.js has a typo" message after an edit, a comma or quote is
probably missing. Undo your last change and try again.

**Adding a food:** copy a food line inside a level, give it a new `id` (this is also its
file name), an `emoji`, a `word` and a `letter`. A place can have more or fewer than 4 foods.
A food without a `letter` is simply on the shelf from the start.
**Adding a place:** copy a whole level block `{ … },` and change it.
The shelf fits about 16 foods with big buttons; with more foods the buttons get smaller.
Keep at least one starter food, so she can make her first stick.

---

## 6. Switch to another language

Everything spoken and every letter is in `config.js`. To switch, for example to Spanish:

1. Set the voice language: `language: "es-ES"` (other examples: `"en-GB"`, `"de-DE"`, `"fr-FR"`, `"it-IT"`, `"lv-LV"`, `"ru-RU"`).
2. Translate `artBy` ("Art by"), the `title`, and all the sentences in `phrases`.
3. Translate `letterSpeech`, for example `"{letter}, como {word}"`.
4. For every food, translate `word`, and set `letter` to the **first sound of the word in the
   new language** (for example strawberry → `word: "fresa"`, `letter: "f"`). You may want to
   pick different foods so that each place teaches different letters.
5. Translate each level's `say` ("Welcome to the beach!") and the customer's `word`.
6. Record new sounds (or delete the old recordings so the browser voice is used).

Notes:
- You can keep the `id`s in English (they are only file names), or rename them **and** the files.
- Letters can be special characters or more than one letter: `"ñ"`, `"ā"`, `"ch"`, `"sh"`.
  The letter recording then is `assets/sounds/letters/ñ.mp3` or `ch.mp3`.
- The browser voice must exist on the tablet. The parent screen shows the voices found for
  your language. On iPad you can download more: Settings → Accessibility → **Spoken Content → Voices**.
  On Android: Settings → **Text-to-speech output**.
- The parent screen and this README stay in English (they're for grown-ups).

---

## 7. Record your own voice: the checklist

The game talks without any recordings, using the browser's built-in voice. Recordings
make it much nicer, and **letter sounds in particular are worth recording**: the browser
voice says the letter's *name* ("ess, like strawberry"), while you can say the *sound* ("sss").

**How:**
- Use any voice recorder (iPhone Voice Memos saves `.m4a`, which works). Free editor for trimming: Audacity.
- One recording per file, `.mp3` or `.m4a`, with the exact file name below (lowercase).
- Trim the silence at the start and end so the game feels quick.
- Speak warmly and a little slowly. Record in a quiet room.
- Everything is optional. Record a few files, the rest keep using the fallback.

The parent screen ("Show missing recordings") lists every file name the game looks for,
always matching your current `config.js`.

### Letter sounds: `assets/sounds/letters/`

Say the **sound**, short and clean, without adding "uh" (say "t", not "tuh").

| File | Say | Tip |
|---|---|---|
| `s.mp3` | "sss" | like a snake |
| `a.mp3` | "a" | as in **a**pple (short a) |
| `t.mp3` | "t" | a quick tap of the tongue |
| `p.mp3` | "p" | a little puff of air |
| `m.mp3` | "mmm" | like something yummy |
| `b.mp3` | "b" | short, lips pop |
| `k.mp3` | "k" | as in **k**iwi |
| `l.mp3` | "lll" | tongue behind the teeth |
| `w.mp3` | "w" | as in **w**atermelon, lips round |
| `d.mp3` | "d" | short |
| `h.mp3` | "h" | a breath, like fogging a mirror |
| `n.mp3` | "nnn" | through the nose |

### Food words: `assets/sounds/words/`

| File | Say |
|---|---|
| `cherry.mp3` | "cherry" |
| `grape.mp3` | "grape" |
| `orange.mp3` | "orange" |
| `strawberry.mp3` | "strawberry" |
| `apple.mp3` | "apple" |
| `tomato.mp3` | "tomato" |
| `peach.mp3` | "peach" |
| `mango.mp3` | "mango" |
| `banana.mp3` | "banana" |
| `kiwi.mp3` | "kiwi" |
| `lemon.mp3` | "lemon" |
| `watermelon.mp3` | "watermelon" |
| `donut.mp3` | "donut" |
| `hotdog.mp3` | "hot dog" |
| `nuts.mp3` | "nuts" |

### Sentences: `assets/sounds/voice/`

| File | Say |
|---|---|
| `welcome.mp3` | "Welcome to the candy stick shop!" |
| `tapFood.mp3` | "Tap a food to put it on the stick!" |
| `tapPot.mp3` | "Add more food, or tap the pot to dip the stick in sugar syrup!" |
| `stickFull.mp3` | "The stick is full! Tap the pot to dip it in syrup." |
| `tapStick.mp3` | "So shiny! Tap the stick to feed the bear!" |
| `dipFirst.mp3` | "Dip it in the syrup first! Tap the pot." |
| `feedFirst.mp3` | "Feed the bear first! Tap the stick." |
| `keepGoing.mp3` | "Tap the stick again!" |
| `yay.mp3` | "Yay! The bear loves it!" (the cheer after every finished stick) |
| `jar.mp3` | "A secret jar! Which letter makes this sound?" |
| `review.mp3` | "Do you remember? Which letter makes this sound?" |
| `listen.mp3` | "Listen." |
| `star.mp3` | "You got a star!" |
| `again.mp3` | "Let's make another candy stick!" |
| `newPlace.mp3` | "You opened all the jars! Let's go somewhere new!" |
| `allDone.mp3` | "Wow! You know all the letters! You are a candy star!" |
| `place-kitchen.mp3` | "Welcome to the kitchen!" |
| `place-beach.mp3` | "Welcome to the beach!" |
| `place-space.mp3` | "Welcome to space!" |

If you change a sentence in `config.js`, record the new words with the same file name.

### Sound effects (optional): `assets/sounds/fx/`

Without these files the game makes the sounds itself.

| File | What it is |
|---|---|
| `crunch.mp3` | the bear biting the sugar coat (played a little higher or lower each time) |
| `pop.mp3` | a food jumps onto the stick |
| `dip.mp3` | the stick goes into the syrup |
| `shine.mp3` | the shine sweeping over the glossy stick |
| `whoosh.mp3` | something flies |
| `boing.mp3` | a soft "not now" (stick full, dip first…) |
| `sour.mp3` | the bear tastes the lemon |
| `unlock.mp3` | the jar's lock pops open |
| `sparkle.mp3` | sparkles around the opened jar |
| `star.mp3` | a star appears |
| `cheer.mp3` | a happy fanfare (finished stick, new place) |

### Music (optional): `assets/music/`

| File | What it is |
|---|---|
| `theme.mp3` | background music, played quietly on a loop (can be switched off on the parent screen) |

---

## 8. The parent screen

**Hold the ⚙️ in the top-right corner for 3 seconds.** A ring fills up while you hold.
A quick tap does nothing, so she won't open it by accident.

It shows:
- **Letters:** which letters she knows. A letter counts as known after 3 right answers in a row on the first try. Also shows what's still locked, the stars she earned and how often she missed.
- **Drawings:** which foods (and the bear and backgrounds) still use placeholders, with the exact file name to save.
- **Sound:** volume, music on/off, the browser voice to use, and which recordings were found.
- **Letters on the buttons:** lowercase (default) or UPPERCASE.
- **Start over:** reset all progress (it asks first). Volume and other settings are kept.

---

## 9. Troubleshooting

**No sound on the iPad**
- Sound starts with the first tap on ▶. Reload and tap ▶ again.
- Check the volume, and that the iPad isn't muted (Control Center → bell icon).
- Check the volume slider on the parent screen.

**The voice sounds strange or robotic**
- Choose a different voice on the parent screen, or download a better one (see section 6).
- Better: record your own voice (section 7).

**A drawing doesn't show up**
- Check the folder and the exact file name on the parent screen (lowercase, `.png`/`.jpg`).
- Reload the page. If you replaced an older drawing, see the note at the end of section 4.

**The screen shows a turning tablet 📱↻**
- Turn the tablet sideways. The game is made for landscape.

**The buttons look small**
- The game scales to the screen. Buttons are at least 80 px when the browser window is
  about 900 × 560 or bigger. Close extra toolbars, use the Home Screen icon, or use the
  online version for fullscreen.

**The tablet can't open `http://192.168…`**
- Is the server still running on the computer? Is the tablet on the same Wi-Fi (not a guest network)?
- Allow Python through the firewall (Windows: "Allow access" when asked; Mac: System Settings → Network → Firewall).

**Her progress is gone**
- Progress lives in the browser's storage for one exact address. Clearing website data, a
  changed address (`.23` → `.24`), or switching between a Safari tab and the Home Screen icon
  each start fresh. See the notes in section 2.

---

## 10. What each file does

| File | What it does |
|---|---|
| `config.js` | **All settings**: title, artist, foods, letters, places, sentences. The only file you need to edit. |
| `index.html` | The page itself: the screens and buttons. |
| `drawing-sheets.html` | The printable drawing sheets. |
| `css/style.css` | How everything looks: colors, sizes, positions, animations. |
| `js/main.js` | Starts the game and connects the parts (title screen, instructions, places). |
| `js/shop.js` | The shop: shelf, stick, pot, bear. |
| `js/jar.js` | The letter jar riddle. |
| `js/levels.js` | Which place she's in and what the next jar holds (including review jars). |
| `js/parent.js` | The parent screen. |
| `js/hint.js` | The bouncing 👆 hand. |
| `js/sound.js` | Plays recordings, falls back to the browser voice, music. |
| `js/synth.js` | Sound effects made in code (crunch, pop, …). |
| `js/assets.js` | Finds her drawings, shows placeholders, removes white paper. |
| `js/effects.js` | Flying sugar, hearts, sparkles, confetti. |
| `js/progress.js` | Saves progress in the browser (localStorage). |
| `js/util.js` | Small helpers, and the stage that scales the game to any screen. |
| `manifest.json`, `icon*.png`, `icon.svg` | The home-screen icon and fullscreen mode. (The home-screen name is set in `manifest.json`.) |

The code uses no frameworks and makes no network requests. Every file has comments,
so feel free to explore and change things.

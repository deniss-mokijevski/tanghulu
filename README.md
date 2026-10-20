# 🍡 Kommipulgapood (Candy Stick Shop)

A tablet game for a child who can't read yet. She runs a candy-skewer shop
(like *tanghulu*: fruit on a stick, coated in shiny sugar syrup) and learns
**Estonian** letter sounds along the way. Everything she hears and sees is in Estonian;
this README and the parent screen are in English for the grown-ups.

- **Shop:** tap foods to put them on the stick, cook the sugar in the pot until it's golden, dip the stick, and let the bear eat it.
- **Letter jar:** after every finished stick, a locked jar appears. She hears a sound (or a word) and taps the matching letter to open the jar and win a new food.
- **Places:** the kitchen (a m s l), the beach (õ v j n), then space (h k p t). Each place has 4 new letters, from the easy, long sounds to the short ones, the way Estonian teachers do it.
- **From the original tanghulu:** the hawthorn berry, the bubbling sugar pot, the thin sugar "wing", the glassy crack, the street seller's call and the straw pole where every won stick is kept (see [section 7](#7-from-the-original-tanghulu)).
- **Nothing to read:** every instruction is spoken, 🔊 repeats it, and a bouncing 👆 shows what to tap after 5 quiet seconds. There are no timers, no buzzers and no way to lose.
- **Speaks proper Estonian out of the box:** the game has its own Estonian voice clips, so it works on an iPad (which has no Estonian voice) and never reads Estonian with an English voice.
- **Her own art:** every food, the bear and the backgrounds start as placeholders. Drop her drawings into the `assets` folder and they replace the placeholders. No code changes needed.

It is plain HTML, CSS and JavaScript: no installing, no build step, no internet
needed. Progress is saved only on the device (in the browser), and the game itself never
connects to the internet (only a tablet's own online voice might, see section 6).

---

## Contents

1. [Run the game on your computer](#1-run-the-game-on-your-computer)
2. [Play on the tablet over home Wi-Fi](#2-play-on-the-tablet-over-home-wi-fi)
3. [Put it online for free](#3-put-it-online-for-free)
4. [Add her drawings](#4-add-her-drawings)
5. [Change names, foods and words (config.js)](#5-change-names-foods-and-words-configjs)
6. [How the game speaks Estonian](#6-how-the-game-speaks-estonian)
7. [From the original tanghulu](#7-from-the-original-tanghulu)
8. [Record your own voice: the checklist](#8-record-your-own-voice-the-checklist)
9. [Switch to another language](#9-switch-to-another-language)
10. [The parent screen](#10-the-parent-screen)
11. [Troubleshooting](#11-troubleshooting)
12. [What each file does](#12-what-each-file-does)

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
- **Android (Chrome):** the game switches to fullscreen and sideways by itself when she taps ▶
  (turn this off with `fullscreenOnAndroid: false` in `config.js`). A shortcut is handy too:
  over home Wi-Fi (`http://192.168…`) Chrome can only add a normal shortcut (⋮ → **Add to Home
  screen**); with the online version (section 3) you can use ⋮ → **Install app**.

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
   big empty squares, each with the food's emoji and Estonian name above it, so she knows what to draw.
   Tick "Only pictures that are still missing" to print only what's left.
2. **She draws.** Crayons, markers, anything. A nice first one: the **viirpuumari** (hawthorn
   berry), the fruit of the original tanghulu. There is no emoji for it, so it is a red dot 🔴 until she draws it.
3. **Take a photo or scan** of each drawing. Crop it roughly around the drawing.
   The exact size doesn't matter: the game scales drawings to fit and trims empty margins.
4. **Save it with the right name** in the right folder. The file names are in plain English
   letters (no õ ä ö ü), so they work on every computer:

   | What | Folder | File name |
   |---|---|---|
   | Starter foods | `assets/foods/` | `hawthorn.png` (viirpuumari), `cherry.png` (kirss), `grape.png` (viinamari), `mandarin.png` (mandariin) |
   | Kitchen foods | `assets/foods/` | `watermelon.png` (arbuus), `strawberry.png` (maasikas), `lemon.png` (sidrun), `bread.png` (leib) |
   | Beach foods | `assets/foods/` | `apple.png` (õun), `peach.png` (virsik), `icecream.png` (jäätis), `noodles.png` (nuudlid) |
   | Space foods | `assets/foods/` | `hamburger.png` (hamburger), `kiwi.png` (kiivi), `pear.png` (pirn), `tomato.png` (tomat) |
   | The bear | `assets/characters/` | `bear.png` |
   | Places | `assets/backgrounds/` | `kitchen.png`, `beach.png`, `space.png` (wide pictures) |

   All names are also listed on the parent screen (and in `config.js`). Use **lowercase** names.
5. **Reload the game page.** The placeholder is replaced. No code change needed.

A tip for the **bread** (leib): the emoji shows a white loaf, which some children call
"sai". Her own drawing of dark rye bread makes it clear the word is *leib*.

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
- `title` and `artist` (a nickname is fine): shown on the title screen ("Joonistanud …").
- `customer`: the bear's emoji and name (its drawing is `assets/characters/<id>.png`).
- `starterFoods`: the foods she has from the start.
- `levels`: each place's foods and letters, how many letter buttons (`choices`), colors and emoji decorations.
- `phrases`: everything the game says.
- Game rules: how many foods fit on a stick, how many pot taps cook the sugar (`potTaps`),
  the bear's wishes (`bearWishes`), how long until the 👆 hint, how often a review jar comes, etc.

Keep the quotes and commas as they are. After saving, reload the game.
If the game shows a "config.js has a typo" (or "is not right") message after an edit, or ▶
does nothing, a comma, quote or bracket is probably missing or extra. Undo your last change
and try again.

**Adding a food:** copy a food line inside a level, give it a new `id` (this is also its
file name, plain English letters), an `emoji`, a `word` and a `letter`. The letter must be the
first letter **and** first sound of the Estonian word, and each letter should appear only once
in the whole game. Don't use both of `i` and `j`, `b` and `p`, `d` and `t`, `g` and `k`, or
`z` and `s`: at the start of an Estonian word they sound alike (banaan starts like pirn).
A place can have more or fewer than 4 foods. A food without a `letter` is simply on the shelf
from the start.
**Adding a place:** copy a whole level block `{ … },` and change it.
The shelf fits about 16 foods with big buttons; with more foods the buttons get smaller.
Keep at least one starter food, so she can make her first stick.

**If you change a sentence or a word**, its built-in voice clip no longer matches (the game
then won't use it). Record the new words yourself (section 8), or make new clips with the
tool in section 6.

---

## 6. How the game speaks Estonian

For every sentence and word, the game tries, in this order:

1. **Your recording** (`assets/sounds/…`, see section 8). Always wins (once the page has found
   it, which takes a moment after opening the game).
2. **The built-in Estonian voice**: clips in `assets/sounds/builtin/`, made with
   Neurokõne, the free Estonian speech synthesis of the University of Tartu (voice "Vesta").
   A clip is only used while its words still match `config.js`.
3. **The tablet's own voice**, but **only if it speaks Estonian**. iPads have no Estonian
   voice at all; Android tablets have one if Google's speech engine with Estonian is installed;
   Edge on Windows has online ones (they send the words to Microsoft; voices on the device itself
   are preferred). With no Estonian voice the game stays quiet rather than read Estonian with an
   English voice.

**Letter sounds are special.** In Estonian a letter's *name* ("ess", "emm") is not its
*sound* ("sss", "mmm"), and a computer voice can only say names. So:
- When you have **recorded a letter's sound** (`assets/sounds/letters/s.mp3`), its jar plays it:
  *"Salapurk! Milline täht nii kõlab? … sss"*.
- Until then, its jar says the word and asks for its first letter:
  *"Salapurk! Millise tähega algab see sõna? … sidrun"*. That's the same skill, and it's how
  Estonian teachers practise first sounds.
- If you prefer the letter names, set `letterSpeech: "{name} nagu {word}"` in `config.js`
  ("ess nagu sidrun"; `{name}` comes from `letterNames`) and run `node tools/make-voice.js` once,
  so the built-in voice can say them. Without a voice for them, the jar keeps asking for the
  first letter of the word.

**Making new clips** (only needed after you change words in `config.js` and don't want to record them):

```
node tools/make-voice.js
```

This needs [Node.js](https://nodejs.org) (version 18 or newer) and an internet connection,
**once**, on your computer. It reads `config.js`, asks Neurokõne for every new or changed line,
trims the silence and updates `assets/sounds/builtin/`. Only new or changed lines are made;
the others are kept, in the same voice. If `ffmpeg` is installed the clips are small `.mp3`
files, otherwise `.wav`. To use another voice for everything: `node tools/make-voice.js mari`
(voices you may use: `vesta`, `mari`, `albert`, `kalev`, `meelis`, `lee` (a girl's voice)).
Please don't use `indrek`, `kylli`, `liivika` or `tambet`: they are actors' voices with
stricter rules.

The built-in clips were checked with a speech recognizer (Whisper), which heard almost every
line back exactly. It was unsure about *nuudlid*, *sidrun* and *kööki*, probably its own
mistake; have a listen, and record those words yourself if they sound wrong.

Credit: *Kõnesüntees: Neurokõne (TartuNLP, Tartu Ülikool), hääl Vesta. https://neurokone.ee*
If you publish the game widely, TartuNLP asks people who build on their service to let them
know (ping@tartunlp.ai).

---

## 7. From the original tanghulu

Tanghulu (糖葫芦, "sugar gourd") is a winter street snack from northern China, best known
from old Beijing: hawthorn berries on a bamboo stick, dipped in cooked rock sugar that sets
into a thin, glassy shell. The game borrows these bits from the real thing:

- **The hawthorn berry (viirpuumari)** is the classic fruit, and it grows in Estonia too. It's
  the first starter food, sweet and then a little sour (the bear puckers).
- **Cooking the sugar:** sellers watch the syrup in a copper pot: big bubbles, then small fine
  bubbles and a golden color mean it's ready. Here she taps the pot: the fire lights, the syrup
  bubbles, turns golden, and *then* the stick dips in (`potTaps` in `config.js`, 1–10; 1 = dip at once).
- **The sugar wing (糖风):** sellers flick the stick on a stone slab, which leaves a thin glassy
  sheet of sugar on the tip. After dipping, a sugar wing sits on top of the stick: tap it and it
  snaps off for the bear. Just for fun, it's never needed.
- **The glassy crack:** the shell breaks with a bright *crack* before the crunch, with clear
  sugar shards flying.
- **The street seller's call:** "Kommipulgad! Värskelt kastetud!" ("Candy sticks! Freshly dipped!")
  when the shop opens, like the sellers' sing-song cries.
- **The straw pole (草把子):** sellers carried a pole with a fat straw bundle, the sticks pushed in
  all around. Every food she wins gets a stick in the straw pole (bottom right of the shop),
  with its letter on a little flag. Tap the pole, then a stick, to hear its sound and word again:
  letter practice whenever she likes. The ✕ at the top right goes back to the shop.
- **Customers' wishes**, from tanghulu shop games: the bear shows a picture of the food it would
  like, and she hears "Karu soov on… maasikas". Putting it on the stick makes the bear extra happy,
  but every stick is fine. Turn it off with `bearWishes: false`.

---

## 8. Record your own voice: the checklist

The game already talks with its built-in Estonian voice. Your recordings make it warmer, and
**the 12 letter sounds are the most worth recording**: only a person can say the sound "sss".

**How:**
- Use any voice recorder (iPhone Voice Memos saves `.m4a`, which works). Free editor for trimming: Audacity.
- One recording per file, `.mp3`, `.m4a` or `.wav`, with the exact file name below.
- Trim the silence at the start and end so the game feels quick.
- Speak warmly and a little slowly. Record in a quiet room.
- Everything is optional. Record a few files, the rest keep using the built-in voice.

The parent screen lists the letter sounds still to record, and any line that has no voice at all.

### Letter sounds: `assets/sounds/letters/`

Say the **sound**, not the letter's name ("sss", not "ess"), short and clean. Estonian
k, p, t are short and soft: no puff of air and no vowel after them ("t", not "tee" or "tuh").

| File | Say | Tip |
|---|---|---|
| `a.mp3` | "a" | a short, open a, as at the start of **a**rbuus (not drawn out: "aa" is a double letter) |
| `m.mp3` | "mmm" | lips closed, humming for about a second (not "emm") |
| `s.mp3` | "sss" | a gentle hiss for about a second (not "ess") |
| `l.mp3` | "lll" | the clear l of **l**eib, tongue behind the upper teeth (not "ell") |
| `õ.mp3` | "õ" | short, as at the start of **õ**un: lips relaxed, not rounded |
| `v.mp3` | "vvv" | soft, upper teeth lightly on the lower lip (not "vee") |
| `j.mp3` | "j" | like a short "i", as at the start of **j**äätis (not "jott") |
| `n.mp3` | "nnn" | humming through the nose (not "enn") |
| `h.mp3` | "hhh" | just a breath, as if fogging a mirror, clearly audible (not "haa") |
| `k.mp3` | "k" | one short k from the back of the tongue, no vowel after it (not "kaa") |
| `p.mp3` | "p" | the lips pop once, softly, no vowel after it (not "pee") |
| `t.mp3` | "t" | the tongue tip taps once behind the teeth, no vowel after it (not "tee") |

For **õ.mp3**: type the name on the tablet or a PC if you can. A Mac can store "õ" in a file name
in a different way; the game looks for both ways, so it should still work.

### Food words: `assets/sounds/words/`

| File | Say |
|---|---|
| `hawthorn.mp3` | "viirpuumari" |
| `cherry.mp3` | "kirss" |
| `grape.mp3` | "viinamari" |
| `mandarin.mp3` | "mandariin" |
| `watermelon.mp3` | "arbuus" |
| `strawberry.mp3` | "maasikas" |
| `lemon.mp3` | "sidrun" |
| `bread.mp3` | "leib" |
| `apple.mp3` | "õun" |
| `peach.mp3` | "virsik" |
| `icecream.mp3` | "jäätis" |
| `noodles.mp3` | "nuudlid" |
| `hamburger.mp3` | "hamburger" |
| `kiwi.mp3` | "kiivi" |
| `pear.mp3` | "pirn" |
| `tomato.mp3` | "tomat" |

### Sentences: `assets/sounds/voice/`

| File | Say |
|---|---|
| `call.mp3` | "Kommipulgad! Värskelt kastetud!" (the street seller's call, when the shop opens) |
| `welcome.mp3` | "Tere tulemast kommipulgapoodi!" |
| `tapFood.mp3` | "Puuduta mõnda toitu ja see läheb pulga otsa!" |
| `tapPot.mp3` | "Lisa veel toitu või puuduta potti, et suhkur sulaks!" |
| `cook.mp3` | "Suhkur sulab ja mullitab! Puuduta potti veel!" |
| `syrupReady.mp3` | "Siirup on kuldne! Puuduta potti ja kasta pulk sisse!" |
| `stickFull.mp3` | "Pulk on täis! Nüüd puuduta potti." |
| `bowlClosed.mp3` | "See kauss on veel kinni! Salapurk teeb selle lahti." (tapping a closed bowl) |
| `tapStick.mp3` | "Oi, kui läikiv! Puuduta pulka ja anna see karule!" |
| `dipFirst.mp3` | "Kõigepealt kasta pulk siirupisse! Puuduta potti." |
| `feedFirst.mp3` | "Kõigepealt anna karule süüa! Puuduta pulka." |
| `keepGoing.mp3` | "Puuduta pulka veel!" |
| `wish.mp3` | "Karu soov on…" (the bear's wish; then the food's word) |
| `wishYes.mp3` | "Karu sai just selle, mida ta tahtis!" (the bear got its wish) |
| `yay.mp3` | "Hurraa! Karule maitseb väga!" (the cheer after every finished stick) |
| `jar.mp3` | "Salapurk! Milline täht nii kõlab?" (jar, when the letter sound is recorded) |
| `jarWord.mp3` | "Salapurk! Millise tähega algab see sõna?" (jar, until it is) |
| `review.mp3` | "Kas mäletad? Milline täht nii kõlab?" |
| `reviewWord.mp3` | "Kas mäletad? Millise tähega algab see sõna?" |
| `listen.mp3` | "Kuula!" |
| `star.mp3` | "Said kuldtähe!" |
| `again.mp3` | "Teeme veel ühe kommipulga!" |
| `pole.mp3` | "Siin on kõik sinu kommipulgad! Puuduta pulka ja kuula!" (the straw pole) |
| `poleBack.mp3` | "Kui tahad tagasi poodi, puuduta risti!" (on the straw pole, after listening) |
| `poleNew.mp3` | "Uus kommipulk läks õlgedesse! Puuduta õlgi ja kuula!" (the first time the straw pole appears) |
| `newPlace.mp3` | "Sa tegid kõik purgid lahti! Lähme nüüd uude kohta!" |
| `allDone.mp3` | "Vau! Sa tunned juba nii palju tähti! Sa oled tõeline kommistaar!" |
| `turnTablet.mp3` | "Palun keera tahvelarvuti külili!" (when the tablet is held upright) |
| `place-kitchen.mp3` | "Tere tulemast kööki!" |
| `place-beach.mp3` | "Tere tulemast randa!" |
| `place-space.mp3` | "Tere tulemast kosmosesse!" |

If you change a sentence in `config.js`, record the new words with the same file name.

### Sound effects (optional): `assets/sounds/fx/`

Without these files the game makes the sounds itself.

| File | What it is |
|---|---|
| `crunch.mp3` | the bear biting the sugar coat (played a little higher or lower each time) |
| `crack.mp3` | the glassy crack of the sugar shell (with every bite) |
| `bubble.mp3` | the syrup bubbling when she taps the pot |
| `pling.mp3` | the syrup is golden and ready |
| `snap.mp3` | the sugar wing snapping off |
| `pop.mp3` | a food jumps onto the stick |
| `dip.mp3` | the stick goes into the syrup |
| `shine.mp3` | the shine sweeping over the glossy stick |
| `whoosh.mp3` | something flies |
| `boing.mp3` | a soft "not now" (stick full, dip first…) |
| `sour.mp3` | the bear tastes something sour (lemon, hawthorn) |
| `unlock.mp3` | the jar's lock pops open |
| `sparkle.mp3` | sparkles around the opened jar |
| `star.mp3` | a star appears |
| `clink.mp3` | the lid of a closed bowl rattles |
| `lid.mp3` | a bowl's lid comes off (a new food) |
| `cheer.mp3` | a happy fanfare (finished stick, new place) |

### Music (optional): `assets/music/`

| File | What it is |
|---|---|
| `theme.mp3` | background music, played quietly on a loop (can be switched off on the parent screen) |

---

## 9. Switch to another language

Everything spoken and every letter is in `config.js`. To switch, for example back to English
or to Finnish:

1. Set the language: `language: "en-US"` (or `"fi-FI"`, `"lv-LV"`, `"de-DE"`, …).
2. Translate `artBy`, the `title`, all the sentences in `phrases`, each level's `say` and the customer's `word`.
3. For every food, translate `word`, and set `letter` to the **first letter and first sound of the
   word in the new language**. Pick foods so that each letter appears only once.
4. Set `builtinVoice: false` (the built-in clips are Estonian), or make new clips for a language
   Neurokõne doesn't speak by recording them.
5. Record new letter sounds (or delete the Estonian ones).

Notes:
- You can keep the `id`s in English (they are only file names), or rename them **and** the files.
- Letters can be special characters or more than one letter: `"ñ"`, `"ā"`, `"ch"`, `"sh"`.
  The letter recording then is `assets/sounds/letters/ñ.mp3` or `ch.mp3`.
- The tablet's own voice must exist for that language. The parent screen shows the voices found.
  On iPad you can download more: Settings → Accessibility → **Spoken Content → Voices**.
  On Android: Settings → **Text-to-speech output**.

---

## 10. The parent screen

**Hold the ⚙️ in the top-right corner for 3 seconds.** A ring fills up while you hold.
A quick tap does nothing, so she won't open it by accident.

It shows:
- **Letters:** which letters she knows. A letter counts as known after 3 right answers in a row on the first try. Also shows what's still locked, the stars she earned and how often she missed.
- **Drawings:** which foods (and the bear and backgrounds) still use placeholders, with the exact file name to save.
- **Sound:** volume, music on/off, whether the tablet has an Estonian voice, where every spoken
  line comes from (your recordings, the built-in voice, the tablet voice, or silent), and which
  letter sounds are still to record.
- **Letters on the buttons:** lowercase (default) or UPPERCASE.
- **Start over:** reset all progress (it asks first). Volume and other settings are kept.

If she played the earlier English version on the same tablet, the Estonian version starts her
letters fresh (they are different letters) but keeps the volume and other settings.

---

## 11. Troubleshooting

**No sound on the iPad**
- Sound starts with the first tap on ▶. Reload and tap ▶ again.
- Check the volume, and that the iPad isn't muted (Control Center → bell icon).
- Check the volume slider on the parent screen.

**A sentence is silent**
- You probably changed it in `config.js`, so its built-in clip no longer matches, and the
  tablet has no Estonian voice. The parent screen lists these lines. Record them (section 8)
  or run `node tools/make-voice.js` (section 6).

**The voice sounds strange**
- Record your own voice (section 8): your recordings always win.
- Or make the built-in clips with another voice (section 6).

**A drawing doesn't show up**
- Check the folder and the exact file name on the parent screen (lowercase, `.png`/`.jpg`).
- Reload the page. If you replaced an older drawing, see the note at the end of section 4.

**The screen shows a turning tablet 📱↻**
- Turn the tablet sideways. The game is made for landscape.

**The buttons look small**
- The game scales to the screen. Buttons are at least 80 px when the browser window is
  about 900 × 560 or bigger. On Android the game goes fullscreen after ▶, which helps on
  small tablets. On iPad, start it from the Home Screen icon (no Safari bars).

**The tablet can't open `http://192.168…`**
- Is the server still running on the computer? Is the tablet on the same Wi-Fi (not a guest network)?
- Allow Python through the firewall (Windows: "Allow access" when asked; Mac: System Settings → Network → Firewall).

**Her progress is gone**
- Progress lives in the browser's storage for one exact address. Clearing website data, a
  changed address (`.23` → `.24`), or switching between a Safari tab and the Home Screen icon
  each start fresh. See the notes in section 2.

---

## 12. What each file does

| File | What it does |
|---|---|
| `config.js` | **All settings**: title, artist, foods, letters, places, sentences. The only file you need to edit. |
| `index.html` | The page itself: the screens and buttons. |
| `drawing-sheets.html` | The printable drawing sheets. |
| `css/style.css` | How everything looks: colors, sizes, positions, animations. |
| `js/main.js` | Starts the game and connects the parts (title screen, instructions, places). |
| `js/shop.js` | The shop: shelf, stick, pot (cooking the sugar), sugar wing, bear and its wishes. |
| `js/jar.js` | The letter jar riddle. |
| `js/pole.js` | The straw pole with all her won sticks. |
| `js/levels.js` | Which place she's in and what the next jar holds (including review jars). |
| `js/parent.js` | The parent screen. |
| `js/hint.js` | The bouncing 👆 hand. |
| `js/sound.js` | Plays recordings, then the built-in Estonian clips, then the tablet voice; music. |
| `js/synth.js` | Sound effects made in code (crunch, crack, bubbles, …). |
| `js/assets.js` | Finds her drawings, shows placeholders, removes white paper. |
| `js/effects.js` | Flying sugar and glass, hearts, sparkles, confetti. |
| `js/progress.js` | Saves progress in the browser (localStorage). |
| `js/util.js` | Small helpers, and the stage that scales the game to any screen. |
| `assets/sounds/builtin/` | The built-in Estonian voice clips and their list (`voice-index.js`). |
| `tools/make-voice.js` | Makes new built-in clips after you change words (optional, see section 6). |
| `manifest.json`, `icon*.png`, `icon.svg` | The home-screen icon and fullscreen mode. (The home-screen name is set in `manifest.json`.) |

The game uses no frameworks and makes no network requests. Every file has comments,
so feel free to explore and change things.

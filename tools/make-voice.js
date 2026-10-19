#!/usr/bin/env node
/* =====================================================================
   tools/make-voice.js — makes the game's built-in Estonian voice clips.

   You only need this if you CHANGE a sentence or a food word in
   config.js and don't want to record it yourself. The game itself never
   connects to the internet; this script does, once, on your computer.

   How to run it (needs Node.js 18 or newer, https://nodejs.org):
       node tools/make-voice.js            (voice "mari")
       node tools/make-voice.js vesta      (another voice)

   What it does:
     1. reads every sentence and food word from config.js,
     2. asks Neurokõne (the free Estonian speech service of the University
        of Tartu, https://neurokone.ee) to say it,
     3. trims the silence and saves the clip in assets/sounds/builtin/,
     4. writes assets/sounds/builtin/voice-index.js, the list the game reads.
   Clips whose words did not change are kept, so it is quick to re-run.
   If ffmpeg is installed the clips are small .mp3 files, otherwise .wav.

   Voices you may use for a game you share: mari, vesta, albert, kalev,
   meelis, lee (lee is a girl's voice). Please don't use indrek, kylli,
   liivika or tambet: those are actors' voices with stricter rules.
   ===================================================================== */

"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "sounds", "builtin");
const API = "https://api.tartunlp.ai/text-to-speech/v2";
const SPEAKER = (process.argv[2] || "mari").toLowerCase();
const SPEED = 0.9; // a little slower than normal, for a child
const RECIPE = "sentence-1"; // change this to make every clip again

// ---------------------------------------------------------------------
// 1. Read config.js
// ---------------------------------------------------------------------
function readConfig() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "config.js"), "utf8") + "\n;this.CONFIG = CONFIG;", sandbox);
  return sandbox.CONFIG;
}

function fillIn(sentence, values) {
  return String(sentence).replace(/\{(\w+)\}/g, (all, name) => (values[name] !== undefined ? values[name] : all));
}

function sameWords(text) {
  return String(text || "").replace(/\s+/g, " ").trim().normalize("NFC");
}

// Every line the game can say, with the same names the game uses.
function linesToSay(CONFIG) {
  const lines = [];
  const add = (key, text) => { if (sameWords(text)) lines.push({ key, text: sameWords(text) }); };
  Object.keys(CONFIG.phrases).forEach((key) => add("voice/" + key, CONFIG.phrases[key]));
  CONFIG.levels.forEach((level) => add("voice/place-" + level.id, level.say));
  const foods = CONFIG.starterFoods.concat(...CONFIG.levels.map((level) => level.foods)).filter(Boolean);
  foods.forEach((food) => add("words/" + food.id, food.word));
  if (CONFIG.letterSpeech) {
    CONFIG.levels.forEach((level) => level.foods.forEach((food) => {
      if (food.letter) add("letters/" + food.letter, fillIn(CONFIG.letterSpeech, { letter: food.letter, word: food.word }));
    }));
  }
  return lines;
}

// File names stay plain ASCII ("õ" becomes "u00f5"), so they work everywhere.
function safeName(key) {
  return key.split("/").map((part) =>
    part.normalize("NFC").replace(/[^A-Za-z0-9_-]/g, (ch) => "u" + ch.codePointAt(0).toString(16).padStart(4, "0"))
  ).join("/");
}

function readOldIndex() {
  const file = path.join(OUT, "voice-index.js");
  if (!fs.existsSync(file)) return { clips: {} };
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(fs.readFileSync(file, "utf8") + "\n;this.BUILTIN_VOICE = BUILTIN_VOICE;", sandbox);
    return sandbox.BUILTIN_VOICE || { clips: {} };
  } catch (error) {
    return { clips: {} };
  }
}

// ---------------------------------------------------------------------
// 2. Ask Neurokõne to say a line, get the samples back
// ---------------------------------------------------------------------

// Send single words like a little sentence ("Maasikas."): the voice then
// says the last sound clearly instead of letting it fade away.
function asSentence(text) {
  let sentence = text.charAt(0).toLocaleUpperCase("et-EE") + text.slice(1);
  if (!/[.!?…]$/.test(sentence)) sentence += ".";
  return sentence;
}

async function synthesize(text) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "audio/wav" },
        body: JSON.stringify({ text: asSentence(text), speaker: SPEAKER, speed: SPEED }),
      });
      if (!response.ok) throw new Error("HTTP " + response.status + " " + (await response.text()).slice(0, 200));
      return parseWav(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

// Read a WAV file (16-bit or 32-bit float) into numbers between -1 and 1.
function parseWav(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a WAV file");
  let offset = 12, format = 1, channels = 1, rate = 22050, bits = 16, data = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = buffer.readUInt16LE(offset + 8);
      channels = buffer.readUInt16LE(offset + 10);
      rate = buffer.readUInt32LE(offset + 12);
      bits = buffer.readUInt16LE(offset + 22);
    } else if (id === "data") {
      data = buffer.subarray(offset + 8, offset + 8 + size);
    }
    offset += 8 + size + (size % 2);
  }
  if (!data) throw new Error("WAV has no data");
  const step = (bits / 8) * channels;
  const count = Math.floor(data.length / step);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const at = i * step;
    samples[i] = format === 3 ? data.readFloatLE(at) : data.readInt16LE(at) / 32768;
  }
  return { samples, rate };
}

// Cut the quiet parts at the start and end (keep a tiny margin) and fade.
function trim({ samples, rate }) {
  const loud = 0.012;
  let start = 0, end = samples.length - 1;
  while (start < end && Math.abs(samples[start]) < loud) start++;
  while (end > start && Math.abs(samples[end]) < loud) end--;
  const margin = Math.round(rate * 0.06);
  start = Math.max(0, start - margin);
  end = Math.min(samples.length - 1, end + margin);
  const out = samples.slice(start, end + 1);
  const fade = Math.min(Math.round(rate * 0.01), Math.floor(out.length / 4));
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[out.length - 1 - i] *= i / fade;
  }
  return { samples: out, rate };
}

// A plain 16-bit mono WAV file.
function wavBytes({ samples, rate }) {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(36 + samples.length * 2, 4);
  bytes.write("WAVEfmt ", 8, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  return bytes;
}

function hasFfmpeg() {
  try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return true; } catch (error) { return false; }
}

// Save the clip; gives back its file name inside assets/sounds/builtin/.
function save(name, audio, useMp3) {
  const wav = wavBytes(audio);
  const target = path.join(OUT, name + (useMp3 ? ".mp3" : ".wav"));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (useMp3) {
    const temp = path.join(os.tmpdir(), "make-voice-" + process.pid + ".wav");
    fs.writeFileSync(temp, wav);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", temp, "-ac", "1", "-b:a", "64k", target]);
    fs.unlinkSync(temp);
  } else {
    fs.writeFileSync(target, wav);
  }
  return path.relative(OUT, target).split(path.sep).join("/");
}

// ---------------------------------------------------------------------
// 3. Make every clip that is missing or out of date, then write the index
// ---------------------------------------------------------------------
async function main() {
  const CONFIG = readConfig();
  const lines = linesToSay(CONFIG);
  const old = readOldIndex();
  const useMp3 = hasFfmpeg();
  const clips = {};
  let made = 0, kept = 0;

  for (const line of lines) {
    const before = old.clips && old.clips[line.key];
    if (before && sameWords(before.text) === line.text && old.speaker === SPEAKER &&
        old.recipe === RECIPE && fs.existsSync(path.join(OUT, before.file))) {
      clips[line.key] = before;
      kept++;
      continue;
    }
    process.stdout.write("  saying: " + line.text + " … ");
    const audio = trim(await synthesize(line.text));
    const file = save(safeName(line.key), audio, useMp3);
    clips[line.key] = { text: line.text, file, seconds: Math.round((audio.samples.length / audio.rate) * 100) / 100 };
    made++;
    console.log("ok (" + clips[line.key].seconds + " s)");
    await new Promise((resolve) => setTimeout(resolve, 250)); // be gentle with the free service
  }

  // Remove old clips that are not needed any more.
  const keep = new Set(Object.values(clips).map((clip) => clip.file));
  for (const folder of ["voice", "words", "letters"]) {
    const dir = path.join(OUT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!keep.has(folder + "/" + name) && /\.(mp3|wav)$/.test(name)) fs.unlinkSync(path.join(dir, name));
    }
  }

  const index = {
    speaker: SPEAKER,
    recipe: RECIPE,
    credit: "Kõnesüntees: Neurokõne (TartuNLP, Tartu Ülikool), hääl " + SPEAKER + ". https://neurokone.ee",
    clips,
  };
  fs.writeFileSync(path.join(OUT, "voice-index.js"),
    "/* Made by tools/make-voice.js — please don't edit by hand.\n" +
    "   The game's built-in Estonian voice. " + index.credit + "\n" +
    "   A clip is only used while its words still match config.js. */\n" +
    "var BUILTIN_VOICE = " + JSON.stringify(index, null, 2) + ";\n");
  console.log("Done: " + made + " new clips, " + kept + " kept (" + (useMp3 ? "mp3" : "wav") + ").");
}

main().catch((error) => {
  console.error("\nSomething went wrong: " + error.message);
  console.error("Check the internet connection and try again.");
  process.exit(1);
});

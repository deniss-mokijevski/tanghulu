/* =====================================================================
   util.js — tiny helpers used by all the other files.
   ===================================================================== */

// Find one thing on the page, e.g. $("#shelf")
function $(selector) {
  return document.querySelector(selector);
}

// Make a new element, e.g. make("div", "food", "🍓")
function make(tag, className, text) {
  var element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

// Wait a little: await wait(500) pauses for half a second.
function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// Random helpers
function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
function shuffle(list) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
  }
  return copy;
}

// Run "handler" the moment a finger (or mouse) touches the element.
// We use "pointerdown" instead of "click" because it reacts instantly
// and also works when a small finger slides a bit while tapping.
function onTap(element, handler) {
  function run(event) {
    if (event.cancelable) event.preventDefault();
    handler(event);
  }
  if (window.PointerEvent) {
    element.addEventListener("pointerdown", function (event) {
      if (event.button > 0) return; // ignore the right mouse button
      // (A second finger is fine: a thumb resting on the tablet's edge
      // must not stop her taps from working.)
      run(event);
    });
  } else {
    // Very old browsers without pointer events
    element.addEventListener("touchstart", run, { passive: false });
    element.addEventListener("mousedown", run);
  }
}

// Like onTap, but for things on the shelf, which scrolls sideways: it
// waits until the finger lifts, so a swipe (to scroll) is not a tap.
// The finger may wobble a little (12 px) and it is still a tap.
function onTapNoSwipe(element, handler) {
  var start = null;
  function scroller() { return element.closest ? element.closest(".scroller") : null; }
  function begin(x, y) {
    var box = scroller();
    start = { x: x, y: y, scroll: box ? box.scrollLeft : 0 };
  }
  function end(x, y, event) {
    if (!start) return;
    var box = scroller();
    var moved = Math.abs(x - start.x) + Math.abs(y - start.y);
    var scrolled = box ? Math.abs(box.scrollLeft - start.scroll) : 0;
    start = null;
    if (moved < 12 && scrolled < 4) handler(event);
  }
  if (window.PointerEvent) {
    element.addEventListener("pointerdown", function (event) {
      if (event.button > 0) return;
      begin(event.clientX, event.clientY);
    });
    element.addEventListener("pointerup", function (event) { end(event.clientX, event.clientY, event); });
    // The browser took over the finger to scroll: not a tap.
    element.addEventListener("pointercancel", function () { start = null; });
  } else {
    element.addEventListener("touchstart", function (event) {
      begin(event.touches[0].clientX, event.touches[0].clientY);
    });
    element.addEventListener("touchend", function (event) {
      var touch = event.changedTouches[0];
      end(touch.clientX, touch.clientY, event);
      if (event.cancelable) event.preventDefault(); // no extra mouse events
    });
    element.addEventListener("touchcancel", function () { start = null; });
    element.addEventListener("mousedown", function (event) { begin(event.clientX, event.clientY); });
    element.addEventListener("mouseup", function (event) { end(event.clientX, event.clientY, event); });
  }
}

// Restart a CSS animation class (e.g. "wiggle") on an element.
function replayClass(element, className, ms) {
  element.classList.remove(className);
  void element.offsetWidth; // forces the browser to notice the removal
  element.classList.add(className);
  if (ms) {
    setTimeout(function () { element.classList.remove(className); }, ms);
  }
}

// The language from config.js written the way browsers expect ("es-ES").
function languageTag() {
  return String(CONFIG.language || "en-US").trim().replace("_", "-");
}

// Fill in {letter} / {word} style blanks in a sentence.
function fillIn(sentence, values) {
  return String(sentence).replace(/\{(\w+)\}/g, function (all, name) {
    return values[name] !== undefined ? values[name] : all;
  });
}

/* ---------------------------------------------------------------------
   The STAGE is a fixed 1000 × 640 game area. It is scaled up or down
   to fit any screen, so all positions in the CSS are simple pixels.
   --------------------------------------------------------------------- */
var Stage = {
  width: 1000,
  height: 640,
  scale: 1,
  element: null,

  init: function () {
    this.element = $("#stage");
    this.fit();
    var self = this;
    window.addEventListener("resize", function () { self.fit(); });
    window.addEventListener("orientationchange", function () {
      setTimeout(function () { self.fit(); }, 300);
    });
  },

  // Make the stage as big as possible while keeping its shape.
  fit: function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.scale = Math.min(w / this.width, h / this.height);
    this.element.style.transform =
      "translate(-50%, -50%) scale(" + this.scale + ")";
  },

  // Where is an element, measured in stage pixels? Returns its center.
  where: function (element) {
    var s = this.element.getBoundingClientRect();
    var r = element.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - s.left) / this.scale,
      y: (r.top + r.height / 2 - s.top) / this.scale,
      width: r.width / this.scale,
      height: r.height / this.scale,
    };
  },
};

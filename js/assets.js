/* =====================================================================
   assets.js — her drawings.

   For every food, the customer and every place, the game looks for a
   picture file (for example assets/foods/strawberry.png).
     • Found     → the drawing is shown, with a small 🖍️ badge.
     • Not found → a placeholder is shown: the emoji in a dashed
                   "empty frame" with a small ✏️ badge.
   No code needs to change: just drop the file in the folder and reload.
   ===================================================================== */

var Assets = {
  searches: {}, // "foods/strawberry" → Promise that gives the picture (or null)
  results: {},  // "foods/strawberry" → the picture once we know (or null)

  // Look for a picture, trying each file type from config.js in turn.
  // Gives back { src: "...", paper: true/false } or null when missing.
  find: function (folder, id) {
    var key = folder + "/" + id;
    var self = this;
    if (!this.searches[key]) {
      this.searches[key] = this.tryTypes(folder, id, 0).then(function (found) {
        self.results[key] = found;
        return found;
      });
    }
    return this.searches[key];
  },

  // Try assets/<folder>/<id>.png, then .jpg, and so on.
  tryTypes: function (folder, id, index) {
    var types = CONFIG.imageTypes || ["png"];
    if (index >= types.length) return Promise.resolve(null);
    var self = this;
    var url = "assets/" + folder + "/" + encodeURIComponent(id) + "." + types[index];
    return this.loadImage(url).then(function (img) {
      if (!img) return self.tryTypes(folder, id, index + 1);
      // Backgrounds are used as they are. Foods and characters get
      // their white paper removed, if possible.
      if (folder === "backgrounds" || !CONFIG.cleanUpPaper) {
        return { src: url, paper: false };
      }
      var cleaned = self.cleanPaper(img);
      if (cleaned) return { src: cleaned, paper: false };
      // Could not clean it (happens when the game is opened straight
      // from a file). Use the picture with a "multiply" trick instead,
      // which makes white paper blend into what is behind it.
      return { src: url, paper: true };
    });
  },

  // Load one picture. Gives back the <img> or null if the file is missing.
  loadImage: function (url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve(img.naturalWidth > 0 ? img : null);
      };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  },

  // Start looking for every picture right away, so they are ready
  // by the time she presses ▶.
  preloadAll: function () {
    var self = this;
    var jobs = [];
    allFoods().forEach(function (food) { jobs.push(self.find("foods", food.id)); });
    jobs.push(this.find("characters", CONFIG.customer.id));
    CONFIG.levels.forEach(function (level) { jobs.push(self.find("backgrounds", level.id)); });
    return Promise.all(jobs);
  },

  /* -------------------------------------------------------------------
     Build the picture for a food or the customer.
       item    = an entry from config.js (has id and emoji)
       options.framed = true → show the dashed frame / badges
     ------------------------------------------------------------------- */
  picture: function (folder, item, options) {
    options = options || {};
    var box = make("div", "picture" + (options.framed ? " framed" : ""));
    box.dataset.id = item.id;

    function fill(found) {
      box.innerHTML = "";
      box.classList.remove("has-paper");
      box.classList.toggle("is-drawing", !!found);
      box.classList.toggle("is-placeholder", !found);
      if (found) {
        var img = make("img");
        img.src = found.src;
        img.alt = item.word || item.id;
        img.draggable = false;
        if (found.paper) {
          img.classList.add("paper");
          box.classList.add("has-paper");
        }
        box.appendChild(img);
        if (options.framed) box.appendChild(make("span", "badge crayon", "🖍️"));
      } else {
        box.appendChild(make("span", "emoji", item.emoji));
        if (options.framed) box.appendChild(make("span", "badge pencil", "✏️"));
      }
    }

    var key = folder + "/" + item.id;
    if (key in this.results) {
      fill(this.results[key]);
    } else {
      fill(null);                         // placeholder for now…
      this.find(folder, item.id).then(fill); // …swap in the drawing if it exists
    }
    return box;
  },

  /* -------------------------------------------------------------------
     Make white (or grey) paper see-through and cut away empty margins,
     so a photo or scan of a drawing on paper still looks nice.
     Gives back a new picture (as a data URL), or null if not possible.
     ------------------------------------------------------------------- */
  cleanPaper: function (img) {
    try {
      // 1. Draw the picture small enough to work with quickly.
      var maxSide = 600;
      var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.max(1, Math.round(img.naturalWidth * scale));
      var h = Math.max(1, Math.round(img.naturalHeight * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var image = ctx.getImageData(0, 0, w, h); // fails when opened from a file
      var px = image.data;

      // 2. Look at the pixels around the edge.
      var edge = [];
      var hasSeeThrough = false;
      var addEdge = function (x, y) {
        var i = (y * w + x) * 4;
        if (px[i + 3] < 250) hasSeeThrough = true;
        edge.push(i);
      };
      for (var x = 0; x < w; x++) { addEdge(x, 0); addEdge(x, h - 1); }
      for (var y = 0; y < h; y++) { addEdge(0, y); addEdge(w - 1, y); }

      // 3. A picture that already has a see-through background is kept
      //    as it is. Otherwise we remove the paper.
      if (!hasSeeThrough) {
        // The paper color is the middle value of the edge pixels.
        var middle = function (channel) {
          var values = edge.map(function (i) { return px[i + channel]; });
          values.sort(function (a, b) { return a - b; });
          return values[Math.floor(values.length / 2)];
        };
        var paper = [middle(0), middle(1), middle(2)];
        var paperLight = (paper[0] + paper[1] + paper[2]) / 3;
        // Only remove light, plain paper (not a fully colored background).
        if (paperLight < 150) return this.trim(canvas, ctx, image, w, h);

        // Is this pixel "paper"? Close to the paper color, or a light grey shadow.
        var isPaper = function (i) {
          var r = px[i], g = px[i + 1], b = px[i + 2];
          var dr = r - paper[0], dg = g - paper[1], db = b - paper[2];
          var distance = Math.sqrt(dr * dr + dg * dg + db * db);
          if (distance < 45) return true;
          var light = (r + g + b) / 3;
          var greyish = Math.max(r, g, b) - Math.min(r, g, b) < 25;
          return greyish && light > paperLight - 60;
        };

        // Flood fill from the edges: paper touching the edge becomes
        // see-through. Paper inside closed lines (like a white shine
        // on a cherry) stays.
        var seen = new Uint8Array(w * h);
        var stack = [];
        edge.forEach(function (i) { stack.push(i / 4); });
        var removed = 0;
        while (stack.length) {
          var p = stack.pop();
          if (seen[p]) continue;
          seen[p] = 1;
          if (!isPaper(p * 4)) continue;
          px[p * 4 + 3] = 0;
          removed++;
          var px0 = p % w, py0 = (p - px0) / w;
          if (px0 > 0) stack.push(p - 1);
          if (px0 < w - 1) stack.push(p + 1);
          if (py0 > 0) stack.push(p - w);
          if (py0 < h - 1) stack.push(p + w);
        }
        // If (almost) everything was removed, the drawing is too light.
        // Keep the original picture instead.
        if (removed > w * h * 0.97) return null;
        ctx.putImageData(image, 0, 0);
      }
      return this.trim(canvas, ctx, ctx.getImageData(0, 0, w, h), w, h);
    } catch (error) {
      return null;
    }
  },

  // Cut away empty see-through margins so small drawings fill their spot.
  trim: function (canvas, ctx, image, w, h) {
    var px = image.data;
    var left = w, right = -1, top = h, bottom = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 20) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    if (right < 0) return canvas.toDataURL("image/png"); // nothing visible
    var margin = Math.round(Math.max(right - left, bottom - top) * 0.04);
    left = Math.max(0, left - margin);
    top = Math.max(0, top - margin);
    right = Math.min(w - 1, right + margin);
    bottom = Math.min(h - 1, bottom + margin);
    var out = document.createElement("canvas");
    out.width = right - left + 1;
    out.height = bottom - top + 1;
    out.getContext("2d").drawImage(canvas, left, top, out.width, out.height,
      0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  },
};

/* ---------------------------------------------------------------------
   Handy lists built from config.js
   --------------------------------------------------------------------- */

// Every food: the starter foods first, then each level's foods.
function allFoods() {
  var list = CONFIG.starterFoods.slice();
  CONFIG.levels.forEach(function (level) {
    level.foods.forEach(function (food) { list.push(food); });
  });
  // A stray extra comma in config.js leaves a gap; a food listed twice counts once.
  var seen = {};
  return list.filter(function (food) {
    if (!food || seen[food.id]) return false;
    seen[food.id] = true;
    return true;
  });
}

// Find a food by its id.
function foodById(id) {
  var foods = allFoods();
  for (var i = 0; i < foods.length; i++) {
    if (foods[i].id === id) return foods[i];
  }
  return null;
}

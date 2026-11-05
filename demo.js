import BruceLawson from "./src/bruce-lawson.js";

/* ===================== demo page ===================== */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bruce = document.querySelector("#stage bruce-lawson");
  const B = BruceLawson;
  document.documentElement.classList.toggle("talk", new URLSearchParams(location.search).has("talk"));  // the slides embed ?talk
  const sel = { head: $("head"), top: $("top"), legs: $("legs"), rant: $("rant") };

  function fill(select, values, current) {
    select.innerHTML = "";
    values.forEach(([v, label]) => { const o = document.createElement("option"); o.value = v; o.textContent = label; select.appendChild(o); });
    select.value = current;
  }
  fill(sel.head, [["auto", "auto (mood-based)"], ...Object.entries(B.heads).map(([k, h]) => [k, `${k} (${h.label})`])], bruce.getAttribute("head") || "auto");
  fill(sel.top, [["random", "random"], ...Object.keys(B.tops).map(k => [k, k])], bruce.getAttribute("top") || "random");
  fill(sel.legs, [["random", "random"], ...Object.keys(B.legs).map(k => [k, k])], bruce.getAttribute("legs") || "random");
  fill(sel.rant, [["random", "random"], ...B.topics.map(t => [t, t])], bruce.getAttribute("rant") || "random");
  // Stage backgrounds: photos behind Bruce, drawn by the component. The choice is remembered in this browser.
  // "random" picks a different photo each time it is chosen, and on every visit while it is remembered.
  const BACKGROUNDS = [
    ["gallery", "Bruce’s gallery wall"], ["oslo", "Oslo Opera House"], ["irises", "Iris wallpaper"],
    ["stage", "Conference stage"], ["cma", "Competition & Markets Authority"], ["eu", "EU flags"]
  ];
  const stage = $("stage");
  function setBackground(id) {
    if (id !== "random" && !BACKGROUNDS.some(([k]) => k === id)) id = "gallery";
    bruce.setAttribute("background", id);  // he draws it himself, and settles "random"
    $("background").value = id;
    try { localStorage.setItem("bruce-background", id); } catch {}
  }
  // #bg=oslo in the address picks a background, handy for bookmarking one per slide
  let savedBg = (location.hash.match(/bg=([\w-]+)/) || [])[1] || null;
  if (!savedBg) try { savedBg = localStorage.getItem("bruce-background"); } catch {}
  fill($("background"), [["random", "random"], ...BACKGROUNDS], "gallery");
  setBackground(savedBg || "gallery");
  $("background").addEventListener("change", e => setBackground(e.target.value));


  for (const [attr, s] of Object.entries(sel)) s.addEventListener("change", () => { bruce.setAttribute(attr, s.value); });

  // Props: one checkbox each. Bruce settles clashes between hands himself, so after every change
  // the attribute and the boxes are set to what he actually ended up holding.
  const propBoxes = Object.keys(B.props).map(k => {
    const label = document.createElement("label"), box = document.createElement("input");
    box.type = "checkbox"; box.value = k;
    label.append(box, " " + k);
    $("props").appendChild(label);
    box.addEventListener("change", () => {
      const list = bruce.props.filter(p => p !== k);
      if (box.checked) list.push(k);
      setProps(B.resolveProps(list));
    });
    return box;
  });
  function setProps(list) {
    list.length ? bruce.setAttribute("props", list.join(" ")) : bruce.removeAttribute("props");
    syncProps();
  }
  function syncProps() { const on = new Set(bruce.props); propBoxes.forEach(b => { b.checked = on.has(b.value); }); }
  syncProps();
  $("reduced-motion").addEventListener("change", e => { e.target.checked ? bruce.setAttribute("reduced-motion", "") : bruce.removeAttribute("reduced-motion"); });
  // Turning on the hoedown also dresses him for it: cheeky face, cowboy get-up, jeans and the guitar.
  $("hoedown").addEventListener("change", e => {
    if (e.target.checked) {
      for (const [k, v] of [["head", "cheeky"], ["top", "cowboy"], ["legs", "jeans"]]) { sel[k].value = v; bruce.setAttribute(k, v); }
      bruce.setAttribute("props", "guitar"); syncProps();
      bruce.setAttribute("hoedown", "");
    } else bruce.removeAttribute("hoedown");
  });
  $("ai").addEventListener("change", e => { e.target.checked ? bruce.setAttribute("ai", "") : bruce.removeAttribute("ai"); });
  $("glamorous").addEventListener("change", e => { bruce.setAttribute("glamorous", e.target.checked ? "" : "false"); });
  $("rantBtn").addEventListener("click", () => bruce.rant());
  // Sound effects, made with Web Audio so there are no files: a click for the panel, a slide while the
  // stage is dragged, a ratchet while it's resized. Each one fails silently without Web Audio.
  let actx;
  const audio = () => (actx ||= new AudioContext());
  function tone(f0, f1, dur, vol, type = "sine") {
    try {
      const ac = audio(), t = ac.currentTime, osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur * .7);
      gain.gain.setValueAtTime(vol, t); gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(gain).connect(ac.destination); osc.start(t); osc.stop(t + dur + .01);
    } catch {}
  }
  // a soft, breathy scrape whose loudness follows how fast the stage moves
  function slide() {
    try {
      const ac = audio(), buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
      src.buffer = buf; src.loop = true;
      filter.type = "bandpass"; filter.frequency.value = 500; filter.Q.value = .8;
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(ac.destination); src.start();
      return {
        speed(v) {
          gain.gain.setTargetAtTime(Math.min(.05, v * .00035), ac.currentTime, .03);
          filter.frequency.setTargetAtTime(400 + Math.min(900, v * 2), ac.currentTime, .05);
        },
        stop() { gain.gain.setTargetAtTime(0, ac.currentTime, .04); src.stop(ac.currentTime + .3); }
      };
    } catch { return { speed() {}, stop() {} }; }
  }
  const sfx = {
    click: () => tone(1400, 700, .06, .08),
    pickUp: () => tone(260, 380, .07, .07),
    putDown: () => tone(220, 120, .1, .1),
    tick: up => tone(up ? 2200 : 1700, up ? 1900 : 1400, .025, .05, "triangle"),
    // Randomise: a quick, dreamy run up a whole-tone scale from a random start, each note with a quiet
    // slightly detuned twin that makes it shimmer, and a long last note left hanging
    mystery() {
      try {
        const ac = audio(), t0 = ac.currentTime, base = 392 * 2 ** (Math.floor(Math.random() * 6) * 2 / 12);
        for (let i = 0; i < 7; i++) {
          const t = t0 + i * .07, last = i === 6, f = base * 2 ** (i * 2 / 12), dur = last ? .9 : .22;
          for (const detune of [0, 7]) {
            const osc = ac.createOscillator(), gain = ac.createGain();
            osc.type = "sine"; osc.frequency.value = f; osc.detune.value = detune;
            gain.gain.setValueAtTime(.0001, t);
            gain.gain.exponentialRampToValueAtTime(detune ? .02 : .045, t + .02);
            gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
            osc.connect(gain).connect(ac.destination); osc.start(t); osc.stop(t + dur + .02);
          }
        }
      } catch {}
    }
  };
  // View Source and Randomise have their own sounds: the component's whoosh, and sfx.mystery()
  $("controls").addEventListener("click", e => { if (e.target.closest("button:not(#flipBtn, #randomBtn), input[type=checkbox]")) sfx.click(); });
  // Shh also ends the hoedown, and unticks its switch
  $("shhBtn").addEventListener("click", () => {
    bruce.hush();
    if ($("hoedown").checked) { $("hoedown").checked = false; bruce.removeAttribute("hoedown"); }
  });
  $("flipBtn").addEventListener("click", () => bruce.flip());
  bruce.addEventListener("bruce:flip", e => { $("flipBtn").setAttribute("aria-pressed", e.detail.flipped); stage.classList.toggle("flipped", e.detail.flipped); });
  $("randomBtn").addEventListener("click", () => {
    sfx.mystery();
    for (const k of ["top", "legs", "rant"]) { sel[k].value = "random"; bruce.setAttribute(k, "random"); }
    sel.head.value = "auto"; bruce.setAttribute("head", "auto");
    bruce.setAttribute("props", "random");
    setBackground("random");
    bruce.reroll(); syncProps();
    bruce.rant();
  });


  // Caption: “A glaring Bruce wearing a …”. It follows the face, which changes while he rants and dances.
  let look = null;
  function caption() {
    if (!look) return;
    const d = look, adj = (B.heads[bruce.shownHead] || {}).adj || "glamorous";
    let t;
    if (d.mood === "refuse") t = "Arms crossed. Refusing to work with AI.";
    else if (d.mood === "offended") t = "Deeply offended. Check the console.";
    else t = `${/^[“"]?[aeiou]/i.test(adj) ? "An" : "A"} ${adj} Bruce wearing a ${d.top}, ${d.legs}${d.propsLabel ? `, ${d.propsLabel}` : ""}${d.playing ? ". Mid-hoedown." : "."}`;
    $("caption").textContent = t;
  }
  bruce.addEventListener("bruce:render", e => { look = e.detail; caption(); });
  bruce.addEventListener("bruce:face", caption);
  bruce.render();

  const log = $("log");
  function addLog(html) {
    const empty = log.querySelector(".empty"); if (empty) empty.remove();
    const li = document.createElement("li");
    li.innerHTML = html;
    log.prepend(li);
    while (log.children.length > 7) log.lastElementChild.remove();
  }
  document.addEventListener("bruce:rant", e => addLog(`<code>bruce:rant</code> (${esc(e.detail.topic)}): ${esc(e.detail.text)}`));
  document.addEventListener("bruce:change", e => addLog(`<code>bruce:change</code>: ${esc(e.detail.part)} is now ${esc(e.detail.label || e.detail.value || "nothing")}`));
  document.addEventListener("bruce:hoedown", e => addLog(`<code>bruce:hoedown</code>: ${e.detail.playing ? "started" : "stopped"}`));
  document.addEventListener("bruce:flip", e => addLog(`<code>bruce:flip</code>: ${e.detail.flipped ? "turned over, source showing" : "turned back round"}`));
  document.addEventListener("bruce:offended", () => addLog(`<code>bruce:offended</code>: someone set glamorous to false`));

  // The stage is a little window: drag its background to move it, drag the grip in its corner to resize it.
  // Bruce sizes himself to fit. Double-clicking the grip (or Home on it) puts it back.
  const grip = $("stageGrip");
  let stagePos = [0, 0];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function moveStage(x, y) {
    stagePos = [x, y];
    stage.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    stage.style.zIndex = 30;
  }
  function sizeStage(w, h) {
    w = clamp(w, 260, 1800); h = clamp(h, 320, 1400);
    Object.assign(stage.style, { width: w + "px", height: h + "px", minHeight: "0", zIndex: 30 });
  }
  function resetStage() {
    stagePos = [0, 0];
    for (const p of ["translate", "z-index", "width", "height", "min-height"]) stage.style.removeProperty(p);
  }
  function follow(e, onMove, onEnd) {
    const sx = e.clientX, sy = e.clientY;
    const move = ev => onMove(ev.clientX - sx, ev.clientY - sy, ev);
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); if (onEnd) onEnd(); };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }
  stage.addEventListener("pointerdown", e => {
    // the background only: pressing Bruce still makes him rant, and the grip resizes
    const onBruce = e.composedPath().some(n => n.part && ["figure", "bubble", "back"].some(p => n.part.contains(p)));
    if (e.button !== 0 || e.pointerType === "touch" || onBruce || e.target === grip) return;
    e.preventDefault();
    const [x0, y0] = stagePos;
    stage.classList.add("moving");
    sfx.pickUp();
    const scrape = slide();
    let last = [e.clientX, e.clientY, e.timeStamp];
    follow(e, (dx, dy, ev) => {
      moveStage(x0 + dx, y0 + dy);
      const dt = Math.max(1, ev.timeStamp - last[2]);
      scrape.speed(Math.hypot(ev.clientX - last[0], ev.clientY - last[1]) / dt * 1000);
      last = [ev.clientX, ev.clientY, ev.timeStamp];
    }, () => { stage.classList.remove("moving"); scrape.stop(); sfx.putDown(); });
  });
  grip.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = stage.getBoundingClientRect();
    // a ratchet: one tick for every 14px the stage grows or shrinks, higher when it grows
    let notch = 0;
    follow(e, (dx, dy) => {
      sizeStage(r.width + dx, r.height + dy);
      const n = Math.round((dx + dy) / 14);
      if (n !== notch) { sfx.tick(n > notch); notch = n; }
    }, sfx.putDown);
  });
  grip.addEventListener("dblclick", resetStage);
  grip.addEventListener("keydown", e => {
    if (e.key === "Home") { e.preventDefault(); resetStage(); return; }
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const step = e.shiftKey ? 80 : 20;
    if (e.altKey) { moveStage(stagePos[0] + d[0] * step, stagePos[1] + d[1] * step); sfx.putDown(); }
    else { const r = stage.getBoundingClientRect(); sizeStage(r.width + d[0] * step, r.height + d[1] * step); sfx.tick(d[0] + d[1] > 0); }
  });

  // Looks: preset scenes, one click each. #look=oslo in the address opens with that look.
  const LOOKS = {
    oslo:       { label: "Oslo",       head: "viking",    background: "oslo",    top: "opera-tee",     legs: "jeans",         rant: "standards", props: "phone peace-left" },
    conference: { label: "Conf",       head: "visionary", background: "stage",   top: "blazer",        legs: "formal",        rant: "standards", props: "clicker lanyard mic" },
    brussels:   { label: "BXL",        head: "orly",      background: "eu",      top: "compliant-tee", legs: "black-jeans",   rant: "dma",       props: "point-left laptop" },
    home:       { label: "Home",       head: "quizzical", background: "gallery", top: "kitten-tee",    legs: "golden-shorts", rant: "ai",        props: "laptop" }
  };
  function applyLook(id, speak = true) {
    const look = LOOKS[id];
    if (!look) return;
    for (const k of ["head", "top", "legs", "rant"]) { sel[k].value = look[k]; bruce.setAttribute(k, look[k]); }
    setBackground(look.background);
    setProps(B.resolveProps(look.props.split(" ")));
    if (speak) bruce.rant();
  }
  for (const [id, look] of Object.entries(LOOKS)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn"; b.textContent = look.label;
    b.addEventListener("click", () => applyLook(id));
    $("looks").insertBefore(b, $("randomBtn"));
  }
  const startLook = (location.hash.match(/look=([\w-]+)/) || [])[1];
  if (startLook) applyLook(startLook, false);

  setTimeout(() => bruce.say("Hello, Web Standards fans! Press me for a rant.", 6500, "talk"), 700);

  // Installable and offline-ready: sw.js caches the page and everything Bruce needs
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();

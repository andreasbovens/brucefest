import BruceLawson from "./src/bruce-lawson.js";

/* ===================== demo page ===================== */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const star = $("star");
  const B = BruceLawson;
  const sel = { head: $("head"), top: $("top"), legs: $("legs"), rant: $("rant") };

  function fill(select, values, current) {
    select.innerHTML = "";
    values.forEach(([v, label]) => { const o = document.createElement("option"); o.value = v; o.textContent = label; select.appendChild(o); });
    select.value = current;
  }
  fill(sel.head, [["auto", "auto (mood-based)"], ...Object.entries(B.heads).map(([k, h]) => [k, `${k} (${h.label})`])], star.getAttribute("head") || "auto");
  fill(sel.top, [["random", "random"], ...Object.keys(B.tops).map(k => [k, k])], star.getAttribute("top") || "random");
  fill(sel.legs, [["random", "random"], ...Object.keys(B.legs).map(k => [k, k])], star.getAttribute("legs") || "random");
  fill(sel.rant, [["random", "random"], ...B.topics.map(t => [t, t])], star.getAttribute("rant") || "random");
  // Stage backgrounds: photos behind Bruce. The choice is remembered in this browser.
  // "random" picks a different photo each time it is chosen, and on every visit while it is remembered.
  const BACKGROUNDS = [
    ["gallery", "Bruce’s gallery wall"], ["oslo", "Oslo Opera House"], ["irises", "Iris wallpaper"],
    ["stage", "Conference stage"], ["cma", "Competition & Markets Authority"], ["eu", "EU flags"]
  ];
  const stage = $("stage");
  let shownBg = null;
  function setBackground(id) {
    let photo = id;
    if (id === "random") {
      const others = BACKGROUNDS.filter(([k]) => k !== shownBg);
      photo = others[Math.floor(Math.random() * others.length)][0];
    } else if (!BACKGROUNDS.some(([k]) => k === id)) id = photo = "gallery";
    stage.style.backgroundImage = `url("assets/backgrounds/${photo}.webp")`;
    shownBg = photo;
    $("background").value = id;
    try { localStorage.setItem("bruce-background", id); } catch {}
  }
  // #bg=oslo in the address picks a background, handy for bookmarking one per slide
  let savedBg = (location.hash.match(/bg=([\w-]+)/) || [])[1] || null;
  if (!savedBg) try { savedBg = localStorage.getItem("bruce-background"); } catch {}
  fill($("background"), [["random", "random"], ...BACKGROUNDS], "gallery");
  setBackground(savedBg || "gallery");
  $("background").addEventListener("change", e => setBackground(e.target.value));


  for (const [attr, s] of Object.entries(sel)) s.addEventListener("change", () => { star.setAttribute(attr, s.value); showMarkup(); });

  // Props: one checkbox each. Bruce settles clashes between hands himself, so after every change
  // the attribute and the boxes are set to what he actually ended up holding.
  const propBoxes = Object.keys(B.props).map(k => {
    const label = document.createElement("label"), box = document.createElement("input");
    box.type = "checkbox"; box.value = k;
    label.append(box, " " + k);
    $("props").appendChild(label);
    box.addEventListener("change", () => {
      const list = star.props.filter(p => p !== k);
      if (box.checked) list.push(k);
      setProps(B.resolveProps(list));
    });
    return box;
  });
  function setProps(list) {
    list.length ? star.setAttribute("props", list.join(" ")) : star.removeAttribute("props");
    syncProps(); showMarkup();
  }
  function syncProps() { const on = new Set(star.props); propBoxes.forEach(b => { b.checked = on.has(b.value); }); }
  syncProps();
  $("reduced-motion").addEventListener("change", e => { e.target.checked ? star.setAttribute("reduced-motion", "") : star.removeAttribute("reduced-motion"); showMarkup(); });
  // Turning on the hoedown also dresses him for it: cheeky face, cowboy get-up, jeans and the guitar.
  $("hoedown").addEventListener("change", e => {
    if (e.target.checked) {
      for (const [k, v] of [["head", "cheeky"], ["top", "cowboy"], ["legs", "jeans"]]) { sel[k].value = v; star.setAttribute(k, v); }
      star.setAttribute("props", "guitar"); syncProps();
      star.setAttribute("hoedown", "");
    } else star.removeAttribute("hoedown");
    showMarkup();
  });
  $("ai").addEventListener("change", e => { e.target.checked ? star.setAttribute("ai", "") : star.removeAttribute("ai"); showMarkup(); });
  $("glamorous").addEventListener("change", e => { star.setAttribute("glamorous", e.target.checked ? "" : "false"); showMarkup(); });
  $("rantBtn").addEventListener("click", () => star.rant());
  $("shhBtn").addEventListener("click", () => star.hush());
  $("randomBtn").addEventListener("click", () => {
    for (const k of ["top", "legs", "rant"]) { sel[k].value = "random"; star.setAttribute(k, "random"); }
    sel.head.value = "auto"; star.setAttribute("head", "auto");
    star.setAttribute("props", "random");
    setBackground("random");
    star.reroll(); syncProps(); showMarkup();
    star.rant();
  });

  function showMarkup() {
    const order = ["head", "top", "legs", "props", "rant", "hoedown", "glamorous", "ai", "reduced-motion"];
    // one attribute per line, colour-coded: tag name, attribute names and values each get a class
    const tag = t => `<span class="tag">${t}</span>`;
    const lines = order.filter(a => star.hasAttribute(a)).map(a => {
      const v = star.getAttribute(a);
      if (a === "head" && v === "auto") return null;
      return `  <span class="attr">${a}</span>` + (v === "" ? "" : `=<span class="val">"${esc(v)}"</span>`);
    }).filter(Boolean);
    $("markup").innerHTML = lines.length
      ? `&lt;${tag("bruce-lawson")}\n${lines.join("\n")}&gt;\n&lt;/${tag("bruce-lawson")}&gt;`
      : `&lt;${tag("bruce-lawson")}&gt;&lt;/${tag("bruce-lawson")}&gt;`;
  }
  showMarkup();

  // Caption: “A glaring Bruce wearing a …”. It follows the face, which changes while he rants and dances.
  let look = null;
  function caption() {
    if (!look) return;
    const d = look, adj = (B.heads[star.shownHead] || {}).adj || "glamorous";
    let t;
    if (d.mood === "refuse") t = "Arms crossed. Refusing to work with AI.";
    else if (d.mood === "offended") t = "Deeply offended. Check the console.";
    else t = `${/^[“"]?[aeiou]/i.test(adj) ? "An" : "A"} ${adj} Bruce wearing a ${d.top}, ${d.legs}${d.propsLabel ? `, ${d.propsLabel}` : ""}${d.playing ? ". Mid-hoedown." : "."}`;
    $("caption").textContent = t;
  }
  star.addEventListener("bruce:render", e => { look = e.detail; caption(); });
  star.addEventListener("bruce:face", caption);
  star.render();

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
  document.addEventListener("bruce:offended", () => addLog(`<code>bruce:offended</code>: someone set glamorous to false`));

  // The stage is a little window: drag its background to move it, drag the grip in its corner to resize it.
  // Bruce scales with it. Double-clicking the grip (or Home on it) puts it back.
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
    star.style.setProperty("--bruce-size", Math.round(clamp(Math.min(w * .62, (h - 40) / 1.9), 120, 900)) + "px");
  }
  function resetStage() {
    stagePos = [0, 0];
    for (const p of ["translate", "z-index", "width", "height", "min-height"]) stage.style.removeProperty(p);
    star.style.removeProperty("--bruce-size");
  }
  function follow(e, onMove, onEnd) {
    const sx = e.clientX, sy = e.clientY;
    const move = ev => onMove(ev.clientX - sx, ev.clientY - sy);
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); if (onEnd) onEnd(); };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }
  stage.addEventListener("pointerdown", e => {
    // the background only: pressing Bruce still makes him rant, and the grip resizes
    if (e.button !== 0 || e.pointerType === "touch" || e.composedPath().includes(star) || e.target === grip) return;
    e.preventDefault();
    const [x0, y0] = stagePos;
    stage.classList.add("moving");
    follow(e, (dx, dy) => moveStage(x0 + dx, y0 + dy), () => stage.classList.remove("moving"));
  });
  grip.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = stage.getBoundingClientRect();
    follow(e, (dx, dy) => sizeStage(r.width + dx, r.height + dy));
  });
  grip.addEventListener("dblclick", resetStage);
  grip.addEventListener("keydown", e => {
    if (e.key === "Home") { e.preventDefault(); resetStage(); return; }
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const step = e.shiftKey ? 80 : 20;
    if (e.altKey) moveStage(stagePos[0] + d[0] * step, stagePos[1] + d[1] * step);
    else { const r = stage.getBoundingClientRect(); sizeStage(r.width + d[0] * step, r.height + d[1] * step); }
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
    for (const k of ["head", "top", "legs", "rant"]) { sel[k].value = look[k]; star.setAttribute(k, look[k]); }
    setBackground(look.background);
    setProps(B.resolveProps(look.props.split(" ")));
    if (speak) star.rant();
  }
  for (const [id, look] of Object.entries(LOOKS)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn"; b.textContent = look.label;
    b.addEventListener("click", () => applyLook(id));
    $("looks").insertBefore(b, $("randomBtn"));
  }
  const startLook = (location.hash.match(/look=([\w-]+)/) || [])[1];
  if (startLook) applyLook(startLook, false);

  setTimeout(() => star.say("Hello, Web Standards fans! Press me for a rant.", 6500, "talk"), 700);

  // Installable and offline-ready: sw.js caches the page and everything Bruce needs
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();

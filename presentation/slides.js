// A tiny slide deck: arrow keys, Space and clickers (Page Up and Down) step through .step items, then slides.
// The slide number lives in the URL hash (#5), so a reload keeps your place.
const deck = document.getElementById("deck");
const slides = [...deck.querySelectorAll(".slide")];
const progress = document.getElementById("progress");
const notesPanel = document.getElementById("notesPanel");
const blackout = document.getElementById("blackout");
let index = 0;

function fit() {
  deck.style.setProperty("--scale", Math.min(innerWidth / 1600, innerHeight / 900));
}

function show(i, fromEnd = false) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, n) => s.classList.toggle("current", n === index));
  // arriving backwards shows every step, arriving forwards shows none
  slides[index].querySelectorAll(".step").forEach(s => s.classList.toggle("shown", fromEnd));
  progress.style.width = `${(index / (slides.length - 1)) * 100}%`;
  const notes = slides[index].querySelector(".notes");
  notesPanel.innerHTML = `<b>${index + 1} / ${slides.length}</b>${notes ? notes.innerHTML : ""}`;
  history.replaceState(null, "", `#${index + 1}`);
  if (document.activeElement?.tagName === "IFRAME") document.activeElement.blur();
  // videos play (muted) while their slide is showing, and pause when you move on
  for (const v of deck.querySelectorAll("video")) slides[index].contains(v) ? v.play().catch(() => {}) : v.pause();
  // and YouTube embeds pause when you leave their slide
  for (const yt of deck.querySelectorAll('iframe[src*="youtube"]')) {
    if (!slides[index].contains(yt)) yt.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
  }
}

function next() {
  const hidden = slides[index].querySelector(".step:not(.shown)");
  if (hidden) hidden.classList.add("shown");
  else show(index + 1);
}

function prev() {
  const shown = slides[index].querySelectorAll(".step.shown");
  if (shown.length) shown[shown.length - 1].classList.remove("shown");
  else if (index > 0) show(index - 1, true);
}

addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // let Bruce have Space and Enter when he has focus, so he can still be pressed
  if (e.target.closest?.("bruce-lawson") && (e.key === " " || e.key === "Enter")) return;
  switch (e.key) {
    case "ArrowRight": case "ArrowDown": case "PageDown": case " ": next(); break;
    case "ArrowLeft": case "ArrowUp": case "PageUp": prev(); break;
    case "Home": show(0); break;
    case "End": show(slides.length - 1); break;
    case "n": case "N": notesPanel.hidden = !notesPanel.hidden; break;
    case "f": case "F": document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); break;
    case "b": case "B": case ".": blackout.hidden = !blackout.hidden; break;
    default: return;
  }
  e.preventDefault();
});

// The demo is a same-origin iframe: while it has focus, still let the clicker (Page Up and Down) change slides
for (const frame of document.querySelectorAll('.slide iframe:not([src^="http"])')) {
  frame.addEventListener("load", () => frame.contentWindow.addEventListener("keydown", e => {
    if (e.key === "PageDown" || e.key === "PageUp") { e.preventDefault(); e.key === "PageDown" ? next() : prev(); }
  }));
}

// Photos: show the file if it's there, a labelled placeholder if not
for (const fig of document.querySelectorAll(".photo[data-src]")) {
  const img = new Image();
  img.alt = fig.dataset.label || "";
  img.onload = () => fig.append(img);
  img.onerror = () => fig.classList.add("missing");
  img.src = fig.dataset.src;
}

addEventListener("resize", fit);
addEventListener("hashchange", () => show((parseInt(location.hash.slice(1), 10) || 1) - 1));
fit();
show((parseInt(location.hash.slice(1), 10) || 1) - 1);

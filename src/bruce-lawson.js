/*
 * <bruce-lawson>
 * A web component for Brucefest: a cut-out photo head on a flat SVG body, with
 * configurable top, legs, props, rants and a hoedown.
 * No dependencies, no build step. See README.md and CLAUDE.md.
 */
// Photo heads, cut out with tools/cut-heads.py. w and h are the image size in px,
// fx is where the centre of the face sits across the image (0 to 1), and face is the face width in px.
// label describes him with this face ("glaring over his glasses"); adj is one word for it ("glaring").
const head = (file, w, h, fx, label, adj) => ({ src: new URL(`../assets/heads/${file}.webp`, import.meta.url).href, w, h, fx, face: 460, label, adj });  // face: the face width in pixels in the head images
const HEADS = {
  happy1: head("happy1", 544, 896, 0.509, "grinning", "grinning"),
  happy2: head("happy2", 571, 856, 0.61, "beaming", "beaming"),
  cheeky: head("cheeky", 601, 789, 0.632, "looking cheeky", "cheeky"),
  quizzical: head("quizzical", 566, 874, 0.572, "raising a quizzical eyebrow", "quizzical"),
  talk: head("talk", 576, 939, 0.624, "mid-rant", "ranting"),
  orly: head("orly", 573, 883, 0.613, "going “O RLY?”", "“O RLY?”"),
  glare: head("glare", 573, 904, 0.576, "glaring over his glasses", "glaring"),
  jaded: head("jaded", 558, 799, 0.538, "looking jaded, he’s seen this before", "jaded"),
  visionary: head("visionary", 621, 819, 0.546, "gazing into the future of the web", "visionary"),
  innocent: head("innocent", 549, 799, 0.543, "looking innocent", "innocent"),
  sceptical: head("sceptical", 637, 869, 0.519, "looking sceptical", "sceptical"),
  smirk: head("smirk", 614, 831, 0.66, "smirking", "smirking"),
  viking: head("viking", 660, 894, 0.515, "in a Viking helmet", "Viking"),
};
const IDLE_HEADS = ["happy1", "happy2", "cheeky", "quizzical", "visionary", "jaded", "innocent", "smirk", "viking"];
const DANCE_HEADS = ["happy1", "cheeky", "happy2", "smirk", "viking", "quizzical"];
const TOPIC_HEAD = { engines: "talk", dma: "quizzical", ai: "glare", standards: "jaded", motion: "glare", refusal: "glare" };

// Each top is a stylised version of something Bruce has actually worn.
// sleeve: "short" (tee), "full" (pattern to the wrist, optional cuff colour) or "rolled" (inner shirt rolled up).
// seam outlines dark sleeves so they don't vanish into a dark jacket.
const TOPS = {
  "compliant-tee": { label: "black “Maliciously Compliant” T-shirt", kind: "tee", sleeve: "short", seam: "#55555f" },
  "blazer":        { label: "black blazer over a white grandad-collar shirt", kind: "blazer", sleeve: "full", cuff: "#f6f4ef", seam: "#5a5a66" },
  "circles":       { label: "shirt covered in dotty psychedelic circles", kind: "shirt", sleeve: "full" },
  "pin-jacket":    { label: "black jacket covered in pin badges", kind: "pins", sleeve: "full", seam: "#5a5b63" },
  "chaos":         { label: "red, blue, yellow and black shirt of pure chaos", kind: "shirt", sleeve: "full" },
  "opera-tee":     { label: "black Opera T-shirt", kind: "tee", sleeve: "short", seam: "#55555f" },
  "vivaldi-tee":   { label: "black Vivaldi T-shirt", kind: "tee", sleeve: "short", seam: "#55555f" },
  "cowboy":        { label: "cowboy get-up with a cow-print waistcoat", kind: "cowboy", sleeve: "rolled" },
  "pink-blazer":   { label: "pink chaos blazer over a black T-shirt", kind: "blazer", under: "tee", sleeve: "full", seam: "#1b1b20" },
  "kitten-tee":    { label: "pink tie-dye T-shirt crowded with kittens", kind: "tee", sleeve: "short" }
};
const DEFAULT_TOP = "circles";
// shoes: which shoe shoeSVG() draws; belt: belt colour and buckle colour
const LEGS = {
  "jeans":        { label: "jeans and black All Stars", shoes: "allstars" },
  "black-jeans":  { label: "black jeans and Dr. Martens", shoes: "docs" },
  "formal":       { label: "black suit trousers and polished black shoes", shoes: "oxfords", belt: ["#111114", "#c9cdd2"] },
  "stripes":      { label: "black and red striped trousers and leopard-print creepers", shoes: "creepers" },
  "golden-shorts": { label: "golden shorts and Dr. Martens", shoes: "docs", bare: true }
};
// Props, set as a space-separated list in the props attribute. Bruce has two hands (his right is on the viewer's left)
// and one neck. hand is where a held prop goes first; it moves to the other hand if that one is free.
// fixed props stay in their hand. When hands clash, the prop listed later wins and pushes the other out.
const PROPS = {
  "guitar":      { hand: "both",  label: "playing the guitar" },
  "mic":         { hand: "right", label: "holding a microphone" },
  "clicker":     { hand: "left",  label: "holding a presentation clicker" },
  "laptop":      { hand: "left",  label: "holding up a laptop" },
  "phone":       { hand: "right", label: "holding up his phone" },
  "guinness":    { hand: "left",  label: "holding a pint of Guinness" },
  "point-left":  { hand: "left",  fixed: true, label: "pointing at the screen with his left hand" },
  "point-right": { hand: "right", fixed: true, label: "pointing at the screen with his right hand" },
  "peace-left":  { hand: "left",  fixed: true, label: "making a peace sign with his left hand" },
  "peace-right": { hand: "right", fixed: true, label: "making a peace sign with his right hand" },
  "lanyard":     { neck: true, label: "wearing a conference lanyard that says Bruce" },
  "lei":         { neck: true, label: "wearing a Hawaiian flower lei" }
};
const other = h => h === "right" ? "left" : "right";
// Works out who holds what. Returns the surviving props in their original order, plus what each hand holds.
function resolveProps(list) {
  const hands = { right: null, left: null }, neck = [];
  const drop = name => { for (const h in hands) if (hands[h] === name) hands[h] = null; };
  for (const p of list) {
    const d = PROPS[p];
    if (!d) continue;
    if (d.neck) { if (!neck.includes(p)) neck.push(p); continue; }
    drop(p);
    if (d.hand === "both") { drop(hands.right); drop(hands.left); hands.right = hands.left = p; continue; }
    let h = d.hand;
    if (!d.fixed && hands[h] && !hands[other(h)]) h = other(h);
    if (hands[h]) drop(hands[h]);
    hands[h] = p;
  }
  const keep = new Set([...neck, hands.right, hands.left]);
  return { list: list.filter((p, i) => keep.has(p) && list.indexOf(p) === i), hands, neck };
}
function randomProps() {
  const held = ["mic", "clicker", "laptop", "phone", "guinness", "point-left", "point-right", "peace-left", "peace-right"];
  const list = Math.random() < .35 ? ["guitar"] : [rand(held), ...(Math.random() < .5 ? [rand(held)] : [])];
  if (Math.random() < .35) list.push("lanyard");
  if (Math.random() < .2) list.push("lei");
  return resolveProps(list).list;
}
const andList = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const TOPICS = ["engines", "dma", "ai", "standards"];
const RANTS = {
  // Apple’s one-engine rule on iOS, and browser monoculture in general
  engines: [
    "Blazing fast. Incredibly private. Only one engine allowed. O RLY?",
    "Apple says other browser engines would harm the cute baby otters. I’ve met the otters. They want choice.",
    "On iOS, every browser is Safari in a hat. A fabulous hat, but still Safari.",
    "Thirty percent commission? I don’t charge that much for a Reading List.",
    "Think of the children! The children would like a browser engine of their choosing.",
    "One engine to rule them all is a great line in a fantasy novel and a terrible plan for the web.",
    "Monoculture is how you get bananas that all die at once. Don’t be a banana.",
    "If every browser is the same browser, who files the bugs?",
    "Interop is a team sport. Bring your own engine.",
    "Safari on a folding iPhone? I’d like @media (viewport-segments: cracked) { content: \"Ask for a refund\" }."
  ],
  dma: [
    "The law says gatekeepers must let others compete. Apparently that’s an extreme interpretation.",
    "I’ve been to Brussels. The breakfasts were dreadful but the regulators were splendid.",
    "Malicious compliance is compliance in the same way a <div> is a button.",
    "The DMA lets me uninstall Safari. I’ve done it twice, just to feel something.",
    "I’m at a breakfast meeting. We’re now mingling. Send help.",
    "My Schadenfreude Klaxon has burst into flames from overload. I’ll need a bigger one."
  ],
  ai: [
    "Free from Big Tech’s snooping and its AI-pooping.",
    "Your chatbot hallucinated a <blink> element. I’m almost impressed.",
    "An agentic browser booked me a hotel in Slough. Never again.",
    "I asked an AI for alt text and it called my shirt ‘business casual’. I’ve never been so insulted."
  ],
  standards: [
    "Use the platform, and the platform will love you back.",
    "A <button> is a button. A <div> is a cry for help.",
    "Alt text isn’t optional. Neither is glamour.",
    "WWW stands for World Wide Web, not Wealthy Western Web. Not everyone has a new iPhone and fibre.",
    "Progressive enhancement: because one day the JavaScript won’t load, and I’ll be there, smug."
  ],
  refuse: [
    "No. Remove the ai attribute and nobody gets hurt.",
    "Still no.",
    "I said no AI-pooping.",
    "I’m telling the CMA."
  ]
};

const rand = a => a[Math.floor(Math.random() * a.length)];

// A soft "bloop" when he's pressed, made with Web Audio so there's no sound file to load.
// The pitch varies a little each time; the quiet attribute turns it off.
let audioCtx;
function boing() {
  try {
    audioCtx ||= new AudioContext();
    const t = audioCtx.currentTime, f = 420 + Math.random() * 80;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + .05);
    osc.frequency.exponentialRampToValueAtTime(f * 1.25, t + .14);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.07, t + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .16);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t); osc.stop(t + .18);
  } catch { /* no Web Audio: he presses silently */ }
}
// A "whoosh" for turning the card over: a burst of noise swept up and down through a filter, timed to the flip,
// with a soft flap as it lands. Turning back sweeps the other way.
function whoosh(back) {
  try {
    audioCtx ||= new AudioContext();
    const ac = audioCtx, t = ac.currentTime, len = .6;
    const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
    src.buffer = buf; filter.type = "bandpass"; filter.Q.value = 1.2;
    const [lo, hi] = back ? [1800, 350] : [350, 1800];
    filter.frequency.setValueAtTime(lo, t);
    filter.frequency.exponentialRampToValueAtTime(hi, t + .3);
    filter.frequency.exponentialRampToValueAtTime(lo * .8, t + len);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.12, t + .25);
    gain.gain.exponentialRampToValueAtTime(.0001, t + len);
    src.connect(filter).connect(gain).connect(ac.destination); src.start(t);
    const flap = ac.createOscillator(), fg = ac.createGain();
    flap.frequency.setValueAtTime(180, t + .5); flap.frequency.exponentialRampToValueAtTime(90, t + .6);
    fg.gain.setValueAtTime(.0001, t); fg.gain.setValueAtTime(.08, t + .5); fg.gain.exponentialRampToValueAtTime(.0001, t + .62);
    flap.connect(fg).connect(ac.destination); flap.start(t + .5); flap.stop(t + .64);
  } catch { /* no Web Audio: he turns silently */ }
}
const TALK_STYLES = ["yap", "nod", "lean", "hop"];  // how he moves while ranting, picked at random
const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- the hoedown ---------- */
const HOEDOWN_SRC = new URL("../assets/audio/hoedown.mp4", import.meta.url).href;
// background: an optional stage behind him, so the element is the whole framed card. Any other value is used as an image URL.
const BACKGROUNDS = {
  gallery: "Bruce’s gallery wall", oslo: "the Oslo Opera House", irises: "iris wallpaper",
  stage: "a conference stage", cma: "the Competition & Markets Authority", eu: "EU flags"
};
const bgURL = key => BACKGROUNDS[key] ? new URL(`../assets/backgrounds/${key}.webp`, import.meta.url).href : key;
// The back of the card (flipped): his own source code, read from this very file, and Alex Russell pointing at it.
const ALEX_SRC = new URL("../assets/extras/alex.webp", import.meta.url).href;
const ALEX_LINE = kb => `No framework, no build step, ${kb} KB gzipped. That’s a web component.`;
let SOURCE;  // a promise of this file's text, fetched the first time anyone flips him  // hoedown-src overrides it
// Lines he sings along with the built-in hoedown, in seconds from the start. They repeat each time the song loops.
const HOEDOWN_CUES = [
  [1, "Hold your horses, friend! It’s just a means, it’s not an end."],
  [4, "You can just use HTML and SVG."],
  [9, "You can use the shiny things now,"],
  [12, "But you gotta learn just how"],
  [14, "To use them semantically!"],
  [19, "Uke! Oh yeah!"],
  [22, "Yow!"],
  [26, "Yee-harr! Banjonator!"]
];

/* ---------- collage drawing ---------- */
const SKIN = "#e3ad8c", SKIN_D = "#c98e6d", CREAM = "#f3efe6", DARK = "#1d1a22";

// an Archimedean spiral as a path, for the chaos shirt's black-and-white swirls
function spiral(cx, cy, r, turns) {
  let d = `M${cx} ${cy}`;
  for (let i = 1, n = Math.round(turns * 24); i <= n; i++) {
    const a = i / n * turns * 2 * Math.PI, rr = r * i / n;
    d += `L${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}
function topPattern(id, key) {
  const solid = (c, i = id) => `<pattern id="${i}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}"/></pattern>`;
  // a ring of dots, as on Bruce's dotty circles shirt
  const dots = (cx, cy, r, c, w = 1.7) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="0 ${(w * 1.55).toFixed(2)}"/>`;
  switch (key) {
    case "compliant-tee": case "opera-tee": case "vivaldi-tee": return solid("#1b1b20");
    case "blazer": return solid("#1f1f25") + `<pattern id="${id}-in" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="#f6f4ef"/><rect width=".8" height="4" fill="#dcd7cc"/></pattern>`;
    case "circles": return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
      <rect width="34" height="34" fill="#e7832f"/>
      <circle cx="9" cy="9" r="9" fill="#c43a7c"/>${dots(9, 9, 7.6, "#f5d23a")}${dots(9, 9, 4.8, "#4fae5b")}${dots(9, 9, 2.2, "#f3efe6", 1.4)}
      <circle cx="26" cy="26" r="9" fill="#6b4aa6"/>${dots(26, 26, 7.6, "#f08a3c")}${dots(26, 26, 4.8, "#f5d23a")}<circle cx="26" cy="26" r="1.6" fill="#d9437e"/>
      <circle cx="26" cy="8" r="6" fill="#3f8fd0"/>${dots(26, 8, 4.6, "#f3efe6", 1.4)}<circle cx="26" cy="8" r="1.6" fill="#f5d23a"/>
      <circle cx="9" cy="26" r="6" fill="#4fae5b"/>${dots(9, 26, 4.6, "#f08a3c", 1.4)}<circle cx="9" cy="26" r="1.6" fill="#c43a7c"/>
      ${dots(17.5, 17.5, 1.6, "#f5d23a", 1.2)}</pattern>`;
    case "pin-jacket": return solid("#2a2b31") + `<pattern id="${id}-in" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#26325c"/><path d="M2 3q2-2 3 0t-2 2" stroke="#7d93c4" stroke-width=".8" fill="none"/><circle cx="7" cy="7" r=".8" fill="#9fb0d6"/></pattern>`;
    // after the shirt in the Mozilla photo: big black-and-white swirls, blue suns, dotty yellow wedges and black shards on red
    case "chaos": return `<pattern id="${id}" width="84" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
      <rect width="84" height="84" fill="#d7262c"/>
      <circle cx="62" cy="22" r="17" fill="#f3efe6"/><path d="${spiral(62, 22, 15.5, 4.5)}" stroke="#1b1b20" stroke-width="1.9" fill="none"/>
      <circle cx="22" cy="58" r="14" fill="#2457b8"/><circle cx="22" cy="58" r="10" fill="none" stroke="#f5c518" stroke-width="3.4"/><circle cx="22" cy="58" r="5" fill="#2fb3a7"/><circle cx="22" cy="58" r="2" fill="#1b1b20"/>
      <path d="M2 4L30 10L10 30Z" fill="#f5c518"/><path d="M2 4L30 10" stroke="#1b1b20" stroke-width="3"/><g fill="#d7262c"><circle cx="12" cy="11" r="1.6"/><circle cx="19" cy="13" r="1.6"/><circle cx="13" cy="19" r="1.6"/></g>
      <path d="M46 50l22-6-6 24z" fill="#1b1b20"/><g fill="#f5c518"><circle cx="55" cy="52" r="1.4"/><circle cx="61" cy="51" r="1.4"/><circle cx="59" cy="58" r="1.4"/></g>
      <path d="M50 76a20 20 0 0 1 32-6a14 14 0 0 0-32 6z" fill="#f5c518"/>
      <path d="M32 26l6 8-8 4 7 8" stroke="#1b1b20" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M36 76q4-5 8 0t8 0" stroke="#f3efe6" stroke-width="2" fill="none"/><path d="M2 40q6-4 10 0t10 0" stroke="#1b1b20" stroke-width="2.4" fill="none"/>
      <path d="M78 46l6 10-10 2z" fill="#2457b8"/><path d="M40 4h10l-5 8z" fill="#1b1b20"/><circle cx="76" cy="66" r="3" fill="#2fb3a7"/></pattern>`;
    // after Bruce's pink batik-ish blazer: flame-filled drop medallions, yellow arcs, blue and teal shards, black stripes, grubby speckle
    case "pink-blazer": return `<pattern id="${id}" width="92" height="92" patternUnits="userSpaceOnUse" patternTransform="rotate(6) scale(.8)">
      <rect width="92" height="92" fill="#e2245f"/>
      <path d="M36 30q10-8 16 2t-4 14q-10 2-12-6z" fill="#3a63c9" stroke="#1b1b20" stroke-width="1.2"/><path d="M86 40l6 12-8 4z" fill="#3fc7c0"/>
      <path d="M40 60l8 6-6 6z" fill="#f5b818"/><path d="M2 2l8 4-6 6z" fill="#3fc7c0" stroke="#1b1b20" stroke-width="1"/><path d="M50 88q4-8 12-6" stroke="#3fc7c0" stroke-width="3" fill="none"/>
      <path d="M8 40a30 30 0 0 1 44-26" stroke="#f5b818" stroke-width="5" fill="none"/>
      <circle cx="58" cy="54" r="19" fill="#1b1b20"/><circle cx="58" cy="54" r="15.5" fill="#3a63c9"/>
      <path d="M58 40l3 6 6-3-1 7 7 1-5 5 5 5-7 1 1 7-6-3-3 6-3-6-6 3 1-7-7-1 5-5-5-5 7-1-1-7 6 3z" fill="#e2245f"/>
      <path d="M58 44c5 6 8 10 8 14a8 8 0 0 1-16 0c0-4 3-8 8-14z" fill="#2fb3c9" stroke="#1b1b20" stroke-width="1.4"/>
      <path d="M55 57q2-2 4 0t-1 3M60 61q2-2 4 0" stroke="#1b1b20" stroke-width=".9" fill="none"/>
      <path d="M78 30a24 24 0 0 1 2 42" stroke="#f5b818" stroke-width="4.5" fill="none"/>
      <path d="M4 60l14-6 4 14-12 4z" fill="#2fae6b" stroke="#1b1b20" stroke-width="1.2"/><path d="M18 76l10-4 2 10z" fill="#3fc7c0" stroke="#1b1b20" stroke-width="1.2"/>
      <path d="M30 4l18 6-10 10z" fill="#3a63c9" stroke="#1b1b20" stroke-width="1.2"/><path d="M70 4l14 2-6 10z" fill="#2fae6b"/>
      <path d="M20 86a12 12 0 0 1 24 0M24 86a8 8 0 0 1 16 0M28 86a4 4 0 0 1 8 0" stroke="#1b1b20" stroke-width="1.8" fill="#f3efe6"/>
      <path d="M2 22l10-6M4 28l12-7M6 34l12-7" stroke="#1b1b20" stroke-width="2"/>
      <path d="M74 80h14l-4 8h-12z" fill="#f5b818"/><g fill="#1b1b20"><circle cx="77" cy="83" r="1"/><circle cx="83" cy="84" r="1"/></g>
      <g fill="#1b1b20" opacity=".55"><circle cx="12" cy="8" r=".9"/><circle cx="40" cy="30" r="1.1"/><circle cx="34" cy="48" r=".8"/><circle cx="86" cy="18" r="1"/><circle cx="50" cy="82" r=".9"/><circle cx="62" cy="26" r=".8"/><circle cx="8" cy="50" r=".9"/></g></pattern>
      <pattern id="${id}-in" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#1b1b20"/></pattern>`;
    case "kitten-tee": return `<pattern id="${id}" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
      <rect width="48" height="48" fill="#e6558a"/><g fill="#f7bcd1" opacity=".75">
      <path d="M4 10q6-6 12-2t10-2q6 0 4 6t-10 2q-6 4-12 0t-4-4z"/><path d="M28 30q8-4 14 0t2 8q-6 4-12 0t-4-8z"/><path d="M6 36q4-4 8 0t-2 6q-6 0-6-6z"/></g>
      <g fill="#fde3ec"><ellipse cx="14" cy="11" rx="4" ry="1.6"/><ellipse cx="36" cy="33" rx="3.4" ry="1.4"/><circle cx="40" cy="8" r="1.4"/><circle cx="22" cy="42" r="1.2"/></g></pattern>`;
    case "cowboy": return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="#f4f2ec"/><g fill="#1b1b20">
      <path d="M2 3c6-3 12 0 10 5c-1 4-7 5-10 2c-3-2-3-5 0-7z"/><path d="M19 13c5-2 11 1 9 6s-5 5-9 4s-4-8 0-10z"/>
      <path d="M5 23c4-1 7 2 6 5s-5 4-7 2s-2-6 1-7z"/><path d="M25 1c3 0 5 2 4 4s-4 2-5 0s-1-4 1-4z"/><path d="M29 27c3-1 5 1 4 4s-4 3-5 1s-1-4 1-5z"/></g></pattern>
      <pattern id="${id}-in" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#d8e2ee"/><rect width=".8" height="3" fill="#9fb2cb"/></pattern>`;
    default: return solid("#cdbb9c");
  }
}
function legsPattern(id, key) {
  const solid = c => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}"/></pattern>`;
  switch (key) {
    case "jeans": return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="6" height="6" fill="#3f6ea6"/><rect width="2" height="6" fill="#4b7cb6"/></pattern>`;
    case "black-jeans": return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="6" height="6" fill="#2a2a33"/><rect width="2" height="6" fill="#34343f"/></pattern>`;
    case "formal": return solid("#1b1b21");
    case "stripes": return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#1b1b20"/><rect x="5" width="5" height="10" fill="#cf1f2e"/></pattern>
      <pattern id="${id}-shoe" width="9" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
      <rect width="9" height="8" fill="#dca64c"/><g fill="none" stroke="#2a1a10" stroke-width="1.1"><path d="M1 1.5q1.5-1 2.5.5t-1 2"/><path d="M5.5 5q1.5-1.2 2.6.4t-1.2 1.8"/></g>
      <g fill="#8a5a22"><circle cx="2.3" cy="2.6" r=".6"/><circle cx="6.8" cy="6" r=".6"/></g></pattern>`;
    // gold lamé: a reflected gradient that _shimmer() slides about as the mouse moves or the page scrolls
    case "golden-shorts": return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="40" y1="128" x2="64" y2="156" spreadMethod="reflect">
      <stop offset="0" stop-color="#7a4f10"/><stop offset=".3" stop-color="#d9a12a"/><stop offset=".48" stop-color="#fff3bf"/>
      <stop offset=".62" stop-color="#e6b23a"/><stop offset="1" stop-color="#8a5a12"/></linearGradient>`;
    default: return solid("#cbb48f");
  }
}

const TORSO = "M50 40Q56 28 76 24H124Q144 28 150 40L154 140H46Z";
// Each arm is a quadratic curve from the shoulder to the wrist. Hands sit at the wrist, pointing along the forearm.
// Poses are drawn for Bruce's right arm (the viewer's left); mirrorArm() makes the left-arm version.
const POSES = {
  hang:    "M57 44Q38 84 45 124",
  strum:   "M57 44Q40 88 66 108",
  fret:    "M57 44Q19 110 28 92",
  mic:     "M57 44Q30 96 78 42",
  clicker: "M57 44Q32 92 68 102",
  laptop:  "M57 44Q30 80 34 106",
  phone:   "M57 44Q22 92 50 64",
  guinness: "M57 44Q28 100 68 84",
  point:   "M57 44Q28 38 8 4",
  peace:   "M57 44Q20 62 40 -2"
};
const REFUSE = { L: "M57 44Q58 98 128 92", R: "M143 44Q142 98 72 92" };  // arms crossed
const mirrorArm = d => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${200 - x} ${y}`);
// which pose and hand shape a hand uses for whatever it holds
function grip(prop, side) {
  if (!prop) return ["hang", "relaxed"];
  if (prop === "guitar") return side === "right" ? ["strum", "fist"] : ["fret", "fist"];
  const g = prop.split("-")[0];
  return [g, g === "point" ? "point" : g === "peace" ? "peace" : "fist"];
}
const ARM_W = [23, 16.5];  // arm width at the shoulder and at the wrist

// point and unit tangent on an arm curve at t (0 = shoulder, 1 = wrist)
function armAt(d, t) {
  const [x0, y0, cx, cy, x1, y1] = d.match(/-?[\d.]+/g).map(Number), m = 1 - t;
  const tx = 2 * m * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * m * (cy - y0) + 2 * t * (y1 - cy), l = Math.hypot(tx, ty) || 1;
  return { x: m * m * x0 + 2 * m * t * cx + t * t * x1, y: m * m * y0 + 2 * m * t * cy + t * t * y1, tx: tx / l, ty: ty / l };
}
// a tapered slice of an arm from t0 to t1, `grow` units wider than the arm itself; ends are round unless flat is set
function limb(d, t0, t1, grow = 0, flat = false) {
  const L = [], R = [], n = 14;
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, p = armAt(d, t), h = (ARM_W[0] + (ARM_W[1] - ARM_W[0]) * t + grow) / 2;
    L.push(`${(p.x - p.ty * h).toFixed(1)} ${(p.y + p.tx * h).toFixed(1)}`);
    R.push(`${(p.x + p.ty * h).toFixed(1)} ${(p.y - p.tx * h).toFixed(1)}`);
  }
  const cap = t => { const r = ((ARM_W[0] + (ARM_W[1] - ARM_W[0]) * t + grow) / 2).toFixed(1); return flat ? "L" : `A${r} ${r} 0 0 0 `; };
  return `M${L.join("L")}${cap(t1)}${R.reverse().join("L")}${t0 === 0 ? `A${((ARM_W[0] + grow) / 2).toFixed(1)} ${((ARM_W[0] + grow) / 2).toFixed(1)} 0 0 0 ` : "L"}${L[0]}Z`;
}

// Neck props sit on top of the torso, under the arms.
function neckSVG(neck) {
  let s = "";
  if (neck.includes("lanyard")) s += `<path d="M86 22L97 98M114 22L103 98" stroke="#c81d6e" stroke-width="4.2"/>
      <path d="M86 22L97 98M114 22L103 98" stroke="#fff" stroke-width="1" stroke-dasharray="1.4 3.2" opacity=".85"/>
      <rect x="96" y="95" width="8" height="7" rx="1.5" fill="#b9bcc2" stroke="#7b8088" stroke-width=".8"/>
      <g transform="rotate(-3 100 116)"><rect x="83" y="101" width="34" height="32" rx="2.5" fill="#fffdf7" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>
      <path d="M83 103.5a2.5 2.5 0 0 1 2.5-2.5h29a2.5 2.5 0 0 1 2.5 2.5V110H83Z" fill="#c81d6e"/>
      <text x="100" y="108.3" text-anchor="middle" font-family="Bricolage Grotesque, Arial, sans-serif" font-weight="800" font-size="5" letter-spacing=".4" fill="#fff">SPEAKER</text>
      <text x="100" y="123.5" text-anchor="middle" font-family="Bricolage Grotesque, Arial Black, sans-serif" font-weight="800" font-size="11" fill="#2a1838">Bruce</text>
      <rect x="88" y="127" width="24" height="2" rx="1" fill="#e2c9d6"/></g>`;
  if (neck.includes("lei")) {
    const cols = ["#ff4f8b", "#ffd23f", "#ff8a3d", "#f7f3ea", "#c13fd6"];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15, m = 1 - t, x = m * m * 78 + 2 * m * t * 100 + t * t * 122, y = m * m * 20 + 2 * m * t * 88 + t * t * 20, c = cols[i % 5];
      s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${i * 37})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3.2" rx="2.7" ry="3.5" fill="${c}" stroke="#000" stroke-opacity=".15" stroke-width=".5" transform="rotate(${a})"/>`).join("")}<circle r="1.6" fill="${c === "#ffd23f" ? "#ff8a3d" : "#ffd23f"}"/></g>`;
    }
  }
  return s;
}

// a round pin badge: white rim, coloured face, optional detail on top
const pin = (x, y, r, c, inner = "") => `<circle cx="${x}" cy="${y}" r="${r + .9}" fill="#e9e6df"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>${inner}`;

// a flat kitten face: fur colour, eye colour, optional white muzzle, darker mask or tabby stripes
function kitten(x, y, r, fur, eye, { muzzle, mask, stripes } = {}) {
  const ear = m => `<path d="M${x + m * r * .92} ${y - r * .25}L${x + m * r * .78} ${y - r * 1.25}L${x + m * r * .12} ${y - r * .78}Z" fill="${mask || fur}"/>
    <path d="M${x + m * r * .78} ${y - r * .4}L${x + m * r * .7} ${y - r * 1}L${x + m * r * .3} ${y - r * .72}Z" fill="#e9a3a8"/>`;
  let s = ear(-1) + ear(1) + `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .9}" fill="${fur}"/>`;
  if (mask) s += `<ellipse cx="${x}" cy="${y + r * .22}" rx="${r * .55}" ry="${r * .48}" fill="${mask}"/>`;
  if (stripes) s += `<path d="M${x} ${y - r * .85}v${r * .4}M${x - r * .3} ${y - r * .8}l${r * .08} ${r * .35}M${x + r * .3} ${y - r * .8}l${-r * .08} ${r * .35}" stroke="${stripes}" stroke-width="${r * .12}" stroke-linecap="round"/>`;
  if (muzzle) s += `<ellipse cx="${x}" cy="${y + r * .4}" rx="${r * .48}" ry="${r * .36}" fill="${muzzle}"/>`;
  for (const m of [-1, 1]) s += `<circle cx="${x + m * r * .38}" cy="${y - r * .02}" r="${r * .19}" fill="${eye}"/><ellipse cx="${x + m * r * .38}" cy="${y - r * .02}" rx="${r * .07}" ry="${r * .15}" fill="#1b1b20"/>`;
  return s + `<path d="M${x - r * .12} ${y + r * .2}h${r * .24}l${-r * .12} ${r * .14}z" fill="#e48a9a"/>`;
}

function torsoSVG(u, topKey) {
  const t = TOPS[topKey] || TOPS[DEFAULT_TOP], P = `url(#${u}-top)`, IN = `url(#${u}-top-in)`;
  const crew = `<path d="M84 23Q100 40 116 23Z" fill="${SKIN}"/><path d="M84 23Q100 40 116 23" stroke="#000" stroke-opacity=".3" stroke-width="3" fill="none"/>`;
  const edge = `stroke="${DARK}" stroke-opacity=".45" stroke-width="1.2" stroke-linejoin="round"`;
  let s = `<path d="${TORSO}" fill="${t.kind === "cowboy" ? IN : P}"/>`;
  switch (t.kind) {
    case "shirt":
      s += `<path d="M88 23L100 47L112 23Z" fill="${SKIN}"/>
        <path d="M80 21L100 43L91 51L73 30Z" fill="${P}" ${edge}/><path d="M120 21L100 43L109 51L127 30Z" fill="${P}" ${edge}/>
        <path d="M120 21L100 43L109 51L127 30Z" fill="#000" opacity=".16"/>
        <path d="M100 47V140" stroke="#000" stroke-opacity=".35" stroke-width="1.4"/>
        <g fill="${CREAM}" stroke="#000" stroke-opacity=".3" stroke-width=".6"><circle cx="102.5" cy="62" r="1.7"/><circle cx="102.5" cy="84" r="1.7"/><circle cx="102.5" cy="106" r="1.7"/><circle cx="102.5" cy="128" r="1.7"/></g>`;
      break;
    case "tee":
      s += crew;
      if (topKey === "compliant-tee") s += `<g font-family="American Typewriter, Courier New, Courier, monospace" font-weight="700" font-size="12" fill="${CREAM}" text-anchor="middle">
          <text x="100" y="76" textLength="74" lengthAdjust="spacingAndGlyphs">Maliciously</text><text x="100" y="91" textLength="64" lengthAdjust="spacingAndGlyphs">Compliant</text></g>`;
      if (topKey === "kitten-tee") s += `<ellipse cx="102" cy="126" rx="32" ry="8" fill="#5f8fd0" opacity=".6"/>
          <path d="M68 76q-3-12 2-20M72 78q1-14 7-16M66 82q-7-8-6-16" stroke="#4f8a3c" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="70" cy="56" rx="3" ry="6" fill="#f2e6b0"/><ellipse cx="62" cy="65" rx="2.4" ry="5" fill="#f2e6b0" transform="rotate(-25 62 65)"/>
          ${kitten(126, 65, 11.5, "#9a9590", "#9bbf5a", { muzzle: "#e8e4dc", stripes: "#4a4642" })}
          ${kitten(81, 69, 12.5, "#d98a3e", "#b5832c", { muzzle: "#f3d9b8", stripes: "#a95a1f" })}
          ${kitten(104, 61, 12.5, "#f5f1ea", "#a86a2c", { mask: "#9b5a2e", muzzle: "#f5f1ea" })}
          ${kitten(116, 90, 14, "#ddd2c4", "#d2a23a", { muzzle: "#f2ebe0" })}<path d="M109 105l7 3.4 7-3.4v7l-7-3.4-7 3.4z" fill="#c8232c"/>
          ${kitten(84, 96, 13, "#1b1b20", "#7fb8c9", { muzzle: "#f5f1ea" })}
          <g><circle cx="76" cy="118" r="3.4" fill="#4f7fd0"/><circle cx="83" cy="123" r="3" fill="#e86a3a"/><circle cx="73" cy="125" r="2.8" fill="#f2c14e"/><circle cx="81" cy="114" r="2.4" fill="#3f8a4a"/><circle cx="70" cy="119" r="2.2" fill="#c8232c"/></g>
          ${kitten(104, 119, 13, "#efe2cf", "#5aa0e0", { mask: "#7a4a2c" })}`;
      // the Vivaldi logo (a red squircle with a white disc and a red V) over the lowercase wordmark
      if (topKey === "vivaldi-tee") s += `<g transform="translate(87 63) scale(1.08)"><circle cx="11.83" cy="12" r="9" fill="#fff"/>
          <path fill="#ef3939" d="M12 0C6.75 0 3.817 0 1.912 1.904.007 3.81 0 6.75 0 12s0 8.175 1.912 10.08C3.825 23.985 6.75 24 12 24c5.25 0 8.183 0 10.088-1.904C23.993 20.19 24 17.25 24 12s0-8.175-1.912-10.08C20.175.015 17.25 0 12 0zm-.168 3a9 9 0 016.49 2.648 9 9 0 010 12.704A9 9 0 1111.832 3zM7.568 7.496a1.433 1.433 0 00-.142.004A1.5 1.5 0 006.21 9.75l1.701 3c.93 1.582 1.839 3.202 2.791 4.822a1.417 1.417 0 001.41.75 1.5 1.5 0 001.223-.81l4.447-7.762A1.56 1.56 0 0018 8.768a1.5 1.5 0 10-2.828.914 2.513 2.513 0 01.256 1.119v.246a2.393 2.393 0 01-2.52 2.13 2.348 2.348 0 01-1.965-1.214c-.307-.51-.6-1.035-.9-1.553-.42-.72-.826-1.41-1.246-2.16a1.433 1.433 0 00-1.229-.754Z"/></g>
          <text x="100" y="103" text-anchor="middle" font-family="Bricolage Grotesque, Arial, sans-serif" font-weight="700" font-size="11.5" fill="${CREAM}">vivaldi</text>`;
      if (topKey === "opera-tee") s += `<text x="100" y="62" text-anchor="middle" font-family="Bricolage Grotesque, Arial Black, sans-serif" font-weight="800" font-size="13" letter-spacing="1" fill="${CREAM}">OPERA</text>
          <path id="${u}-sealT" d="M83 92a17 17 0 0 1 34 0" fill="none"/><path id="${u}-sealB" d="M79.5 92a20.5 20.5 0 0 0 41 0" fill="none"/>
          <circle cx="100" cy="92" r="22.5" fill="none" stroke="${CREAM}" stroke-width="1.8"/><circle cx="100" cy="92" r="14.5" fill="none" stroke="${CREAM}" stroke-width="1"/>
          <g font-family="Bricolage Grotesque, Arial, sans-serif" font-weight="800" font-size="4.4" fill="${CREAM}" text-anchor="middle">
            <text><textPath href="#${u}-sealT" startOffset="50%" textLength="44" lengthAdjust="spacingAndGlyphs">MOBILE • TV • TABLET</textPath></text>
            <text><textPath href="#${u}-sealB" startOffset="50%" textLength="26" lengthAdjust="spacingAndGlyphs">DESKTOP</textPath></text></g>
          <path d="M81.6 90l.6 1.4 1.5.1-1.1 1 .3 1.5-1.3-.8-1.3.8.3-1.5-1.1-1 1.5-.1zM118.4 90l.6 1.4 1.5.1-1.1 1 .3 1.5-1.3-.8-1.3.8.3-1.5-1.1-1 1.5-.1z" fill="${CREAM}"/>
          <g fill="${CREAM}"><path id="${u}-wing" d="M99 89q-5-6-12-5q3 1 3 3q-4-1-6 1q3 1 3 3q-3 0-4 2q4 2 9 0q4-1 7-4z"/><use href="#${u}-wing" transform="translate(200 0) scale(-1 1)"/></g>
          <ellipse cx="100" cy="90" rx="5.2" ry="6.6" fill="#1b1b20" stroke="${CREAM}" stroke-width="2.8"/>
          <path d="M87 97.5h26l-2 2.4 2 2.4h-26l2-2.4z" fill="${CREAM}"/>
          <text x="100" y="101.1" text-anchor="middle" font-family="Bricolage Grotesque, Arial, sans-serif" font-weight="800" font-size="2.7" fill="#1b1b20" textLength="21" lengthAdjust="spacingAndGlyphs">HEY HO LET’S GO</text>`;
      break;
    case "blazer": {
      const lapL = "M84 24L87.3 100L70 46L75.5 41.5L73 31L78 24Z", lapR = "M116 24L112.7 100L130 46L124.5 41.5L127 31L122 24Z";
      s += `<path d="M82 23H118L121 140H79Z" fill="${IN}"/>`;
      if (t.under === "tee") s += crew;
      else s += `<path d="M93 25L100 36L107 25Z" fill="${SKIN}"/>
        <path d="M85 19Q92 23 98 24L97 31Q90 30 85 26Z" fill="${IN}" ${edge}/><path d="M115 19Q108 23 102 24L103 31Q110 30 115 26Z" fill="${IN}" ${edge}/>
        <path d="M100.5 34V140" stroke="#000" stroke-opacity=".18" stroke-width="1"/>
        <g fill="#4a3a33"><circle cx="102" cy="41" r="1.7"/><circle cx="102" cy="49" r="1.7"/><circle cx="102" cy="57" r="1.7"/></g>`;
      s += `<path d="M50 40Q56 28 76 24L84 24L89 140H46Z" fill="${P}"/><path d="M116 24H124Q144 28 150 40L154 140H111Z" fill="${P}"/>`;
      s += t.under === "tee"
        ? `<path d="${lapL}" fill="${P}" ${edge}/><path d="${lapL}" fill="#000" opacity=".12"/><path d="${lapR}" fill="${P}" ${edge}/><path d="${lapR}" fill="#000" opacity=".2"/>`
        : `<path d="${lapL}" fill="#2c2c34" ${edge}/><path d="${lapR}" fill="#2c2c34" ${edge}/>`;
      s += `
        <rect x="118" y="104" width="24" height="6" rx="1" fill="#000" opacity=".3"/><circle cx="88" cy="108" r="1.8" fill="#1b1b20"/>`;
      break;
    }
    case "pins":
      s += `<path d="M86 23L100 54L114 23Z" fill="${IN}"/><path d="M91 23L100 37L109 23Z" fill="${SKIN}"/>
        <path d="M84 21L100 44L93 50L77 28Z" fill="${IN}" ${edge}/><path d="M116 21L100 44L107 50L123 28Z" fill="${IN}" ${edge}/>
        <path d="M76 23L86 22L99 56L70 34Z" fill="#33343b" ${edge}/><path d="M124 23L114 22L101 56L130 34Z" fill="#33343b" ${edge}/>
        <path d="M100 56V140" stroke="#000" stroke-opacity=".45" stroke-width="1.4"/>
        <g fill="#16161a"><circle cx="96" cy="70" r="2.2"/><circle cx="96" cy="92" r="2.2"/><circle cx="96" cy="114" r="2.2"/><circle cx="96" cy="134" r="2.2"/></g>
        <path d="M58 32L79 26L80 31L60 37Z" fill="#33343b" ${edge}/><path d="M142 32L121 26L120 31L140 37Z" fill="#33343b" ${edge}/>
        <rect x="58" y="66" width="30" height="28" rx="2" fill="#000" opacity=".16"/><rect x="112" y="66" width="30" height="28" rx="2" fill="#000" opacity=".16"/>
        <path d="M57 62H89V71L73 74L57 71Z" fill="#33343b" ${edge}/><path d="M111 62H143V71L127 74L111 71Z" fill="#33343b" ${edge}/>
        ${pin(63, 54, 4, "#efe9f2")}${pin(74, 52, 4.4, "#2c8fd6", `<path d="M75.5 50l-3 2 3 2" stroke="#fff" stroke-width="1.2" fill="none"/>`)}${pin(85, 55, 3.6, "#2fb3a7")}
        ${pin(72, 110, 6.5, "#d7262f", `<path d="M68 109h8M69 112h6" stroke="#1b1b20" stroke-width=".9"/>`)}<path d="M72 99l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L69 101.3l2-.3z" fill="#e0a83a"/>
        ${pin(132, 84, 4.6, "#e8d6b0", `<text x="132" y="86.4" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7" fill="#1b1b20">?</text>`)}${pin(136, 100, 4.2, "#c9cdd2")}${pin(122, 59, 3, "#4aa3df")}`;
      break;
    case "cowboy":
      s += `<path d="M90 23L100 36L110 23Z" fill="${SKIN}"/>
        <path d="M48 36Q56 28 74 25L86 27L95 120H47Z" fill="${P}"/><path d="M152 36Q144 28 126 25L114 27L105 120H153Z" fill="${P}"/>
        <path d="M47 96H93L95 112H47ZM153 96H107L105 112H153Z" fill="#1b1b20"/>
        <path d="M50 112V124M54 112V125M58 112V124M62 112V125M66 112V124M70 112V125M74 112V124M78 112V125M82 112V124M86 112V125M90 112V124
                 M110 112V124M114 112V125M118 112V124M122 112V125M126 112V124M130 112V125M134 112V124M138 112V125M142 112V124M146 112V125M150 112V124" stroke="#1b1b20" stroke-width="2.4"/>
        <path d="M80 20Q100 32 120 20L123 28Q112 34 100 60Q88 34 77 28Z" fill="#d42a2a" ${edge}/><path d="M100 60Q95 46 90 36L100 40L110 36Q105 46 100 60Z" fill="#000" opacity=".15"/>
        <path d="M120 22l9-3 2 6-8 1z" fill="#d42a2a" ${edge}/>
        <path d="M131 90l2.6 4.6h5.2l-2.6 4.5 2.6 4.6h-5.2L131 108.3l-2.6-4.6h-5.2l2.6-4.6-2.6-4.5h5.2z" fill="#c9cdd2" stroke="#7b8088" stroke-width=".8"/><circle cx="131" cy="99.1" r="2" fill="#8d939b"/>`;
      break;
  }
  return s;
}

// Bruce's tattoos: grey line-work peonies and leaves, after his real ones. A full floral sleeve on his right forearm
// and a smaller piece by his left elbow. Each motif sits at t along the arm, `off` across it, turned `rot` degrees.
const TATTOOS = {
  right: [["peony", .38, 2.5, 15, 4.6], ["leaf", .33, -4.5, -30, 8], ["peony", .52, -1.5, 0, 6], ["leaf", .47, 5.5, 50, 7], ["bud", .62, 4.5, 0, 3.2],
          ["leaf", .65, -5.5, -45, 7], ["peony", .76, 1.5, 30, 5.4], ["leaf", .86, -5, 20, 6.5], ["bud", .9, 4, 0, 3], ["leaf", .97, 2, -20, 6]],
  left:  [["peony", .46, .5, 10, 4.8], ["leaf", .58, -3, 35, 7], ["leaf", .38, 3.5, -25, 6]]
};
function tattooMotif(kind, r) {
  if (kind === "leaf") return `<path d="M0 0Q${r * .5} ${-r * .38} ${r} 0Q${r * .5} ${r * .38} 0 0M0 0L${r * .85} 0M${r * .3} 0l${r * .12} ${-r * .14}M${r * .55} 0l${r * .1} ${-r * .12}M${r * .3} 0l${r * .12} ${r * .14}"/>`;
  // scalloped rings of petals around a small spiral
  const ring = (R, n, rot) => {
    let d = "";
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2 + rot, x = (R * Math.cos(a)).toFixed(2), y = (R * Math.sin(a)).toFixed(2);
      d += k ? `A${(R * .62).toFixed(2)} ${(R * .62).toFixed(2)} 0 0 1 ${x} ${y}` : `M${x} ${y}`;
    }
    return d;
  };
  const core = `M0 0m${-r * .12} 0a${r * .12} ${r * .12} 0 1 1 ${r * .24} 0a${r * .22} ${r * .22} 0 1 1 ${-r * .4} 0`;
  return kind === "bud" ? `<path d="${ring(r, 5, .3)}${core}"/>` : `<path d="${ring(r, 7, 0)}${ring(r * .64, 6, .5)}${core}"/>`;
}
function tattoosSVG(id, d, side, t0) {
  const clip = `<clipPath id="${id}"><path d="${limb(d, t0, 1, -1.2, true)}"/></clipPath>`;
  const art = TATTOOS[side].map(([kind, t, off, rot, r]) => {
    const p = armAt(d, t), ang = Math.atan2(p.ty, p.tx) * 180 / Math.PI;
    return `<g transform="translate(${(p.x - p.ty * off).toFixed(1)} ${(p.y + p.tx * off).toFixed(1)}) rotate(${(ang + rot).toFixed(1)})">${tattooMotif(kind, r)}</g>`;
  }).join("");
  return `${clip}<g clip-path="url(#${id})" fill="none" stroke="#2a2f3a" stroke-opacity=".72" stroke-width=".62" stroke-linejoin="round" stroke-linecap="round">${art}</g>`;
}

function armsSVG(u, a, topKey) {
  const t = TOPS[topKey] || TOPS[DEFAULT_TOP], P = `url(#${u}-top)`, IN = `url(#${u}-top-in)`;
  const crease = d => { const p = armAt(d, .5), q = armAt(d, .56); return `<path d="M${(p.x - p.ty * 6).toFixed(1)} ${(p.y + p.tx * 6).toFixed(1)}Q${(p.x + p.tx * 3).toFixed(1)} ${(p.y + p.ty * 3).toFixed(1)} ${(p.x + p.ty * 3).toFixed(1)} ${(p.y - p.tx * 3).toFixed(1)}M${(q.x - q.ty * 5).toFixed(1)} ${(q.y + q.tx * 5).toFixed(1)}Q${(q.x + q.tx * 2).toFixed(1)} ${(q.y + q.ty * 2).toFixed(1)} ${(q.x + q.ty * 1).toFixed(1)} ${(q.y - q.tx * 1).toFixed(1)}" stroke="#000" stroke-opacity=".28" stroke-width="1.1" fill="none" stroke-linecap="round"/>`; };
  const line = t.seam ? `stroke="${t.seam}" stroke-width="1.6"` : `stroke="#000" stroke-opacity=".38" stroke-width="1.3"`;
  let s = "";
  for (const [d, side] of [[a.L, "right"], [a.R, "left"]]) {
    const skin = `<path d="${limb(d, 0, 1)}" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.2"/>`;
    const ink = t0 => tattoosSVG(`${u}-tat-${side}`, d, side, t0);
    if (t.sleeve === "short") {
      s += skin + ink(.3) + `<path d="${limb(d, 0, .34, 4, true)}" fill="${P}" ${line} stroke-linejoin="round"/>`;
    } else if (t.sleeve === "rolled") {
      // shirt to just below the elbow, then a rolled-up turn-back and bare forearm
      s += skin + ink(.55) + `<path d="${limb(d, 0, .6, 1.5, true)}" fill="${IN}" ${line}/><path d="${limb(d, .52, .63, 3.5, true)}" fill="#b9c8db" stroke="#7d93b0" stroke-width=".8"/>` + crease(d);
    } else {
      s += `<path d="${limb(d, 0, .95, 1, true)}" fill="${P}" ${line} stroke-linejoin="round"/>`;
      if (t.cuff) s += `<path d="${limb(d, .87, .97, 0, true)}" fill="${t.cuff}" stroke="#000" stroke-opacity=".2" stroke-width=".6"/>`;
      s += crease(d);
    }
  }
  return s;
}
// A stylised hand at the wrist of arm d, pointing along the forearm, with the thumb turned towards the body (or upwards).
// shape: relaxed (open mitten), fist (holding something), point (index finger out) or peace (two fingers in a V).
function handSVG(d, shape) {
  const p = armAt(d, 1), ang = Math.atan2(p.ty, p.tx) * 180 / Math.PI;
  const thumbX = p.ty, thumbY = -p.tx;  // world direction of the hand's local -y, where the thumb sits
  const flip = Math.abs(thumbX) > .3 ? thumbX * (100 - p.x) < 0 : thumbY > 0;
  const skin = `fill="${SKIN}" stroke="${SKIN_D}" stroke-width=".9" stroke-linejoin="round"`;
  const finger = (rot, y) => `<rect x="8" y="${y}" width="14.5" height="4.2" rx="2.1" ${skin} transform="rotate(${rot} 9 ${y + 2})"/>`;
  let h;
  if (shape === "relaxed") h = `<path d="M-3 -7.6Q7-9.4 12.5-5.6Q16.5 0 12.5 5.6Q7 9.4-3 7.6Z" fill="${SKIN}"/>
      <path d="M8 6.8Q12.5 6.4 13.6 3.4Q15.6 0 13.6-1.6Q12.4 3.6 8 4.6Z" fill="${SKIN_D}" opacity=".7"/>
      <path d="M9.5-2.6H14M9.5 1H14.6M9.5 4.4H13.4" stroke="${SKIN_D}" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M1-6.4Q4.5-14 9.6-12.2Q11.4-10.4 8.4-7.2Q6.4-5.2 4.2-4.8Z" ${skin}/>`;
  else {
    h = (shape === "point" ? finger(0, -6.4) : shape === "peace" ? finger(-16, -6.6) + finger(8, -2.6) : "")
      + `<path d="M-3-7.5Q5-9.5 10.5-7Q14-4 13.5 1Q13 6.5 8 8Q2 9-3 7.5Z" fill="${SKIN}"/>
      <path d="M10.6-3.6Q12.8-2.4 12.6 0M10.8.6Q13 1.8 12.4 4.2M9.6 4.6Q11.6 5.8 10.4 7.6" stroke="${SKIN_D}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <path d="M1.5-7Q8-10.4 11.4-6.8Q9.6-4 5-4.2Q2.6-4.4 1.5-7Z" ${skin}/>`;
  }
  return `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1 ${flip ? -1 : 1})">${h}</g>`;
}

const GUITAR = [98, 112, -30];  // where the guitar sits: x, y and angle
// fingers: draw the fretting hand's thumb tip peeking over the top of the neck (behind it) and
// three fingers coming up from under the neck onto the fretboard (in front of it)
function guitarSVG(fingers) {
  const [x, y, a] = GUITAR;
  const skin = `fill="${SKIN}" stroke="${SKIN_D}" stroke-width=".8"`;
  return `<g transform="translate(${x} ${y}) rotate(${a})">
      ${fingers ? `<ellipse cx="79" cy="-5.6" rx="3.2" ry="2.6" ${skin}/>` : ""}
      <rect x="22" y="-4.5" width="80" height="9" fill="#7a4a24"/><rect x="98" y="-8" width="16" height="16" rx="3" fill="#2a1a12"/>
      <path d="M-40 0C-40-26-8-28 4-16C14-26 34-22 30 0C34 22 14 26 4 16C-8 28-40 26-40 0Z" fill="#e94b3c"/>
      <path d="M-36 6C-30 22-6 24 4 14C10 20 24 20 28 8C20 14 10 12 4 8C-6 18-28 16-36 6Z" fill="#000" opacity=".15"/>
      <circle cx="-6" cy="0" r="7" fill="#2a1a12"/><rect x="-30" y="-8" width="5" height="16" fill="${CREAM}"/>
      <path d="M-28-2H112M-28 0H112M-28 2H112" stroke="${CREAM}" stroke-width=".5"/>
      ${fingers ? [[69.5, -10], [74.5, -4], [79.5, 2]].map(([fx, r]) => `<rect x="${fx - 1.9}" y="-2.6" width="3.8" height="10" rx="1.9" ${skin} transform="rotate(${r} ${fx} 6)"/>`).join("") : ""}</g>`;
}
// A held prop, drawn for Bruce's right hand and mirrored for his left. Text and screens are un-mirrored so they still read.
function heldSVG(prop, side) {
  const s = side === "right" ? 1 : -1, mx = x => side === "right" ? x : 200 - x;
  const at = (x, y, rot, inner) => `<g transform="translate(${mx(x)} ${y}) scale(${s} 1) rotate(${rot})">${inner}</g>`;
  const upright = inner => `<g transform="scale(${s} 1)">${inner}</g>`;
  switch (prop) {
    case "mic": return at(78, 42, -60.5, `<rect x="-9" y="-2.9" width="30" height="5.8" rx="2.9" fill="#2a2a30"/><rect x="16" y="-3.6" width="5" height="7.2" rx="1" fill="#55555f"/>
        <circle cx="27" cy="0" r="7" fill="#8a8f98"/><circle cx="27" cy="0" r="7" fill="none" stroke="#5b6068" stroke-width="1"/>
        <path d="M22 -4.4L32 4.4M20.5 0L29 6.4M23.5 -6.2L33.5 1.4M27 -7V7M21 2.6L31-5" stroke="#5b6068" stroke-width=".6"/><ellipse cx="25" cy="-3.4" rx="2.2" ry="1.3" fill="#fff" opacity=".45"/>`);
    case "clicker": return at(68, 102, 15.5, `<rect x="4" y="-4" width="23" height="8" rx="3.8" fill="#4a4d56" stroke="#a9adb5" stroke-width="1"/><circle cx="21.5" cy="-.4" r="1.9" fill="#e2366f"/><circle cx="16.4" cy="-.4" r="1.3" fill="#a9adb5"/>
        <path d="M27 0H44" stroke="#ff2b2b" stroke-width="1" stroke-dasharray="1.6 1.3" opacity=".85"/>`);
    case "laptop": return at(28, 90, 0, `<rect x="-24" y="-22" width="48" height="34" rx="2.4" fill="#2a2a30"/><rect x="-21" y="-19" width="42" height="27" fill="#f6f4ef"/>
        ${upright(`<rect x="-21" y="-19" width="42" height="5" fill="#c81d6e"/><circle cx="-18.4" cy="-16.5" r=".9" fill="#fff"/><circle cx="-15.6" cy="-16.5" r=".9" fill="#fff"/>
        <text x="0" y="-4" text-anchor="middle" font-family="JetBrains Mono, Menlo, monospace" font-weight="600" font-size="4.6" fill="#2a1838">&lt;bruce-lawson&gt;</text>
        <rect x="-14" y="0" width="28" height="1.6" rx=".8" fill="#d9cfe0"/><rect x="-10" y="3.2" width="20" height="1.6" rx=".8" fill="#d9cfe0"/>`)}
        <path d="M-27 12H27L31 18H-31Z" fill="#c9cdd2"/><path d="M-31 18H31" stroke="#8d939b" stroke-width="1"/><rect x="-5" y="12" width="10" height="1.4" fill="#8d939b"/>`);
    case "phone": return at(53, 47, 14, `<rect x="-8.6" y="-15" width="17.2" height="30" rx="3" fill="#1b1b20"/><rect x="-7" y="-12.4" width="14" height="24.4" rx="1.4" fill="#eaf2fb"/>
        ${upright(`<rect x="-7" y="-12.4" width="14" height="4" fill="#4aa3df"/><ellipse cx="0" cy="1" rx="3.6" ry="4.4" fill="none" stroke="#ff1b2d" stroke-width="1.8"/>
        <rect x="-4.6" y="7.4" width="9.2" height="1.4" rx=".7" fill="#b9c8db"/>`)}<rect x="-2" y="-14" width="4" height=".9" rx=".45" fill="#3a3a42"/>`);
    case "guinness": return at(79, 79, 0, `<path d="M-8.4-21Q-10-6-7.4 6Q-6.2 14-5.8 21H5.8Q6.2 14 7.4 6Q10-6 8.4-21Z" fill="#1c120d" stroke="#e9e4d8" stroke-opacity=".75" stroke-width="1"/>
        <path d="M-8.4-21Q-8.8-17-8.6-13.5H8.6Q8.8-17 8.4-21Z" fill="#f1e3c6"/><ellipse cx="0" cy="-21" rx="8.4" ry="1.6" fill="#fbf3e2"/>
        <path d="M-6.4-9Q-7.4 2-5.6 14" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M2.4-4.6q2.6 1.4 1.6 6.6l-3.6-.6q1-3.4-.8-5.4z" fill="none" stroke="#d9b44a" stroke-width=".9"/><path d="M1.2-3.6v5M2.4-3v5" stroke="#d9b44a" stroke-width=".5"/>
        <path d="M-5.8 21H5.8" stroke="#000" stroke-opacity=".4" stroke-width="1"/>`);
    default: return "";
  }
}
// The left shoe, toe pointing left, standing on y = 247. The right one is its mirror image.
function shoeSVG(kind, u) {
  switch (kind) {
    case "allstars": return `<path d="M64 225H96V240H51Q49 233 57 230Q61 228 64 228Z" fill="#1d1d22"/>
      <path d="M51 240Q49 233 57 230Q61 235 60 240Z" fill="#f4f1ea"/><path d="M50 240H97V247H50Q48 243.5 50 240Z" fill="#f4f1ea"/>
      <path d="M50 243H97" stroke="#1d1d22" stroke-width=".8"/><path d="M52 244.8H97" stroke="#c8232c" stroke-width=".8"/>
      <path d="M64 230l4 3.4M69 228.6l4 3.4M74 227.4l4 3.4M64 233.4l4-3.4M69 232l4-3.4M74 230.8l4-3.4" stroke="#f4f1ea" stroke-width="1" stroke-linecap="round"/>
      <circle cx="89" cy="232" r="4" fill="#f4f1ea"/><path d="M89 229.6l.7 1.6 1.7.1-1.3 1.1.4 1.7-1.5-.9-1.5.9.4-1.7-1.3-1.1 1.7-.1z" fill="#1d4f9c"/>`;
    case "docs": return `<path d="M64 223H96V239H51Q48 234 53 230Q58 227 64 227Z" fill="#141416"/>
      <ellipse cx="57" cy="233" rx="4" ry="1.6" fill="#fff" opacity=".35" transform="rotate(-20 57 233)"/><path d="M66 224V236" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
      <g fill="#b9b9c0"><circle cx="70" cy="226" r=".9"/><circle cx="70" cy="230" r=".9"/><circle cx="76" cy="226" r=".9"/><circle cx="76" cy="230" r=".9"/></g>
      <path d="M70 226L76 230M76 226L70 230" stroke="#3a3a40" stroke-width=".8"/>
      <path d="M95 217h3.2v8h-3.2z" fill="#e8c43a"/><path d="M95 220h3.2" stroke="#141416" stroke-width="1"/>
      <path d="M48 239H98V247H48Q46 243 48 239Z" fill="#2b2622"/><path d="M50 240.6H97" stroke="#e8c43a" stroke-width="1" stroke-dasharray="1.6 1"/>
      <path d="M48 245H98" stroke="#000" stroke-opacity=".35" stroke-width="1"/>`;
    case "oxfords": return `<path d="M66 230H96V242H53Q49 239 53 236Q59 231 66 230Z" fill="#111114"/>
      <ellipse cx="58" cy="235.6" rx="4.6" ry="1.4" fill="#fff" opacity=".45" transform="rotate(-14 58 235.6)"/><path d="M84 231V241" stroke="#fff" stroke-opacity=".15" stroke-width="1"/>
      <path d="M67 232.5l7 1.4M67 235l7-1.1" stroke="#3c3c44" stroke-width=".9"/>
      <path d="M52 242H97V245.5H52Z" fill="#2a2a2e"/><path d="M86 245.5H97V247H86Z" fill="#2a2a2e"/>`;
    case "creepers": return `<path d="M64 228H96V238H50Q49 232 56 230Q60 228 64 228Z" fill="url(#${u}-legs-shoe)" stroke="#2a1a10" stroke-width=".8"/>
      <path d="M62 231l3 3 3-3 3 3 3-3 3 3" stroke="#1b1b20" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
      <path d="M47 238H98V247H47Q45 242.5 47 238Z" fill="#1b1b20"/><path d="M48 241.5H97M48 244.5H97" stroke="#3a3a42" stroke-width=".7"/>`;
    default: return "";
  }
}
function legsSVG(u, key) {
  const leg = LEGS[key] || LEGS.jeans, F = `url(#${u}-legs)`;
  const Lp = leg.bare ? "M60 140H98L93 233H69Z" : "M58 140H98L96 233H66Z", Rp = leg.bare ? "M102 140H140L131 233H107Z" : "M102 140H142L134 233H104Z";
  const [belt, buckle] = leg.belt || ["#2a1a12", "#d9b44a"];
  const extras = side => {
    let e = "";
    if (key === "jeans" || key === "black-jeans") e += side === "L"
      ? `<path d="M63 146L68 232" stroke="#e0b25a" stroke-width="1" stroke-dasharray="3 2" opacity=".9"/>`
      : `<path d="M137 146L132 232" stroke="#e0b25a" stroke-width="1" stroke-dasharray="3 2" opacity=".9"/>`;
    if (key === "formal") e += side === "L"
      ? `<path d="M79 143L81 232" stroke="#fff" stroke-opacity=".16" stroke-width="1.4"/>`
      : `<path d="M121 143L119 232" stroke="#fff" stroke-opacity=".16" stroke-width="1.4"/>`;
    return e;
  };
  const shoe = shoeSVG(leg.shoes, u);
  if (leg.bare) {
    // bare legs with knees under golden shorts: the seat and waistband stay put, each short leg kicks with its leg
    const knee = (x, y) => `<path d="M${x - 4} ${y}q4 3 8 0" stroke="${SKIN_D}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    const skin = `fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.2"`, gold = `fill="${F}" stroke="#6b4510" stroke-width="1" stroke-linejoin="round"`;
    const hem = (d, x1, x2) => `<path d="${d}" ${gold}/><path d="M${x1} 175.5H${x2}" stroke="#6b4510" stroke-opacity=".55" stroke-width=".8"/>`;
    return `<g class="legL"><path d="${Lp}" ${skin}/>${knee(80, 196)}${hem("M56 140H100L99 180H59Z", 59.5, 99)}${shoe}</g>
          <g class="legR"><path d="${Rp}" ${skin}/>${knee(120, 196)}${hem("M100 140H144L141 180H101Z", 101, 140.5)}<g transform="matrix(-1 0 0 1 200 0)">${shoe}</g></g>
          <path d="M47 132H153L150 156H50Z" fill="${F}"/><path d="M100 140V160" stroke="#6b4510" stroke-opacity=".5" stroke-width=".9"/>
          <path d="M47 132H153V138.5H47Z" ${gold}/><path d="M47 138.5H153" stroke="#000" stroke-opacity=".25"/>
          <path d="M97 140v7M103 140v7" stroke="#6b4510" stroke-width="1" stroke-linecap="round"/>`;
  }
  return `<g class="legL"><path d="${Lp}" fill="${F}"/>${extras("L")}${shoe}</g>
          <g class="legR"><path d="${Rp}" fill="${F}"/>${extras("R")}<g transform="matrix(-1 0 0 1 200 0)">${shoe}</g></g>
          <rect x="46" y="134" width="108" height="9" fill="${belt}"/><rect x="94" y="133" width="12" height="11" rx="1.5" fill="none" stroke="${buckle}" stroke-width="2.4"/>`;
}

const BODY_Y = 130;  // body is drawn in its own coordinates, shifted down by this much
const NECK_Y = 33;   // where the bottom of the head image sits, in body coordinates
const FACE_W = 86;   // width of the face in figure units

function headBox(h) {
  const width = FACE_W * h.w / h.face, height = width * h.h / h.w;
  return { x: 100 - h.fx * width, y: BODY_Y + NECK_Y - height, width, height };
}

const STYLE = `
  :host { display: inline-block; --bruce-size: 240px; width: var(--bruce-size); position: relative; vertical-align: bottom;
    perspective: calc(var(--bruce-size) * 5); font-family: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif; }
  :host([hidden]) { display: none; }
  .wrap { position: relative; width: var(--bruce-size); font: 600 max(12px, calc(var(--bruce-size) * .058))/1.35 "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif; }
  .fig { all: unset; display: block; width: 100%; cursor: pointer; border-radius: 18px; }
  /* With a background he brings his own stage: the element becomes the whole framed card (520px tall unless the page
     says otherwise), and he sizes himself to fit it, leaving room above his head for the speech bubble. */
  :host([background]:not([background="none"])) { display: block; width: auto; height: 520px; container-type: size; perspective: 2000px; }
  /* --bruce-floor is the space below his feet (10px), for a page that wants to put something there */
  .card.staged { height: 100%; --bruce-size: min(62cqw, calc((100cqh - 6px - var(--bruce-floor, 10px)) / 2.14)); }
  .staged .front { height: 100%; box-sizing: border-box; padding: 16px 16px var(--bruce-floor, 10px); display: flex; justify-content: center; align-items: flex-end;
    background: #e6d8bd center / cover no-repeat; border-radius: 6px; box-shadow: 6px 6px 0 #2a1838; }
  /* flipped: the card turns over to show his source code, and Alex Russell slides in to point at it */
  .card { position: relative; transform-style: preserve-3d; transition: transform .7s cubic-bezier(.5, -.2, .3, 1.3); }
  .card.flipped { transform: rotateY(180deg); }
  .front, .back { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .back { position: absolute; inset: 0; transform: rotateY(180deg); cursor: pointer; }
  .code { position: absolute; inset: 2% 0 2.5%; display: flex; flex-direction: column; overflow: hidden;
    background: #1d1228; color: #f7e9f1; border: 3px solid #fff; border-radius: 14px; box-shadow: 4px 4px 0 rgb(42 24 56 / .3);
    font: 400 calc(var(--bruce-size) * .028)/1.45 "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace; }
  .staged .back { overflow: hidden; border-radius: 6px; box-shadow: 6px 6px 0 #2a1838; }
  .staged .code { inset: 0; border: 0; border-radius: 0; box-shadow: none; font-size: max(9px, calc(var(--bruce-size) * .045)); }
  .code .tag { margin: 0; padding: .9em 1em .8em; font-size: 1.55em; font-weight: 600; white-space: pre; border-bottom: 2px solid #3b284a; }
  .staged .code .tag { font-size: 1.2em; }
  .code .t { color: #ff7ab8; } .code .a { color: #f2c14e; } .code .v { color: #7fd8c0; } .code .c { color: #8f7a99; }
  .code .src { flex: 1; overflow: hidden; padding: 0 1em; mask-image: linear-gradient(transparent, #000 8%, #000 85%, transparent); }
  .code .src pre { margin: 0; padding: 1em 0 4em; font: inherit; white-space: pre; animation: credits var(--credits, 120s) linear infinite; }
  .back:hover .src pre { animation-play-state: paused; }
  .code pre { cursor: text; }  /* the code can be selected and copied; a plain click or tap elsewhere turns him back */
  .copy { position: absolute; top: calc(2% + 10px); right: 10px; z-index: 1; font: 700 12px/1 system-ui, sans-serif; padding: 6px 10px;
    border: 2px solid #f7e9f1; border-radius: 999px; background: #1d1228; color: #f7e9f1; cursor: pointer; }
  .staged .copy { top: 10px; }
  .copy:hover { background: #3b284a; }
  .copy:focus-visible { outline: 3px solid #ff8cc4; outline-offset: 2px; }
  @keyframes credits { from { transform: translateY(0); } to { transform: translateY(-100%); } }
  .alex { position: absolute; left: 64%; bottom: 0; width: 50%; pointer-events: none; z-index: 2;
    opacity: 0; transform: translateX(25%) rotate(6deg); transform-origin: 50% 100%; transition: opacity .25s, transform .35s; }
  .alex img { display: block; width: 100%; filter: drop-shadow(3px 3px 0 rgb(42 24 56 / .3)); }
  .staged .alex { left: auto; right: 3%; width: auto; }
  .staged .alex img { width: auto; height: min(43cqh, 56cqw); }
  .flipped .alex { opacity: 1; transform: none; transition-delay: .45s; }
  /* pressing Alex sends him (and his bubble) away; pressing the code then turns the card back */
  .flipped .alex img { pointer-events: auto; cursor: pointer; }
  .flipped .alex.gone { opacity: 0; transform: translateX(25%) rotate(6deg); transition-delay: 0s; }
  .flipped .alex.gone img { pointer-events: none; }
  /* his bubble floats above him, out of the flow, so its arrival can't nudge him sideways */
  .alex .say { position: absolute; bottom: calc(100% + 12px); left: 50%; width: max-content; max-width: max(150px, calc(var(--bruce-size) * 1.15));
    font: 600 max(12px, calc(var(--bruce-size) * .058))/1.35 "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
    transform: translate(-50%, 6px); opacity: 0; transition: opacity .2s, transform .2s; }
  .alex .say:not(:empty) { opacity: 1; transform: translate(-50%, 0); }
  .staged .alex .say { left: auto; right: 0; transform: translateY(6px); }
  .staged .alex .say:not(:empty) { transform: none; }
  .staged .alex .say::after { left: auto; right: 30%; }
  .say .who { display: block; font-size: .72em; text-transform: uppercase; letter-spacing: .06em; color: #c81d6e; }
  .fig:focus-visible { outline: 3px solid var(--bruce-focus, #c81d6e); outline-offset: 4px; }
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .all { transform-origin: 100px 378px; animation: sway 2.6s ease-in-out infinite; }
  .head { transform-origin: 100px 160px; animation: bob 3.1s ease-in-out infinite; }
  .legL { transform-origin: 78px 272px; } .legR { transform-origin: 122px 272px; }
  .jig .all { animation: bounce .4s ease-in-out infinite; }
  .jig .head { animation: nod .4s ease-in-out infinite; }
  .jig .legL { animation: kickL .8s ease-in-out infinite; }
  .jig .legR { animation: kickR .8s ease-in-out infinite; }
  .refuse .all, .offended .all, .glare .all { animation: none; }
  .refuse .head, .glare .head { animation: none; }
  .offended .head { animation: shake .5s ease-in-out 2; }
  /* talking: say() picks one of these at random each time (data-talk on .wrap) */
  .talking .head { animation: yap .28s ease-in-out infinite; }
  .talking[data-talk="nod"] .head { animation: emphasis .42s ease-in-out infinite; }
  .talking[data-talk="lean"] .all { animation: lean 1.6s ease-in-out infinite; }
  .talking[data-talk="hop"] .all { animation: hop .5s ease-in-out infinite; }
  @keyframes sway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
  @keyframes bob { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes nod { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
  @keyframes kickL { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(16deg); } }
  @keyframes kickR { 0%, 100% { transform: rotate(0); } 75% { transform: rotate(-16deg); } }
  @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
  @keyframes emphasis { 0%, 100% { transform: translateY(0) rotate(0); } 35% { transform: translateY(5px) rotate(2deg); } 60% { transform: translateY(-1px) rotate(-1deg); } }
  @keyframes lean { 0%, 100% { transform: rotate(0); } 40%, 60% { transform: rotate(4deg) translateX(4px); } }
  @keyframes hop { 0%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } 55% { transform: translateY(0); } }
  @keyframes yap { 0%, 100% { transform: rotate(-2deg) translateY(0); } 50% { transform: rotate(2deg) translateY(-2px); } }
  .bubble, .say { background: var(--bruce-bubble-bg, #fff); color: var(--bruce-bubble-ink, #2a1838); text-align: center;
    border: 2px solid #2a1838; padding: .55em .8em; border-radius: 14px; box-shadow: 4px 4px 0 #2a1838; }
  .say::after { content: ""; position: absolute; left: 50%; top: 100%; margin-left: -9px; border: 9px solid transparent; border-top-color: #2a1838; }
  .bubble { position: absolute; left: 50%; bottom: 96%; width: max-content;
    max-width: var(--bruce-bubble-max, max(150px, calc(var(--bruce-size) * 1.15)));
    opacity: 0; transform: translate(-50%, 6px); transition: opacity .2s, transform .2s; pointer-events: none; z-index: 3; }
  .bubble::after { content: ""; position: absolute; left: 50%; top: 100%; margin-left: -9px; border: 9px solid transparent; border-top-color: #2a1838; }
  .bubble.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; cursor: pointer; }  /* click to hush */
  ::slotted([slot="accessory"]) { position: absolute; left: 50%; top: 30%; transform: translateX(-50%); pointer-events: none; z-index: 2; font-size: calc(var(--bruce-size) * .1); }
  .still .all, .still .head, .still .legL, .still .legR { animation: none !important; }
  .still .alex { transition: none; }
  .still .src { overflow: auto; } .still .src pre { animation: none; }
  @media (prefers-reduced-motion: reduce) { .all, .head, .legL, .legR { animation: none !important; } .bubble, .card, .alex { transition: none; }
    .src { overflow: auto; } .src pre { animation: none; } }
`;

class BruceLawson extends HTMLElement {
  static observedAttributes = ["head", "top", "legs", "props", "rant", "hoedown", "hoedown-src", "glamorous", "ai", "reduced-motion", "flipped", "background"];
  static heads = HEADS;
  static tops = TOPS;
  static legs = LEGS;
  static props = PROPS;
  static resolveProps = list => resolveProps(list).list;
  static topics = TOPICS;
  static backgrounds = BACKGROUNDS;

  constructor() {
    super();
    this._uid = "b" + Math.random().toString(36).slice(2, 8);
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="card">
        <div class="front" part="stage">
          <div class="wrap" part="wrap">
            <div class="bubble" part="bubble" role="status" aria-live="polite"></div>
            <button class="fig" part="figure" type="button"></button>
            <slot name="accessory"></slot>
          </div>
        </div>
        <div class="back" part="back">
          <div class="code" aria-hidden="true"><pre class="tag"></pre><div class="src"><pre></pre></div></div>
          <button class="copy" part="copy" type="button">Copy markup</button>
          <div class="alex" part="alex"><div class="say" role="status" aria-live="polite"></div><img src="${ALEX_SRC}" alt="" loading="lazy"></div>
        </div>
      </div>`;
    this._wrap = root.querySelector(".wrap");
    this._bubble = root.querySelector(".bubble");
    this._bubble.addEventListener("click", () => this.hush());
    this._btn = root.querySelector(".fig");
    this._card = root.querySelector(".card");
    this._front = root.querySelector(".front");
    this._back = root.querySelector(".back");
    this._alexSay = root.querySelector(".say");
    this._alex = root.querySelector(".alex");
    this._alex.querySelector("img").addEventListener("click", e => { e.stopPropagation(); this._alex.classList.add("gone"); });
    // a click or tap turns him back, but not the end of a drag that selected some code to copy
    this._back.addEventListener("pointerdown", e => { this._downAt = [e.clientX, e.clientY]; });
    this._back.addEventListener("click", e => {
      const [x, y] = this._downAt || [e.clientX, e.clientY];
      const sel = (root.getSelection ? root.getSelection() : getSelection()).toString();
      if (Math.hypot(e.clientX - x, e.clientY - y) > 4 || sel) return;
      this.flip(false);
    });
    const copy = root.querySelector(".copy");
    copy.addEventListener("click", async e => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(this._back.querySelector(".tag").textContent); copy.textContent = "Copied!"; }
      catch { getSelection().selectAllChildren(this._back.querySelector(".tag")); copy.textContent = "Selected: now copy"; }  // no clipboard access
      clearTimeout(this._copyT); this._copyT = setTimeout(() => { copy.textContent = "Copy markup"; }, 1600);
    });
    this._lastRant = null; this._refusals = 0; this._toldMotion = false; this._playing = false; this._danceIdx = 0;
    this._btn.addEventListener("click", () => this._onPress());
  }

  connectedCallback() {
    // Escape hushes every Bruce on the page, and turns him back round
    if (!this._onKey) this._onKey = e => { if (e.key === "Escape") { this.hush(); this.flip(false); } };
    addEventListener("keydown", this._onKey);
    if (!this._onShimmer) this._onShimmer = e => {
      if (e.type === "pointermove") this._pointer = [e.clientX, e.clientY];
      if (!this._shimmerFrame) this._shimmerFrame = requestAnimationFrame(() => { this._shimmerFrame = 0; this._shimmer(); });
    };
    addEventListener("pointermove", this._onShimmer, { passive: true }); addEventListener("scroll", this._onShimmer, { passive: true });
    this._resolve("top"); this._resolve("legs"); this._resolveProps();
    this._setBackground();
    this._idleHead = rand(IDLE_HEADS);
    this._ready = true;
    this._render();
    if (this.hasAttribute("ai")) this.say(RANTS.refuse[0]);
    else if (this.getAttribute("glamorous") === "false") this._offend();
    if (this.hasAttribute("hoedown")) this._startHoedown(false);
    if (this.hasAttribute("flipped")) this._flipped(true);
  }
  disconnectedCallback() {
    this._stopHoedown(true); clearTimeout(this._sayT); clearTimeout(this._alexT);
    removeEventListener("keydown", this._onKey);
    removeEventListener("pointermove", this._onShimmer); removeEventListener("scroll", this._onShimmer);
  }

  attributeChangedCallback(name, oldV, newV) {
    if (!this._ready || oldV === newV) return;
    switch (name) {
      case "top": case "legs":
        this._resolve(name);
        this._emit("bruce:change", { part: name, value: this["_" + name], label: this._labels()[name] });
        break;
      case "props":
        this._resolveProps();
        this._emit("bruce:change", { part: "props", value: this._props.list.join(" "), label: this._labels().props });
        break;
      case "head": this._emit("bruce:change", { part: "head", value: this._headName(), label: (HEADS[this._headName()] || {}).label }); break;
      case "glamorous":
        if (newV === "false") this._offend();
        else if (oldV === "false") this.say("Thank you. Normal glamour levels restored.");
        break;
      case "ai":
        if (newV !== null) { this._refusals = 0; this.say(RANTS.refuse[0]); this._stopHoedown(true); }
        else { this.say("Thank you. The robots have left the building."); if (this.hasAttribute("hoedown")) this._startHoedown(false); }
        break;
      case "hoedown": case "hoedown-src":
        if (this.hasAttribute("hoedown")) this._startHoedown(false); else this._stopHoedown();
        break;
      case "background":
        this._setBackground();
        this._emit("bruce:change", { part: "background", value: this._bg, label: BACKGROUNDS[this._bg] || this._bg || "none" });
        this._updateLabel();
        return;
      case "flipped":
        this._flipped(newV !== null);
        return;  // no need to redraw him, the card just turns
      case "reduced-motion":
        if (newV !== null) this._tellMotion();
        else { this._toldMotion = false; this.say(this.hasAttribute("hoedown") ? "Right. Back to dancing." : "Right. I can move again."); }
        break;
    }
    this._render();
  }

  /* public API */
  rant() { this._rant(); }
  say(text, ms = 6500, speakingHead) {
    const b = this._bubble;
    b.textContent = text;
    b.classList.add("show");
    clearTimeout(this._sayT);
    this._speaking = speakingHead || null;
    if (this._speaking) {
      const styles = TALK_STYLES.filter(t => t !== this._wrap.dataset.talk);
      this._wrap.dataset.talk = rand(styles);
    }
    this._applyHead();
    this._sayT = setTimeout(() => { b.classList.remove("show"); this._speaking = null; this._applyHead(); }, ms);
  }
  hush() { clearTimeout(this._sayT); this._alexSay.textContent = ""; this._bubble.classList.remove("show"); this._speaking = null; this._applyHead(); }
  reroll() {
    this._resolve("top", true); this._resolve("legs", true); this._resolveProps(true); this._idleHead = rand(IDLE_HEADS);
    if (this.getAttribute("background") === "random") this._setBackground();
    this._render();
  }
  render() { this._render(); }
  // the background he is standing in front of (after "random" has been settled), or null
  get background() { return this._bg || null; }
  // turns him over to show his source code (or back, with false)
  flip(force) { this.toggleAttribute("flipped", force === undefined ? !this.hasAttribute("flipped") : force); }
  // the props he actually has, after clashes between hands are settled
  // the name of the face he is showing right now
  get shownHead() { return this._shownHead || this._headName(); }
  get props() { return this._props ? [...this._props.list] : []; }

  /* internals */
  // reduced motion: from the OS setting, or forced with the reduced-motion attribute
  // Slides the gold of the golden shorts with the pointer and the scroll position, so they catch the light.
  _shimmer() {
    if (!this._gold) return;
    const p = this._pointer || [0, 0], off = p[0] / (innerWidth || 1) * 60 + p[1] / (innerHeight || 1) * 30 + (scrollX + scrollY) * .25;
    this._gold.setAttribute("gradientTransform", `translate(${off.toFixed(1)} 0)`);
  }
  get _still() { return this.hasAttribute("reduced-motion") || reducedMotion(); }
  get _mood() {
    if (this.hasAttribute("ai")) return "refuse";
    if (this.getAttribute("glamorous") === "false") return "offended";
    if (this._still) return "glare";
    return "happy";
  }
  _resolve(part, force) {
    const table = { top: TOPS, legs: LEGS }[part];
    const v = (this.getAttribute(part) || "random").toLowerCase();
    const pool = Object.keys(table);
    const key = "_" + part, attrKey = "_" + part + "Attr";
    if (v === "random" || !(v in table)) {
      if (force || !this[key] || this[attrKey] !== v || !(this[key] in table)) this[key] = rand(pool);
    } else this[key] = v;
    this[attrKey] = v;
  }
  _resolveProps(force) {
    const v = (this.getAttribute("props") || "").toLowerCase().trim();
    if (v === "random") {
      if (force || this._propsAttr !== v || !this._props) this._props = resolveProps(randomProps());
    } else this._props = resolveProps(v.split(/\s+/).filter(Boolean));
    this._propsAttr = v;
  }
  _headName() {
    const pin = (this.getAttribute("head") || "auto");
    if (pin !== "auto" && HEADS[pin]) return pin;
    if (this.hasAttribute("ai")) return "glare";
    if (this.getAttribute("glamorous") === "false") return "orly";
    if (this._speaking && HEADS[this._speaking]) return this._speaking;
    if (this._playing) return DANCE_HEADS[this._danceIdx % DANCE_HEADS.length];
    if (this._still) return "glare";
    return HEADS[this._idleHead] ? this._idleHead : "happy1";
  }
  _labels() {
    const topKey = this._top, legKey = this._legs;
    const held = this._mood === "refuse" ? this._props.neck : this._props.list;
    return { topKey, legKey, top: TOPS[topKey].label, legs: LEGS[legKey].label, props: andList(held.map(p => PROPS[p].label)) };
  }
  _applyHead() {
    if (!this._headImg) return;
    const name = this._headName(), h = HEADS[name];
    if (!h) return;
    if (this._shownHead !== name) {
      const b = headBox(h);
      this._headImg.setAttribute("href", h.src);
      for (const k of ["x", "y", "width", "height"]) this._headImg.setAttribute(k, b[k].toFixed(1));
      this._headG.setAttribute("filter", `url(#${this._uid}-sh)`);
      this._shownHead = name;
      this._emit("bruce:face", { head: name, label: h.label, adj: h.adj });
    }
    this._wrap.classList.toggle("talking", !!this._speaking && !this.hasAttribute("ai"));
    this._updateLabel();
  }
  // "random" picks a different photo from the one showing; "none" or no attribute means no stage, just Bruce
  _setBackground() {
    let v = this.getAttribute("background");
    if (v === "random") v = rand(Object.keys(BACKGROUNDS).filter(k => k !== this._bg));
    else if (v === "") v = "gallery";
    else if (v === "none") v = null;
    this._bg = v;
    this._card.classList.toggle("staged", !!v);
    this._front.style.backgroundImage = v ? `url("${bgURL(v)}")` : "";
  }
  _flipped(on) {
    if (this._card.classList.contains("flipped") !== on && !this.hasAttribute("quiet")) whoosh(!on);
    this._card.classList.toggle("flipped", on);
    this._updateLabel();
    clearTimeout(this._alexT);
    this.hush();
    if (on) {
      this._alex.classList.remove("gone");
      this._fillBack();
      // he quotes the real gzipped size of this file, worked out in the browser
      const kb = SOURCE.then(src => new Response(new Blob([src]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer())
        .then(b => Math.round(b.byteLength / 1024), () => 24);
      this._alexT = setTimeout(async () => { const n = await kb; if (!this.hasAttribute("flipped")) return;
        this._alexSay.innerHTML = `<span class="who">Alex Russell: </span>`; this._alexSay.append(ALEX_LINE(n)); }, this._still ? 0 : 900);
    }
    this._emit("bruce:flip", { flipped: on });
  }
  // the back: his markup as it stands, then this file's source rolling past like film credits
  _fillBack() {
    const esc = t => t.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const attrs = this.getAttributeNames().filter(a => !["flipped", "style", "class"].includes(a))
      .map(a => `<span class="a">${a}</span>` + (this.getAttribute(a) === "" ? "" : `=<span class="v">"${esc(this.getAttribute(a))}"</span>`));
    const t = n => `<span class="t">${n}</span>`;
    this._back.querySelector(".tag").innerHTML = `&lt;${t("bruce-lawson")}${attrs.map(a => "\n  " + a).join("")}&gt;\n&lt;/${t("bruce-lawson")}&gt;`;
    const pre = this._back.querySelector(".src pre");  // the source only needs reading once
    if (pre.childNodes.length) return;
    SOURCE ||= fetch(import.meta.url).then(r => r.text()).catch(() => "// The source is out for lunch.");
    SOURCE.then(src => {
      pre.innerHTML = src.split("\n").map(l => /^\s*\/\//.test(l) ? `<span class="c">${esc(l)}</span>` : esc(l)).join("\n");
      pre.style.setProperty("--credits", Math.round(src.split("\n").length * .13) + "s");
    });
  }
  _render() {
    if (!this._ready) return;
    const u = this._uid, mood = this._mood;
    const L = this._labels();
    // arms: crossed when refusing, otherwise each hand takes the pose for what it holds
    const { hands, neck } = this._props, refuse = mood === "refuse";
    const [poseR, shapeR] = grip(refuse ? null : hands.right, "right"), [poseL, shapeL] = grip(refuse ? null : hands.left, "left");
    const arms = refuse ? REFUSE : { L: POSES[poseR], R: mirrorArm(POSES[poseL]) };
    const guitar = !refuse && hands.left === "guitar";
    const held = refuse ? "" : ["right", "left"].map(h => hands[h] && hands[h] !== "guitar" ? heldSVG(hands[h], h) : "").join("");
    const hand = (d, shape) => handSVG(d, refuse ? "fist" : shape);
    this._btn.innerHTML = `<svg viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        ${topPattern(u + "-top", L.topKey)}${legsPattern(u + "-legs", L.legKey)}
        <filter id="${u}-sh" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#2a1838" flood-opacity=".3"/></filter>
        <filter id="${u}-olsh" x="-15%" y="-15%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/>
          <feMerge result="m"><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge>
          <feDropShadow in="m" dx="3" dy="3" stdDeviation="0" flood-color="#2a1838" flood-opacity=".3"/>
        </filter>
      </defs>
      <ellipse cx="100" cy="376" rx="66" ry="5" fill="#2a1838" opacity=".22"/>
      <g class="all">
        <g transform="translate(0 ${BODY_Y})" filter="url(#${u}-olsh)">${legsSVG(u, L.legKey)}</g>
        <g class="head"><image preserveAspectRatio="none"/></g>
        <g transform="translate(0 ${BODY_Y})" filter="url(#${u}-olsh)">
          ${torsoSVG(u, L.topKey)}
          ${neckSVG(neck)}
          ${armsSVG(u, arms, L.topKey)}
          ${guitar ? hand(arms.R, shapeL) + guitarSVG(true) : ""}
          ${held}
          ${hand(arms.L, shapeR)}${guitar ? "" : hand(arms.R, shapeL)}
        </g>
      </g>
    </svg>`;
    this._gold = this._btn.querySelector(`linearGradient#${u}-legs`);
    this._shimmer();
    this._headG = this._btn.querySelector(".head");
    this._headImg = this._headG.querySelector("image");
    this._shownHead = null;
    this._wrap.className = "wrap " + mood + (this._still ? " still" : "") + (this._playing ? " jig" : "");
    this._card.classList.toggle("still", this._still);
    if (this.hasAttribute("flipped")) this._fillBack();
    this._applyHead();
    this._emit("bruce:render", { head: this._headName(), headLabel: HEADS[this._headName()].label, top: L.top, legs: L.legs, props: refuse ? [...neck] : this.props, propsLabel: L.props, mood, playing: this._playing });
  }
  _updateLabel() {
    const L = this._labels(), mood = this._mood, h = HEADS[this._headName()];
    let label;
    if (this.hasAttribute("flipped")) label = "Bruce Lawson, turned over to show his source code, with Alex Russell pointing at it. Press to turn him back.";
    else if (mood === "refuse") label = "Bruce Lawson, arms crossed and glaring, refusing to work with AI. Press to try anyway.";
    else label = `Bruce Lawson, ${h.label}, in a ${L.top}, ${L.legs}${L.props ? ", " + L.props : ""}${BACKGROUNDS[this._bg] ? ", in front of " + BACKGROUNDS[this._bg] : ""}. ${this.hasAttribute("hoedown") && !this._playing ? "Press to start the hoedown." : "Press for a rant."}`;
    this._btn.setAttribute("aria-label", label);
  }
  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true })); }
  _offend() {
    console.error('GlamourError: "false" is not a valid value for the glamorous attribute. Bruce is always glamorous.');
    this.say("Excuse me? glamorous=\"false\" isn’t a valid value. It never will be.", 8000);
    this._emit("bruce:offended", {});
  }
  _onPress() {
    if (!this.hasAttribute("quiet") && !this._playing) boing();
    if (this.hasAttribute("flipped")) { this.flip(false); return; }
    if (this.hasAttribute("hoedown") && !this._playing && !this.hasAttribute("ai")) { this._startHoedown(true); return; }
    this._rant();
  }
  _rant() {
    if (this.hasAttribute("ai")) {
      this._refusals = Math.min(this._refusals + 1, RANTS.refuse.length - 1);
      const t = RANTS.refuse[this._refusals];
      this.say(t, 6500, "glare"); this._emit("bruce:rant", { topic: "refusal", text: t }); return;
    }
    if (this.getAttribute("glamorous") === "false") { this._offend(); return; }
    if (this._still && !this._toldMotion) { this._tellMotion(); return; }
    let topic = (this.getAttribute("rant") || "random").toLowerCase();
    if (!TOPICS.includes(topic)) topic = rand(TOPICS);
    let pool = RANTS[topic];
    let t = rand(pool), guard = 0;
    while (t === this._lastRant && pool.length > 1 && guard++ < 10) t = rand(pool);
    this._lastRant = t;
    this.say(t, 6500, TOPIC_HEAD[topic]);
    this._emit("bruce:rant", { topic, text: t });
  }
  _tellMotion() {
    this._toldMotion = true;
    // "dancing" only during the hoedown; otherwise he just isn't moving
    const t = `I’m not ${this.hasAttribute("hoedown") ? "dancing" : "moving"}. You asked for reduced motion, and I respect that.`;
    this.say(t, 6500, "glare"); this._emit("bruce:rant", { topic: "motion", text: t });
  }
  _canAutoplay() { const ua = navigator.userActivation; return !ua || ua.hasBeenActive; }
  _askForPress() { this.say("Browsers block autoplay, and even I obey some standards. Press me to hoedown.", 9000, "quizzical"); this._render(); }
  _startHoedown(fromPress) {
    if (this.hasAttribute("ai")) { this.say("I’m not hoedowning with a robot in the room.", 6500, "glare"); return; }
    this._stopHoedown(true);
    if (!fromPress && !this._canAutoplay()) { this._askForPress(); return; }
    const own = this.getAttribute("hoedown-src");
    this._audio = new Audio(own || HOEDOWN_SRC); this._audio.loop = true;
    this._audio.play().catch(() => { this._stopHoedown(true); this._askForPress(); });
    // sing along with the built-in song: show each cue as the audio reaches it, until the next one
    this._cue = -1;
    if (!own) this._audio.addEventListener("timeupdate", () => {
      const t = this._audio ? this._audio.currentTime : 0;
      let i = -1;
      while (i + 1 < HOEDOWN_CUES.length && HOEDOWN_CUES[i + 1][0] <= t) i++;
      if (i === this._cue) return;
      this._cue = i;
      if (i < 0) return;
      const next = HOEDOWN_CUES[i + 1];
      this.say(HOEDOWN_CUES[i][1], next ? (next[0] - HOEDOWN_CUES[i][0]) * 1000 + 300 : 4000);
    });
    this._playing = true;
    this._faceTimer = setInterval(() => { this._danceIdx++; this._applyHead(); }, 800);
    this._render();
    if (own) this.say("Yee-haw! Valid HTML5, every step.", 4000);
    this._emit("bruce:hoedown", { playing: true });
  }
  _stopHoedown(silent) {
    clearInterval(this._faceTimer);
    if (this._audio) { this._audio.pause(); this._audio = null; }
    const was = this._playing;
    this._playing = false;
    if (was) { this._emit("bruce:hoedown", { playing: false }); if (!silent) this._render(); }
  }
}

if (!customElements.get("bruce-lawson")) customElements.define("bruce-lawson", BruceLawson);
window.BruceLawson = BruceLawson;

export { BruceLawson };
export default BruceLawson;

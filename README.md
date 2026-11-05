# &lt;bruce-lawson&gt;

Sixty is 0x3C in hex, and 0x3C is `<`. So Bruce gets an element of his own.

Try it: **https://andreasbovens.github.io/brucefest/**

A dependency-free web component: a cut-out photo head (collage style, white outline) on a flat SVG body, with interchangeable tops, trousers and props, mood-based faces, rants, and a hoedown.

## Run it

ES modules don't load from `file://`, so use a local server:

```sh
npm run dev        # serves on http://localhost:5173
```

Any static server works (`python3 -m http.server` too).

## Use it

1. Copy `src/bruce-lawson.js` and `assets/` (heads, audio, extras and, for a stage, backgrounds) to your site, keeping that folder layout (the component finds the images and audio relative to its own file).
2. Load the script once, as a module, and use the element:

```html
<script type="module" src="src/bruce-lawson.js"></script>
<bruce-lawson top="circles" legs="jeans" props="guitar lanyard" rant="engines" hoedown></bruce-lawson>
```

| Attribute | Values |
| --- | --- |
| `head` | `auto` (mood-based), `happy1`, `happy2`, `cheeky`, `quizzical`, `talk`, `orly`, `glare`, `jaded`, `visionary`, `innocent`, `sceptical`, `smirk`, `viking` |
| `top` | `compliant-tee`, `blazer`, `circles`, `pin-jacket`, `chaos`, `opera-tee`, `vivaldi-tee`, `cowboy`, `pink-blazer`, `kitten-tee`, `random` |
| `legs` | `jeans`, `black-jeans`, `formal`, `stripes`, `golden-shorts`, `random` |
| `props` | space-separated: `guitar`, `mic`, `clicker`, `laptop`, `phone`, `guinness`, `point-left`, `point-right`, `peace-left`, `peace-right`, `lanyard`, `lei`, or `random`. One item per hand; when props clash, the later one wins. |
| `rant` | `engines`, `dma`, `ai`, `standards`, `random` |
| `hoedown` | boolean; waits for a press because of autoplay rules |
| `hoedown-src` | URL of an audio file to play instead of the built-in hoedown (`assets/audio/hoedown.mp4`) |
| `glamorous` | anything except `"false"` |
| `ai` | boolean; he refuses to work |
| `reduced-motion` | boolean; he stops moving and glares, as with the OS reduced-motion setting |
| `quiet` | boolean; no sound when he’s pressed or turned over |
| `background` | `gallery`, `oslo`, `irises`, `stage`, `cma`, `eu`, `random`, or an image URL; he brings his own framed stage, and the element becomes the whole card (give it a height, 520px by default) |
| `flipped` | boolean; turns him over to show his source code, with Alex Russell pointing at it |

3. Serve it from a web server (localhost is fine). Without a background, size him with the `--bruce-size` CSS custom property (240px by default) and leave some room above him for his speech bubble. With one, give the element a width and height and he fits himself in; `--bruce-floor` (10px by default) leaves space below his feet, say for a caption.

Anything you put inside the element is the fallback: it shows when JavaScript is off (or the module fails to load) and disappears once he upgrades, because his shadow DOM doesn't slot it. The demo uses a photo head with a speech bubble.

Methods: `rant()`, `say(text, ms, head)`, `reroll()`, `hush()`, `flip(force)`, `render()`.
Events (bubbling, composed): `bruce:rant`, `bruce:change`, `bruce:hoedown`, `bruce:flip`, `bruce:offended`, `bruce:render`, `bruce:face` (the face changed; `detail.adj` is one word for it).

## Install it

The demo page is a progressive web app: install it from the address bar in Chrome or Edge, with File › Add to Dock in Safari on a Mac, or with Share › Add to Home Screen on iOS. It works offline once loaded. After changing any file, bump `VERSION` in `sw.js`.

## Licence

The code is MIT licensed. The photos, backgrounds, audio and icons in `assets/` are not: they belong to their owners and are only here for this non-commercial parody. See [LICENSE](LICENSE) for the details, and open an issue if you own one of them and want it removed.

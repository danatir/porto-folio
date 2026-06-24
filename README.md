# DAN ATIR — Portfolio 2025

A portfolio built around Dan Atir's chrome **DANN** logo (full-res GLB) and the real 2025
project assets. The **floating 3D logo** is the centrepiece; all content is presented as an
**alche.studio-style smooth-scrolling site** layered over it.

## What it does
- **Floating 3D logo** — `dann_logo.glb` at full PBR resolution, glowing via selective bloom,
  over a round reactive starfield, with a live film-grain / scanline / vignette overlay. It
  floats behind the content, reacting to the mouse and to page scroll.
- **alche-style content layer** — the page scrolls smoothly (Lenis) through sections:
  Hero → About → Selected Works → Posters → Contact.
  - Headings reveal as **masked word/line rises**; blocks fade-rise on scroll.
  - **Works list** — each project is a row that dims its siblings and shows a cursor-tracking
    **hover preview**, and **expands inline** to reveal the work image, description and scope.
  - **Marquee** sweeps in at the contact section; big chrome email; custom lagging **cursor**.
- **Live demo (roaming mode)** — the Viaro project launches a "Maki-style" interactive phone
  prototype that auto-cycles its screens (Home / Dive / Sites / Profile), or click the tabs.
- **Synthesised sound** — ambient drone + wind bed that reacts to scroll velocity, plus UI
  blips/whooshes. No audio files; everything is generated with the Web Audio API.

## Run it
ES modules + the `.glb` are fetched over HTTP, so you need a local server (opening
`index.html` from `file://` will not work).

```bash
cd "porto folio"
python3 -m http.server 8765
# then open http://localhost:8765
```

Click **ENTER** to unlock sound, then scroll. Hover a work to preview it, click to expand;
the **SOUND** button toggles audio.

## Structure
```
index.html        loader, enter-gate, fixed nav, content sections, demo + cursor, importmap
css/style.css     chrome typography, sections/works/posters/contact, reveals, cursor, grain
js/main.js        WebGL: floating GLB logo + starfield + selective bloom + grain (no carousels)
js/ui.js          content build from data, Lenis smooth scroll, reveals, works list, cursor, nav
js/data.js        all portfolio content (about, projects, posters)
js/audio.js       Web-Audio synth (drone, wind, SFX)
js/demo.js        the roaming Viaro live prototype
assets/models/    dann_logo.glb (full resolution)
assets/img/       project + poster imagery (web-optimised from the portfolio PDF)
```

three.js and Lenis are loaded from a CDN via the import map in `index.html`, so an internet
connection is needed on first load.

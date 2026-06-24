// ============================================================
//  UI / CONTENT LAYER — horizontal SLIDE deck (not scroll)
//  Pages slide right→left. Landing (page 0) is left untouched;
//  the rest are inverted (light) panels. Content built from data.
//  Does NOT touch the floating 3D logo (main.js / WebGL).
// ============================================================
import { ABOUT, PROJECTS, POSTERS } from "./data.js";
import Lenis from "lenis";

const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, "0");
let liquidDraw = () => {};   // assigned by initLiquid; (on)=>... toggles the landing oil sim
let liquidRiftActive = true; // true during loading rift; set false when rift done

/* ============================================================
   BUILD CONTENT
   ============================================================ */
function buildArchive() {
  const el = $("#archiveOverlay"); if (!el) return;

  const allImgs = [];
  PROJECTS.forEach(p => p.images.forEach(src => allImgs.push({ src })));
  POSTERS.forEach(src => allImgs.push({ src }));
  const N = allImgs.length;

  /* Anchor index: first image of the last project card — survives content swaps */
  const N_PROJ_ARC = Math.min(4, PROJECTS.length);
  let ANCHOR_IDX = 0;
  for (let i = 0; i < N_PROJ_ARC - 1; i++) ANCHOR_IDX += PROJECTS[i].images.length;

  /* Grid-cell scatter — no overlaps, all upright */
  const IMG_W = 240, IMG_H = 160;
  const COLS = 5, ROWS = Math.ceil(N / COLS);
  const CELL_W = 310, CELL_H = 220;
  const WORLD_W = COLS * CELL_W, WORLD_H = ROWS * CELL_H;
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const JX = (CELL_W - IMG_W) / 2, JY = (CELL_H - IMG_H) / 2;
  const wCenters = allImgs.map((_, i) => ({
    cx: (i % COLS) * CELL_W + CELL_W / 2 + (rnd(i * 3)     - 0.5) * 2 * JX,
    cy: Math.floor(i / COLS) * CELL_H + CELL_H / 2 + (rnd(i * 3 + 1) - 0.5) * 2 * JY,
  }));

  /* 4 ghost copies per image for seamless toroidal tiling */
  const panelHTML = allImgs.map((img, i) =>
    [0,1,2,3].map(t => `
      <figure class="sc-panel" data-i="${i}" data-t="${t}">
        <img src="${img.src}" alt="" loading="lazy" draggable="false" crossorigin="anonymous" />
      </figure>`).join('')
  ).join('');


  /* SVG filter defs for barrel/fisheye displacement */
  document.getElementById('sc-fisheye-defs')?.remove();
  const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgDefs.id = 'sc-fisheye-defs';
  svgDefs.setAttribute('width', '0'); svgDefs.setAttribute('height', '0');
  svgDefs.style.cssText = 'position:absolute;pointer-events:none';
  svgDefs.innerHTML = `<defs>
    <filter id="sc-fisheye" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage id="scFisheyeMap" result="dmap" preserveAspectRatio="none"/>
      <feDisplacementMap id="scFisheyeDisp" in="SourceGraphic" in2="dmap" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
  document.body.appendChild(svgDefs);

  el.innerHTML = `
    <div class="sc-viewport" id="scViewport">
      <div class="sc-canvas" id="scCanvas">${panelHTML}</div>
      <canvas id="scRender" style="position:absolute;inset:0;pointer-events:none;display:block"></canvas>
    </div>
    <div class="sc-hud">
      <span class="sc-title">/ ARCHIVE</span>
      <span class="sc-sub">← → ↑ ↓ &nbsp;OR&nbsp; DRAG</span>
    </div>
    <button class="sc-contact-hint" id="scContactHint" aria-label="Go to contact">
      CONTACT <span class="sc-hint-arrow">↓</span>
    </button>`;

  const viewport   = el.querySelector("#scViewport");
  const canvas     = el.querySelector("#scCanvas");
  const renderEl   = el.querySelector("#scRender");
  const renderCtx  = renderEl.getContext('2d');
  const feDisp     = document.getElementById('scFisheyeDisp');
  const feImg      = document.getElementById('scFisheyeMap');
  const allPanels  = [...el.querySelectorAll(".sc-panel")];

  let vpW = viewport.offsetWidth  || window.innerWidth;
  let vpH = viewport.offsetHeight || window.innerHeight;
  let camX = WORLD_W / 2, camY = WORLD_H / 2;
  let vx = 0, vy = 0;
  let motionStr = 0;
  let dragging = false, lastX = 0, lastY = 0;
  const keys = {};

  /* Entry / exit effect state */
  let entryReady = false; // flips true when _startArchiveEntry fires
  let _entryTime = 0;     // performance.now() at entry — used for forward-exit cooldown
  let entryStart = 0;     // performance.now() at which tile fade-in begins
  let exitReady  = false; // flips true when _exitArchive fires
  let exitStart  = 0;

  /* Build pincushion displacement map — edges pushed outward (fisheye) */
  const makeBarrelMap = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx2 = c.getContext('2d');
    const d = ctx2.createImageData(w, h);
    const K = 0.85;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x / w) * 2 - 1, ny = (y / h) * 2 - 1;
        const r2 = Math.min(nx * nx + ny * ny, 1.5);
        const idx = (y * w + x) * 4;
        d.data[idx]   = Math.round(Math.max(0, Math.min(255, (-nx * K * r2 * 0.5 + 0.5) * 255)));
        d.data[idx+1] = Math.round(Math.max(0, Math.min(255, (-ny * K * r2 * 0.5 + 0.5) * 255)));
        d.data[idx+2] = 128; d.data[idx+3] = 255;
      }
    }
    ctx2.putImageData(d, 0, 0);
    return c.toDataURL();
  };

  const syncFilter = () => {
    vpW = viewport.offsetWidth  || window.innerWidth;
    vpH = viewport.offsetHeight || window.innerHeight;
    renderEl.width  = vpW;
    renderEl.height = vpH;
    const filt = document.getElementById('sc-fisheye');
    if (filt) { filt.setAttribute('x', 0); filt.setAttribute('y', 0); filt.setAttribute('width', vpW); filt.setAttribute('height', vpH); }
    if (feImg) { feImg.setAttribute('x', 0); feImg.setAttribute('y', 0); feImg.setAttribute('width', vpW); feImg.setAttribute('height', vpH); feImg.setAttribute('href', makeBarrelMap(vpW, vpH)); }
  };
  requestAnimationFrame(syncFilter);
  window.addEventListener("resize", syncFilter, { passive: true });

  /* drag */
  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    dragging = true; vx = 0; vy = 0;
    lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    camX -= dx; camY -= dy;
    vx = -dx; vy = -dy;
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = () => { dragging = false; };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);

  /* arrow keys */
  const onKeyDown = e => {
    if (!{ ArrowLeft:1, ArrowRight:1, ArrowUp:1, ArrowDown:1 }[e.key]) return;
    const r = el.getBoundingClientRect();
    if (r.top < -100 || r.top > window.innerHeight) return;
    keys[e.key] = true;
    e.preventDefault();
  };
  const onKeyUp = e => { delete keys[e.key]; };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup",   onKeyUp);

  const ARROW_V = 7;

  (function loop() {
    requestAnimationFrame(loop);

    if (!dragging) {
      const tx = (keys.ArrowRight ? ARROW_V : 0) - (keys.ArrowLeft ? ARROW_V : 0);
      const ty = (keys.ArrowDown  ? ARROW_V : 0) - (keys.ArrowUp   ? ARROW_V : 0);
      vx += (tx - vx) * 0.22;
      vy += (ty - vy) * 0.22;
      camX += vx; camY += vy;
    }
    if (!dragging && !keys.ArrowLeft && !keys.ArrowRight) vx *= 0.88;
    if (!dragging && !keys.ArrowUp   && !keys.ArrowDown)  vy *= 0.88;

    /* motion strength: ramps up fast, decays slowly when still */
    const speed = Math.hypot(vx, vy);
    const targetStr = Math.min(1, speed / 5);
    motionStr += (targetStr - motionStr) * (targetStr > motionStr ? 0.18 : 0.04);

    /* Symmetric tile selection */
    const tileX = Math.floor(camX / WORLD_W);
    const tileY = Math.floor(camY / WORLD_H);
    const fracX = (camX / WORLD_W) - tileX;
    const fracY = (camY / WORLD_H) - tileY;
    const tx0 = fracX < 0.5 ? tileX - 1 : tileX;
    const ty0 = fracY < 0.5 ? tileY - 1 : tileY;
    const tileOffsets = [
      [tx0,   ty0  ],
      [tx0+1, ty0  ],
      [tx0,   ty0+1],
      [tx0+1, ty0+1],
    ];

    /* Compute panel screen positions and draw to render canvas.
       The SVG filter on the canvas produces pixel-level barrel distortion. */
    const maxDisp = Math.round(vpW * 0.09);
    if (feDisp) feDisp.setAttribute('scale', (maxDisp * motionStr).toFixed(1));
    renderEl.style.filter = motionStr > 0.01 ? 'url(#sc-fisheye)' : 'none';

    renderCtx.clearRect(0, 0, vpW, vpH);
    allPanels.forEach(panel => {
      const i  = +panel.dataset.i;
      const t  = +panel.dataset.t;
      const [otx, oty] = tileOffsets[t];
      const wc = wCenters[i];
      const dx = wc.cx + otx * WORLD_W - camX;
      const dy = wc.cy + oty * WORLD_H - camY;
      const sx = vpW / 2 + dx - IMG_W / 2;
      const sy = vpH / 2 + dy - IMG_H / 2;
      panel.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
      /* only draw to canvas if potentially visible */
      if (sx > vpW + IMG_W || sx < -IMG_W * 2 || sy > vpH + IMG_H || sy < -IMG_H * 2) return;
      const img = panel.querySelector('img');
      if (img.complete && img.naturalWidth > 0) {
        /* entry: tiles materialise with per-tile stagger.
           Anchor tile follows the same stagger — the clone (z-index:500) covers
           it while both are present, so when the clone fades the canvas tile is
           already underneath at full alpha. No gap, no flash.
           exit: tiles dematerialise in reverse stagger. */
        if (exitReady) {
          const elapsed = performance.now() - exitStart;
          const delay = (allImgs.length - i) * 12;
          const t = Math.max(0, Math.min(1, (elapsed - delay) / 380));
          renderCtx.globalAlpha = 1 - t * t;
        } else if (entryReady) {
          const elapsed = performance.now() - entryStart;
          const delay   = i * 22;
          const tileT   = Math.max(0, Math.min(1, (elapsed - delay) / 520));
          renderCtx.globalAlpha = tileT * tileT;
        } else {
          renderCtx.globalAlpha = 1;
        }
        renderCtx.drawImage(img, Math.round(sx), Math.round(sy), IMG_W, IMG_H);
        renderCtx.globalAlpha = 1;
      }
    });
  })();

  /* ---- Entry transition: called by initInfoScroll when last project card exits ---- */
  let _entryFly = null; // ref to the floating clone so popup can dismiss it early

  window._startArchiveEntry = (srcEl) => {
    if (entryReady) return;

    /* show the fixed overlay — appear instantly so the card exit animation is hidden */
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.classList.add('archive-active');
    el.setAttribute('aria-hidden', 'false');
    /* restore CSS transition on the next paint (for exit fade later) */
    requestAnimationFrame(() => { el.style.transition = ''; el.style.opacity = ''; });

    /* _archiveCardRect is captured in the rAF loop when the card is at rest */

    /* Snap camera so anchor tile sits at viewport centre — float lands exactly on it */
    camX = wCenters[ANCHOR_IDX].cx;
    camY = wCenters[ANCHOR_IDX].cy;
    vx = 0; vy = 0;
    motionStr = 1; // full fisheye from frame 0 — settles as user interacts

    entryReady = true;
    _entryTime = performance.now();
    entryStart = performance.now() + 420; // tile fade starts after float reaches centre

    /* --- Floating image clone --- */
    const rect = srcEl.getBoundingClientRect();
    const fly  = document.createElement('div');
    fly.style.cssText = `
      position:fixed;z-index:500;pointer-events:none;overflow:hidden;
      left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      transition:left .44s cubic-bezier(.16,1,.3,1),
                 top  .44s cubic-bezier(.16,1,.3,1),
                 width .44s cubic-bezier(.16,1,.3,1),
                 height .44s cubic-bezier(.16,1,.3,1);
    `;
    const flyImg = document.createElement('img');
    flyImg.src = srcEl.src;
    flyImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    fly.appendChild(flyImg);
    document.body.appendChild(fly);
    _entryFly = fly;

    /* Animate to exact tile position at viewport centre */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fly.style.left   = (vpW / 2 - IMG_W / 2) + 'px';
      fly.style.top    = (vpH / 2 - IMG_H / 2) + 'px';
      fly.style.width  = IMG_W + 'px';
      fly.style.height = IMG_H + 'px';
    }));

    /* Fade out quickly once tile grid starts appearing */
    setTimeout(() => {
      fly.style.transition = 'opacity .3s ease';
      fly.style.opacity    = '0';
      setTimeout(() => { fly.remove(); if (_entryFly === fly) _entryFly = null; }, 350);
    }, 550);
  };

  /* ---- Exit: wheel-up while archive is active ---- */
  let archiveExiting = false;

  const doExitMorph = () => {
    archiveExiting = true;
    exitReady = true;
    exitStart = performance.now();

    const cr = window._archiveCardRect;
    if (cr) {
      const fly = document.createElement('div');
      fly.style.cssText = `
        position:fixed;z-index:501;pointer-events:none;overflow:hidden;
        left:${vpW / 2 - IMG_W / 2}px;top:${vpH / 2 - IMG_H / 2}px;
        width:${IMG_W}px;height:${IMG_H}px;
        transition:left .42s cubic-bezier(.7,0,.84,0),
                   top  .42s cubic-bezier(.7,0,.84,0),
                   width .42s cubic-bezier(.7,0,.84,0),
                   height .42s cubic-bezier(.7,0,.84,0);
      `;
      const flyImg = document.createElement('img');
      flyImg.src = allImgs[ANCHOR_IDX].src;
      flyImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      fly.appendChild(flyImg);
      document.body.appendChild(fly);

      /* Clone fly + overlay fade start on the same paint — fully coordinated */
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fly.style.left   = cr.left   + 'px';
        fly.style.top    = cr.top    + 'px';
        fly.style.width  = cr.width  + 'px';
        fly.style.height = cr.height + 'px';

        /* Overlay fades while clone flies — both complete together */
        el.style.transition = 'opacity 0.44s cubic-bezier(.4,0,1,1)';
        el.style.opacity = '0';
      }));

      /* Clone arrives, then fades out — handoff to the real card underneath */
      setTimeout(() => {
        fly.style.transition += ', opacity .2s ease';
        fly.style.opacity = '0';
        setTimeout(() => fly.remove(), 240);
      }, 420);
    } else {
      /* No card rect: just fade overlay */
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease';
        el.style.opacity = '0';
      });
    }

    /* Cleanup after all animations finish — unlock scroll here so user
       cannot scroll to the white contact section while overlay is fading */
    setTimeout(() => {
      window._unlockArchiveScroll?.();
      el.classList.remove('archive-active');
      el.style.cssText = '';
      el.setAttribute('aria-hidden', 'true');
      window._archiveCardRect = null;
      entryReady = false;
      exitReady = false;
      archiveExiting = false;
      window._resetArchiveEntry?.();
    }, 520);
  };

  window._exitArchive = () => {
    if (archiveExiting || !entryReady) return;

    /* if camera is not on anchor tile, lerp to it first then morph */
    const targetX = wCenters[ANCHOR_IDX].cx;
    const targetY = wCenters[ANCHOR_IDX].cy;
    const dist    = Math.hypot(camX - targetX, camY - targetY);

    if (dist < 8) {
      doExitMorph();
    } else {
      /* use velocity to drift toward anchor — once close, fire morph */
      archiveExiting = true;
      (function centerLoop() {
        const d = Math.hypot(camX - targetX, camY - targetY);
        if (d < 8) { camX = targetX; camY = targetY; doExitMorph(); return; }
        camX += (targetX - camX) * 0.09;
        camY += (targetY - camY) * 0.09;
        vx = 0; vy = 0;
        requestAnimationFrame(centerLoop);
      })();
    }
  };

  /* ---- iOS-style contact popup ---- */
  const popup = document.createElement('div');
  popup.id = 'archiveContactPopup';
  popup.innerHTML = `
    <div class="acp-nonet">
      <div class="acp-nonet-dino">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 65" fill="#535353">
          <rect x="36" y="0" width="24" height="4"/>
          <rect x="32" y="4" width="28" height="4"/>
          <rect x="30" y="8" width="30" height="4"/>
          <rect x="30" y="12" width="26" height="4"/>
          <rect x="50" y="4" width="6" height="6" fill="white"/>
          <rect x="52" y="6" width="3" height="3"/>
          <rect x="52" y="16" width="4" height="2" fill="white"/>
          <rect x="56" y="14" width="4" height="2" fill="white"/>
          <rect x="36" y="16" width="14" height="8"/>
          <rect x="32" y="14" width="4" height="8"/>
          <rect x="26" y="16" width="4" height="6"/>
          <rect x="20" y="18" width="4" height="5"/>
          <rect x="6" y="22" width="40" height="20"/>
          <rect x="0" y="22" width="8" height="8"/>
          <rect x="2" y="20" width="6" height="4"/>
          <rect x="36" y="32" width="10" height="4"/>
          <rect x="44" y="28" width="4" height="6"/>
          <rect x="12" y="42" width="10" height="18"/>
          <rect x="26" y="42" width="10" height="14"/>
          <rect x="6" y="56" width="18" height="4"/>
          <rect x="24" y="52" width="16" height="4"/>
        </svg>
      </div>
      <h2 class="acp-nonet-title">This person can't be reached.</h2>
      <p class="acp-nonet-try">Try:</p>
      <ul class="acp-nonet-list">
        <li><a href="mailto:danatir64@gmail.com" class="acp-nonet-link">Sending an email to danatir64@gmail.com</a></li>
        <li><a href="https://www.linkedin.com/in/dan-atir/" target="_blank" rel="noopener" class="acp-nonet-link">Connecting on LinkedIn</a></li>
        <li><span class="acp-nonet-hint">Checking if you scrolled past a great portfolio</span></li>
      </ul>
      <p class="acp-nonet-code">ERR_CONTACT_NOT_FOUND</p>
      <div class="acp-nonet-qr">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="100%" height="100%">
          <rect width="21" height="21" fill="white"/>
          <rect x="1" y="1" width="7" height="7" fill="#535353"/>
          <rect x="2" y="2" width="5" height="5" fill="white"/>
          <rect x="3" y="3" width="3" height="3" fill="#535353"/>
          <rect x="13" y="1" width="7" height="7" fill="#535353"/>
          <rect x="14" y="2" width="5" height="5" fill="white"/>
          <rect x="15" y="3" width="3" height="3" fill="#535353"/>
          <rect x="1" y="13" width="7" height="7" fill="#535353"/>
          <rect x="2" y="14" width="5" height="5" fill="white"/>
          <rect x="3" y="15" width="3" height="3" fill="#535353"/>
          <rect x="9" y="1" width="1" height="1" fill="#535353"/>
          <rect x="11" y="1" width="2" height="1" fill="#535353"/>
          <rect x="8" y="2" width="1" height="1" fill="#535353"/>
          <rect x="10" y="2" width="1" height="1" fill="#535353"/>
          <rect x="9" y="3" width="2" height="1" fill="#535353"/>
          <rect x="12" y="3" width="1" height="1" fill="#535353"/>
          <rect x="8" y="4" width="2" height="1" fill="#535353"/>
          <rect x="11" y="4" width="1" height="1" fill="#535353"/>
          <rect x="9" y="5" width="1" height="1" fill="#535353"/>
          <rect x="11" y="5" width="2" height="1" fill="#535353"/>
          <rect x="8" y="6" width="1" height="1" fill="#535353"/>
          <rect x="10" y="6" width="2" height="1" fill="#535353"/>
          <rect x="8" y="7" width="2" height="1" fill="#535353"/>
          <rect x="11" y="7" width="1" height="1" fill="#535353"/>
          <rect x="0" y="9" width="1" height="1" fill="#535353"/>
          <rect x="2" y="9" width="2" height="1" fill="#535353"/>
          <rect x="5" y="9" width="1" height="1" fill="#535353"/>
          <rect x="9" y="9" width="1" height="1" fill="#535353"/>
          <rect x="11" y="9" width="2" height="1" fill="#535353"/>
          <rect x="14" y="9" width="2" height="1" fill="#535353"/>
          <rect x="17" y="9" width="1" height="1" fill="#535353"/>
          <rect x="19" y="9" width="2" height="1" fill="#535353"/>
          <rect x="1" y="10" width="1" height="1" fill="#535353"/>
          <rect x="4" y="10" width="1" height="1" fill="#535353"/>
          <rect x="6" y="10" width="1" height="1" fill="#535353"/>
          <rect x="8" y="10" width="2" height="1" fill="#535353"/>
          <rect x="13" y="10" width="1" height="1" fill="#535353"/>
          <rect x="15" y="10" width="2" height="1" fill="#535353"/>
          <rect x="18" y="10" width="1" height="1" fill="#535353"/>
          <rect x="0" y="11" width="2" height="1" fill="#535353"/>
          <rect x="3" y="11" width="1" height="1" fill="#535353"/>
          <rect x="9" y="11" width="1" height="1" fill="#535353"/>
          <rect x="11" y="11" width="1" height="1" fill="#535353"/>
          <rect x="14" y="11" width="2" height="1" fill="#535353"/>
          <rect x="17" y="11" width="1" height="1" fill="#535353"/>
          <rect x="19" y="11" width="2" height="1" fill="#535353"/>
          <rect x="1" y="12" width="2" height="1" fill="#535353"/>
          <rect x="5" y="12" width="1" height="1" fill="#535353"/>
          <rect x="8" y="12" width="2" height="1" fill="#535353"/>
          <rect x="12" y="12" width="1" height="1" fill="#535353"/>
          <rect x="16" y="12" width="1" height="1" fill="#535353"/>
          <rect x="18" y="12" width="2" height="1" fill="#535353"/>
          <rect x="9" y="13" width="2" height="1" fill="#535353"/>
          <rect x="12" y="13" width="2" height="1" fill="#535353"/>
          <rect x="15" y="13" width="1" height="1" fill="#535353"/>
          <rect x="17" y="13" width="2" height="1" fill="#535353"/>
          <rect x="20" y="13" width="1" height="1" fill="#535353"/>
          <rect x="8" y="14" width="1" height="1" fill="#535353"/>
          <rect x="11" y="14" width="1" height="1" fill="#535353"/>
          <rect x="13" y="14" width="1" height="1" fill="#535353"/>
          <rect x="16" y="14" width="1" height="1" fill="#535353"/>
          <rect x="18" y="14" width="1" height="1" fill="#535353"/>
          <rect x="20" y="14" width="1" height="1" fill="#535353"/>
          <rect x="9" y="15" width="2" height="1" fill="#535353"/>
          <rect x="12" y="15" width="2" height="1" fill="#535353"/>
          <rect x="15" y="15" width="2" height="1" fill="#535353"/>
          <rect x="19" y="15" width="2" height="1" fill="#535353"/>
          <rect x="8" y="16" width="1" height="1" fill="#535353"/>
          <rect x="10" y="16" width="1" height="1" fill="#535353"/>
          <rect x="13" y="16" width="1" height="1" fill="#535353"/>
          <rect x="17" y="16" width="1" height="1" fill="#535353"/>
          <rect x="20" y="16" width="1" height="1" fill="#535353"/>
          <rect x="9" y="17" width="1" height="1" fill="#535353"/>
          <rect x="11" y="17" width="2" height="1" fill="#535353"/>
          <rect x="14" y="17" width="2" height="1" fill="#535353"/>
          <rect x="18" y="17" width="1" height="1" fill="#535353"/>
          <rect x="8" y="18" width="2" height="1" fill="#535353"/>
          <rect x="12" y="18" width="1" height="1" fill="#535353"/>
          <rect x="15" y="18" width="1" height="1" fill="#535353"/>
          <rect x="17" y="18" width="2" height="1" fill="#535353"/>
          <rect x="20" y="18" width="1" height="1" fill="#535353"/>
          <rect x="9" y="19" width="2" height="1" fill="#535353"/>
          <rect x="13" y="19" width="1" height="1" fill="#535353"/>
          <rect x="16" y="19" width="1" height="1" fill="#535353"/>
          <rect x="18" y="19" width="2" height="1" fill="#535353"/>
          <rect x="8" y="20" width="1" height="1" fill="#535353"/>
          <rect x="11" y="20" width="2" height="1" fill="#535353"/>
          <rect x="14" y="20" width="2" height="1" fill="#535353"/>
          <rect x="17" y="20" width="1" height="1" fill="#535353"/>
          <rect x="19" y="20" width="1" height="1" fill="#535353"/>
        </svg>
        <p class="acp-nonet-qr-label">Scan the QR code<br>to get in touch</p>
      </div>
      <button class="acp-back-btn acp-nonet-back acp-dismiss">← back</button>
    </div>`;
  el.appendChild(popup);

  let _progressTimer = null;
  const showContactPopup = () => {
    if (!entryReady) return;
    /* dismiss entry clone immediately so it doesn't float above the popup */
    if (_entryFly) {
      _entryFly.style.transition = 'opacity .15s ease';
      _entryFly.style.opacity = '0';
      const _f = _entryFly; _entryFly = null;
      setTimeout(() => _f.remove(), 160);
    }
    popup.classList.add('acp-visible');
    document.body.classList.add('bsod-active');
    /* animate progress counter */
    const el2 = document.getElementById('acpProgress');
    let pct = 0;
    clearInterval(_progressTimer);
    _progressTimer = setInterval(() => {
      pct += Math.floor(Math.random() * 3) + 1;
      if (pct >= 100) { pct = 100; clearInterval(_progressTimer); }
      if (el2) el2.textContent = pct + '% complete';
    }, 120);
  };
  let _popupClosedAt = 0;
  const POPUP_CLOSE_COOLDOWN = 700;
  const hideContactPopup = () => {
    popup.classList.remove('acp-visible');
    document.body.classList.remove('bsod-active');
    clearInterval(_progressTimer);
    const el2 = document.getElementById('acpProgress');
    if (el2) el2.textContent = '0% complete';
    _popupClosedAt = performance.now();
    _exitDelta = 0; _fwdDelta = 0; // clear any accumulated scroll so popup-close can't trigger exit
  };

  popup.querySelector('.acp-dismiss').addEventListener('click', hideContactPopup);

  /* hint button → popup */
  document.getElementById('scContactHint')?.addEventListener('click', showContactPopup);

  /* wheel exit detection:
     up   (≥ 40px net)  → exit back to work cards
     down (≥ 200px net, after 1s grace) → show contact popup */
  let _exitDelta = 0;
  let _fwdDelta  = 0;
  const FORWARD_COOLDOWN  = 1000;
  const BACKWARD_COOLDOWN = 1800; // prevent immediate exit when entering from below (longer for contact→archive momentum)

  window.addEventListener('wheel', e => {
    if (!entryReady || archiveExiting) { _exitDelta = 0; _fwdDelta = 0; return; }
    _exitDelta += e.deltaY;
    if (_exitDelta > 0) _exitDelta = 0;
    if (_exitDelta < -40) {
      _exitDelta = 0; _fwdDelta = 0;
      /* if popup is open, close it first — next upward intent exits the archive */
      if (popup.classList.contains('acp-visible')) { hideContactPopup(); return; }
      /* cooldown prevents immediate exit when scroll momentum carries the user
         in from below (e.g. scrolling up from the contact section) */
      if (performance.now() - _entryTime < BACKWARD_COOLDOWN) return;
      /* prevent immediate exit right after closing the contact popup */
      if (performance.now() - _popupClosedAt < POPUP_CLOSE_COOLDOWN) return;
      window._exitArchive();
      return;
    }
    if (performance.now() - _entryTime > FORWARD_COOLDOWN) {
      _fwdDelta += e.deltaY;
      if (_fwdDelta < 0) _fwdDelta = 0;
      if (_fwdDelta > 200) {
        _exitDelta = 0; _fwdDelta = 0;
        showContactPopup();
      }
    }
  }, { passive: true });
}

function buildAbout() {
  const intro = ABOUT[0], skills = ABOUT[1], edu = ABOUT[2];
  $("#aboutBody").innerHTML = `
    <p class="about-lead reveal">${intro.body}</p>
    <div class="about-cols">
      <div class="about-col reveal">
        <h4>Skills &amp; Tools</h4>
        <div class="chips">${skills.scope.map(s => `<span>${s}</span>`).join("")}</div>
      </div>
      <div class="about-col reveal">
        <h4>Education</h4>
        <p>${edu.body}</p>
      </div>
    </div>`;
}



/* live Tokyo time / date stamp */
function startClock() {
  const timeEl = $("#metaTime");
  const dateEl = $("#metaDate");
  if (!timeEl) return;
  const pad = n => String(n).padStart(2, "0");
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const tick = () => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    let h = d.getHours(), ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    timeEl.textContent = `${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
    if (dateEl) dateEl.textContent = `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()}`;
  };
  tick(); setInterval(tick, 1000);
}

/* landing thumbnails — hovering slides that project's OWN page in (selected
   look, no grow); moving between thumbs swaps project; leaving slides back. */
function buildHeroThumbs() {
  const el = $("#heroThumbs"); if (!el) return;
  const HERO = PROJECTS.slice(0, 4);
  el.innerHTML = HERO.map((p, i) => `
    <a class="thumb" data-i="${i}" href="#works">
      <span class="thumb-no">[${pad(i + 1)}]</span>
      <span class="thumb-img"><img src="${p.images[0]}" alt="${p.title}" /></span>
      <span class="thumb-title">${p.title}</span>
    </a>`).join("");
  const thumbs = [...el.querySelectorAll(".thumb")];

  /* The hover preview "page" — a fixed panel inside #content that slides in
     from the right with a spring overshoot. It sits below the thumbs (z) but
     above the hero statement, and is purely visual (pointer-events:none) so
     hovering between thumbs is never interrupted. */
  const content = $("#content");
  const panel = document.createElement("div");
  panel.id = "heroProjPanel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <span class="hpp-wm" aria-hidden="true"></span>
    <div class="hpp-inner">
      <div class="hpp-media"><img src="" alt="" /></div>
      <div class="hpp-text">
        <span class="hpp-no"></span>
        <h2 class="hpp-title"></h2>
        <p class="hpp-tag"></p>
        <p class="hpp-body"></p>
        <ul class="hpp-scope"></ul>
      </div>
    </div>`;
  content && content.appendChild(panel);
  const pWm    = panel.querySelector(".hpp-wm");
  const pImg   = panel.querySelector(".hpp-media img");
  const pNo    = panel.querySelector(".hpp-no");
  const pTitle = panel.querySelector(".hpp-title");
  const pTag   = panel.querySelector(".hpp-tag");
  const pBody  = panel.querySelector(".hpp-body");
  const pScope = panel.querySelector(".hpp-scope");

  let curIdx = -1, isOpen = false;
  const fill = (i) => {
    const p = HERO[i]; if (!p) return;
    panel.style.setProperty("--hpp-accent", p.accent || "#0a0b0e");
    pWm.textContent    = pad(i + 1);
    pImg.src           = p.images[0];
    pImg.alt           = p.title;
    pNo.textContent    = `[${pad(i + 1)}] / WORK`;
    pTitle.textContent = p.title;
    pTag.textContent   = p.tag;
    pBody.textContent  = p.body;
    pScope.innerHTML   = p.scope.map(s => `<li>${s}</li>`).join("");
  };

  const OPEN = "inset(0 0 0 0)";        // fully revealed
  const SHUT = "inset(0 100% 0 0)";     // clipped to the left edge (hidden)
  const WIPE = 320;                     // ms — keep in sync with CSS transition

  /* fill the new project, then animate the slab open (left→right) from shut */
  const wipeOpen = (i) => {
    curIdx = i; fill(i);
    panel.setAttribute("aria-hidden", "false");
    panel.style.transition = "none";
    panel.style.clipPath = SHUT;
    void panel.offsetWidth;            // commit the shut state as the start point
    panel.style.transition = "";
    panel.style.clipPath = OPEN;
    isOpen = true;
  };

  let hideT, swapT;
  const show = (i) => {
    clearTimeout(hideT);
    clearTimeout(swapT);
    if (i === curIdx && isOpen) return;      // already showing this one
    if (isOpen) {
      /* swapping to a different project: animate the slab CLOSED, then
         animate it back open with the new content */
      panel.style.transition = "";
      panel.style.clipPath = SHUT;
      isOpen = false;
      swapT = setTimeout(() => wipeOpen(i), WIPE);
    } else {
      wipeOpen(i);
    }
  };
  const hide = () => {
    clearTimeout(swapT);
    panel.style.transition = "";
    panel.style.clipPath = SHUT;   // wipe back closed toward the left
    panel.setAttribute("aria-hidden", "true");
    isOpen = false;
    curIdx = -1;
    thumbs.forEach(x => x.classList.remove("sel"));
  };

  thumbs.forEach(t => {
    const i = +t.dataset.i;
    t.addEventListener("mouseenter", () => {
      thumbs.forEach(x => x.classList.toggle("sel", x === t));
      show(i);
    });
    /* short delay so moving between adjacent thumbs swaps content instead of
       sliding the whole panel out and back in */
    t.addEventListener("mouseleave", () => { hideT = setTimeout(hide, 90); });
    t.addEventListener("click", e => {
      e.preventDefault();
      transitionTo(projIndex(i));
    });
  });
  /* leaving the thumb cluster entirely → slide the panel back out */
  el.addEventListener("mouseleave", () => { hideT = setTimeout(hide, 90); });
  el.addEventListener("mouseenter", () => clearTimeout(hideT));
}

/* make the landing thumbnails the same height as the statement text-box */
function matchThumbHeight() {
  const s = $(".hero-statement"), el = $("#heroThumbs");
  if (!s || !el) return;
  el.style.setProperty("--ih", Math.round(s.offsetHeight) + "px");
}

/* liquid / oil ink trail on the landing — velocity-reactive with splashes and
   swirl. blur+contrast (CSS filter on the element) gives gooey liquid edges;
   mix-blend difference inverts against the scene. */
function initLiquid() {
  const cv = $("#liquid"); if (!cv) return;
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) { cv.style.display = "none"; return; }
  const ctx = cv.getContext("2d");
  const tmp = document.createElement("canvas"); const tctx = tmp.getContext("2d");
  let W = 0, H = 0;
  function size() {
    W = innerWidth; H = innerHeight;
    cv.width = W; cv.height = H; tmp.width = W; tmp.height = H;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  }
  size(); addEventListener("resize", size);

  let mx = W / 2, my = H / 2, px = mx, py = my;
  let active = false, dissolving = false, dissolveStart = 0;
  let lTime = 0, lastMoveT = -999;

  /* instant clear — called when navigating away so blob never shows on light pages */
  window._liquidClear = () => {
    active = false; dissolving = false; drops.length = 0;
    cv.classList.remove("show");
    cv.style.filter = ""; cv.style.opacity = "";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  };

  // called by collapseLoader when loading is done — activates liquid cursor
  window.liquidRiftDone = () => {
    liquidRiftActive = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    px = mx; py = my; drops.length = 0; lastMoveT = lTime;
    active = true; dissolving = false;
    cv.style.filter = ""; cv.style.opacity = "";
    cv.classList.add("show");
  };

  /* graceful dissolve: stops new strokes, diffuses blob away while morphing CSS filter */
  window._liquidDissolve = () => {
    if (!active && !dissolving) return; // already off
    active = false; dissolving = true; dissolveStart = performance.now();
    drops.length = 0;
  };

  addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    lastMoveT = lTime;
  }, { passive: true });

  const drops = [];
  function spawnDrops(x, y, dvx, dvy, spd) {
    const n = 8 + Math.floor(spd * 22);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (4 + Math.random() * 11) * spd;
      drops.push({
        x, y,
        vx: Math.cos(a) * s + dvx * 0.45,
        vy: Math.sin(a) * s + dvy * 0.45,
        r: 14 + Math.random() * spd * 42,
        life: 1,
        decay: 0.004 + Math.random() * 0.007
      });
    }
  }

  function brush(x, y, r, alpha) {
    if (r < 1) return;
    alpha = alpha ?? 1;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,    `rgba(255,255,255,${alpha.toFixed(3)})`);
    g.addColorStop(0.46, `rgba(255,255,255,${(alpha * 0.84).toFixed(3)})`);
    g.addColorStop(1,    "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  liquidDraw = (on) => {
    if (on) {
      dissolving = false;
      cv.style.filter = ""; cv.style.opacity = "";
      active = true; px = mx; py = my; drops.length = 0;
    } else {
      // graceful dissolve if visible; if already off, just ensure canvas is black
      if (active || dissolving) window._liquidDissolve();
      else { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
      active = false; px = mx; py = my;
    }
    lastMoveT = lTime;
  };

  const DISSOLVE_MS = 800;

  (function loop() {
    requestAnimationFrame(loop);
    lTime += 0.015;

    if (!active && !dissolving) {
      cv.style.filter = ""; cv.style.opacity = "";
      return;
    }

    /* ---- DISSOLVING mode: blob contracts into cursor point, then canvas clears ---- */
    if (dissolving) {
      const t = Math.min(1, (performance.now() - dissolveStart) / DISSOLVE_MS);
      const ease = 1 - Math.pow(1 - t, 2); // quad ease-out

      // Diffuse existing blob (faster as t increases so trails melt)
      tctx.clearRect(0, 0, W, H); tctx.drawImage(cv, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.filter = `blur(${(4 + t * 5).toFixed(1)}px)`;
      ctx.globalAlpha = 0.965;
      ctx.drawImage(tmp, 0, 0, W, H);
      ctx.restore();
      ctx.filter = "none"; ctx.globalAlpha = 1;

      // Draw a concentrating white dot at cursor: 55px → 0 as blob converges
      const dotR = 55 * (1 - ease);
      if (dotR > 0.5) brush(mx, my, dotR, 0.85);

      // CSS: goo filter dissolves (contrast 26→1, blur 16→4), opacity fades last 35%
      const contrast = Math.max(1, 26 - 25 * t).toFixed(1);
      const cssBlur  = Math.max(4, 16 - 12 * t).toFixed(1);
      cv.style.filter  = `blur(${cssBlur}px) contrast(${contrast})`;
      cv.style.opacity = t > 0.65 ? (1 - (t - 0.65) / 0.35).toFixed(3) : "1";

      if (t >= 1) {
        dissolving = false;
        cv.classList.remove("show");
        cv.style.filter = ""; cv.style.opacity = "";
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    const dvx = mx - px, dvy = my - py;
    const dist = Math.hypot(dvx, dvy);
    const spd  = Math.min(dist / 12, 1);
    const idleFor = Math.max(0, lTime - lastMoveT);

    // 1) DIFFUSE
    tctx.clearRect(0, 0, W, H); tctx.drawImage(cv, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const idleBlur = idleFor > 0.3 ? Math.min((idleFor - 0.3) * 0.5, 1.6) : 0;
    ctx.filter = `blur(${(3.8 + spd * 4.5 + idleBlur).toFixed(1)}px)`;
    ctx.globalAlpha = 0.955;
    ctx.drawImage(tmp, 0, 0, W, H);
    ctx.restore();
    ctx.filter = "none"; ctx.globalAlpha = 1;

    // 2) MOVING: swirling stroke
    if (dist > 0.5) {
      const r = 26 + spd * 46;
      const steps = Math.max(1, Math.ceil(dist / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const swirl = Math.sin(lTime * 5.2 + t * Math.PI * 2.2) * spd * 28;
        const len   = Math.max(dist, 0.001);
        brush(px + dvx * t + (-dvy / len) * swirl,
              py + dvy * t + ( dvx / len) * swirl, r);
      }
      if (dist > 5 && Math.random() < spd * 1.3) spawnDrops(mx, my, dvx, dvy, spd);
    }

    // 3) IDLE VORTEX — 4 arms orbit the cursor, building into a whirlpool
    if (idleFor > 0.35) {
      const vStr = Math.min((idleFor - 0.35) / 2.5, 1);
      const ARMS = 4;
      for (let v = 0; v < ARMS; v++) {
        const phase = (v / ARMS) * Math.PI * 2;
        // inner fast arm
        const ia = lTime * 2.6 + phase;
        const ir = 20 + Math.sin(lTime * 1.8 + phase) * 7;
        brush(mx + Math.cos(ia) * ir, my + Math.sin(ia) * ir * 0.68,
              (12 + Math.sin(lTime * 3.5 + v) * 4) * vStr,
              (0.52 + Math.sin(lTime * 4 + v * 1.3) * 0.16) * vStr);
        // outer slow arm
        const oa = lTime * 1.1 - phase;
        const or2 = 52 + vStr * 40 + Math.cos(lTime * 2.1 + phase) * 14;
        brush(mx + Math.cos(oa) * or2, my + Math.sin(oa) * or2 * 0.58,
              (20 + Math.cos(lTime * 2.8 + v) * 7) * vStr,
              (0.35 + Math.cos(lTime * 3.2 + v * 1.7) * 0.12) * vStr);
        // mid filament bridging inner/outer for a spiral feel
        const ma = lTime * 1.9 + phase + 0.4;
        const mr = ir + (or2 - ir) * 0.5;
        brush(mx + Math.cos(ma) * mr, my + Math.sin(ma) * mr * 0.62,
              (9 + Math.sin(lTime * 4.4 + v) * 3) * vStr, 0.28 * vStr);
      }
      brush(mx, my, 15 * vStr, 0.25 * vStr);
    }

    // 4) SPLASH drops decay
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      brush(d.x, d.y, d.r * d.life, d.life * 0.88);
      d.x += d.vx; d.y += d.vy;
      d.vx *= 0.962; d.vy *= 0.962;
      d.r  *= 0.982;
      d.life -= d.decay;
      if (d.life <= 0) drops.splice(i, 1);
    }

    // 5) ORBITAL RIPPLE — subtler when vortex is active
    const orbScale = idleFor > 0.35 ? 0.28 : 0.62;
    brush(mx + Math.cos(lTime * 3.6) * (14 + spd * 26),
          my + Math.sin(lTime * 5.3) * (9  + spd * 18),
          22 + spd * 16, 0.44 * orbScale);

    px = mx; py = my;
  })();
}

/* split headings into masked words */
function splitHeadings() {
  document.querySelectorAll("[data-split]").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const outer = document.createElement("span"); outer.className = "word";
      const inner = document.createElement("span"); inner.className = "word-i";
      inner.textContent = w; inner.style.transitionDelay = (i * 0.07) + "s";
      outer.appendChild(inner); el.appendChild(outer); el.append(" ");
    });
  });
}

/* ============================================================
   SINGLE-PAGE SCROLL
   All sections live in one vertical scroll (#content).
   Nav clicks play the opening transition animation, then scroll.
   Natural scroll updates nav state via IntersectionObserver.
   ============================================================ */
const pages =[...document.querySelectorAll(".page")];
const contentEl = $("#content");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const cursorEl = $("#cursor");
const projectPages = [...document.querySelectorAll(".work-page")];
const projIndex = (i) => pages.indexOf(projectPages[i]);
let idx = 0, previewing = false;

/* ============================================================
   SMOOTH SCROLL (Lenis) — wrapper mode on #content
   - speed-capped so you can't blow past a transition
   - low lerp = springy glide that eases to rest, never a hard stop
   Native `scroll` events still fire (Lenis sets wrapper.scrollTop),
   so every scroll-driven handler/observer below keeps working.
   ============================================================ */
const pagesEl = document.getElementById("pages");
const _reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = new Lenis({
  wrapper: contentEl,
  content: pagesEl,
  lerp: _reduceMotion ? 1 : 0.09,         // springy settle (lower = longer glide; higher = snappier start)
  wheelMultiplier: _reduceMotion ? 1 : 0.38, // cap scroll speed (whole site)
  touchMultiplier: _reduceMotion ? 1 : 0.7,  // slow touch/trackpad drags too
  smoothWheel: !_reduceMotion,
  syncTouch: !_reduceMotion,              // route trackpad momentum through Lenis
  syncTouchLerp: 0.06,
});
window.__lenis = lenis;
(function rafLenis(t) { lenis.raf(t); requestAnimationFrame(rafLenis); })();

/* hard jump that also resets Lenis' internal target (used for instant
   slab-covered jumps and the synchronous archive clamps) */
const scrollJump = (y) => lenis.scrollTo(y, { immediate: true, force: true });

function revealPage(p) {
  p.querySelectorAll(".reveal, [data-split]").forEach(el => el.classList.add("in"));
}
function setPage(i) {
  i = Math.max(0, Math.min(pages.length - 1, i));
  idx = i;
  scrollJump(pages[i].offsetTop);
  updatePageState(i);
}
function updatePageState(i) {
  document.body.classList.toggle("inverted-page", i === 1);
  /* cursor: only update when NOT mid-slab-animation (onScrollDriven owns it then) */
  if (!window._slabActive) {
    if (cursorEl) {
      cursorEl.classList.toggle("home", i === 0);
      cursorEl.classList.toggle("solid", i > 0);
    }
  }
  if (!liquidRiftActive) {
    if (i === 0) { $("#liquid").classList.add("show"); liquidDraw(true); }
    else if (!window._slabActive) { liquidDraw(false); }
  }
  revealPage(pages[i]);
  const id = pages[i].id;
  const isWork = pages[i].classList.contains("work-page");
  navLinks.forEach(l => { const h = l.getAttribute("href"); l.classList.toggle("active", h === "#" + id || (isWork && h === "#works")); });
  $("#marquee").classList.toggle("show", id === "contact");
}

/* reveal sections as they scroll into view */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) revealPage(e.target); });
}, { root: contentEl, threshold: 0.08 });
pages.forEach(p => revealObs.observe(p));

/* contact section fade-in */
const contactEl = document.getElementById("contact");
if (contactEl) {
  const contactObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => contactEl.classList.add("contact-visible"), 80);
        contactObs.disconnect();
      }
    });
  }, { root: contentEl, threshold: 0.15 });
  contactObs.observe(contactEl);
}

/* track active section while scrolling naturally */
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const i = pages.indexOf(e.target);
    if (i < 0 || i === idx) return;
    idx = i;
    updatePageState(i);
  });
}, { root: contentEl, threshold: 0.5 });
pages.forEach(p => sectionObs.observe(p));

/* ---- transition overlay (column wipe — nav clicks + scroll boundaries) ---- */
const tr = $("#transition"), trTitle = document.getElementById("trTitle");
const sleep = ms => new Promise(r => setTimeout(r, ms));
let transitioning = false;

function glitchNav(i) {
  const id = pages[i].id, isWork = pages[i].classList.contains("work-page");
  navLinks.forEach(l => {
    const h = l.getAttribute("href"), tgt = h === "#" + id || (isWork && h === "#works");
    l.classList.remove("glitch");
    if (tgt) { void l.offsetWidth; l.classList.add("glitch"); setTimeout(() => l.classList.remove("glitch"), 900); }
  });
}

async function transitionTo(i) {
  i = Math.max(0, Math.min(pages.length - 1, i));
  if (transitioning || i === idx) return;

  // Only hero (0) and INFO (1) use the slab animation; everything else just scrolls
  if (i > 1) {
    previewing = false;
    idx = i;
    lenis.scrollTo(pages[i].offsetTop, { duration: 1.1 });
    updatePageState(i);
    return;
  }

  transitioning = true; previewing = false;
  glitchNav(i);

  // clear liquid immediately at start (slab will cover the screen)
  if (i !== 0) window._liquidClear?.();

  // set up: dark slab going to hero, light otherwise
  const isDark = i === 0;
  tr.className = "transition" + (isDark ? " dark" : "");
  trTitle.textContent = (pages[i].dataset.title || "").toUpperCase();
  trTitle.style.cssText = "";           // clear scroll-driven inline styles
  trTitle.classList.toggle("dark", isDark);
  void tr.offsetWidth;

  // slab expands from center — reverse of the loader snap
  tr.classList.add("slab-open");
  await sleep(920);

  // title fades in while fully covered
  trTitle.classList.add("show");
  await sleep(600);

  // jump content underneath, hold slab covering it
  tr.classList.remove("slab-open");
  tr.classList.add("slab-hold");
  setPage(i);
  await sleep(80);

  // slab fades out smoothly
  tr.classList.remove("slab-hold");
  trTitle.classList.remove("show");
  tr.classList.add("slab-fade");
  await sleep(680);

  tr.className = "transition";
  transitioning = false;
  if (i === 0 && !liquidRiftActive) {
    /* nav-click back to hero: desolidify circle into blob */
    window._cursorStartDesolidify?.();
    $("#liquid").classList.add("show"); liquidDraw(true);
  } else if (cursorEl) {
    cursorEl.classList.toggle("home", i === 0);
    cursorEl.classList.toggle("solid", i > 0);
  }
}


/* ---- scroll-driven clip-path reveal + parallax ---- */
const scrollLineEl = document.getElementById("scrollLine");
const c01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

function onScrollDriven() {
  if (transitioning) return;
  const sy = contentEl.scrollTop;
  const vh = window.innerHeight;

  /* scroll-driven slab — phase 1 (t:0→1) expands from center,
     phase 2 (t:1→1.5) shrinks from bottom while title rises */
  const PHASE2_END = 1.5;
  let slabT = 0, slabPage = null;

  /* Only INFO page (index 1) gets the scroll-driven slab transition.
     All pages beyond it are always visible — regular vertical scroll. */
  pages.forEach((page, i) => {
    if (i === 0) return;

    if (i > 1) {
      // Clear any lingering clip-path — these pages are always fully visible
      if (page.style.clipPath !== "") page.style.clipPath = "";
      revealPage(page);
      return;
    }

    // pages[1] = INFO/about — full slab logic
    const top = page.offsetTop;
    /* phase-1 spans 0.7vh of scroll so this slab plays at the SAME rate as the
       WORK slab (svcWipe = …/(vh*0.7)). Start is shifted back so phase-2 still
       ends at the photo scene's animStart (top + 0.5vh) — no gap, no downstream
       shift. Total span = 1.5 * 0.7 = 1.05vh, ending at top + 0.5vh. */
    const t   = (sy - (top - vh * 0.55)) / (vh * 0.7);

    const title = page.querySelector(".pg-title-hero");
    if (title && title.style.cssText !== "") title.style.cssText = "";

    if (t >= PHASE2_END) {
      if (page.style.clipPath !== "") {
        page.style.clipPath = "";
        revealPage(page);
      }
    } else if (t >= 1) {
      if (page.style.clipPath !== "") page.style.clipPath = "";
      revealPage(page);
      if (t > slabT) { slabT = t; slabPage = page; }
    } else {
      page.style.clipPath = "inset(0 0 100% 0)";
      if (t > 0) revealPage(page);
      if (t > 0 && t > slabT) { slabT = t; slabPage = page; }
    }
  });


  if (slabPage) {
    trTitle.textContent = (slabPage.dataset.title || "").toUpperCase();
    trTitle.classList.remove("show", "dark");
    tr.className = "transition slab-scroll";
    /* INFO slab gets a slightly larger title */
    trTitle.style.fontSize = slabPage.id === "about" ? "clamp(195px,31vw,430px)" : "";

    if (slabT <= 1) {
      /* phase 1: slab expands from center, title scales in */
      const inset = (50 * (1 - slabT)).toFixed(2);
      tr.style.clipPath = `inset(${inset}% 0)`;
      trTitle.style.top = "50%";
      const titleOpacity = Math.max(0, Math.min(1, (slabT - 0.35) / 0.3));
      /* scale from 0.88 → 1 as it fades in */
      const titleScale = (0.88 + 0.12 * Math.min(1, (slabT - 0.35) / 0.45)).toFixed(3);
      trTitle.style.transform = `translate(-50%, calc(-50% + 0.12em)) scale(${titleScale})`;
      trTitle.style.opacity = titleOpacity.toFixed(3);
    } else {
      /* phase 2: slab shrinks from bottom, title stays fixed at center, fades as content rises */
      const t2 = (slabT - 1) / (PHASE2_END - 1); // 0→1
      const bottomInset = (t2 * 100).toFixed(2);
      tr.style.clipPath = `inset(0 0 ${bottomInset}% 0)`;
      trTitle.style.top = "50%";
      trTitle.style.transform = "translate(-50%, calc(-50% + 0.12em)) scale(1)";
      /* fade to exactly the same floor as the info watermark */
      const titleFade = Math.max(0.10, 1 - t2 / 0.7);
      trTitle.style.opacity = titleFade.toFixed(3);
    }
  } else {
    if (tr.classList.contains("slab-scroll")) {
      tr.className = "transition";
      tr.style.clipPath = "";
    }
    /* Don't clear trTitle when initInfoScroll owns it — avoids a one-frame
       opacity flash at the exact boundary where the two systems hand off. */
    const _aboutEl = pages[1];
    const _infoStart = _aboutEl ? _aboutEl.offsetTop + window.innerHeight * 0.5 : Infinity;
    if (contentEl.scrollTop < _infoStart) trTitle.style.cssText = "";
  }

  scrollLineEl.style.opacity = "0";

  /* expose slab state so updatePageState can defer liquid management */
  window._slabActive = slabPage !== null;

  /* cursor: only two states — liquid blob on hero, solid circle elsewhere */
  if (cursorEl) {
    const onHero = sy < vh * 0.15;
    const nowSlabActive = slabPage !== null;
    window._prevSlabActive = nowSlabActive;
    const wantSolid = !onHero;
    const wasSolid = cursorEl.classList.contains("solid");
    const isDesolidifying = !!window._cursorDesolidifying;

    if (wantSolid && isDesolidifying) {
      /* scrolled back to non-hero while desolidifying — cancel and restore solid */
      window._cursorCancelDesolidify?.();
      cursorEl.classList.remove("home"); cursorEl.classList.add("solid");
      window._liquidClear?.();
    } else if (!wantSolid && wasSolid && !isDesolidifying && !liquidRiftActive) {
      /* leaving non-hero → hero: desolidify circle back into blob */
      window._cursorStartDesolidify?.();
      $("#liquid").classList.add("show");
      liquidDraw(true);
      /* the CSS keyframe + animationend complete the transition */
    } else if (!isDesolidifying) {
      cursorEl.classList.toggle("home", !wantSolid);
      cursorEl.classList.toggle("solid", wantSolid);
      /* first entry to non-hero: clear liquid + begin solidify immediately */
      if (wantSolid && !wasSolid) {
        window._liquidClear?.();
        window._cursorStartSolidify?.();
      }
    }
  }
}

contentEl.addEventListener("scroll", onScrollDriven, { passive: true });
onScrollDriven(); /* run once on init */

/* Hero element opacity — runs every paint frame so fast/momentum scroll
   never lets thumbnails bleed through the slab gap between scroll events.
   Transition is disabled so JS-set values apply instantly each frame. */
(function heroOpacityLoop() {
  const heroStatEl  = document.querySelector(".hero-statement");
  const heroThumbEl = document.getElementById("heroThumbs");
  if (heroStatEl)  heroStatEl.style.transition  = "none";
  if (heroThumbEl) heroThumbEl.style.transition = "none";
  (function loop() {
    requestAnimationFrame(loop);
    const sy = contentEl.scrollTop;
    const vh = window.innerHeight;
    const st = pages[1] ? (sy - (pages[1].offsetTop - vh)) / vh : -1;
    const op = st >= 0.8 ? Math.max(0, 1 - (st - 0.8) * 10) : 1;
    if (heroStatEl)  heroStatEl.style.opacity  = op.toFixed(3);
    if (heroThumbEl) heroThumbEl.style.opacity = op.toFixed(3);
  })();
})();

document.querySelectorAll("[data-link]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  previewing = false;
  const id = a.getAttribute("href").slice(1);
  const i = pages.findIndex(p => p.id === id);
  if (i >= 0) transitionTo(i);
}));

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  const cursor = $("#cursor");
  if (!cursor || !matchMedia("(hover:hover) and (pointer:fine)").matches) { cursor && (cursor.style.display = "none"); return; }
  const ring = cursor.querySelector(".cur-ring");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;

  addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    if (!shown) { shown = true; cursor.classList.add("on"); }
  }, { passive: true });
  addEventListener("mouseout", e => { if (!e.relatedTarget) cursor.classList.remove("on"); });

  const clearAnim = () => ring.classList.remove("solidify", "desolidify");

  /* blob → circle: keep .solid (white ring) and let the CSS keyframe play */
  window._cursorStartSolidify = () => {
    clearAnim(); void ring.offsetWidth;          // force animation restart
    cursor.style.opacity = "1";
    cursor.classList.remove("home"); cursor.classList.add("solid");
    ring.classList.add("solidify");
  };
  /* circle → blob: ring stays white & visible, CSS keyframe expands+fades it out */
  window._cursorStartDesolidify = () => {
    clearAnim(); void ring.offsetWidth;
    cursor.style.opacity = "1";
    cursor.classList.add("solid");
    window._cursorDesolidifying = true;
    ring.classList.add("desolidify");
  };
  window._cursorCancelDesolidify = () => {
    clearAnim(); window._cursorDesolidifying = false;
    cursor.style.opacity = ""; cursor.classList.add("solid"); cursor.classList.remove("home");
  };

  ring.addEventListener("animationend", e => {
    if (e.animationName === "cur-desolidify") {
      window._cursorDesolidifying = false;
      clearAnim();
      cursor.classList.remove("solid"); cursor.classList.add("home");
      cursor.style.opacity = "";
    } else if (e.animationName === "cur-solidify") {
      clearAnim();
      cursor.style.opacity = "";
    }
  });

  /* JS only positions the ring — cursor element stays fixed so the
     mix-blend-mode layer never moves and never forces a recomposite */
  (function loop() {
    requestAnimationFrame(loop);
    if (cursor.classList.contains("solid")) { rx = mx; ry = my; }
    else { rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1; }
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  })();
}

/* ============================================================
   BOOT
   ============================================================ */
buildHeroThumbs();
buildArchive();
splitHeadings();
startClock();
initCursor();
initLiquid();
matchThumbHeight();
addEventListener("resize", matchThumbHeight);
if (window.ResizeObserver) { const ro = new ResizeObserver(matchThumbHeight); const s = $(".hero-statement"); if (s) ro.observe(s); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(matchThumbHeight);
/* clear any stale hero parallax transforms */
const _hs = document.querySelector(".hero-statement");
const _ht = document.getElementById("heroThumbs");
if (_hs) _hs.style.transform = "";
if (_ht) _ht.style.transform = "";

setPage(0);     // landing revealed; deck at start

/* ============================================================
   INFO SCROLL SCENE — scroll-driven photos + flip
   ============================================================ */
function initInfoScroll() {
  const infoBg   = document.getElementById("info-bg");
  const infoWrap = document.getElementById("info-photos");
  const photoL   = document.getElementById("info-photo-l");
  const photoCWrap = document.getElementById("info-photo-c-wrap");
  const photoR   = document.getElementById("info-photo-r");
  const flipper  = document.getElementById("info-flipper");
  const textL    = document.getElementById("info-text-l");
  const textR    = document.getElementById("info-text-r");
  const infoSvc  = document.getElementById("info-services");
  const svcItems = infoSvc ? [...infoSvc.querySelectorAll(".is-item")] : [];
  const projPrev = document.getElementById("info-proj-preview");
  if (!infoBg || !photoL || !photoCWrap || !photoR || !flipper) return;

  /* build 4 project cards */
  const N_PROJ = Math.min(4, PROJECTS.length);
  const projCards = [];
  if (projPrev) {
    const container = projPrev.parentNode;
    let lastCard = projPrev;
    for (let i = 0; i < N_PROJ; i++) {
      const card = i === 0 ? projPrev : projPrev.cloneNode(true);
      card.id = `info-proj-preview-${i}`;
      card.classList.add("ipp-card");
      if (i > 0) {
        lastCard.after(card);
        lastCard = card;
      }
      const p = PROJECTS[i];
      card.querySelector(".ipp-num").textContent = `[0${i+1}]`;
      card.querySelector(".ipp-title").textContent = p.title;
      card.querySelector(".ipp-tag").textContent = p.tag;
      card.querySelector(".ipp-scope").innerHTML = p.scope.map(s => `<li>${s}</li>`).join("");
      const cta = card.querySelector(".ipp-cta");
      cta.href = `#${p.id}`;
      const pi = i;
      cta.addEventListener("click", e => { e.preventDefault(); transitionTo(pages.indexOf(projectPages[pi])); });
      const img = card.querySelector("img");
      img.src = p.images[0];
      img.id = `ipp-img-${i}`;
      card.style.opacity = "0";
      projCards.push(card);
    }
  }

  const svcWm = infoSvc ? infoSvc.querySelector(".is-watermark") : null;

  const cl = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const eo = t => 1 - Math.pow(1 - cl(t, 0, 1), 3);
  /* smoothstep: scroll-position driven, smooth start AND smooth end — no time-based ease */
  const ss = t => { const c = cl(t, 0, 1); return c * c * (3 - 2 * c); };
  /* WORK title colour: light #cdc5fa (alone) → dark #2b2c36 (text flows up) */
  const WM_FROM = [205, 197, 250], WM_TO = [43, 44, 54];
  const lerpWmColor = t =>
    `rgb(${WM_FROM.map((c, i) => Math.round(c + (WM_TO[i] - c) * cl(t, 0, 1))).join(",")})`;

  let archiveEntryFired = false; // one-shot flag, reset by _resetArchiveEntry on exit
  let _scrollLocked = false, _lockedAt = 0, _safeLockPos = 0;
  /* scroll position at which the archive entry fires, plus the card it flies
     from — kept up to date by the rAF loop so the scroll handler can gate the
     threshold *synchronously*, before the browser paints a scrolled-past frame
     that would expose the section beneath the archive overlay. null until the
     last project card is fully on screen. */
  let _archiveTriggerTop = null, _lastProjCard = null;

  /* Fire the archive entry: lock scroll at the safe position and show the
     overlay. Called from the scroll handler (pre-paint, the common path) and
     from the rAF loop (backstop). Idempotent via archiveEntryFired. */
  const _fireArchiveEntry = () => {
    if (archiveEntryFired || _archiveTriggerTop == null) return;
    archiveEntryFired = true;
    _safeLockPos = _archiveTriggerTop - 4;
    _lockedAt = _safeLockPos;
    /* lock first (kills Lenis momentum), then snap natively — once stopped +
       overflow:hidden, a native scrollTop set holds without Lenis fighting it,
       which is what caused the entry jitter. */
    _scrollLocked = true;
    lenis.stop();
    contentEl.style.overflowY = 'hidden';
    contentEl.scrollTop = _safeLockPos;
    const cardImg = _lastProjCard?.querySelector('img');
    if (cardImg) window._startArchiveEntry?.(cardImg);
  };

  /* expose scroll lock/unlock + entry reset so _exitArchive can call them */
  window._unlockArchiveScroll = () => {
    if (!_scrollLocked) return;
    _scrollLocked = false;
    /* set scroll synchronously before re-enabling overflow so there's
       no single frame where momentum scroll can jump away */
    contentEl.style.overflowY = '';
    scrollJump(_safeLockPos);   // resync Lenis' internal state to the held pos
    lenis.start();
  };
  let _archiveCooldownUntil = 0;
  window._resetArchiveEntry = () => {
    /* Re-entry is gated by the _archiveCooldownUntil timestamp, which both
       re-entry guards already check. Clear archiveEntryFired *immediately*
       (not on a timer): the snap-back guard below requires !archiveEntryFired
       to hold the user at the card during the cooldown. If the flag stayed
       true for the cooldown window, a fast re-scroll would slip past the last
       card into the white #contact section before the entry could fire. */
    _archiveCooldownUntil = performance.now() + 900;
    archiveEntryFired = false;
  };

  /* The archive threshold is gated here, in the scroll handler, so it resolves
     *before paint*: the moment scroll tries to cross into the archive we either
     fire the entry (overlay covers instantly) or — during the post-exit
     cooldown — clamp back. Either way the browser never paints a frame where
     the last card has scrolled up and the section beneath the overlay (#contact)
     is exposed. Up-scroll (below the threshold) passes through untouched. */
  contentEl.addEventListener('scroll', () => {
    if (_scrollLocked) { contentEl.scrollTop = _lockedAt; return; }
    if (archiveEntryFired || _archiveTriggerTop == null) return;
    if (contentEl.scrollTop <= _archiveTriggerTop) return;
    if (performance.now() <= _archiveCooldownUntil) {
      scrollJump(_archiveTriggerTop - 4); // cooldown: hold at the card
    } else {
      _fireArchiveEntry();                          // commit: overlay covers pre-paint
    }
  }, { passive: false });

  /* Extra inertia for the scroll-driven INFO scene: the visual loop follows a
     smoothed scroll value rather than raw scrollTop, so the floating photos,
     the flip and the project cards glide fluidly instead of snapping 1:1 to
     the scroll position. (Archive entry is still gated on raw scrollTop in the
     scroll handler above, so this lag never affects the lock timing.) */
  let _animSy  = contentEl.scrollTop;

  (function loop() {
    requestAnimationFrame(loop);

    const aboutEl = pages[1];
    if (!aboutEl) return;

    const syReal = contentEl.scrollTop;
    /* _animSy: slow lerp used for services/cards stagger */
    _animSy += (syReal - _animSy) * 0.16;
    if (Math.abs(syReal - _animSy) < 0.4) _animSy = syReal;
    const sy = _animSy;


    const vh  = window.innerHeight;
    const top = aboutEl.offsetTop;
    const h   = aboutEl.offsetHeight;

    const animStart  = top + vh * 0.5;
    const photoRange = vh * 1.8;
    const photoDwell = vh * 0.6;   // "hey!" text stays visible; services slab reveals over it
    const photoEnd   = animStart + photoRange;
    const svcStart   = photoEnd + photoDwell;
    const SVC_SCROLL = vh * 2.0;
    const svcEnd     = svcStart + SVC_SCROLL;
    const svcRange   = SVC_SCROLL;
    const PROJ_SCROLL = vh * 1.2;
    const projZoneStart = svcEnd;

    /* infoT: driven directly by syReal (Lenis smooth output) — photos track
       exactly the current scroll position with no secondary lag or targetScroll
       lookahead; Lenis lerp 0.09 provides natural deceleration */
    const infoT = cl((syReal - animStart) / photoRange, 0, 1);

    /* white bg fades IN only — the services slab reveals over the hey! content,
       no fade-out needed (services z-index covers infoBg naturally) */
    const bgOp = cl((syReal - animStart) / (vh * 0.15), 0, 1);
    infoBg.style.opacity = bgOp.toFixed(3);
    if (infoWrap) infoWrap.style.opacity = bgOp.toFixed(3);

    /* side photos — enter then slow parallax then exit
       plain cl() keeps movement exactly proportional to scroll position;
       Lenis (lerp 0.09) already provides temporal smoothness */
    const entY   = (1 - cl(infoT / 0.22, 0, 1)) * vh;
    const parY   = -cl((infoT - 0.22) / 0.36, 0, 1) * vh * 0.2;
    const exY    = -cl((infoT - 0.58) / 0.20, 0, 1) * vh * 1.1;
    const sideYL = entY + parY + exY;
    const sideYR = sideYL;

    const centerY = (1 - cl(infoT / 0.22, 0, 1)) * vh;

    const flipDeg = cl((infoT - 0.75) / 0.18, 0, 1) * 180;
    const textY = (1 - cl((infoT - 0.75) / 0.20, 0, 1)) * vh;

    photoL.style.transform = `translateY(${sideYL.toFixed(1)}px)`;
    photoR.style.transform = `translateY(${sideYR.toFixed(1)}px)`;
    photoCWrap.style.transform = `translateY(${centerY.toFixed(1)}px)`;
    flipper.style.transform = `rotateY(${flipDeg.toFixed(1)}deg)`;
    if (textL) textL.style.transform = `translateY(${textY.toFixed(1)}px)`;
    if (textR) textR.style.transform = `translateY(${textY.toFixed(1)}px)`;

    /* services panel — items stagger in, then whole panel slides up */
    const svcExitT = cl((sy - svcEnd) / (vh * 0.5), 0, 1);
    const svcExitY = -(eo(svcExitT) * vh);
    if (infoSvc) {
      /* WORK panel reveals with the SAME slab animation as the INFO title:
         a solid slab wipes open from the centre line (clip-path inset 50%→0)
         over ~0.7vh while the giant WORK title scales 0.88→1 and fades in. */
      const svcWipe = cl((sy - svcStart) / (vh * 0.7), 0, 1);
      infoSvc.style.opacity   = svcWipe > 0 ? "1" : "0";
      infoSvc.style.clipPath  = svcWipe < 1 ? `inset(${(50 * (1 - svcWipe)).toFixed(2)}% 0)` : "none";
      infoSvc.style.transform = `translateY(${svcExitY.toFixed(1)}px)`;
      const svcT = cl((sy - svcStart) / svcRange, 0, 1);
      /* hold the WORK title alone, then let the list flow up */
      const ITEM_LEAD = 0.42;
      /* WORK title: appears only after the dark background has faded in, then
         fades + grows from a slightly smaller size to full (same scale-in feel
         as the INFO slab title), and finally tints from #cdc5fa to #2b2c36 as
         the list text flows up */
      if (svcWm) {
        /* identical curve to the INFO trTitle: fade in over wipe 0.35→0.65,
           scale 0.88→1 over wipe 0.35→0.80 */
        const titleOpacity = cl((svcWipe - 0.35) / 0.3, 0, 1);
        const titleScale   = 0.88 + 0.12 * cl((svcWipe - 0.35) / 0.45, 0, 1);
        svcWm.style.opacity   = titleOpacity.toFixed(3);
        svcWm.style.transform = `translate(-50%, calc(-50% + 0.12em)) scale(${titleScale.toFixed(3)})`;
        const colorT = cl((svcT - ITEM_LEAD) / 0.22, 0, 1);
        svcWm.style.color = lerpWmColor(eo(colorT));
      }
      svcItems.forEach((item, i) => {
        const t  = cl((svcT - ITEM_LEAD - i * 0.10) / 0.40, 0, 1);
        item.style.transform = `translateY(${((1 - eo(t)) * 70).toFixed(1)}px)`;
        item.style.opacity   = eo(t).toFixed(3);
      });
    }

    /* project cards — overlap transitions so there's never a gap */
    const PROJ_STEP = PROJ_SCROLL - vh * 0.4; // each card's enter = previous card's exit start
    const archiveTop = (document.getElementById("posters")?.offsetTop ?? (top + h));
    projCards.forEach((card, i) => {
      const cardStart = projZoneStart + i * PROJ_STEP;
      const cardEnd   = cardStart + PROJ_SCROLL;
      const enterT    = cl((sy - cardStart) / (vh * 0.4), 0, 1);
      const exitT     = cl((sy - (cardEnd - vh * 0.4)) / (vh * 0.4), 0, 1);
      const enterY    = (1 - eo(enterT)) * vh;
      const exitY     = -(eo(exitT) * vh);
      const isLast    = i === N_PROJ - 1;
      /* last card: slide up + fade out as archive section enters */
      /* trigger relative to when THIS card is fully entered, not archiveTop —
         fires 0.2vh of scroll after the card settles, independent of section height */
      const lastCardFullyAt = cardStart + vh * 0.4;
      const archiveExitT = isLast ? cl((sy - (lastCardFullyAt + vh * 0.2)) / (vh * 0.3), 0, 1) : 0;
      const archiveExitY = -(eo(archiveExitT) * vh * 0.6);
      const translateY = isLast
        ? (enterT < 1 ? enterY : archiveExitT > 0 ? archiveExitY : 0)
        : (exitT > 0 ? exitY : enterY);
      const opacity = isLast
        ? (enterT > 0 ? Math.max(0, 1 - archiveExitT * 2) : 0)
        : (enterT > 0 ? 1 : 0);
      card.style.transform = `translateY(${translateY.toFixed(1)}px)`;
      card.style.opacity   = opacity.toFixed(3);

      /* publish the entry threshold + source card for the scroll handler */
      if (isLast) {
        _archiveTriggerTop = lastCardFullyAt + vh * 0.2;
        _lastProjCard = card;
      }

      /* track the card's resting rect so the exit clone flies to the exact right spot */
      if (isLast && enterT >= 1 && archiveExitT === 0 && !archiveEntryFired) {
        const restImg = card.querySelector('img');
        if (restImg) window._archiveCardRect = restImg.getBoundingClientRect();
      }

      /* Backstop only — the scroll handler normally gates this pre-paint.
         This catches the rare case where archiveExitT crosses without a scroll
         event firing (e.g. a programmatic scrollTop change or layout shift). */
      if (isLast && !archiveEntryFired && archiveExitT > 0) {
        if (performance.now() <= _archiveCooldownUntil) {
          scrollJump(_archiveTriggerTop - 4); // cooldown: hold at the card
        } else {
          _fireArchiveEntry();
        }
      }
    });

    /* keep INFO watermark title at constant opacity while in info zone */
    if (sy >= animStart) {
      trTitle.textContent = "INFO";
      trTitle.classList.remove("show", "dark");
      trTitle.style.fontSize = "clamp(195px,31vw,430px)";
      trTitle.style.top = "50%";
      trTitle.style.transform = "translate(-50%, calc(-50% + 0.12em)) scale(1)";
      const fadeOut = cl((photoEnd + vh * 0.4 - syReal) / (vh * 0.3), 0, 1);
      /* fade to 0 while flip is happening */
      const flipFade = 1 - cl((infoT - 0.75) / 0.18, 0, 1);
      trTitle.style.opacity = (0.10 * fadeOut * flipFade).toFixed(3);
    }
  })();
}
initInfoScroll();

/* Match WORK watermark width to INFO title rendered width (its previous size).
   Position/anchor still mirrors .tr-title exactly (see .is-watermark CSS). */
(function matchWorkWatermarkToInfo() {
  const wm = document.querySelector(".is-watermark");
  if (!wm) return;

  function resize() {
    /* Measure INFO at its scroll-scene font-size */
    const infoSize = Math.min(430, Math.max(195, window.innerWidth * 0.31));
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");

    /* Sample INFO width */
    ctx.font = `400 ${infoSize}px Dirtyline`;
    const infoW = ctx.measureText("INFO").width;

    /* Find font-size where WORK renders at the same width */
    ctx.font = `400 ${infoSize}px Dirtyline`;
    const workW = ctx.measureText("WORK").width;

    const ratio = infoW / workW;
    /* 1.03 renders WORK slightly larger than the INFO title */
    wm.style.fontSize = (infoSize * ratio * 1.03).toFixed(1) + "px";
  }

  resize();
  window.addEventListener("resize", resize);
})();

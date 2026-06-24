// ============================================================
//  DAN ATIR — PORTFOLIO 2025
//  WebGL layer = the FLOATING 3D logo only (untouched centerpiece).
//  All content / transitions live in the DOM (see ui.js), alche-style.
//  full-res GLB logo · reactive starfield · selective bloom · grain · sound
// ============================================================
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Audio } from "./audio.js";
import { LiveDemo } from "./demo.js";

/* ---------------- globals ---------------- */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setClearColor(0x050507, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050507, 0.0065);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 600);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* post-processing — SELECTIVE bloom: only stars + chrome logo glow */
const BLOOM_LAYER = 1;
const renderPass = new RenderPass(scene, camera);

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.55, 0.0);
bloomComposer.addPass(bloom);

const mixPass = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: { baseTexture: { value: null }, bloomTexture: { value: bloomComposer.renderTarget2.texture } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv;
    void main(){ gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv); }`
}), "baseTexture");
mixPass.needsSwap = true;

const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(mixPass);
composer.addPass(new OutputPass());

function renderWithBloom() {
  camera.layers.set(BLOOM_LAYER);
  renderer.setClearColor(0x000000, 1);
  bloomComposer.render();
  camera.layers.set(0); camera.layers.enable(BLOOM_LAYER);
  renderer.setClearColor(0x050507, 1);
  composer.render();
}

/* lights — give the chrome logo punch */
scene.add(new THREE.AmbientLight(0x445066, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
const rim = new THREE.DirectionalLight(0x86a8ff, 1.6); rim.position.set(-6, 2, -4); scene.add(rim);
const fill = new THREE.PointLight(0xff8a4d, 1.1, 80); fill.position.set(0, -4, 10); scene.add(fill);

const audio = new Audio();
const demo = new LiveDemo(audio);
window.__openDemo = () => demo.open();          // launched from the DOM works list

/* ---------------- starfield / dust — round, glowing, reactive ---------------- */
function buildStars() {
  const N = 4200, g = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), siz = new Float32Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 240;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 150;
    pos[i * 3 + 2] = 30 - Math.random() * 320;
    siz[i] = Math.random() * 2.2 + 0.35;
    seed[i] = Math.random() * 6.28;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("asize", new THREE.BufferAttribute(siz, 1));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));

  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uReact: { value: 0 }, uHero: { value: 1 },
      uPx: { value: Math.min(devicePixelRatio, 2) }, uMouse: { value: new THREE.Vector2() }
    },
    vertexShader: /* glsl */`
      attribute float asize; attribute float seed;
      uniform float uTime, uReact, uPx, uHero; uniform vec2 uMouse;
      varying float vTw;
      void main(){
        vec3 p = position;
        // depth-layered parallax: nearer dust reacts more to the mouse
        float depth = clamp(1.0 - (-p.z) / 320.0, 0.05, 1.0);
        float mreact = depth * (0.5 + asize*0.6);
        p.x += sin(uTime*0.22 + seed)*1.3 + uMouse.x*22.0*mreact;
        p.y += cos(uTime*0.18 + seed)*1.1 + uMouse.y*16.0*mreact;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        float twinkle = 0.6 + 0.4*sin(uTime*2.0 + seed*3.0);
        vTw = twinkle;
        float react = 1.0 + uReact*1.6;
        float sz = asize * (1.0 + uHero*0.4) * uPx * twinkle * react * (90.0 / -mv.z);
        gl_PointSize = clamp(sz, 0.0, 26.0*uPx);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      precision highp float; varying float vTw;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float core = smoothstep(0.5, 0.0, d);
        float glow = pow(core, 2.5);
        float a = glow * (0.55 + 0.45*vTw);
        if(a < 0.01) discard;
        vec3 col = mix(vec3(0.78,0.84,1.0), vec3(1.0), glow);
        gl_FragColor = vec4(col, a);
      }`
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.layers.enable(BLOOM_LAYER);
  scene.add(pts);
  pts.mat = m;
  return pts;
}
const stars = buildStars();

/* ---------------- GLB logo (THE floating asset — unchanged behaviour) ---------------- */
const manager = new THREE.LoadingManager();
let loadFrac = 0.02;     // smoothed loader progress (0..1)
let hero = null;
const gltfLoader = new GLTFLoader(manager);
gltfLoader.load("assets/models/dann_logo.glb", (gltf) => {
  hero = gltf.scene;
  const box = new THREE.Box3().setFromObject(hero);
  const size = box.getSize(new THREE.Vector3());
  const ctr = box.getCenter(new THREE.Vector3());
  const s = 9 / Math.max(size.x, size.y, size.z);
  hero.scale.setScalar(s);
  hero.position.sub(ctr.multiplyScalar(s));
  hero.rotation.set(0, 0, 0);
  hero.traverse(o => {
    if (o.isMesh && o.material) {
      o.layers.enable(BLOOM_LAYER);
      const m = o.material;
      m.envMapIntensity = 1.9;
      m.transparent = true;
      if ("roughness" in m) m.roughness = Math.min(m.roughness ?? 0.5, 0.45);
      if ("emissive" in m) {
        m.emissive = new THREE.Color(0x5a6fb0);
        m.emissiveIntensity = m.emissiveMap ? 0.9 : 0.35;
        m.toneMapped = true;
      }
    }
  });
  const orient = new THREE.Group();
  orient.rotation.x = Math.PI / 2;          // fix GLB's baked tilt so it faces camera
  orient.add(hero);
  const holder = new THREE.Group();
  holder.add(orient);
  scene.add(holder);
  hero.holder = holder;
}, (e) => { if (e.lengthComputable) loadFrac = Math.max(loadFrac, 0.1 + 0.85 * (e.loaded / e.total)); });

/* fit distance so a w×h subject frames nicely (aspect aware) */
function viewDist(w, h, fillH = 0.62, fillW = 0.7) {
  const vfov = camera.fov * Math.PI / 180;
  const hFit = (h / fillH) / (2 * Math.tan(vfov / 2));
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const wFit = (w / fillW) / (2 * Math.tan(hfov / 2));
  return Math.max(hFit, wFit);
}

/* ---------------- mouse parallax ---------------- */
const par = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", e => {
  par.tx = (e.clientX / innerWidth) * 2 - 1;
  par.ty = -((e.clientY / innerHeight) * 2 + -1);
}, { passive: true });
addEventListener("keydown", e => { if (e.key === "Escape") demo.close(); });

/* ---------------- grain / static ---------------- */
const grain = document.getElementById("grain");
const gctx = grain.getContext("2d");
let grainImg;
function sizeGrain() {
  grain.width = Math.floor(innerWidth / 2);
  grain.height = Math.floor(innerHeight / 2);
  grainImg = gctx.createImageData(grain.width, grain.height);
}
function drawGrain() {
  const d = grainImg.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  gctx.putImageData(grainImg, 0, 0);
}

/* ---------------- resize ---------------- */
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloomComposer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth, innerHeight);
  stars.mat.uniforms.uPx.value = Math.min(devicePixelRatio, 2);
  camera.position.z = viewDist(9, 7.6, 0.76, 0.9);   // frame the logo (bigger)
  sizeGrain();
}
addEventListener("resize", resize); resize();

/* ---------------- loop ---------------- */
const clock = new THREE.Clock();
let prevSp = 0, svel = 0;
function scrollProgress() {
  /* content scrolls inside #content (driven by Lenis), not the window */
  const l = window.__lenis;
  if (l && isFinite(l.progress)) return Math.min(1, Math.max(0, l.progress));
  const sc = document.getElementById("content");
  if (sc) {
    const max = Math.max(1, sc.scrollHeight - sc.clientHeight);
    return Math.min(1, Math.max(0, sc.scrollTop / max));
  }
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  return Math.min(1, Math.max(0, scrollY / max));
}
function tick() {
  requestAnimationFrame(tick);
  const time = clock.elapsedTime; clock.getDelta();

  const sp = scrollProgress();
  svel = sp - prevSp; prevSp = sp;
  audio.drive(svel * 3.2);

  par.x += (par.tx - par.x) * 0.05; par.y += (par.ty - par.y) * 0.05;
  camera.position.x = par.x * 0.7;       // keep the logo more centered
  camera.position.y = par.y * 0.45;
  camera.rotation.y = -par.x * 0.018;
  camera.rotation.x = par.y * 0.012;

  // floating logo — subtle parallax wobble + gentle reaction to page scroll
  if (hero) {
    const h = hero.holder;
    h.rotation.y = THREE.MathUtils.lerp(h.rotation.y, par.x * 0.26 + sp * Math.PI * 0.7 + Math.sin(time * 0.3) * 0.1, 0.12);
    h.rotation.x = THREE.MathUtils.lerp(h.rotation.x, -par.y * 0.17 + Math.sin(time * 0.45) * 0.05, 0.12);
    h.rotation.z = Math.sin(time * 0.5) * 0.04 + svel * 1.6;
    h.position.y = Math.sin(time * 0.6) * 0.3 - sp * 2.2;
    h.scale.setScalar(1 - sp * 0.12);
  }

  // stars
  stars.rotation.y = par.x * 0.08;
  stars.position.x = -par.x * 2.2;
  stars.position.y = -par.y * 1.6;
  const su = stars.mat.uniforms;
  su.uTime.value = time;
  su.uReact.value += (Math.min(1, Math.abs(svel) * 12) - su.uReact.value) * 0.12;
  su.uMouse.value.set(par.x, par.y);
  su.uHero.value += ((sp < 0.1 ? 1 : 0.5) - su.uHero.value) * 0.05;

  drawGrain();
  renderWithBloom();
}

/* ---------------- boot ---------------- */
const slabLogo = document.getElementById("slabLogo")?.querySelector("img");
function collapseLoader() {
  const l = document.getElementById("loader");
  if (l.classList.contains("snap")) return;
  l.classList.add("snap");
  document.body.classList.add("entered");
  document.getElementById("cursor")?.classList.remove("loader-hidden");
  if (window.liquidRiftDone) window.liquidRiftDone();
}
// hide cursor until loader finishes
document.getElementById("cursor")?.classList.add("loader-hidden");
const tStart = performance.now();
const MIN_LOADER_MS = 3200;
let collapsed = false;
manager.onProgress = (url, loaded, total) => { loadFrac = Math.max(loadFrac, 0.05 + 0.9 * (loaded / Math.max(1, total))); };
manager.onLoad = () => { loadFrac = 1; };
let disp = 0;

/* === LOADER === */
const loaderEl = document.getElementById("loader");
let loaderLive = true;

const liqScaleEl = document.getElementById("liqScale");
if (slabLogo) { slabLogo.style.filter = "url(#liq-solid)"; slabLogo.style.opacity = "1"; }

/* === solidify RAF — liquid displacement scale 160 → 0 === */
(function solidifyLoop() {
  if (!loaderLive) return;
  if (liqScaleEl) liqScaleEl.setAttribute("scale", (160 * Math.pow(1 - disp, 2)).toFixed(1));
  requestAnimationFrame(solidifyLoop);
})();

/* === progress tracker (40 ms) === */
const loaderTimer = setInterval(() => {
  const timeFrac = Math.min(1, (performance.now() - tStart) / MIN_LOADER_MS);
  const target   = Math.min(loadFrac, timeFrac);
  disp += (target - disp) * 0.1;
  if (target >= 0.999 && target - disp < 0.004) disp = 1;
  if (!collapsed && disp >= 0.999 && loadFrac >= 1 && timeFrac >= 1) {
    collapsed = true; clearInterval(loaderTimer); loaderLive = false;
    collapseLoader();
  }
}, 40);


/* audio needs a user gesture (no ENTER gate anymore) → unlock on first interaction */
let audioOn = false;
function unlockAudio() {
  if (audioOn) return; audioOn = true;
  audio.start(); audio.whoosh();
}
["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev =>
  addEventListener(ev, unlockAudio, { passive: true }));

const muteHint = document.getElementById("muteHint");
addEventListener("keydown", e => {
  if (e.key === "m" || e.key === "M") {
    unlockAudio();
    const on = audio.toggle();
    if (muteHint) {
      muteHint.textContent = on ? "[M] MUTE" : "[M] UNMUTE";
      muteHint.classList.toggle("muted", !on);
    }
  }
});

sizeGrain();
tick();

setTimeout(() => { if (!collapsed) { collapsed = true; clearInterval(loaderTimer); loaderLive = false; collapseLoader(); } }, 12000);

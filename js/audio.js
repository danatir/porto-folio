// ============================================================
//  AUDIO — fully synthesised (no binary assets)
//  ambient chrome drone + static wind bed + UI SFX
// ============================================================

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.started = false;
    this.master = null;
  }

  // must be called from a user gesture
  start() {
    if (this.started) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.0001 : 0.0001;
    this.master.connect(ctx.destination);
    // gentle fade-in
    this.master.gain.exponentialRampToValueAtTime(this.enabled ? 0.6 : 0.0001, ctx.currentTime + 2.5);

    this._buildDrone();
    this._buildWind();
    this.started = true;
  }

  // ---- layered detuned pad ----
  _buildDrone() {
    const ctx = this.ctx;
    const bus = ctx.createGain(); bus.gain.value = 0.16; bus.connect(this.master);
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 520; filt.Q.value = 3;
    filt.connect(bus);
    // slow filter sweep
    const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
    lfo.frequency.value = 0.05; lfoG.gain.value = 240;
    lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();

    const freqs = [55, 82.4, 110, 164.8, 220.5]; // A1 stack + a touch detuned
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "sawtooth" : "sine";
      o.frequency.value = f + (i - 2) * 0.4;
      const g = ctx.createGain(); g.gain.value = 0.5 / freqs.length;
      o.connect(g); g.connect(filt); o.start();
    });
    this.droneFilter = filt;
  }

  // ---- filtered noise "static / wind" ----
  _buildWind() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(bp); bp.connect(g); g.connect(this.master); src.start();
    this.windGain = g; this.windFilter = bp;
  }

  // map scroll velocity -> wind intensity + drone brightness
  drive(velocity) {
    if (!this.started || !this.enabled) return;
    const v = Math.min(1, Math.abs(velocity) * 40);
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(0.04 + v * 0.22, t, 0.15);
    this.windFilter.frequency.setTargetAtTime(700 + v * 2600, t, 0.15);
    if (this.droneFilter) this.droneFilter.frequency.setTargetAtTime(520 + v * 700, t, 0.2);
  }

  // ---- one-shot UI sounds ----
  blip(freq = 660, dur = 0.08, type = "triangle", vol = 0.18) {
    if (!this.started || !this.enabled) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    o.connect(g); g.connect(this.master);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  hover() { this.blip(880, 0.05, "sine", 0.07); }
  click() { this.blip(420, 0.12, "square", 0.12); this.blip(840, 0.09, "triangle", 0.08); }
  whoosh() {
    if (!this.started || !this.enabled) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.4);
    const g = ctx.createGain(); g.gain.value = 0.0001;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
    o.connect(f); f.connect(g); g.connect(this.master);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.start(t); o.stop(t + 0.5);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.started) return this.enabled;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.enabled ? 0.6 : 0.0001, t, 0.4);
    return this.enabled;
  }
}

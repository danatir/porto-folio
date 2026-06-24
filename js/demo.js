// ============================================================
//  LIVE DEMO — "Maki-style" roaming interactive prototype
//  A simulated VIARO dive-app you can click, or let it roam.
// ============================================================

const SCREENS = {
  home: {
    icon: "◎", label: "HOME",
    html: `
      <div class="av-eyebrow">VIARO · READ THE WATER</div>
      <div class="av-h">Good dive,<br>Dan.</div>
      <div class="av-card">
        <div class="av-label">NO-DECO TIME</div>
        <div class="av-big">38<small> min</small></div>
        <div class="av-bar"><i style="width:64%"></i></div>
      </div>
      <div class="av-row">
        <div class="av-card"><div class="av-label">DEPTH</div><div class="av-big">18<small>m</small></div></div>
        <div class="av-card"><div class="av-label">WATER</div><div class="av-big">24<small>°</small></div></div>
      </div>
      <div class="av-card" style="margin-top:12px">
        <div class="av-label">TANK PRESSURE</div>
        <div class="av-big">186<small> bar</small></div>
        <div class="av-bar"><i style="width:82%"></i></div>
      </div>`
  },
  dive: {
    icon: "⏱", label: "DIVE",
    html: `
      <div class="av-eyebrow">ACTIVE DIVE · 00:24:11</div>
      <div class="av-h">In the blue</div>
      <div class="av-dive-ring" style="--p:62%"><div><b>18</b><br><span class="av-label">METERS</span></div></div>
      <div class="av-row">
        <div class="av-card"><div class="av-label">ASCENT</div><div class="av-big" style="font-size:26px">OK</div></div>
        <div class="av-card"><div class="av-label">AIR LEFT</div><div class="av-big" style="font-size:26px">41<small>m</small></div></div>
      </div>`
  },
  map: {
    icon: "◭", label: "SITES",
    html: `
      <div class="av-eyebrow">NEARBY · 4 SITES</div>
      <div class="av-h">Dive sites</div>
      <div class="av-map">
        <span class="pin" style="top:40%;left:32%"></span>
        <span class="pin" style="top:62%;left:58%"></span>
        <span class="pin" style="top:24%;left:70%"></span>
      </div>
      <ul class="av-list">
        <li><span>Caves of the Pillars</span><b>2.1 km</b></li>
        <li><span>The Blue Hole</span><b>5.8 km</b></li>
        <li><span>Coral Gardens</span><b>7.4 km</b></li>
      </ul>`
  },
  log: {
    icon: "❖", label: "PROFILE",
    html: `
      <div class="av-eyebrow">CERTIFIED · ADVANCED</div>
      <div class="av-avatar"></div>
      <div class="av-h" style="text-align:center">Dan Atir</div>
      <ul class="av-list">
        <li><span>Total dives</span><b>147</b></li>
        <li><span>Max depth</span><b>39 m</b></li>
        <li><span>Bottom time</span><b>91 h</b></li>
        <li><span>Last dive</span><b>Today</b></li>
      </ul>`
  }
};

export class LiveDemo {
  constructor(audio) {
    this.audio = audio;
    this.root = document.getElementById("demo");
    this.screenEl = document.getElementById("appScreen");
    this.navEl = document.getElementById("appNav");
    this.roamBtn = document.getElementById("roamBtn");
    this.order = ["home", "dive", "map", "log"];
    this.current = "home";
    this.roaming = true;
    this.timer = null;
    this._build();

    this.roamBtn.addEventListener("click", () => this.toggleRoam());
    document.getElementById("demoClose").addEventListener("click", () => this.close());
    this.root.querySelector(".demo-backdrop").addEventListener("click", () => this.close());
  }

  _build() {
    this.screenEl.innerHTML = this.order.map(k =>
      `<div class="app-view" data-k="${k}">${SCREENS[k].html}</div>`).join("");
    this.navEl.innerHTML = this.order.map(k =>
      `<button data-k="${k}"><span class="ic">${SCREENS[k].icon}</span>${SCREENS[k].label}</button>`).join("");
    this.navEl.querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => { this.stopRoam(); this.go(b.dataset.k, true); }));
    this.go("home");
  }

  go(k, user) {
    this.current = k;
    this.screenEl.querySelectorAll(".app-view").forEach(v => v.classList.toggle("on", v.dataset.k === k));
    this.navEl.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.k === k));
    if (this.audio) this.audio.blip(user ? 520 : 740, 0.06, "sine", 0.08);
  }

  startRoam() {
    this.roaming = true; this.roamBtn.classList.add("on");
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const i = (this.order.indexOf(this.current) + 1) % this.order.length;
      this.go(this.order[i]);
    }, 2600);
  }
  stopRoam() { this.roaming = false; this.roamBtn.classList.remove("on"); clearInterval(this.timer); }
  toggleRoam() { this.roaming ? this.stopRoam() : this.startRoam(); if (this.audio) this.audio.click(); }

  open() {
    this.root.classList.remove("hidden");
    this.go("home");
    this.startRoam();
    if (this.audio) this.audio.whoosh();
  }
  close() {
    this.stopRoam();
    this.root.classList.add("hidden");
    if (this.audio) this.audio.blip(300, 0.12, "square", 0.1);
  }
}

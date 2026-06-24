(() => {
  // js/data.js
  var PROJECTS = [
    {
      id: "viaro",
      title: "VIARO",
      tag: "DIVING TECHNOLOGY & CONNECTIVITY",
      body: "A modern diving-technology brand built to make every dive smarter, safer and more personal. The identity pairs fluid, tool-inspired logo motion with a clean visual language and deep-ocean blues lit by vibrant accents.",
      scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN", "3D DESIGN", "PHOTOGRAPHY", "UX / UI"],
      accent: "#1f7fd0",
      images: ["assets/img/viaro_1.jpg", "assets/img/viaro_2.jpg", "assets/img/viaro_3.jpg"],
      demo: true
    },
    {
      id: "oto",
      title: "OTO SOUND MOUSEUM",
      tag: "MUSEUM FOR MUSIC & SOUND ART",
      body: "A contemporary space for music and sound art. \u201COto\u201D (ear) fuses with \u201CMouseum\u201D from the Greek Mouseion. A logo shaped from cassette tape and sound waves, neon tones balanced by deep blues \u2014 energetic yet calming.",
      scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN"],
      accent: "#3a6bff",
      images: ["assets/img/oto_1.jpg", "assets/img/oto_2.jpg", "assets/img/oto_3.jpg"]
    },
    {
      id: "edenic",
      title: "EDENIC",
      tag: "HOUSE-PLANT SHOP \xB7 GRAFTING",
      body: "An online shop for house plants and grafting. Drawn from the Garden of Eden, the logo unites yin-yang balance with a leaf and sprout \u2014 harmony and growth. A Peace-Lily palette of soft greens and off-whites.",
      scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN", "PHOTOGRAPHY"],
      accent: "#6f9d5e",
      images: ["assets/img/edenic_1.jpg", "assets/img/edenic_2.jpg", "assets/img/edenic_3.jpg"]
    },
    {
      id: "levenshtein",
      title: "LEVENSHTEIN",
      tag: "MEMORIAL PROJECT \xB7 \u201CDRINK LIKE A VIKING\u201D",
      body: "A memorial beer for Yonadav Levenshtein, who fell on October 7th, 2023. Viking spirit, strength and camaraderie through bold type, Norse pattern and a warrior emblem. Purple and black honour his Givati beret.",
      scope: ["LOGO", "GRAPHIC DESIGN"],
      accent: "#7a4bb0",
      images: ["assets/img/levenshtein_1.jpg"]
    },
    {
      id: "lute",
      title: "LUT\xC9",
      tag: "COLLECTIBLES & STREET CAMPAIGN",
      body: "LUT\xC9 Mystery Bunny fuses pop culture, streetwear and kawaii into one bold universe. The mascot towers over surreal cityscapes amid loud doodles and comic chaos \u2014 Harajuku meets graffiti meets hype culture.",
      scope: ["LOGO", "3D DESIGN", "GRAPHIC DESIGN"],
      accent: "#ff3da6",
      images: ["assets/img/lute_1.jpg"]
    },
    {
      id: "infected",
      title: "INFECTED MUSHROOM",
      tag: "REBORN \xB7 VINYL & ARTBOOK",
      body: "A vinyl and artbook project for the Israeli psytrance duo. Their sound becomes a visual language of bold forms and playful distortion \u2014 experimental type and layered texture between chaos and control, raw and immersive.",
      scope: ["GRAPHIC DESIGN", "EDITORIAL", "TYPOGRAPHY"],
      accent: "#9b5cff",
      images: ["assets/img/infected_1.jpg", "assets/img/infected_2.jpg", "assets/img/infected_3.jpg", "assets/img/infected_4.jpg", "assets/img/infected_5.jpg"]
    },
    {
      id: "vader",
      title: "THE VADER PROJECT",
      tag: "COLLECTIBLE ART VOLUME \xB7 BOOK COVER",
      body: "A cover for a collectible volume of custom Darth Vader helmets reinterpreted by artists worldwide. Swirling marbled textures stand for creative freedom; clean white framing presents each mask as a work of art.",
      scope: ["GRAPHIC DESIGN", "EDITORIAL"],
      accent: "#aab0c4",
      images: ["assets/img/vader_1.jpg", "assets/img/vader_2.jpg"]
    }
  ];
  var POSTERS = Array.from(
    { length: 11 },
    (_, i) => `assets/img/poster_${String(i + 1).padStart(2, "0")}.jpg`
  );

  // vendor/lenis.mjs
  var version = "1.1.20";
  function clamp(min, input, max) {
    return Math.max(min, Math.min(input, max));
  }
  function lerp(x, y, t) {
    return (1 - t) * x + t * y;
  }
  function damp(x, y, lambda, deltaTime) {
    return lerp(x, y, 1 - Math.exp(-lambda * deltaTime));
  }
  function modulo(n, d) {
    return (n % d + d) % d;
  }
  var Animate = class {
    isRunning = false;
    value = 0;
    from = 0;
    to = 0;
    currentTime = 0;
    // These are instanciated in the fromTo method
    lerp;
    duration;
    easing;
    onUpdate;
    /**
     * Advance the animation by the given delta time
     *
     * @param deltaTime - The time in seconds to advance the animation
     */
    advance(deltaTime) {
      if (!this.isRunning) return;
      let completed = false;
      if (this.duration && this.easing) {
        this.currentTime += deltaTime;
        const linearProgress = clamp(0, this.currentTime / this.duration, 1);
        completed = linearProgress >= 1;
        const easedProgress = completed ? 1 : this.easing(linearProgress);
        this.value = this.from + (this.to - this.from) * easedProgress;
      } else if (this.lerp) {
        this.value = damp(this.value, this.to, this.lerp * 60, deltaTime);
        if (Math.round(this.value) === this.to) {
          this.value = this.to;
          completed = true;
        }
      } else {
        this.value = this.to;
        completed = true;
      }
      if (completed) {
        this.stop();
      }
      this.onUpdate?.(this.value, completed);
    }
    /** Stop the animation */
    stop() {
      this.isRunning = false;
    }
    /**
     * Set up the animation from a starting value to an ending value
     * with optional parameters for lerping, duration, easing, and onUpdate callback
     *
     * @param from - The starting value
     * @param to - The ending value
     * @param options - Options for the animation
     */
    fromTo(from, to, { lerp: lerp2, duration, easing, onStart, onUpdate }) {
      this.from = this.value = from;
      this.to = to;
      this.lerp = lerp2;
      this.duration = duration;
      this.easing = easing;
      this.currentTime = 0;
      this.isRunning = true;
      onStart?.();
      this.onUpdate = onUpdate;
    }
  };
  function debounce(callback, delay) {
    let timer;
    return function(...args) {
      let context = this;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        callback.apply(context, args);
      }, delay);
    };
  }
  var Dimensions = class {
    constructor(wrapper, content, { autoResize = true, debounce: debounceValue = 250 } = {}) {
      this.wrapper = wrapper;
      this.content = content;
      if (autoResize) {
        this.debouncedResize = debounce(this.resize, debounceValue);
        if (this.wrapper instanceof Window) {
          window.addEventListener("resize", this.debouncedResize, false);
        } else {
          this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize);
          this.wrapperResizeObserver.observe(this.wrapper);
        }
        this.contentResizeObserver = new ResizeObserver(this.debouncedResize);
        this.contentResizeObserver.observe(this.content);
      }
      this.resize();
    }
    width = 0;
    height = 0;
    scrollHeight = 0;
    scrollWidth = 0;
    // These are instanciated in the constructor as they need information from the options
    debouncedResize;
    wrapperResizeObserver;
    contentResizeObserver;
    destroy() {
      this.wrapperResizeObserver?.disconnect();
      this.contentResizeObserver?.disconnect();
      if (this.wrapper === window && this.debouncedResize) {
        window.removeEventListener("resize", this.debouncedResize, false);
      }
    }
    resize = () => {
      this.onWrapperResize();
      this.onContentResize();
    };
    onWrapperResize = () => {
      if (this.wrapper instanceof Window) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      } else {
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
      }
    };
    onContentResize = () => {
      if (this.wrapper instanceof Window) {
        this.scrollHeight = this.content.scrollHeight;
        this.scrollWidth = this.content.scrollWidth;
      } else {
        this.scrollHeight = this.wrapper.scrollHeight;
        this.scrollWidth = this.wrapper.scrollWidth;
      }
    };
    get limit() {
      return {
        x: this.scrollWidth - this.width,
        y: this.scrollHeight - this.height
      };
    }
  };
  var Emitter = class {
    events = {};
    /**
     * Emit an event with the given data
     * @param event Event name
     * @param args Data to pass to the event handlers
     */
    emit(event, ...args) {
      let callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) {
        callbacks[i]?.(...args);
      }
    }
    /**
     * Add a callback to the event
     * @param event Event name
     * @param cb Callback function
     * @returns Unsubscribe function
     */
    on(event, cb) {
      this.events[event]?.push(cb) || (this.events[event] = [cb]);
      return () => {
        this.events[event] = this.events[event]?.filter((i) => cb !== i);
      };
    }
    /**
     * Remove a callback from the event
     * @param event Event name
     * @param callback Callback function
     */
    off(event, callback) {
      this.events[event] = this.events[event]?.filter((i) => callback !== i);
    }
    /**
     * Remove all event listeners and clean up
     */
    destroy() {
      this.events = {};
    }
  };
  var LINE_HEIGHT = 100 / 6;
  var listenerOptions = { passive: false };
  var VirtualScroll = class {
    constructor(element, options = { wheelMultiplier: 1, touchMultiplier: 1 }) {
      this.element = element;
      this.options = options;
      window.addEventListener("resize", this.onWindowResize, false);
      this.onWindowResize();
      this.element.addEventListener("wheel", this.onWheel, listenerOptions);
      this.element.addEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.addEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.addEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
    touchStart = {
      x: 0,
      y: 0
    };
    lastDelta = {
      x: 0,
      y: 0
    };
    window = {
      width: 0,
      height: 0
    };
    emitter = new Emitter();
    /**
     * Add an event listener for the given event and callback
     *
     * @param event Event name
     * @param callback Callback function
     */
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    /** Remove all event listeners and clean up */
    destroy() {
      this.emitter.destroy();
      window.removeEventListener("resize", this.onWindowResize, false);
      this.element.removeEventListener("wheel", this.onWheel, listenerOptions);
      this.element.removeEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchend",
        this.onTouchEnd,
        listenerOptions
      );
    }
    /**
     * Event handler for 'touchstart' event
     *
     * @param event Touch event
     */
    onTouchStart = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: 0,
        y: 0
      };
      this.emitter.emit("scroll", {
        deltaX: 0,
        deltaY: 0,
        event
      });
    };
    /** Event handler for 'touchmove' event */
    onTouchMove = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier;
      const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: deltaX,
        y: deltaY
      };
      this.emitter.emit("scroll", {
        deltaX,
        deltaY,
        event
      });
    };
    onTouchEnd = (event) => {
      this.emitter.emit("scroll", {
        deltaX: this.lastDelta.x,
        deltaY: this.lastDelta.y,
        event
      });
    };
    /** Event handler for 'wheel' event */
    onWheel = (event) => {
      let { deltaX, deltaY, deltaMode } = event;
      const multiplierX = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1;
      const multiplierY = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1;
      deltaX *= multiplierX;
      deltaY *= multiplierY;
      deltaX *= this.options.wheelMultiplier;
      deltaY *= this.options.wheelMultiplier;
      this.emitter.emit("scroll", { deltaX, deltaY, event });
    };
    onWindowResize = () => {
      this.window = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
  };
  var Lenis = class {
    _isScrolling = false;
    // true when scroll is animating
    _isStopped = false;
    // true if user should not be able to scroll - enable/disable programmatically
    _isLocked = false;
    // same as isStopped but enabled/disabled when scroll reaches target
    _preventNextNativeScrollEvent = false;
    _resetVelocityTimeout = null;
    __rafID = null;
    /**
     * Whether or not the user is touching the screen
     */
    isTouching;
    /**
     * The time in ms since the lenis instance was created
     */
    time = 0;
    /**
     * User data that will be forwarded through the scroll event
     *
     * @example
     * lenis.scrollTo(100, {
     *   userData: {
     *     foo: 'bar'
     *   }
     * })
     */
    userData = {};
    /**
     * The last velocity of the scroll
     */
    lastVelocity = 0;
    /**
     * The current velocity of the scroll
     */
    velocity = 0;
    /**
     * The direction of the scroll
     */
    direction = 0;
    /**
     * The options passed to the lenis instance
     */
    options;
    /**
     * The target scroll value
     */
    targetScroll;
    /**
     * The animated scroll value
     */
    animatedScroll;
    // These are instanciated here as they don't need information from the options
    animate = new Animate();
    emitter = new Emitter();
    // These are instanciated in the constructor as they need information from the options
    dimensions;
    // This is not private because it's used in the Snap class
    virtualScroll;
    constructor({
      wrapper = window,
      content = document.documentElement,
      eventsTarget = wrapper,
      smoothWheel = true,
      syncTouch = false,
      syncTouchLerp = 0.075,
      touchInertiaMultiplier = 35,
      duration,
      // in seconds
      easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: lerp2 = 0.1,
      infinite = false,
      orientation = "vertical",
      // vertical, horizontal
      gestureOrientation = "vertical",
      // vertical, horizontal, both
      touchMultiplier = 1,
      wheelMultiplier = 1,
      autoResize = true,
      prevent,
      virtualScroll,
      overscroll = true,
      autoRaf = false,
      anchors = false,
      __experimental__naiveDimensions = false
    } = {}) {
      window.lenisVersion = version;
      if (!wrapper || wrapper === document.documentElement) {
        wrapper = window;
      }
      this.options = {
        wrapper,
        content,
        eventsTarget,
        smoothWheel,
        syncTouch,
        syncTouchLerp,
        touchInertiaMultiplier,
        duration,
        easing,
        lerp: lerp2,
        infinite,
        gestureOrientation,
        orientation,
        touchMultiplier,
        wheelMultiplier,
        autoResize,
        prevent,
        virtualScroll,
        overscroll,
        autoRaf,
        anchors,
        __experimental__naiveDimensions
      };
      this.dimensions = new Dimensions(wrapper, content, { autoResize });
      this.updateClassName();
      this.targetScroll = this.animatedScroll = this.actualScroll;
      this.options.wrapper.addEventListener("scroll", this.onNativeScroll, false);
      this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      if (this.options.anchors && this.options.wrapper === window) {
        this.options.wrapper.addEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.options.wrapper.addEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      this.virtualScroll = new VirtualScroll(eventsTarget, {
        touchMultiplier,
        wheelMultiplier
      });
      this.virtualScroll.on("scroll", this.onVirtualScroll);
      if (this.options.autoRaf) {
        this.__rafID = requestAnimationFrame(this.raf);
      }
    }
    /**
     * Destroy the lenis instance, remove all event listeners and clean up the class name
     */
    destroy() {
      this.emitter.destroy();
      this.options.wrapper.removeEventListener(
        "scroll",
        this.onNativeScroll,
        false
      );
      this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      this.options.wrapper.removeEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      if (this.options.anchors && this.options.wrapper === window) {
        this.options.wrapper.removeEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.virtualScroll.destroy();
      this.dimensions.destroy();
      this.cleanUpClassName();
      if (this.__rafID) {
        cancelAnimationFrame(this.__rafID);
      }
    }
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    off(event, callback) {
      return this.emitter.off(event, callback);
    }
    onScrollEnd = (e) => {
      if (!(e instanceof CustomEvent)) {
        if (this.isScrolling === "smooth" || this.isScrolling === false) {
          e.stopPropagation();
        }
      }
    };
    dispatchScrollendEvent = () => {
      this.options.wrapper.dispatchEvent(
        new CustomEvent("scrollend", {
          bubbles: this.options.wrapper === window,
          // cancelable: false,
          detail: {
            lenisScrollEnd: true
          }
        })
      );
    };
    setScroll(scroll) {
      if (this.isHorizontal) {
        this.options.wrapper.scrollTo({ left: scroll, behavior: "instant" });
      } else {
        this.options.wrapper.scrollTo({ top: scroll, behavior: "instant" });
      }
    }
    onClick = (event) => {
      const path = event.composedPath();
      const anchor = path.find(
        (node) => node instanceof HTMLAnchorElement && node.getAttribute("href")?.startsWith("#")
      );
      if (anchor) {
        const id = anchor.getAttribute("href");
        if (id) {
          const options = typeof this.options.anchors === "object" && this.options.anchors ? this.options.anchors : void 0;
          this.scrollTo(id, options);
        }
      }
    };
    onPointerDown = (event) => {
      if (event.button === 1) {
        this.reset();
      }
    };
    onVirtualScroll = (data) => {
      if (typeof this.options.virtualScroll === "function" && this.options.virtualScroll(data) === false)
        return;
      const { deltaX, deltaY, event } = data;
      this.emitter.emit("virtual-scroll", { deltaX, deltaY, event });
      if (event.ctrlKey) return;
      if (event.lenisStopPropagation) return;
      const isTouch = event.type.includes("touch");
      const isWheel = event.type.includes("wheel");
      this.isTouching = event.type === "touchstart" || event.type === "touchmove";
      const isClickOrTap = deltaX === 0 && deltaY === 0;
      const isTapToStop = this.options.syncTouch && isTouch && event.type === "touchstart" && isClickOrTap && !this.isStopped && !this.isLocked;
      if (isTapToStop) {
        this.reset();
        return;
      }
      const isUnknownGesture = this.options.gestureOrientation === "vertical" && deltaY === 0 || this.options.gestureOrientation === "horizontal" && deltaX === 0;
      if (isClickOrTap || isUnknownGesture) {
        return;
      }
      let composedPath = event.composedPath();
      composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement));
      const prevent = this.options.prevent;
      if (!!composedPath.find(
        (node) => node instanceof HTMLElement && (typeof prevent === "function" && prevent?.(node) || node.hasAttribute?.("data-lenis-prevent") || isTouch && node.hasAttribute?.("data-lenis-prevent-touch") || isWheel && node.hasAttribute?.("data-lenis-prevent-wheel"))
      ))
        return;
      if (this.isStopped || this.isLocked) {
        event.preventDefault();
        return;
      }
      const isSmooth = this.options.syncTouch && isTouch || this.options.smoothWheel && isWheel;
      if (!isSmooth) {
        this.isScrolling = "native";
        this.animate.stop();
        event.lenisStopPropagation = true;
        return;
      }
      let delta = deltaY;
      if (this.options.gestureOrientation === "both") {
        delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
      } else if (this.options.gestureOrientation === "horizontal") {
        delta = deltaX;
      }
      if (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && deltaY > 0 || this.animatedScroll === this.limit && deltaY < 0)) {
        event.lenisStopPropagation = true;
      }
      event.preventDefault();
      const isSyncTouch = isTouch && this.options.syncTouch;
      const isTouchEnd = isTouch && event.type === "touchend";
      const hasTouchInertia = isTouchEnd && Math.abs(delta) > 5;
      if (hasTouchInertia) {
        delta = this.velocity * this.options.touchInertiaMultiplier;
      }
      this.scrollTo(this.targetScroll + delta, {
        programmatic: false,
        ...isSyncTouch ? {
          lerp: hasTouchInertia ? this.options.syncTouchLerp : 1
          // immediate: !hasTouchInertia,
        } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }
      });
    };
    /**
     * Force lenis to recalculate the dimensions
     */
    resize() {
      this.dimensions.resize();
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.emit();
    }
    emit() {
      this.emitter.emit("scroll", this);
    }
    onNativeScroll = () => {
      if (this._resetVelocityTimeout !== null) {
        clearTimeout(this._resetVelocityTimeout);
        this._resetVelocityTimeout = null;
      }
      if (this._preventNextNativeScrollEvent) {
        this._preventNextNativeScrollEvent = false;
        return;
      }
      if (this.isScrolling === false || this.isScrolling === "native") {
        const lastScroll = this.animatedScroll;
        this.animatedScroll = this.targetScroll = this.actualScroll;
        this.lastVelocity = this.velocity;
        this.velocity = this.animatedScroll - lastScroll;
        this.direction = Math.sign(
          this.animatedScroll - lastScroll
        );
        if (!this.isStopped) {
          this.isScrolling = "native";
        }
        this.emit();
        if (this.velocity !== 0) {
          this._resetVelocityTimeout = setTimeout(() => {
            this.lastVelocity = this.velocity;
            this.velocity = 0;
            this.isScrolling = false;
            this.emit();
          }, 400);
        }
      }
    };
    reset() {
      this.isLocked = false;
      this.isScrolling = false;
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.lastVelocity = this.velocity = 0;
      this.animate.stop();
    }
    /**
     * Start lenis scroll after it has been stopped
     */
    start() {
      if (!this.isStopped) return;
      this.reset();
      this.isStopped = false;
    }
    /**
     * Stop lenis scroll
     */
    stop() {
      if (this.isStopped) return;
      this.reset();
      this.isStopped = true;
    }
    /**
     * RequestAnimationFrame for lenis
     *
     * @param time The time in ms from an external clock like `requestAnimationFrame` or Tempus
     */
    raf = (time) => {
      const deltaTime = time - (this.time || time);
      this.time = time;
      this.animate.advance(deltaTime * 1e-3);
      if (this.options.autoRaf) {
        this.__rafID = requestAnimationFrame(this.raf);
      }
    };
    /**
     * Scroll to a target value
     *
     * @param target The target value to scroll to
     * @param options The options for the scroll
     *
     * @example
     * lenis.scrollTo(100, {
     *   offset: 100,
     *   duration: 1,
     *   easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
     *   lerp: 0.1,
     *   onStart: () => {
     *     console.log('onStart')
     *   },
     *   onComplete: () => {
     *     console.log('onComplete')
     *   },
     * })
     */
    scrollTo(target, {
      offset = 0,
      immediate = false,
      lock = false,
      duration = this.options.duration,
      easing = this.options.easing,
      lerp: lerp2 = this.options.lerp,
      onStart,
      onComplete,
      force = false,
      // scroll even if stopped
      programmatic = true,
      // called from outside of the class
      userData
    } = {}) {
      if ((this.isStopped || this.isLocked) && !force) return;
      if (typeof target === "string" && ["top", "left", "start"].includes(target)) {
        target = 0;
      } else if (typeof target === "string" && ["bottom", "right", "end"].includes(target)) {
        target = this.limit;
      } else {
        let node;
        if (typeof target === "string") {
          node = document.querySelector(target);
        } else if (target instanceof HTMLElement && target?.nodeType) {
          node = target;
        }
        if (node) {
          if (this.options.wrapper !== window) {
            const wrapperRect = this.rootElement.getBoundingClientRect();
            offset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top;
          }
          const rect = node.getBoundingClientRect();
          target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll;
        }
      }
      if (typeof target !== "number") return;
      target += offset;
      target = Math.round(target);
      if (this.options.infinite) {
        if (programmatic) {
          this.targetScroll = this.animatedScroll = this.scroll;
        }
      } else {
        target = clamp(0, target, this.limit);
      }
      if (target === this.targetScroll) {
        onStart?.(this);
        onComplete?.(this);
        return;
      }
      this.userData = userData ?? {};
      if (immediate) {
        this.animatedScroll = this.targetScroll = target;
        this.setScroll(this.scroll);
        this.reset();
        this.preventNextNativeScrollEvent();
        this.emit();
        onComplete?.(this);
        this.userData = {};
        requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      if (!programmatic) {
        this.targetScroll = target;
      }
      this.animate.fromTo(this.animatedScroll, target, {
        duration,
        easing,
        lerp: lerp2,
        onStart: () => {
          if (lock) this.isLocked = true;
          this.isScrolling = "smooth";
          onStart?.(this);
        },
        onUpdate: (value, completed) => {
          this.isScrolling = "smooth";
          this.lastVelocity = this.velocity;
          this.velocity = value - this.animatedScroll;
          this.direction = Math.sign(this.velocity);
          this.animatedScroll = value;
          this.setScroll(this.scroll);
          if (programmatic) {
            this.targetScroll = value;
          }
          if (!completed) this.emit();
          if (completed) {
            this.reset();
            this.emit();
            onComplete?.(this);
            this.userData = {};
            requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            });
            this.preventNextNativeScrollEvent();
          }
        }
      });
    }
    preventNextNativeScrollEvent() {
      this._preventNextNativeScrollEvent = true;
      requestAnimationFrame(() => {
        this._preventNextNativeScrollEvent = false;
      });
    }
    /**
     * The root element on which lenis is instanced
     */
    get rootElement() {
      return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
    }
    /**
     * The limit which is the maximum scroll value
     */
    get limit() {
      if (this.options.__experimental__naiveDimensions) {
        if (this.isHorizontal) {
          return this.rootElement.scrollWidth - this.rootElement.clientWidth;
        } else {
          return this.rootElement.scrollHeight - this.rootElement.clientHeight;
        }
      } else {
        return this.dimensions.limit[this.isHorizontal ? "x" : "y"];
      }
    }
    /**
     * Whether or not the scroll is horizontal
     */
    get isHorizontal() {
      return this.options.orientation === "horizontal";
    }
    /**
     * The actual scroll value
     */
    get actualScroll() {
      const wrapper = this.options.wrapper;
      return this.isHorizontal ? wrapper.scrollX ?? wrapper.scrollLeft : wrapper.scrollY ?? wrapper.scrollTop;
    }
    /**
     * The current scroll value
     */
    get scroll() {
      return this.options.infinite ? modulo(this.animatedScroll, this.limit) : this.animatedScroll;
    }
    /**
     * The progress of the scroll relative to the limit
     */
    get progress() {
      return this.limit === 0 ? 1 : this.scroll / this.limit;
    }
    /**
     * Current scroll state
     */
    get isScrolling() {
      return this._isScrolling;
    }
    set isScrolling(value) {
      if (this._isScrolling !== value) {
        this._isScrolling = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is stopped
     */
    get isStopped() {
      return this._isStopped;
    }
    set isStopped(value) {
      if (this._isStopped !== value) {
        this._isStopped = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is locked
     */
    get isLocked() {
      return this._isLocked;
    }
    set isLocked(value) {
      if (this._isLocked !== value) {
        this._isLocked = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is smooth scrolling
     */
    get isSmooth() {
      return this.isScrolling === "smooth";
    }
    /**
     * The class name applied to the wrapper element
     */
    get className() {
      let className = "lenis";
      if (this.isStopped) className += " lenis-stopped";
      if (this.isLocked) className += " lenis-locked";
      if (this.isScrolling) className += " lenis-scrolling";
      if (this.isScrolling === "smooth") className += " lenis-smooth";
      return className;
    }
    updateClassName() {
      this.cleanUpClassName();
      this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim();
    }
    cleanUpClassName() {
      this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim();
    }
  };

  // js/ui.js
  var $ = (s) => document.querySelector(s);
  var pad = (n) => String(n).padStart(2, "0");
  var liquidDraw = () => {
  };
  var liquidRiftActive = true;
  function buildArchive() {
    const el = $("#archiveOverlay");
    if (!el) return;
    const allImgs = [];
    PROJECTS.forEach((p) => p.images.forEach((src) => allImgs.push({ src })));
    POSTERS.forEach((src) => allImgs.push({ src }));
    const N = allImgs.length;
    const N_PROJ_ARC = Math.min(4, PROJECTS.length);
    let ANCHOR_IDX = 0;
    for (let i = 0; i < N_PROJ_ARC - 1; i++) ANCHOR_IDX += PROJECTS[i].images.length;
    const IMG_W = 240, IMG_H = 160;
    const COLS = 5, ROWS = Math.ceil(N / COLS);
    const CELL_W = 310, CELL_H = 220;
    const WORLD_W = COLS * CELL_W, WORLD_H = ROWS * CELL_H;
    const rnd = (n) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const JX = (CELL_W - IMG_W) / 2, JY = (CELL_H - IMG_H) / 2;
    const wCenters = allImgs.map((_, i) => ({
      cx: i % COLS * CELL_W + CELL_W / 2 + (rnd(i * 3) - 0.5) * 2 * JX,
      cy: Math.floor(i / COLS) * CELL_H + CELL_H / 2 + (rnd(i * 3 + 1) - 0.5) * 2 * JY
    }));
    const panelHTML = allImgs.map(
      (img, i) => [0, 1, 2, 3].map((t) => `
      <figure class="sc-panel" data-i="${i}" data-t="${t}">
        <img src="${img.src}" alt="" loading="lazy" draggable="false" crossorigin="anonymous" />
      </figure>`).join("")
    ).join("");
    document.getElementById("sc-fisheye-defs")?.remove();
    const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgDefs.id = "sc-fisheye-defs";
    svgDefs.setAttribute("width", "0");
    svgDefs.setAttribute("height", "0");
    svgDefs.style.cssText = "position:absolute;pointer-events:none";
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
      <span class="sc-sub">\u2190 \u2192 \u2191 \u2193 &nbsp;OR&nbsp; DRAG</span>
    </div>
    <button class="sc-contact-hint" id="scContactHint" aria-label="Go to contact">
      CONTACT <span class="sc-hint-arrow">\u2193</span>
    </button>`;
    const viewport = el.querySelector("#scViewport");
    const canvas = el.querySelector("#scCanvas");
    const renderEl = el.querySelector("#scRender");
    const renderCtx = renderEl.getContext("2d");
    const feDisp = document.getElementById("scFisheyeDisp");
    const feImg = document.getElementById("scFisheyeMap");
    const allPanels = [...el.querySelectorAll(".sc-panel")];
    let vpW = viewport.offsetWidth || window.innerWidth;
    let vpH = viewport.offsetHeight || window.innerHeight;
    let camX = WORLD_W / 2, camY = WORLD_H / 2;
    let vx = 0, vy = 0;
    let motionStr = 0;
    let dragging = false, lastX = 0, lastY = 0;
    const keys = {};
    let entryReady = false;
    let _entryTime = 0;
    let entryStart = 0;
    let exitReady = false;
    let exitStart = 0;
    const makeBarrelMap = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx2 = c.getContext("2d");
      const d = ctx2.createImageData(w, h);
      const K = 0.85;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w * 2 - 1, ny = y / h * 2 - 1;
          const r2 = Math.min(nx * nx + ny * ny, 1.5);
          const idx2 = (y * w + x) * 4;
          d.data[idx2] = Math.round(Math.max(0, Math.min(255, (-nx * K * r2 * 0.5 + 0.5) * 255)));
          d.data[idx2 + 1] = Math.round(Math.max(0, Math.min(255, (-ny * K * r2 * 0.5 + 0.5) * 255)));
          d.data[idx2 + 2] = 128;
          d.data[idx2 + 3] = 255;
        }
      }
      ctx2.putImageData(d, 0, 0);
      return c.toDataURL();
    };
    const syncFilter = () => {
      vpW = viewport.offsetWidth || window.innerWidth;
      vpH = viewport.offsetHeight || window.innerHeight;
      renderEl.width = vpW;
      renderEl.height = vpH;
      const filt = document.getElementById("sc-fisheye");
      if (filt) {
        filt.setAttribute("x", 0);
        filt.setAttribute("y", 0);
        filt.setAttribute("width", vpW);
        filt.setAttribute("height", vpH);
      }
      if (feImg) {
        feImg.setAttribute("x", 0);
        feImg.setAttribute("y", 0);
        feImg.setAttribute("width", vpW);
        feImg.setAttribute("height", vpH);
        feImg.setAttribute("href", makeBarrelMap(vpW, vpH));
      }
    };
    requestAnimationFrame(syncFilter);
    window.addEventListener("resize", syncFilter, { passive: true });
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      vx = 0;
      vy = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      camX -= dx;
      camY -= dy;
      vx = -dx;
      vy = -dy;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    const endDrag = () => {
      dragging = false;
    };
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    const onKeyDown = (e) => {
      if (!{ ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1 }[e.key]) return;
      const r = el.getBoundingClientRect();
      if (r.top < -100 || r.top > window.innerHeight) return;
      keys[e.key] = true;
      e.preventDefault();
    };
    const onKeyUp = (e) => {
      delete keys[e.key];
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const ARROW_V = 7;
    (function loop() {
      requestAnimationFrame(loop);
      if (!dragging) {
        const tx = (keys.ArrowRight ? ARROW_V : 0) - (keys.ArrowLeft ? ARROW_V : 0);
        const ty = (keys.ArrowDown ? ARROW_V : 0) - (keys.ArrowUp ? ARROW_V : 0);
        vx += (tx - vx) * 0.22;
        vy += (ty - vy) * 0.22;
        camX += vx;
        camY += vy;
      }
      if (!dragging && !keys.ArrowLeft && !keys.ArrowRight) vx *= 0.88;
      if (!dragging && !keys.ArrowUp && !keys.ArrowDown) vy *= 0.88;
      const speed = Math.hypot(vx, vy);
      const targetStr = Math.min(1, speed / 5);
      motionStr += (targetStr - motionStr) * (targetStr > motionStr ? 0.18 : 0.04);
      const tileX = Math.floor(camX / WORLD_W);
      const tileY = Math.floor(camY / WORLD_H);
      const fracX = camX / WORLD_W - tileX;
      const fracY = camY / WORLD_H - tileY;
      const tx0 = fracX < 0.5 ? tileX - 1 : tileX;
      const ty0 = fracY < 0.5 ? tileY - 1 : tileY;
      const tileOffsets = [
        [tx0, ty0],
        [tx0 + 1, ty0],
        [tx0, ty0 + 1],
        [tx0 + 1, ty0 + 1]
      ];
      const maxDisp = Math.round(vpW * 0.09);
      if (feDisp) feDisp.setAttribute("scale", (maxDisp * motionStr).toFixed(1));
      renderEl.style.filter = motionStr > 0.01 ? "url(#sc-fisheye)" : "none";
      renderCtx.clearRect(0, 0, vpW, vpH);
      allPanels.forEach((panel) => {
        const i = +panel.dataset.i;
        const t = +panel.dataset.t;
        const [otx, oty] = tileOffsets[t];
        const wc = wCenters[i];
        const dx = wc.cx + otx * WORLD_W - camX;
        const dy = wc.cy + oty * WORLD_H - camY;
        const sx = vpW / 2 + dx - IMG_W / 2;
        const sy = vpH / 2 + dy - IMG_H / 2;
        panel.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
        if (sx > vpW + IMG_W || sx < -IMG_W * 2 || sy > vpH + IMG_H || sy < -IMG_H * 2) return;
        const img = panel.querySelector("img");
        if (img.complete && img.naturalWidth > 0) {
          if (exitReady) {
            const elapsed = performance.now() - exitStart;
            const delay = (allImgs.length - i) * 12;
            const t2 = Math.max(0, Math.min(1, (elapsed - delay) / 380));
            renderCtx.globalAlpha = 1 - t2 * t2;
          } else if (entryReady) {
            const elapsed = performance.now() - entryStart;
            const delay = i * 22;
            const tileT = Math.max(0, Math.min(1, (elapsed - delay) / 520));
            renderCtx.globalAlpha = tileT * tileT;
          } else {
            renderCtx.globalAlpha = 1;
          }
          renderCtx.drawImage(img, Math.round(sx), Math.round(sy), IMG_W, IMG_H);
          renderCtx.globalAlpha = 1;
        }
      });
    })();
    let _entryFly = null;
    window._startArchiveEntry = (srcEl) => {
      if (entryReady) return;
      el.style.transition = "none";
      el.style.opacity = "1";
      el.classList.add("archive-active");
      el.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        el.style.transition = "";
        el.style.opacity = "";
      });
      camX = wCenters[ANCHOR_IDX].cx;
      camY = wCenters[ANCHOR_IDX].cy;
      vx = 0;
      vy = 0;
      motionStr = 1;
      entryReady = true;
      _entryTime = performance.now();
      entryStart = performance.now() + 420;
      const rect = srcEl.getBoundingClientRect();
      const fly = document.createElement("div");
      fly.style.cssText = `
      position:fixed;z-index:500;pointer-events:none;overflow:hidden;
      left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      transition:left .44s cubic-bezier(.16,1,.3,1),
                 top  .44s cubic-bezier(.16,1,.3,1),
                 width .44s cubic-bezier(.16,1,.3,1),
                 height .44s cubic-bezier(.16,1,.3,1);
    `;
      const flyImg = document.createElement("img");
      flyImg.src = srcEl.src;
      flyImg.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      fly.appendChild(flyImg);
      document.body.appendChild(fly);
      _entryFly = fly;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fly.style.left = vpW / 2 - IMG_W / 2 + "px";
        fly.style.top = vpH / 2 - IMG_H / 2 + "px";
        fly.style.width = IMG_W + "px";
        fly.style.height = IMG_H + "px";
      }));
      setTimeout(() => {
        fly.style.transition = "opacity .3s ease";
        fly.style.opacity = "0";
        setTimeout(() => {
          fly.remove();
          if (_entryFly === fly) _entryFly = null;
        }, 350);
      }, 550);
    };
    let archiveExiting = false;
    const doExitMorph = () => {
      archiveExiting = true;
      exitReady = true;
      exitStart = performance.now();
      const cr = window._archiveCardRect;
      if (cr) {
        const fly = document.createElement("div");
        fly.style.cssText = `
        position:fixed;z-index:501;pointer-events:none;overflow:hidden;
        left:${vpW / 2 - IMG_W / 2}px;top:${vpH / 2 - IMG_H / 2}px;
        width:${IMG_W}px;height:${IMG_H}px;
        transition:left .42s cubic-bezier(.7,0,.84,0),
                   top  .42s cubic-bezier(.7,0,.84,0),
                   width .42s cubic-bezier(.7,0,.84,0),
                   height .42s cubic-bezier(.7,0,.84,0);
      `;
        const flyImg = document.createElement("img");
        flyImg.src = allImgs[ANCHOR_IDX].src;
        flyImg.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
        fly.appendChild(flyImg);
        document.body.appendChild(fly);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fly.style.left = cr.left + "px";
          fly.style.top = cr.top + "px";
          fly.style.width = cr.width + "px";
          fly.style.height = cr.height + "px";
          el.style.transition = "opacity 0.44s cubic-bezier(.4,0,1,1)";
          el.style.opacity = "0";
        }));
        setTimeout(() => {
          fly.style.transition += ", opacity .2s ease";
          fly.style.opacity = "0";
          setTimeout(() => fly.remove(), 240);
        }, 420);
      } else {
        requestAnimationFrame(() => {
          el.style.transition = "opacity 0.4s ease";
          el.style.opacity = "0";
        });
      }
      setTimeout(() => {
        window._unlockArchiveScroll?.();
        el.classList.remove("archive-active");
        el.style.cssText = "";
        el.setAttribute("aria-hidden", "true");
        window._archiveCardRect = null;
        entryReady = false;
        exitReady = false;
        archiveExiting = false;
        window._resetArchiveEntry?.();
      }, 520);
    };
    window._exitArchive = () => {
      if (archiveExiting || !entryReady) return;
      const targetX = wCenters[ANCHOR_IDX].cx;
      const targetY = wCenters[ANCHOR_IDX].cy;
      const dist = Math.hypot(camX - targetX, camY - targetY);
      if (dist < 8) {
        doExitMorph();
      } else {
        archiveExiting = true;
        (function centerLoop() {
          const d = Math.hypot(camX - targetX, camY - targetY);
          if (d < 8) {
            camX = targetX;
            camY = targetY;
            doExitMorph();
            return;
          }
          camX += (targetX - camX) * 0.09;
          camY += (targetY - camY) * 0.09;
          vx = 0;
          vy = 0;
          requestAnimationFrame(centerLoop);
        })();
      }
    };
    const popup = document.createElement("div");
    popup.id = "archiveContactPopup";
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
      <button class="acp-back-btn acp-nonet-back acp-dismiss">\u2190 back</button>
    </div>`;
    el.appendChild(popup);
    let _progressTimer = null;
    const showContactPopup = () => {
      if (!entryReady) return;
      if (_entryFly) {
        _entryFly.style.transition = "opacity .15s ease";
        _entryFly.style.opacity = "0";
        const _f = _entryFly;
        _entryFly = null;
        setTimeout(() => _f.remove(), 160);
      }
      popup.classList.add("acp-visible");
      document.body.classList.add("bsod-active");
      const el2 = document.getElementById("acpProgress");
      let pct = 0;
      clearInterval(_progressTimer);
      _progressTimer = setInterval(() => {
        pct += Math.floor(Math.random() * 3) + 1;
        if (pct >= 100) {
          pct = 100;
          clearInterval(_progressTimer);
        }
        if (el2) el2.textContent = pct + "% complete";
      }, 120);
    };
    let _popupClosedAt = 0;
    const POPUP_CLOSE_COOLDOWN = 700;
    const hideContactPopup = () => {
      popup.classList.remove("acp-visible");
      document.body.classList.remove("bsod-active");
      clearInterval(_progressTimer);
      const el2 = document.getElementById("acpProgress");
      if (el2) el2.textContent = "0% complete";
      _popupClosedAt = performance.now();
      _exitDelta = 0;
      _fwdDelta = 0;
    };
    popup.querySelector(".acp-dismiss").addEventListener("click", hideContactPopup);
    document.getElementById("scContactHint")?.addEventListener("click", showContactPopup);
    let _exitDelta = 0;
    let _fwdDelta = 0;
    const FORWARD_COOLDOWN = 1e3;
    const BACKWARD_COOLDOWN = 1800;
    window.addEventListener("wheel", (e) => {
      if (!entryReady || archiveExiting) {
        _exitDelta = 0;
        _fwdDelta = 0;
        return;
      }
      _exitDelta += e.deltaY;
      if (_exitDelta > 0) _exitDelta = 0;
      if (_exitDelta < -40) {
        _exitDelta = 0;
        _fwdDelta = 0;
        if (popup.classList.contains("acp-visible")) {
          hideContactPopup();
          return;
        }
        if (performance.now() - _entryTime < BACKWARD_COOLDOWN) return;
        if (performance.now() - _popupClosedAt < POPUP_CLOSE_COOLDOWN) return;
        window._exitArchive();
        return;
      }
      if (performance.now() - _entryTime > FORWARD_COOLDOWN) {
        _fwdDelta += e.deltaY;
        if (_fwdDelta < 0) _fwdDelta = 0;
        if (_fwdDelta > 200) {
          _exitDelta = 0;
          _fwdDelta = 0;
          showContactPopup();
        }
      }
    }, { passive: true });
  }
  function startClock() {
    const timeEl = $("#metaTime");
    const dateEl = $("#metaDate");
    if (!timeEl) return;
    const pad2 = (n) => String(n).padStart(2, "0");
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const tick = () => {
      const d = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
      let h = d.getHours(), ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      timeEl.textContent = `${pad2(h)}:${pad2(d.getMinutes())} ${ampm}`;
      if (dateEl) dateEl.textContent = `${months[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`;
    };
    tick();
    setInterval(tick, 1e3);
  }
  function buildHeroThumbs() {
    const el = $("#heroThumbs");
    if (!el) return;
    const HERO = PROJECTS.slice(0, 4);
    el.innerHTML = HERO.map((p, i) => `
    <a class="thumb" data-i="${i}" href="#works">
      <span class="thumb-no">[${pad(i + 1)}]</span>
      <span class="thumb-img"><img src="${p.images[0]}" alt="${p.title}" /></span>
      <span class="thumb-title">${p.title}</span>
    </a>`).join("");
    const thumbs = [...el.querySelectorAll(".thumb")];
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
    const pWm = panel.querySelector(".hpp-wm");
    const pImg = panel.querySelector(".hpp-media img");
    const pNo = panel.querySelector(".hpp-no");
    const pTitle = panel.querySelector(".hpp-title");
    const pTag = panel.querySelector(".hpp-tag");
    const pBody = panel.querySelector(".hpp-body");
    const pScope = panel.querySelector(".hpp-scope");
    let curIdx = -1, isOpen = false;
    const fill = (i) => {
      const p = HERO[i];
      if (!p) return;
      panel.style.setProperty("--hpp-accent", p.accent || "#0a0b0e");
      pWm.textContent = pad(i + 1);
      pImg.src = p.images[0];
      pImg.alt = p.title;
      pNo.textContent = `[${pad(i + 1)}] / WORK`;
      pTitle.textContent = p.title;
      pTag.textContent = p.tag;
      pBody.textContent = p.body;
      pScope.innerHTML = p.scope.map((s) => `<li>${s}</li>`).join("");
    };
    const OPEN = "inset(0 0 0 0)";
    const SHUT = "inset(0 100% 0 0)";
    const WIPE = 320;
    const wipeOpen = (i) => {
      curIdx = i;
      fill(i);
      panel.setAttribute("aria-hidden", "false");
      panel.style.transition = "none";
      panel.style.clipPath = SHUT;
      void panel.offsetWidth;
      panel.style.transition = "";
      panel.style.clipPath = OPEN;
      isOpen = true;
    };
    let hideT, swapT;
    const show = (i) => {
      clearTimeout(hideT);
      clearTimeout(swapT);
      if (i === curIdx && isOpen) return;
      if (isOpen) {
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
      panel.style.clipPath = SHUT;
      panel.setAttribute("aria-hidden", "true");
      isOpen = false;
      curIdx = -1;
      thumbs.forEach((x) => x.classList.remove("sel"));
    };
    thumbs.forEach((t) => {
      const i = +t.dataset.i;
      t.addEventListener("mouseenter", () => {
        thumbs.forEach((x) => x.classList.toggle("sel", x === t));
        show(i);
      });
      t.addEventListener("mouseleave", () => {
        hideT = setTimeout(hide, 90);
      });
      t.addEventListener("click", (e) => {
        e.preventDefault();
        transitionTo(projIndex(i));
      });
    });
    el.addEventListener("mouseleave", () => {
      hideT = setTimeout(hide, 90);
    });
    el.addEventListener("mouseenter", () => clearTimeout(hideT));
  }
  function matchThumbHeight() {
    const s = $(".hero-statement"), el = $("#heroThumbs");
    if (!s || !el) return;
    el.style.setProperty("--ih", Math.round(s.offsetHeight) + "px");
  }
  function initLiquid() {
    const cv = $("#liquid");
    if (!cv) return;
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) {
      cv.style.display = "none";
      return;
    }
    const ctx = cv.getContext("2d");
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d");
    let W = 0, H = 0;
    function size() {
      W = innerWidth;
      H = innerHeight;
      cv.width = W;
      cv.height = H;
      tmp.width = W;
      tmp.height = H;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }
    size();
    addEventListener("resize", size);
    let mx = W / 2, my = H / 2, px = mx, py = my;
    let active = false, dissolving = false, dissolveStart = 0;
    let lTime = 0, lastMoveT = -999;
    window._liquidClear = () => {
      active = false;
      dissolving = false;
      drops.length = 0;
      cv.classList.remove("show");
      cv.style.filter = "";
      cv.style.opacity = "";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    };
    window.liquidRiftDone = () => {
      liquidRiftActive = false;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      px = mx;
      py = my;
      drops.length = 0;
      lastMoveT = lTime;
      active = true;
      dissolving = false;
      cv.style.filter = "";
      cv.style.opacity = "";
      cv.classList.add("show");
    };
    window._liquidDissolve = () => {
      if (!active && !dissolving) return;
      active = false;
      dissolving = true;
      dissolveStart = performance.now();
      drops.length = 0;
    };
    addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      lastMoveT = lTime;
    }, { passive: true });
    const drops = [];
    function spawnDrops(x, y, dvx, dvy, spd) {
      const n = 8 + Math.floor(spd * 22);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (4 + Math.random() * 11) * spd;
        drops.push({
          x,
          y,
          vx: Math.cos(a) * s + dvx * 0.45,
          vy: Math.sin(a) * s + dvy * 0.45,
          r: 14 + Math.random() * spd * 42,
          life: 1,
          decay: 4e-3 + Math.random() * 7e-3
        });
      }
    }
    function brush(x, y, r, alpha) {
      if (r < 1) return;
      alpha = alpha ?? 1;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`);
      g.addColorStop(0.46, `rgba(255,255,255,${(alpha * 0.84).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    liquidDraw = (on) => {
      if (on) {
        dissolving = false;
        cv.style.filter = "";
        cv.style.opacity = "";
        active = true;
        px = mx;
        py = my;
        drops.length = 0;
      } else {
        if (active || dissolving) window._liquidDissolve();
        else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, W, H);
        }
        active = false;
        px = mx;
        py = my;
      }
      lastMoveT = lTime;
    };
    const DISSOLVE_MS = 800;
    (function loop() {
      requestAnimationFrame(loop);
      lTime += 0.015;
      if (!active && !dissolving) {
        cv.style.filter = "";
        cv.style.opacity = "";
        return;
      }
      if (dissolving) {
        const t = Math.min(1, (performance.now() - dissolveStart) / DISSOLVE_MS);
        const ease = 1 - Math.pow(1 - t, 2);
        tctx.clearRect(0, 0, W, H);
        tctx.drawImage(cv, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.filter = `blur(${(4 + t * 5).toFixed(1)}px)`;
        ctx.globalAlpha = 0.965;
        ctx.drawImage(tmp, 0, 0, W, H);
        ctx.restore();
        ctx.filter = "none";
        ctx.globalAlpha = 1;
        const dotR = 55 * (1 - ease);
        if (dotR > 0.5) brush(mx, my, dotR, 0.85);
        const contrast = Math.max(1, 26 - 25 * t).toFixed(1);
        const cssBlur = Math.max(4, 16 - 12 * t).toFixed(1);
        cv.style.filter = `blur(${cssBlur}px) contrast(${contrast})`;
        cv.style.opacity = t > 0.65 ? (1 - (t - 0.65) / 0.35).toFixed(3) : "1";
        if (t >= 1) {
          dissolving = false;
          cv.classList.remove("show");
          cv.style.filter = "";
          cv.style.opacity = "";
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, W, H);
        }
        return;
      }
      const dvx = mx - px, dvy = my - py;
      const dist = Math.hypot(dvx, dvy);
      const spd = Math.min(dist / 12, 1);
      const idleFor = Math.max(0, lTime - lastMoveT);
      tctx.clearRect(0, 0, W, H);
      tctx.drawImage(cv, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      const idleBlur = idleFor > 0.3 ? Math.min((idleFor - 0.3) * 0.5, 1.6) : 0;
      ctx.filter = `blur(${(3.8 + spd * 4.5 + idleBlur).toFixed(1)}px)`;
      ctx.globalAlpha = 0.955;
      ctx.drawImage(tmp, 0, 0, W, H);
      ctx.restore();
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      if (dist > 0.5) {
        const r = 26 + spd * 46;
        const steps = Math.max(1, Math.ceil(dist / 4));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const swirl = Math.sin(lTime * 5.2 + t * Math.PI * 2.2) * spd * 28;
          const len = Math.max(dist, 1e-3);
          brush(
            px + dvx * t + -dvy / len * swirl,
            py + dvy * t + dvx / len * swirl,
            r
          );
        }
        if (dist > 5 && Math.random() < spd * 1.3) spawnDrops(mx, my, dvx, dvy, spd);
      }
      if (idleFor > 0.35) {
        const vStr = Math.min((idleFor - 0.35) / 2.5, 1);
        const ARMS = 4;
        for (let v = 0; v < ARMS; v++) {
          const phase = v / ARMS * Math.PI * 2;
          const ia = lTime * 2.6 + phase;
          const ir = 20 + Math.sin(lTime * 1.8 + phase) * 7;
          brush(
            mx + Math.cos(ia) * ir,
            my + Math.sin(ia) * ir * 0.68,
            (12 + Math.sin(lTime * 3.5 + v) * 4) * vStr,
            (0.52 + Math.sin(lTime * 4 + v * 1.3) * 0.16) * vStr
          );
          const oa = lTime * 1.1 - phase;
          const or2 = 52 + vStr * 40 + Math.cos(lTime * 2.1 + phase) * 14;
          brush(
            mx + Math.cos(oa) * or2,
            my + Math.sin(oa) * or2 * 0.58,
            (20 + Math.cos(lTime * 2.8 + v) * 7) * vStr,
            (0.35 + Math.cos(lTime * 3.2 + v * 1.7) * 0.12) * vStr
          );
          const ma = lTime * 1.9 + phase + 0.4;
          const mr = ir + (or2 - ir) * 0.5;
          brush(
            mx + Math.cos(ma) * mr,
            my + Math.sin(ma) * mr * 0.62,
            (9 + Math.sin(lTime * 4.4 + v) * 3) * vStr,
            0.28 * vStr
          );
        }
        brush(mx, my, 15 * vStr, 0.25 * vStr);
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        brush(d.x, d.y, d.r * d.life, d.life * 0.88);
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.962;
        d.vy *= 0.962;
        d.r *= 0.982;
        d.life -= d.decay;
        if (d.life <= 0) drops.splice(i, 1);
      }
      const orbScale = idleFor > 0.35 ? 0.28 : 0.62;
      brush(
        mx + Math.cos(lTime * 3.6) * (14 + spd * 26),
        my + Math.sin(lTime * 5.3) * (9 + spd * 18),
        22 + spd * 16,
        0.44 * orbScale
      );
      px = mx;
      py = my;
    })();
  }
  function splitHeadings() {
    document.querySelectorAll("[data-split]").forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach((w, i) => {
        const outer = document.createElement("span");
        outer.className = "word";
        const inner = document.createElement("span");
        inner.className = "word-i";
        inner.textContent = w;
        inner.style.transitionDelay = i * 0.07 + "s";
        outer.appendChild(inner);
        el.appendChild(outer);
        el.append(" ");
      });
    });
  }
  var pages = [...document.querySelectorAll(".page")];
  var contentEl = $("#content");
  var navLinks = [...document.querySelectorAll(".nav-links a")];
  var cursorEl = $("#cursor");
  var projectPages = [...document.querySelectorAll(".work-page")];
  var projIndex = (i) => pages.indexOf(projectPages[i]);
  var idx = 0;
  var previewing = false;
  var pagesEl = document.getElementById("pages");
  var _reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = new Lenis({
    wrapper: contentEl,
    content: pagesEl,
    lerp: _reduceMotion ? 1 : 0.09,
    // springy settle (lower = longer glide; higher = snappier start)
    wheelMultiplier: _reduceMotion ? 1 : 0.38,
    // cap scroll speed (whole site)
    touchMultiplier: _reduceMotion ? 1 : 0.7,
    // slow touch/trackpad drags too
    smoothWheel: !_reduceMotion,
    syncTouch: !_reduceMotion,
    // route trackpad momentum through Lenis
    syncTouchLerp: 0.06
  });
  window.__lenis = lenis;
  (function rafLenis(t) {
    lenis.raf(t);
    requestAnimationFrame(rafLenis);
  })();
  var scrollJump = (y) => lenis.scrollTo(y, { immediate: true, force: true });
  function revealPage(p) {
    p.querySelectorAll(".reveal, [data-split]").forEach((el) => el.classList.add("in"));
  }
  function setPage(i) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    idx = i;
    scrollJump(pages[i].offsetTop);
    updatePageState(i);
  }
  function updatePageState(i) {
    document.body.classList.toggle("inverted-page", i === 1);
    if (!window._slabActive) {
      if (cursorEl) {
        cursorEl.classList.toggle("home", i === 0);
        cursorEl.classList.toggle("solid", i > 0);
      }
    }
    if (!liquidRiftActive) {
      if (i === 0) {
        $("#liquid").classList.add("show");
        liquidDraw(true);
      } else if (!window._slabActive) {
        liquidDraw(false);
      }
    }
    revealPage(pages[i]);
    const id = pages[i].id;
    const isWork = pages[i].classList.contains("work-page");
    navLinks.forEach((l) => {
      const h = l.getAttribute("href");
      l.classList.toggle("active", h === "#" + id || isWork && h === "#works");
    });
    $("#marquee").classList.toggle("show", id === "contact");
  }
  var revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) revealPage(e.target);
    });
  }, { root: contentEl, threshold: 0.08 });
  pages.forEach((p) => revealObs.observe(p));
  var contactEl = document.getElementById("contact");
  if (contactEl) {
    const contactObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(() => contactEl.classList.add("contact-visible"), 80);
          contactObs.disconnect();
        }
      });
    }, { root: contentEl, threshold: 0.15 });
    contactObs.observe(contactEl);
  }
  var sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = pages.indexOf(e.target);
      if (i < 0 || i === idx) return;
      idx = i;
      updatePageState(i);
    });
  }, { root: contentEl, threshold: 0.5 });
  pages.forEach((p) => sectionObs.observe(p));
  var tr = $("#transition");
  var trTitle = document.getElementById("trTitle");
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  var transitioning = false;
  function glitchNav(i) {
    const id = pages[i].id, isWork = pages[i].classList.contains("work-page");
    navLinks.forEach((l) => {
      const h = l.getAttribute("href"), tgt = h === "#" + id || isWork && h === "#works";
      l.classList.remove("glitch");
      if (tgt) {
        void l.offsetWidth;
        l.classList.add("glitch");
        setTimeout(() => l.classList.remove("glitch"), 900);
      }
    });
  }
  async function transitionTo(i) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    if (transitioning || i === idx) return;
    if (i > 1) {
      previewing = false;
      idx = i;
      lenis.scrollTo(pages[i].offsetTop, { duration: 1.1 });
      updatePageState(i);
      return;
    }
    transitioning = true;
    previewing = false;
    glitchNav(i);
    if (i !== 0) window._liquidClear?.();
    const isDark = i === 0;
    tr.className = "transition" + (isDark ? " dark" : "");
    trTitle.textContent = (pages[i].dataset.title || "").toUpperCase();
    trTitle.style.cssText = "";
    trTitle.classList.toggle("dark", isDark);
    void tr.offsetWidth;
    tr.classList.add("slab-open");
    await sleep(920);
    trTitle.classList.add("show");
    await sleep(600);
    tr.classList.remove("slab-open");
    tr.classList.add("slab-hold");
    setPage(i);
    await sleep(80);
    tr.classList.remove("slab-hold");
    trTitle.classList.remove("show");
    tr.classList.add("slab-fade");
    await sleep(680);
    tr.className = "transition";
    transitioning = false;
    if (i === 0 && !liquidRiftActive) {
      window._cursorStartDesolidify?.();
      $("#liquid").classList.add("show");
      liquidDraw(true);
    } else if (cursorEl) {
      cursorEl.classList.toggle("home", i === 0);
      cursorEl.classList.toggle("solid", i > 0);
    }
  }
  var scrollLineEl = document.getElementById("scrollLine");
  function onScrollDriven() {
    if (transitioning) return;
    const sy = contentEl.scrollTop;
    const vh = window.innerHeight;
    const PHASE2_END = 1.5;
    let slabT = 0, slabPage = null;
    pages.forEach((page, i) => {
      if (i === 0) return;
      if (i > 1) {
        if (page.style.clipPath !== "") page.style.clipPath = "";
        revealPage(page);
        return;
      }
      const top = page.offsetTop;
      const t = (sy - (top - vh * 0.55)) / (vh * 0.7);
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
        if (t > slabT) {
          slabT = t;
          slabPage = page;
        }
      } else {
        page.style.clipPath = "inset(0 0 100% 0)";
        if (t > 0) revealPage(page);
        if (t > 0 && t > slabT) {
          slabT = t;
          slabPage = page;
        }
      }
    });
    if (slabPage) {
      trTitle.textContent = (slabPage.dataset.title || "").toUpperCase();
      trTitle.classList.remove("show", "dark");
      tr.className = "transition slab-scroll";
      trTitle.style.fontSize = slabPage.id === "about" ? "clamp(195px,31vw,430px)" : "";
      if (slabT <= 1) {
        const inset = (50 * (1 - slabT)).toFixed(2);
        tr.style.clipPath = `inset(${inset}% 0)`;
        trTitle.style.top = "50%";
        const titleOpacity = Math.max(0, Math.min(1, (slabT - 0.35) / 0.3));
        const titleScale = (0.88 + 0.12 * Math.min(1, (slabT - 0.35) / 0.45)).toFixed(3);
        trTitle.style.transform = `translate(-50%, calc(-50% + 0.12em)) scale(${titleScale})`;
        trTitle.style.opacity = titleOpacity.toFixed(3);
      } else {
        const t2 = (slabT - 1) / (PHASE2_END - 1);
        const bottomInset = (t2 * 100).toFixed(2);
        tr.style.clipPath = `inset(0 0 ${bottomInset}% 0)`;
        trTitle.style.top = "50%";
        trTitle.style.transform = "translate(-50%, calc(-50% + 0.12em)) scale(1)";
        const titleFade = Math.max(0.1, 1 - t2 / 0.7);
        trTitle.style.opacity = titleFade.toFixed(3);
      }
    } else {
      if (tr.classList.contains("slab-scroll")) {
        tr.className = "transition";
        tr.style.clipPath = "";
      }
      const _aboutEl = pages[1];
      const _infoStart = _aboutEl ? _aboutEl.offsetTop + window.innerHeight * 0.5 : Infinity;
      if (contentEl.scrollTop < _infoStart) trTitle.style.cssText = "";
    }
    scrollLineEl.style.opacity = "0";
    window._slabActive = slabPage !== null;
    if (cursorEl) {
      const onHero = sy < vh * 0.15;
      const nowSlabActive = slabPage !== null;
      window._prevSlabActive = nowSlabActive;
      const wantSolid = !onHero;
      const wasSolid = cursorEl.classList.contains("solid");
      const isDesolidifying = !!window._cursorDesolidifying;
      if (wantSolid && isDesolidifying) {
        window._cursorCancelDesolidify?.();
        cursorEl.classList.remove("home");
        cursorEl.classList.add("solid");
        window._liquidClear?.();
      } else if (!wantSolid && wasSolid && !isDesolidifying && !liquidRiftActive) {
        window._cursorStartDesolidify?.();
        $("#liquid").classList.add("show");
        liquidDraw(true);
      } else if (!isDesolidifying) {
        cursorEl.classList.toggle("home", !wantSolid);
        cursorEl.classList.toggle("solid", wantSolid);
        if (wantSolid && !wasSolid) {
          window._liquidClear?.();
          window._cursorStartSolidify?.();
        }
      }
    }
  }
  contentEl.addEventListener("scroll", onScrollDriven, { passive: true });
  onScrollDriven();
  (function heroOpacityLoop() {
    const heroStatEl = document.querySelector(".hero-statement");
    const heroThumbEl = document.getElementById("heroThumbs");
    if (heroStatEl) heroStatEl.style.transition = "none";
    if (heroThumbEl) heroThumbEl.style.transition = "none";
    (function loop() {
      requestAnimationFrame(loop);
      const sy = contentEl.scrollTop;
      const vh = window.innerHeight;
      const st = pages[1] ? (sy - (pages[1].offsetTop - vh)) / vh : -1;
      const op = st >= 0.8 ? Math.max(0, 1 - (st - 0.8) * 10) : 1;
      if (heroStatEl) heroStatEl.style.opacity = op.toFixed(3);
      if (heroThumbEl) heroThumbEl.style.opacity = op.toFixed(3);
    })();
  })();
  document.querySelectorAll("[data-link]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    previewing = false;
    const id = a.getAttribute("href").slice(1);
    const i = pages.findIndex((p) => p.id === id);
    if (i >= 0) transitionTo(i);
  }));
  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !matchMedia("(hover:hover) and (pointer:fine)").matches) {
      cursor && (cursor.style.display = "none");
      return;
    }
    const ring = cursor.querySelector(".cur-ring");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        cursor.classList.add("on");
      }
    }, { passive: true });
    addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) cursor.classList.remove("on");
    });
    const clearAnim = () => ring.classList.remove("solidify", "desolidify");
    window._cursorStartSolidify = () => {
      clearAnim();
      void ring.offsetWidth;
      cursor.style.opacity = "1";
      cursor.classList.remove("home");
      cursor.classList.add("solid");
      ring.classList.add("solidify");
    };
    window._cursorStartDesolidify = () => {
      clearAnim();
      void ring.offsetWidth;
      cursor.style.opacity = "1";
      cursor.classList.add("solid");
      window._cursorDesolidifying = true;
      ring.classList.add("desolidify");
    };
    window._cursorCancelDesolidify = () => {
      clearAnim();
      window._cursorDesolidifying = false;
      cursor.style.opacity = "";
      cursor.classList.add("solid");
      cursor.classList.remove("home");
    };
    ring.addEventListener("animationend", (e) => {
      if (e.animationName === "cur-desolidify") {
        window._cursorDesolidifying = false;
        clearAnim();
        cursor.classList.remove("solid");
        cursor.classList.add("home");
        cursor.style.opacity = "";
      } else if (e.animationName === "cur-solidify") {
        clearAnim();
        cursor.style.opacity = "";
      }
    });
    (function loop() {
      requestAnimationFrame(loop);
      if (cursor.classList.contains("solid")) {
        rx = mx;
        ry = my;
      } else {
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
      }
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    })();
  }
  buildHeroThumbs();
  buildArchive();
  splitHeadings();
  startClock();
  initCursor();
  initLiquid();
  matchThumbHeight();
  addEventListener("resize", matchThumbHeight);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(matchThumbHeight);
    const s = $(".hero-statement");
    if (s) ro.observe(s);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(matchThumbHeight);
  var _hs = document.querySelector(".hero-statement");
  var _ht = document.getElementById("heroThumbs");
  if (_hs) _hs.style.transform = "";
  if (_ht) _ht.style.transform = "";
  setPage(0);
  function initInfoScroll() {
    const infoBg = document.getElementById("info-bg");
    const infoWrap = document.getElementById("info-photos");
    const photoL = document.getElementById("info-photo-l");
    const photoCWrap = document.getElementById("info-photo-c-wrap");
    const photoR = document.getElementById("info-photo-r");
    const flipper = document.getElementById("info-flipper");
    const textL = document.getElementById("info-text-l");
    const textR = document.getElementById("info-text-r");
    const infoSvc = document.getElementById("info-services");
    const svcItems = infoSvc ? [...infoSvc.querySelectorAll(".is-item")] : [];
    const projPrev = document.getElementById("info-proj-preview");
    if (!infoBg || !photoL || !photoCWrap || !photoR || !flipper) return;
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
        card.querySelector(".ipp-num").textContent = `[0${i + 1}]`;
        card.querySelector(".ipp-title").textContent = p.title;
        card.querySelector(".ipp-tag").textContent = p.tag;
        card.querySelector(".ipp-scope").innerHTML = p.scope.map((s) => `<li>${s}</li>`).join("");
        const cta = card.querySelector(".ipp-cta");
        cta.href = `#${p.id}`;
        const pi = i;
        cta.addEventListener("click", (e) => {
          e.preventDefault();
          transitionTo(pages.indexOf(projectPages[pi]));
        });
        const img = card.querySelector("img");
        img.src = p.images[0];
        img.id = `ipp-img-${i}`;
        card.style.opacity = "0";
        projCards.push(card);
      }
    }
    const svcWm = infoSvc ? infoSvc.querySelector(".is-watermark") : null;
    const cl = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
    const eo = (t) => 1 - Math.pow(1 - cl(t, 0, 1), 3);
    const ss = (t) => {
      const c = cl(t, 0, 1);
      return c * c * (3 - 2 * c);
    };
    const WM_FROM = [205, 197, 250], WM_TO = [43, 44, 54];
    const lerpWmColor = (t) => `rgb(${WM_FROM.map((c, i) => Math.round(c + (WM_TO[i] - c) * cl(t, 0, 1))).join(",")})`;
    let archiveEntryFired = false;
    let _scrollLocked = false, _lockedAt = 0, _safeLockPos = 0;
    let _archiveTriggerTop = null, _lastProjCard = null;
    const _fireArchiveEntry = () => {
      if (archiveEntryFired || _archiveTriggerTop == null) return;
      archiveEntryFired = true;
      _safeLockPos = _archiveTriggerTop - 4;
      _lockedAt = _safeLockPos;
      _scrollLocked = true;
      lenis.stop();
      contentEl.style.overflowY = "hidden";
      contentEl.scrollTop = _safeLockPos;
      const cardImg = _lastProjCard?.querySelector("img");
      if (cardImg) window._startArchiveEntry?.(cardImg);
    };
    window._unlockArchiveScroll = () => {
      if (!_scrollLocked) return;
      _scrollLocked = false;
      contentEl.style.overflowY = "";
      scrollJump(_safeLockPos);
      lenis.start();
    };
    let _archiveCooldownUntil = 0;
    window._resetArchiveEntry = () => {
      _archiveCooldownUntil = performance.now() + 900;
      archiveEntryFired = false;
    };
    contentEl.addEventListener("scroll", () => {
      if (_scrollLocked) {
        contentEl.scrollTop = _lockedAt;
        return;
      }
      if (archiveEntryFired || _archiveTriggerTop == null) return;
      if (contentEl.scrollTop <= _archiveTriggerTop) return;
      if (performance.now() <= _archiveCooldownUntil) {
        scrollJump(_archiveTriggerTop - 4);
      } else {
        _fireArchiveEntry();
      }
    }, { passive: false });
    let _animSy = contentEl.scrollTop;
    (function loop() {
      requestAnimationFrame(loop);
      const aboutEl = pages[1];
      if (!aboutEl) return;
      const syReal = contentEl.scrollTop;
      _animSy += (syReal - _animSy) * 0.16;
      if (Math.abs(syReal - _animSy) < 0.4) _animSy = syReal;
      const sy = _animSy;
      const vh = window.innerHeight;
      const top = aboutEl.offsetTop;
      const h = aboutEl.offsetHeight;
      const animStart = top + vh * 0.5;
      const photoRange = vh * 1.8;
      const photoDwell = vh * 0.6;
      const photoEnd = animStart + photoRange;
      const svcStart = photoEnd + photoDwell;
      const SVC_SCROLL = vh * 2;
      const svcEnd = svcStart + SVC_SCROLL;
      const svcRange = SVC_SCROLL;
      const PROJ_SCROLL = vh * 1.2;
      const projZoneStart = svcEnd;
      const infoT = cl((syReal - animStart) / photoRange, 0, 1);
      const bgOp = cl((syReal - animStart) / (vh * 0.15), 0, 1);
      infoBg.style.opacity = bgOp.toFixed(3);
      if (infoWrap) infoWrap.style.opacity = bgOp.toFixed(3);
      const entY = (1 - cl(infoT / 0.22, 0, 1)) * vh;
      const parY = -cl((infoT - 0.22) / 0.36, 0, 1) * vh * 0.2;
      const exY = -cl((infoT - 0.58) / 0.2, 0, 1) * vh * 1.1;
      const sideYL = entY + parY + exY;
      const sideYR = sideYL;
      const centerY = (1 - cl(infoT / 0.22, 0, 1)) * vh;
      const flipDeg = cl((infoT - 0.75) / 0.18, 0, 1) * 180;
      const textY = (1 - cl((infoT - 0.75) / 0.2, 0, 1)) * vh;
      photoL.style.transform = `translateY(${sideYL.toFixed(1)}px)`;
      photoR.style.transform = `translateY(${sideYR.toFixed(1)}px)`;
      photoCWrap.style.transform = `translateY(${centerY.toFixed(1)}px)`;
      flipper.style.transform = `rotateY(${flipDeg.toFixed(1)}deg)`;
      if (textL) textL.style.transform = `translateY(${textY.toFixed(1)}px)`;
      if (textR) textR.style.transform = `translateY(${textY.toFixed(1)}px)`;
      const svcExitT = cl((sy - svcEnd) / (vh * 0.5), 0, 1);
      const svcExitY = -(eo(svcExitT) * vh);
      if (infoSvc) {
        const svcWipe = cl((sy - svcStart) / (vh * 0.7), 0, 1);
        infoSvc.style.opacity = svcWipe > 0 ? "1" : "0";
        infoSvc.style.clipPath = svcWipe < 1 ? `inset(${(50 * (1 - svcWipe)).toFixed(2)}% 0)` : "none";
        infoSvc.style.transform = `translateY(${svcExitY.toFixed(1)}px)`;
        const svcT = cl((sy - svcStart) / svcRange, 0, 1);
        const ITEM_LEAD = 0.42;
        if (svcWm) {
          const titleOpacity = cl((svcWipe - 0.35) / 0.3, 0, 1);
          const titleScale = 0.88 + 0.12 * cl((svcWipe - 0.35) / 0.45, 0, 1);
          svcWm.style.opacity = titleOpacity.toFixed(3);
          svcWm.style.transform = `translate(-50%, calc(-50% + 0.12em)) scale(${titleScale.toFixed(3)})`;
          const colorT = cl((svcT - ITEM_LEAD) / 0.22, 0, 1);
          svcWm.style.color = lerpWmColor(eo(colorT));
        }
        svcItems.forEach((item, i) => {
          const t = cl((svcT - ITEM_LEAD - i * 0.1) / 0.4, 0, 1);
          item.style.transform = `translateY(${((1 - eo(t)) * 70).toFixed(1)}px)`;
          item.style.opacity = eo(t).toFixed(3);
        });
      }
      const PROJ_STEP = PROJ_SCROLL - vh * 0.4;
      const archiveTop = document.getElementById("posters")?.offsetTop ?? top + h;
      projCards.forEach((card, i) => {
        const cardStart = projZoneStart + i * PROJ_STEP;
        const cardEnd = cardStart + PROJ_SCROLL;
        const enterT = cl((sy - cardStart) / (vh * 0.4), 0, 1);
        const exitT = cl((sy - (cardEnd - vh * 0.4)) / (vh * 0.4), 0, 1);
        const enterY = (1 - eo(enterT)) * vh;
        const exitY = -(eo(exitT) * vh);
        const isLast = i === N_PROJ - 1;
        const lastCardFullyAt = cardStart + vh * 0.4;
        const archiveExitT = isLast ? cl((sy - (lastCardFullyAt + vh * 0.2)) / (vh * 0.3), 0, 1) : 0;
        const archiveExitY = -(eo(archiveExitT) * vh * 0.6);
        const translateY = isLast ? enterT < 1 ? enterY : archiveExitT > 0 ? archiveExitY : 0 : exitT > 0 ? exitY : enterY;
        const opacity = isLast ? enterT > 0 ? Math.max(0, 1 - archiveExitT * 2) : 0 : enterT > 0 ? 1 : 0;
        card.style.transform = `translateY(${translateY.toFixed(1)}px)`;
        card.style.opacity = opacity.toFixed(3);
        if (isLast) {
          _archiveTriggerTop = lastCardFullyAt + vh * 0.2;
          _lastProjCard = card;
        }
        if (isLast && enterT >= 1 && archiveExitT === 0 && !archiveEntryFired) {
          const restImg = card.querySelector("img");
          if (restImg) window._archiveCardRect = restImg.getBoundingClientRect();
        }
        if (isLast && !archiveEntryFired && archiveExitT > 0) {
          if (performance.now() <= _archiveCooldownUntil) {
            scrollJump(_archiveTriggerTop - 4);
          } else {
            _fireArchiveEntry();
          }
        }
      });
      if (sy >= animStart) {
        trTitle.textContent = "INFO";
        trTitle.classList.remove("show", "dark");
        trTitle.style.fontSize = "clamp(195px,31vw,430px)";
        trTitle.style.top = "50%";
        trTitle.style.transform = "translate(-50%, calc(-50% + 0.12em)) scale(1)";
        const fadeOut = cl((photoEnd + vh * 0.4 - syReal) / (vh * 0.3), 0, 1);
        const flipFade = 1 - cl((infoT - 0.75) / 0.18, 0, 1);
        trTitle.style.opacity = (0.1 * fadeOut * flipFade).toFixed(3);
      }
    })();
  }
  initInfoScroll();
  (function matchWorkWatermarkToInfo() {
    const wm = document.querySelector(".is-watermark");
    if (!wm) return;
    function resize() {
      const infoSize = Math.min(430, Math.max(195, window.innerWidth * 0.31));
      const cvs = document.createElement("canvas");
      const ctx = cvs.getContext("2d");
      ctx.font = `400 ${infoSize}px Dirtyline`;
      const infoW = ctx.measureText("INFO").width;
      ctx.font = `400 ${infoSize}px Dirtyline`;
      const workW = ctx.measureText("WORK").width;
      const ratio = infoW / workW;
      wm.style.fontSize = (infoSize * ratio * 1.03).toFixed(1) + "px";
    }
    resize();
    window.addEventListener("resize", resize);
  })();
})();

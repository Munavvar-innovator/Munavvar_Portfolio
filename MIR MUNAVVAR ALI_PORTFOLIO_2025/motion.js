/* ==========================================================================
   Mir Munavvar Ali — Motion layer
   --------------------------------------------------------------------------
   1. CAD drafting layer      (vanilla JS + CSS, no dependencies)
   2. Card micro-interactions (vanilla JS + CSS: tilt, coordinates, borders)
   3. Scroll choreography     (GSAP + ScrollTrigger from the CDN)

   Rules this file follows
   • Only `transform` and `opacity` are ever animated (compositor-only).
   • Parts 1 and 2 keep working if the GSAP CDN is blocked; part 3 degrades
     to the plain IntersectionObserver reveal in script.js.
   • prefers-reduced-motion: no GSAP animation, no tilt/tracking, no parallax.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  clearTimeout(window.__motionGuard);                 // head guard: "motion.js did load"

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouseMQ  = window.matchMedia('(hover: hover) and (pointer: fine)');
  const conn = navigator.connection || {};
  // Low-end / data-saver devices keep the reveals but skip the continuous effects.
  const LITE = Boolean(conn.saveData) ||
               (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
               (navigator.deviceMemory && navigator.deviceMemory <= 2);

  const MM_PER_PX = 0.26458;                          // CSS px → millimetres at 96 dpi (real units, used by the readouts)

  /* ======================================================================
     1. CAD drafting layer
     Mechanical principle: registration marks and dimension lines behave like
     a drafting overlay being brought into alignment with each workpiece.
     ====================================================================== */
  function initCadLayer() {
    const grid = $('.cad-bg');
    const scan = $('.cad-scan');

    // ── Section accents: registration marks + dimension line ──
    const hostSelectors = ['.hero', '.about', '.experience', '.archive-gallery',
                           '.process-section', '.expertise', '.contact'];
    const accents = new WeakMap();
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(onSectionBand, { rootMargin: '-18% 0px -18% 0px', threshold: 0 })
      : null;

    hostSelectors.map(s => $(s)).filter(Boolean).forEach(host => {
      host.classList.add('cad-host');
      const accent = document.createElement('div');
      accent.className = 'cad-accent';
      accent.setAttribute('aria-hidden', 'true');
      accent.innerHTML =
        `<div class="cad-frame${host.classList.contains('section-wrap') ? ' is-full' : ''}">` +
        '<i class="cad-mark tl"></i><i class="cad-mark tr"></i><i class="cad-mark br"></i><i class="cad-mark bl"></i>' +
        '<i class="cad-dim"></i><span class="cad-dim-label"></span></div>';
      host.appendChild(accent);
      accents.set(host, accent);
      if (io) io.observe(host); else accent.classList.add('is-in');
    });

    let lastPulse = 0;
    function pulse() {
      const now = performance.now();
      if (now - lastPulse < 600 || !grid) return;      // consecutive sections shouldn't machine-gun the effect
      lastPulse = now;
      [grid, scan].forEach(el => {
        if (!el) return;
        el.classList.remove('pulse');
        void el.offsetWidth;                           // restart the CSS animation
        el.classList.add('pulse');
      });
    }

    function onSectionBand(entries) {
      entries.forEach(entry => {
        const accent = accents.get(entry.target);
        if (!accent) return;
        if (entry.isIntersecting) {
          const frame = $('.cad-frame', accent);
          const label = $('.cad-dim-label', accent);
          if (label && !label.textContent) {          // one measurement, first time only
            label.textContent = `${(frame.offsetWidth * MM_PER_PX).toFixed(1)} MM`;
          }
          accent.classList.add('is-in');
          pulse();
        } else {
          accent.classList.remove('is-in');            // marks re-draw each time you come back
        }
      });
    }

    // ── Grid parallax: the grid drifts at 20% of scroll speed (transform only) ──
    if (grid && !reduceMQ.matches && !LITE) {            // static grid on low-end / data-saver devices
      const PERIOD = 56, RATE = 0.2;
      let queued = false;
      const write = () => {
        queued = false;
        const y = -((window.scrollY * RATE) % PERIOD);
        grid.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
      };
      window.addEventListener('scroll', () => {
        if (!queued) { queued = true; requestAnimationFrame(write); }
      }, { passive: true });
      write();
    }
  }

  /* ======================================================================
     2. Card micro-interactions
     Mechanical principle: pointer input acts like a toolhead; exponential
     smoothing gives the card and crosshair realistic inertial follow-through.
     ====================================================================== */
  function initCardFx() {
    const reduced = reduceMQ.matches;
    const mouse = mouseMQ.matches;
    const MAX_TILT = 5.5;          // degrees
    const LIFT = -7;               // px
    const SMOOTH = 0.14;           // exponential smoothing → "inertia"

    const make = (tag, cls, html = '') => {
      const el = document.createElement(tag);
      el.className = cls;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html;
      return el;
    };
    const FRAME = '<i class="fx-edge t"></i><i class="fx-edge r"></i><i class="fx-edge b"></i><i class="fx-edge l"></i>' +
                  '<i class="fx-corner tl"></i><i class="fx-corner tr"></i><i class="fx-corner br"></i><i class="fx-corner bl"></i>';

    const targets = $$('.company-gallery-card').map(host => ({
      host, art: $('.company-logo-disc', host), tilt: false
    })).filter(target => target.art);

    // Shared: one scroll listener marks every cached rect stale
    let rectsStale = false;
    window.addEventListener('scroll', () => { rectsStale = true; }, { passive: true });

    targets.forEach(cfg => {
      const { host, art } = cfg;
      host.classList.add('fx-host');
      host.appendChild(make('span', 'fx-frame', FRAME));
      art.appendChild(make('span', 'fx-scan'));
      if (reduced || !mouse) return;                    // reduced motion: static hover frame only · touch: edges follow .is-active (below)

      const xh = make('span', 'fx-xh', '<i class="v"></i><i class="h"></i>');
      const readout = make('span', 'fx-readout');
      art.append(xh, readout);
      let glare = null;
      if (cfg.tilt && !LITE) {
        host.classList.add('fx-tilt');
        host.appendChild(make('span', 'fx-glare', '<i></i>'));
        glare = $('.fx-glare i', host);
      }

      const xv = $('.v', xh), xhz = $('.h', xh);
      const s = { hover: false, raf: 0, rect: null, artRect: null, first: true,
                  tx: 0, ty: 0, cx: 0, cy: 0, lift: 0, px: 0, py: 0, qx: 0, qy: 0, last: '', lastText: 0, t: 0 };

      const measure = () => { s.rect = host.getBoundingClientRect(); s.artRect = art.getBoundingClientRect(); };

      const write = () => {
        if (cfg.tilt && glare) {
          host.style.transform =
            `perspective(1100px) translate3d(0,${s.lift.toFixed(2)}px,0) ` +
            `rotateX(${(-s.cy * MAX_TILT).toFixed(3)}deg) rotateY(${(s.cx * MAX_TILT).toFixed(3)}deg)`;
          const r = s.rect;
          if (r) glare.style.transform = `translate3d(${(s.cx * r.width * 0.5).toFixed(1)}px,${(s.cy * r.height * 0.5).toFixed(1)}px,0)`;
        }
        xv.style.transform  = `translate3d(${s.qx.toFixed(1)}px,0,0)`;
        xhz.style.transform = `translate3d(0,${s.qy.toFixed(1)}px,0)`;
        const pad = n => n.toFixed(1).padStart(5, '0');
        let text = `X ${pad(s.qx * MM_PER_PX)}  Y ${pad(s.qy * MM_PER_PX)}`;
        if (glare) text += `  θ ${(Math.hypot(s.cx, s.cy) * MAX_TILT).toFixed(1).padStart(4, '0')}°`;
        // Text changes are the only thing here that touches layout, so cap them at ~20 Hz (position/crosshair stay per-frame).
        const now = performance.now();
        if (text !== s.last && now - s.lastText > 50) { readout.textContent = text; s.last = text; s.lastText = now; }
      };

      const step = now => {
        s.raf = 0;
        // Time-based smoothing: identical feel at 60, 120 or 144 Hz (a per-frame factor would be 2× snappier at 120 Hz).
        const dt = s.t ? Math.min(50, now - s.t) : 16.667;
        s.t = now;
        const k  = 1 - Math.pow(1 - SMOOTH, dt / 16.667);
        const kq = 1 - Math.pow(1 - 0.35,   dt / 16.667); // crosshair follows tighter than the tilt
        s.cx += (s.tx - s.cx) * k;
        s.cy += (s.ty - s.cy) * k;
        s.lift += ((s.hover ? LIFT : 0) - s.lift) * k;
        s.qx += (s.px - s.qx) * kq;
        s.qy += (s.py - s.qy) * kq;
        write();
        const converged =
          Math.abs(s.tx - s.cx) < 0.002 && Math.abs(s.ty - s.cy) < 0.002 &&
          Math.abs((s.hover ? LIFT : 0) - s.lift) < 0.02 &&
          Math.abs(s.px - s.qx) < 0.05 && Math.abs(s.py - s.qy) < 0.05;
        if (converged) {                                 // idle → stop spending frames
          s.t = 0;
          if (!s.hover) {
            host.style.transform = '';
            host.classList.remove('is-tilting', 'is-tracking');
          }
          return;
        }
        s.raf = requestAnimationFrame(step);
      };
      const run = () => { if (!s.raf) s.raf = requestAnimationFrame(step); };

      host.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        s.hover = true; s.first = true;
        measure(); rectsStale = false;
        host.classList.add('is-tracking');
        // tilt only once the reveal has finished (the reveal owns `transform` until then)
        if (cfg.tilt && glare && host.classList.contains('visible')) host.classList.add('is-tilting');
        run();
      });
      host.addEventListener('pointermove', e => {
        if (!s.hover || e.pointerType !== 'mouse') return;
        if (rectsStale) { measure(); rectsStale = false; }
        const r = s.rect, a = s.artRect;
        s.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        s.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
        s.px = clamp(e.clientX - a.left, 0, a.width);
        s.py = clamp(e.clientY - a.top, 0, a.height);
        if (s.first) { s.qx = s.px; s.qy = s.py; s.first = false; }
        run();
      });
      host.addEventListener('pointerleave', () => {
        s.hover = false; s.tx = 0; s.ty = 0;
        run();
      });
    });

    // Touch / coarse pointers have no hover: draw the frame on whichever cards sit mid-screen.
    if (!mouse && !reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e =>
        e.target.classList.toggle('is-active', e.isIntersecting)), { rootMargin: '-38% 0px -38% 0px' });
      targets.forEach(t => io.observe(t.host));
    }
  }

  /* ======================================================================
     3. GSAP scroll choreography
     Mechanical principle: content parts translate along constrained axes and
     settle with a small latch-like overshoot, as components seating in a jig.
     ====================================================================== */
  function initChoreography(gsap, ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    try { ScrollTrigger.config({ ignoreMobileResize: true }); } catch { /* option not present in this build */ }

    const EASE = {
      out:   'expo.out',          // fast start, long inertial settle
      latch: 'back.out(0.6)',     // ~3% overshoot → a part seating itself
    };

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => build());

    // Filters change page height → recompute trigger positions.
    window.addEventListener('portfolio:layout', () => ScrollTrigger.refresh());

    function build() {
      const handled = new Set();
      const take = sel => $$(sel).filter(el => { if (handled.has(el)) return false; handled.add(el); return true; });

      // Hand the element back to CSS: add .visible (CSS now says opacity:1), then drop GSAP's inline styles.
      const settle = el => {
        el.style.transition = '';
        el.classList.add('visible');
        gsap.set(el, { clearProps: 'opacity,transform' });
      };
      const quiet = el => { el.style.transition = 'none'; };    // GSAP drives it; CSS transitions must not fight

      // Fire `fn` once, the first time `trigger` reaches `start` (from either direction).
      function once(trigger, start, fn) {
        let done = false;
        const go = self => { if (done) return; done = true; fn(); self.kill(); };
        ScrollTrigger.create({ trigger, start, onEnter: go, onEnterBack: go });
      }

      // A single element that slides along one axis into place.
      function slide(el, from, { dur = 1.1, ease = EASE.out, delay = 0, start = 'top 88%' } = {}) {
        once(el, start, () => {
          quiet(el);
          gsap.fromTo(el, { opacity: 0, ...from },
            { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: dur, ease, delay, overwrite: 'auto', onComplete: () => settle(el) });
        });
      }

      // Several parts that converge on their slots ("assembly"). `fromFn(i)` gives each part's start offset.
      function assemble(trigger, parts, fromFn, { start = 'top 82%', stagger = 0.12, dur = 1.25, ease = EASE.latch } = {}) {
        gsap.set(parts, { opacity: 0 });
        once(trigger, start, () => {
          parts.forEach(quiet);
          gsap.fromTo(parts, { opacity: 0, x: (i) => fromFn(i).x || 0, y: (i) => fromFn(i).y || 0, rotation: (i) => fromFn(i).r || 0 },
            { opacity: 1, x: 0, y: 0, rotation: 0, duration: dur, ease, stagger, overwrite: 'auto', onComplete: () => parts.forEach(settle) });
        });
      }

      const narrow = window.matchMedia('(max-width: 640px)').matches;

      /* ── Hero: one orchestrated entrance ───────────────────────────── */
      const heroParts = $$('.hero-stagger');
      if (heroParts.length) {
        const [eyebrow, h1, intro, actions, quick, meta] =
          ['.eyebrow', 'h1', '.hero-intro', '.hero-actions', '.quick-actions', '.hero-meta'].map(s => $(s, $('.hero-copy')));
        heroParts.forEach(quiet);
        // Each part hands itself back to CSS when *its own* tween finishes (they end at different times).
        const enter = (els, from, to) => gsap.fromTo(els, from, { ...to, ease: EASE.out, overwrite: 'auto',
          onComplete: () => [].concat(els).forEach(settle) });
        enter(eyebrow,           { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 1.1 });
        enter(h1,                { y: 44 },              { y: 0, duration: 1.6, delay: 0.05 });
        enter(intro,             { opacity: 0, y: 22 },  { opacity: 1, y: 0, duration: 1.1, delay: 0.3 });
        enter([actions, quick],  { opacity: 0, y: 18 },  { opacity: 1, y: 0, duration: 1, delay: 0.42, stagger: 0.12 });
        enter(meta,              { opacity: 0, y: 14 },  { opacity: 1, y: 0, duration: 1, delay: 0.62 });
      }

      /* ── Section kickers: label slides in, rule draws left → right ── */
      take('.section-kicker.reveal').forEach(k => {
        const line = $('.line', k);
        once(k, 'top 90%', () => {
          quiet(k);
          gsap.fromTo(k, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.9, ease: EASE.out, onComplete: () => settle(k) });
          if (line) gsap.fromTo(line, { scaleX: 0, transformOrigin: '0% 50%' },
            { scaleX: 1, duration: 1.2, ease: EASE.out, delay: 0.15, onComplete: () => gsap.set(line, { clearProps: 'transform,transformOrigin' }) });
        });
      });

      /* ── Headings glide in along a rail; their side-copy arrives from the opposite end ── */
      take('.section-title.reveal').forEach(el => slide(el, { x: -64 }, { dur: 1.4 }));
      take('.experience-head > p.reveal, .work-heading > p.reveal').forEach(el => slide(el, { x: 44 }, { dur: 1.2, delay: 0.12 }));
      take('.about-copy.reveal').forEach(el => slide(el, { x: 56 }, { dur: 1.3, delay: 0.1 }));

      /* ── Stats ── */
      take('.stat-row.reveal').forEach(row => {
        const parts = $$('.stat, .stat-note', row);
        row.classList.add('visible');                              // no background → safe to show the empty row
        assemble(row, parts, () => ({ y: 34 }), { stagger: 0.1, dur: 1.1, ease: EASE.out, start: 'top 90%' });
      });

      /* ── Proof band: the "jig" fades in, then three parts converge into it ── */
      take('.proof-band.reveal').forEach(band => {
        const items = $$('.proof-item', band);
        const xs = [-70, 0, 70], ys = [28, 54, 28], rs = [-1.4, 0, 1.4];
        gsap.set(items, { opacity: 0 });
        once(band, 'top 82%', () => {
          quiet(band);
          gsap.fromTo(band, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out', onComplete: () => settle(band) });
          items.forEach(quiet);
          gsap.fromTo(items, { opacity: 0, x: i => xs[i % 3], y: i => ys[i % 3], rotation: i => rs[i % 3] },
            { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1.25, ease: EASE.latch, delay: 0.15, stagger: 0.12, overwrite: 'auto', onComplete: () => items.forEach(settle) });
        });
      });

      /* ── Experience timeline: date plate and panel arrive from opposite sides; a weld seam draws ── */
      take('.timeline-item.reveal').forEach(item => {
        const date = $('.timeline-date', item), main = $('.timeline-main', item);
        item.classList.add('visible');
        gsap.set([date, main], { opacity: 0 });
        once(item, 'top 86%', () => {
          [date, main].forEach(quiet);
          item.classList.add('is-welded');
          gsap.fromTo(date, { opacity: 0, x: narrow ? -28 : -48 }, { opacity: 1, x: 0, duration: 1.1, ease: EASE.out, onComplete: () => settle(date) });
          gsap.fromTo(main, { opacity: 0, x: narrow ? 36 : 72 },   { opacity: 1, x: 0, duration: 1.3, ease: EASE.latch, delay: 0.12, onComplete: () => settle(main) });
        });
      });

      /* ── Project cards: assemble from alternating sides, then flash their corner brackets ── */
      take('.project-card.reveal').forEach((card, i) => {
        const from = i === 0 ? { y: 72 } : { x: (i % 2 === 1 ? -54 : 54), y: 36 };
        once(card, 'top 90%', () => {
          quiet(card);
          gsap.fromTo(card, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, duration: 1.25, ease: EASE.latch, overwrite: 'auto',
            onComplete: () => { settle(card); card.classList.add('is-assembled'); } });
        });
      });

      /* ── Archive images: batched so a row arrives together, with a short stagger ── */
      const archive = take('.archive-card.reveal');
      if (archive.length) {
        const seen = new WeakSet();
        const flush = batch => {
          const els = batch.filter(e => !seen.has(e));
          if (!els.length) return;
          els.forEach(e => { seen.add(e); quiet(e); });
          gsap.fromTo(els, { opacity: 0, y: 36, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: EASE.out, stagger: 0.07, overwrite: 'auto', onComplete: () => els.forEach(settle) });
        };
        ScrollTrigger.batch(archive, { start: 'top 94%', interval: 0.1, batchMax: 6, onEnter: flush, onEnterBack: flush });
      }

      /* ── Process: four parts converge from the outside in, each welded to the rail as it lands ── */
      const steps = take('.process-step.reveal');
      const grid = $('.process-grid');
      if (grid && steps.length) {
        const fromFn = i => narrow ? { x: i % 2 ? 40 : -40, y: 18 }
                                   : { x: (i - 1.5) * 60, y: 26, r: (i % 2 ? 1.2 : -1.2) };
        gsap.set(steps, { opacity: 0 });
        once(grid, 'top 80%', () => {
          steps.forEach((el, i) => { quiet(el); setTimeout(() => el.classList.add('is-welded'), 250 + i * 140); });
          gsap.fromTo(steps, { opacity: 0, x: i => fromFn(i).x, y: i => fromFn(i).y, rotation: i => fromFn(i).r || 0 },
            { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1.3, ease: EASE.latch, stagger: 0.13, overwrite: 'auto', onComplete: () => steps.forEach(settle) });
        });
      }

      /* ── Expertise: groups slide in from alternating sides ── */
      take('.skill-group.reveal').forEach((el, i) => slide(el, { x: narrow ? 0 : (i % 2 ? 56 : -56), y: narrow ? 28 : 18 }, { dur: 1.25, ease: EASE.latch }));

      /* ── Contact ── */
      take('.contact-panel.reveal').forEach(el => slide(el, { y: 80, scale: 0.985 }, { dur: 1.4, ease: EASE.latch, start: 'top 88%' }));

      /* ── Anything left over (filter bar, recruiter note, education strip, …) ── */
      take('.reveal').forEach(el => slide(el, { y: 28 }, { dur: 1 }));

      /* ── Safety net: anything already scrolled past (deep link, reload mid-page) must not stay hidden ── */
      window.setTimeout(() => {
        $$('.reveal:not(.visible)').forEach(el => { if (el.getBoundingClientRect().bottom < 0) settle(el); });
      }, 1500);
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  if (root.classList.contains('motion-failed')) return;   // the head guard already gave up on us

  try { initCadLayer(); } catch (err) { console.warn('[motion] CAD layer skipped:', err); }
  try { initCardFx();   } catch (err) { console.warn('[motion] card FX skipped:', err); }

  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) {
    try {
      initChoreography(gsap, ScrollTrigger);
      root.classList.add('gsap');
    } catch (err) {
      console.warn('[motion] GSAP choreography failed; falling back to plain reveals:', err);
      root.classList.add('motion-failed');                // CSS shows everything, un-animated
    }
  } else {
    root.classList.add('no-gsap');                        // CDN blocked/offline: script.js's IntersectionObserver reveal runs instead
  }
})();

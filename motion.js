// ScreenGuard landing page: motion. Loaded after landing.js; the page reads fine without it.
// Hero arrival (p1), headlines that write themselves (p2), a small Gardi per section, the medal row,
// dusk that follows the scroll (p5), startle on tap (p6), the queue at the gate and lantern and tilt (p9).
// The classes p1, p2, p5, p6 on <html> are set by an inline script in the page head, and only when the
// visitor has not asked for reduced motion. Under reduced motion every effect below shows a still or its final state.
(() => {
  window.__sgMotion = true;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const has = n => root.classList.contains('p' + n);
  // Asset paths are resolved against this script, so they also work on /de/, /fr/ and /it/.
  const here = (document.currentScript && document.currentScript.src) || ($('script[src*="motion.js"]') || {}).src || location.href;
  const asset = name => new URL('assets/' + name, here).href;

  // Animated WebP that plays once restarts only with a fresh object URL (same trick as landing.js).
  const blobs = new Map();
  const getBlob = url => {
    if (!blobs.has(url)) blobs.set(url, fetch(url).then(r => { if (!r.ok) throw 0; return r.blob(); }).catch(() => null));
    return blobs.get(url);
  };
  const freshUrl = async url => { const b = await getBlob(url); return b ? URL.createObjectURL(b) : url; };
  const restart = async (img, url) => {
    const next = await freshUrl(url);
    const old = img._objUrl;
    img._objUrl = next.startsWith('blob:') ? next : null;
    img.src = next;
    if (old) URL.revokeObjectURL(old);
  };
  const near = (els, onNear, onFar, margin = '300px 0px') => {
    if (!('IntersectionObserver' in window)) { els.forEach(e => onNear(e)); return; }
    const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? onNear : (onFar || (() => {})))(e.target)), { rootMargin: margin });
    els.forEach(e => io.observe(e));
  };

  // ───────── 1 Hero arrival ─────────
  const initHero = () => {
    const g = $('#gardi'), hero = $('#hero');
    const img = g && $('img', g);
    if (!has(1) || !g || !img) return;
    const WALK = asset('g/walk-r.webp'), ARRIVE = asset('g/arrive-r.webp');
    const SPEED = 0.7;        // walking speed in Gardi-heights per second
    const COPY_DELAY = 1200;  // ms after the swap to arrive-r until the headline appears
    const ARRIVE_MS = 3200;
    let run = 0;
    const play = async () => {
      const id = ++run;
      root.classList.add('p1-pre', 'p1-hide');
      root.classList.remove('p1-show');
      g.classList.add('intro');
      const [walkSrc, arriveSrc] = await Promise.race([
        Promise.all([freshUrl(WALK), freshUrl(ARRIVE)]),
        sleep(2500).then(() => [WALK, ARRIVE]),
      ]);
      if (id !== run) return;
      img.src = walkSrc;
      const warm = new Image();                       // decode arrive-r now so the swap cannot flash
      warm.src = arriveSrc;
      await Promise.all([img.decode().catch(() => {}), warm.decode().catch(() => {}), sleep(150)]);
      if (id !== run) return;
      root.classList.remove('p1-pre');                // lamps come on (0.6 s)
      await sleep(550);
      if (id !== run) return;
      const r = g.getBoundingClientRect(), h = hero.getBoundingClientRect();
      const d = Math.max(0, r.right - h.left) + 8;
      const dur = clamp(d / (r.height * SPEED) * 1000, 900, 2000);
      const walk = g.animate([{ transform: `translateX(${-d}px)` }, { transform: 'translateX(0)' }], { duration: dur, easing: 'linear', fill: 'both' });
      root.classList.remove('p1-hide');
      await walk.finished.catch(() => {});
      if (id !== run) return;
      img.src = arriveSrc;                            // turn, stamp, salute (plays once)
      walk.cancel();
      setTimeout(() => { if (id === run) root.classList.add('p1-show'); }, COPY_DELAY);
      setTimeout(() => { if (id === run) g.classList.remove('intro'); }, ARRIVE_MS);
    };
    play();
  };

  // ───────── 2 Headlines write themselves ─────────
  const initWrite = () => {
    if (!has(2) || !('IntersectionObserver' in window)) return;
    const heads = $$('h2');
    if (!has(1)) heads.unshift($('.hero h1'));
    const wrap = h => {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());   // \s also covers &nbsp;
      let n = 0;
      for (const node of [...h.childNodes]) {
        if (node.nodeType !== 3) continue;
        const frag = document.createDocumentFragment();
        for (const tok of node.textContent.split(/([ \t\n\r]+)/)) {
          if (!tok) continue;
          if (/^[ \t\n\r]+$/.test(tok)) { frag.append(' '); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          for (const c of tok) {                      // keeps &nbsp; inside the word
            const s = document.createElement('span');
            s.className = 'ch';
            s.style.setProperty('--i', n++);
            s.textContent = c;
            w.append(s);
          }
          frag.append(w);
        }
        node.replaceWith(frag);
      }
      h.style.setProperty('--step', Math.min(28, 1200 / Math.max(n, 1)) + 'ms');
      h.dataset.w = '';
    };
    const todo = heads.filter(Boolean);
    todo.forEach(wrap);
    // Writes when a good part of the headline is on screen (also after a reload half way down the page).
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('go');
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.35 });
    // Blank again only when it left through the bottom of the screen (the visitor scrolled back up
    // past it): on the way down it then writes anew and draws the eye. Left through the top, it
    // stays written, so scrolling back up to re-read never makes anyone wait for the letters.
    const out = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting && e.boundingClientRect.top > 0) e.target.classList.remove('go');
    }), { rootMargin: '40px 0px 40px 0px', threshold: 0 });
    todo.forEach(h => { io.observe(h); out.observe(h); });
  };

  // ───────── 3 Gardi per section (stills in the HTML; two of them wake up when near) ─────────
  const initMinis = () => {
    if (reduce) return;                               // the HTML already holds the stills
    const HERO = asset('gardi-hero.webp'), DOZE = asset('g/doze.webp'), SLEEPY = asset('g/still-sleepy.webp');
    const salute = $('.mini[data-kind="salute"]');
    if (salute) {
      let isNear = false;
      near([salute], () => { isNear = true; getBlob(HERO); }, () => { isNear = false; });
      const chapter = salute.closest('.chapter');
      let wasOn = chapter.classList.contains('on');
      new MutationObserver(() => {
        const on = chapter.classList.contains('on');
        if (on && !wasOn && isNear) restart(salute, HERO);
        wasOn = on;
      }).observe(chapter, { attributes: true, attributeFilter: ['class'] });
    }
    const doze = $('.mini[data-kind="doze"]');
    if (doze) near([doze], el => { el.src = DOZE; }, el => { el.src = SLEEPY; });
  };

  // ───────── 4 Medal row ─────────
  const initMedals = () => {
    const row = $('#medal-row');
    if (!row) return;
    if (reduce || !('IntersectionObserver' in window)) { row.classList.add('in'); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      row.classList.add('in');
      io.disconnect();
    }), { threshold: 0.35 });
    io.observe(row);
  };

  // ───────── 5 Dusk follows the scroll ─────────
  let duskTick = false;
  const duskUpdate = () => {
    duskTick = false;
    if (!has(5)) return;
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--dusk', (max > 0 ? clamp(scrollY / max) : 0).toFixed(3));
  };
  const initDusk = () => {
    if (reduce) return;
    const kick = () => { if (!duskTick) { duskTick = true; requestAnimationFrame(duskUpdate); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    duskUpdate();
  };

  // ───────── 6 Startle on tap ─────────
  const initStartle = () => {
    const img = $('.final-gardi'), hint = $('.psst');
    if (!has(6) || !img) return;
    const DOZE = asset('g/doze.webp'), STARTLE = asset('g/startle.webp');
    img.setAttribute('width', 482);
    img.setAttribute('height', 675);
    img.src = DOZE;
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    if (img.dataset.wake) img.setAttribute('aria-label', img.dataset.wake);
    near([img], () => getBlob(STARTLE), null, '400px 0px');
    let busy = false;
    const wake = async () => {
      if (hint) { hint.classList.add('gone'); setTimeout(() => hint.remove(), 450); }
      if (busy) return;
      busy = true;
      await restart(img, STARTLE);
      await sleep(3300);                              // startle.webp runs 3.2 s
      img.src = DOZE;
      busy = false;
    };
    img.addEventListener('click', wake);
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wake(); } });
  };

  // ───────── 8 The queue at the gate (CSS only; JS pauses it off screen) ─────────
  const initQueue = () => {
    const stage = $('.gate-stage');
    if (!stage) return;
    near([stage], el => el.classList.add('live'), el => el.classList.remove('live'), '80px 0px');
  };

  // ───────── 9 Lantern and tilt (pointer devices only) ─────────
  const initLight = () => {
    if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    root.classList.add('p9t');
    const MAX = 6, LAG = 0.14;                         // degrees, easing per frame
    const items = [];
    let running = false;
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    const frame = () => {
      let busy = false;
      for (const it of items) {
        const dx = it.tx - it.x, dy = it.ty - it.y;
        it.x += dx * LAG; it.y += dy * LAG;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) busy = true;
        if (it.lamp) it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0)';
        else { it.el.style.setProperty('--tx', it.y.toFixed(2) + 'deg'); it.el.style.setProperty('--ty', it.x.toFixed(2) + 'deg'); }
      }
      if (busy) requestAnimationFrame(frame); else running = false;
    };
    // lantern: one soft light per hero / dusk section
    $$('#hero, .dusk').forEach(sec => {
      const el = document.createElement('div');
      el.className = 'lantern';
      el.setAttribute('aria-hidden', 'true');
      const before = $('.hero-inner', sec);
      if (before) sec.insertBefore(el, before); else sec.prepend(el);
      const it = { el, lamp: true, x: 0, y: 0, tx: 0, ty: 0, seen: false };
      items.push(it);
      const to = e => {
        const r = sec.getBoundingClientRect();
        it.tx = e.clientX - r.left; it.ty = e.clientY - r.top;
        if (!it.seen) { it.seen = true; it.x = it.tx; it.y = it.ty; }
        el.classList.add('on'); kick();
      };
      sec.addEventListener('pointerenter', to);
      sec.addEventListener('pointermove', to);
      sec.addEventListener('pointerleave', () => { el.classList.remove('on'); it.seen = false; });
    });
    // tilt: every phone mock-up
    $$('figure.phone').forEach(el => {
      const it = { el, lamp: false, x: 0, y: 0, tx: 0, ty: 0 };   // x = rotateY deg, y = rotateX deg
      items.push(it);
      const to = e => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        it.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1) * MAX;
        it.ty = -clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1) * MAX;
        kick();
      };
      el.addEventListener('pointermove', to);
      el.addEventListener('pointerenter', to);
      el.addEventListener('pointerleave', () => { it.tx = 0; it.ty = 0; kick(); });
    });
  };

  // Each effect stands alone: one that fails on some browser must not take the others with it.
  for (const init of [initHero, initWrite, initMinis, initMedals, initDusk, initStartle, initQueue, initLight]) {
    try { init(); } catch (e) { console.error(e); }
  }
})();

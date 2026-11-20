// ScreenGuard landing page: scroll effects. The page reads fine without this file.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Reveal on scroll, with a small stagger between siblings.
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sibs = $$(':scope > .reveal', e.target.parentElement);
        e.target.style.setProperty('--d', Math.min(sibs.indexOf(e.target), 5) * 0.08 + 's');
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // Sticky phone: the chapter nearest the middle of the screen picks the screen.
  const chapters = $$('.chapter');
  const screens = $$('#screens img');
  const pips = $$('#pips li');
  let active = -1;
  const setActive = i => {
    if (i === active) return;
    active = i;
    chapters.forEach((c, n) => c.classList.toggle('on', n === i));
    screens.forEach((s, n) => s.classList.toggle('on', n === i));
    pips.forEach((p, n) => p.classList.toggle('on', n === i));
  };
  setActive(0);

  // Scroll-linked values, written once per frame.
  const hero = $('#hero');
  const nav = $('#nav');
  const linked = $$('[data-p]');
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    const y = scrollY;
    if (!reduce) hero.style.setProperty('--hp', clamp(y / hero.offsetHeight).toFixed(4));
    nav.classList.toggle('solid', y > hero.offsetHeight - 80);

    let best = 0, bestDist = Infinity;
    chapters.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh / 2);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActive(best);

    if (!reduce) for (const el of linked) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      // 0 when the section's top enters the screen, 1 when it reaches the upper third
      el.style.setProperty('--p', clamp((vh - r.top) / (vh * 0.9 + r.height * 0.35)).toFixed(4));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // Tap Gardi for another salute: a fresh object URL restarts the play-once animation.
  const gardi = $('#gardi');
  const gardiImg = gardi && $('img', gardi);
  if (gardi && !reduce) {
    const heroSrc = gardiImg.currentSrc || gardiImg.src;  // works from /de/ etc. too
    let blob, url, busy = false;
    gardi.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      try {
        blob = blob || await (await fetch(heroSrc)).blob();
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(blob);
        gardiImg.src = url;
      } catch (_) { /* opened from a file: no replay, the still frame stays */ }
      setTimeout(() => { busy = false; }, 1200);
    });
  }
})();

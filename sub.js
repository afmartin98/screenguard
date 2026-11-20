// ScreenGuard sub-pages (support, privacy): nav, writing headline, FAQ search + smooth accordion, dozing Gardi, table of contents.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Nav turns solid once the dusk band is behind it.
  const nav = $('#nav'), band = $('.subhead');
  const onScroll = () => nav.classList.toggle('solid', scrollY > (band ? band.offsetHeight - 80 : 40));
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Reduced motion: the stills, never the animated files.
  if (reduce) {
    const d = $('#doze');
    if (d) d.src = 'assets/g/still-sleepy.webp';
  }

  // Headline writes itself (not under reduced motion).
  const h1 = $('h1[data-write]');
  if (h1 && !reduce) {
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    for (const node of [...h1.childNodes]) {
      if (node.nodeType !== 3) continue;
      const frag = document.createDocumentFragment();
      for (const tok of node.textContent.split(/([ \t\n\r]+)/)) {
        if (!tok) continue;
        if (/^[ \t\n\r]+$/.test(tok)) { frag.append(' '); continue; }
        const w = document.createElement('span');
        w.className = 'w';
        w.setAttribute('aria-hidden', 'true');
        for (const c of tok) {
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
    h1.style.setProperty('--step', Math.min(28, 1200 / Math.max(n, 1)) + 'ms');
    requestAnimationFrame(() => setTimeout(() => h1.classList.add('go'), 250));
  }

  // Smooth accordion.
  const items = $$('.qgroup details');
  items.forEach(det => {
    const sum = $('summary', det);
    let anim = null;
    sum.addEventListener('click', e => {
      if (reduce || !det.animate) return;             // native toggle, no motion
      e.preventDefault();
      const start = det.offsetHeight;
      if (anim) anim.cancel();
      const opening = !det.open;
      if (opening) det.open = true;
      const end = opening ? det.scrollHeight : sum.offsetHeight + 2;
      det.style.overflow = 'hidden';
      anim = det.animate({ height: [start + 'px', end + 'px'] }, { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
      anim.onfinish = anim.oncancel = () => {
        if (!opening) det.open = false;
        det.style.overflow = '';
        anim = null;
      };
    });
  });

  // Filter as you type.
  const q = $('#q'), none = $('#none');
  if (q) {
    const text = new Map(items.map(d => [d, d.textContent.toLowerCase().replace(/\s+/g, ' ')]));
    const run = () => {
      const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach(d => {
        const ok = terms.every(t => text.get(d).includes(t));
        d.hidden = !ok;
        if (ok) shown++;
      });
      $$('.qgroup').forEach(g => { g.hidden = !$$('details', g).some(d => !d.hidden); });
      none.hidden = shown > 0;
    };
    q.addEventListener('input', run);
  }

  // Dozing Gardi: tap to startle (plays once), then back to dozing.
  const img = $('#doze'), hint = $('#hint');
  if (img && !reduce) {
    const DOZE = 'assets/g/doze.webp', STARTLE = 'assets/g/startle.webp';
    let blob = null;
    const getBlob = () => blob || (blob = fetch(STARTLE).then(r => { if (!r.ok) throw 0; return r.blob(); }).catch(() => null));
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('alt', 'Gardi is dozing. Tap to wake him.');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { getBlob(); io.disconnect(); } }, { rootMargin: '400px 0px' });
      io.observe(img);
    }
    let busy = false;
    const wake = async () => {
      if (hint) hint.classList.add('gone');
      if (busy) return;
      busy = true;
      const b = await getBlob();
      const old = img._objUrl;
      const next = b ? URL.createObjectURL(b) : STARTLE;   // a fresh URL restarts a play-once animated WebP
      img._objUrl = b ? next : null;
      img.src = next;
      if (old) URL.revokeObjectURL(old);
      await sleep(3300);                                   // startle.webp is 3.25 s
      img.src = DOZE;
      busy = false;
    };
    img.addEventListener('click', wake);
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wake(); } });
  } else if (img) {
    img.setAttribute('alt', 'Gardi, dozing.');
    if (hint) hint.remove();
  }

  // Privacy: table of contents from the headings.
  const toc = $('#toc');
  if (toc) {
    const hs = $$('.prose h2');
    const ol = $('ol', toc);
    hs.forEach((h, i) => {
      h.id = h.id || 'p-' + (i + 1);
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.append(a);
      ol.append(li);
    });
    toc.hidden = hs.length === 0;
  }
})();

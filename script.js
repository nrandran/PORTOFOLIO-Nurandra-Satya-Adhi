/* ==========================================================================
   Portofolio — Nurandra Satya Adhi
   Vanilla JS, tanpa dependensi. Semua efek menghormati prefers-reduced-motion.
   ========================================================================== */
(() => {
    'use strict';

    const doc = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const fmt = (n, d = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- 1. Hero: animasi masuk setelah gambar siap ---------- */
    const hero = $('#hero');
    const heroImg = $('.hero-portrait img');
    const showHero = () => requestAnimationFrame(() => hero.classList.add('ready'));
    if (heroImg && !heroImg.complete) {
        Promise.race([
            heroImg.decode().catch(() => {}),
            new Promise(r => setTimeout(r, 1200))
        ]).then(showHero);
    } else {
        showHero();
    }

    /* ---------- 2. Navbar, progress bar, tombol WhatsApp ---------- */
    const nav = $('#nav');
    const progress = $('#progress');
    const waFloat = $('#waFloat');

    function updateChrome() {
        const y = window.scrollY;
        const max = doc.scrollHeight - innerHeight;
        progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
        nav.classList.toggle('scrolled', y > 20);
        waFloat.classList.toggle('show', y > innerHeight * 0.8);
    }

    const burger = $('#burger');
    const menu = $('#mobileMenu');
    function setMenu(open) {
        doc.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        menu.setAttribute('aria-hidden', String(!open));
    }
    burger.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

    // link aktif sesuai section yang sedang dibaca
    const navLinks = $$('.nav-links a');
    const linkById = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            navLinks.forEach(l => l.classList.remove('active'));
            const link = linkById.get(e.target.id);
            if (link) link.classList.add('active');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    linkById.forEach((_, id) => { const el = document.getElementById(id); if (el) navObserver.observe(el); });
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(l => l.classList.remove('active')); }), { threshold: 0.5 }).observe(hero);

    /* ---------- 3. Mesin parallax (dengan inersia / lerp) ---------- */
    // data-speed : faktor geser vertikal. Positif = bergerak lebih lambat dari scroll, negatif = lebih cepat.
    // data-x     : faktor geser horizontal.
    // data-mode="scroll" : dihitung dari posisi scroll absolut (dipakai di hero).
    // Memakai properti CSS `translate`, jadi tidak bentrok dengan `transform` milik animasi lain.
    const items = [];
    let current = window.scrollY;
    let frame = 0;

    function measure() {
        items.length = 0;
        const els = $$('[data-speed],[data-x]');
        els.forEach(el => { el.style.translate = ''; });
        const sy = window.scrollY;
        els.forEach(el => {
            const r = el.getBoundingClientRect();
            items.push({
                el,
                cy: r.top + sy + r.height / 2,
                h: r.height,
                sp: parseFloat(el.dataset.speed) || 0,
                x: parseFloat(el.dataset.x) || 0,
                scroll: el.dataset.mode === 'scroll',
                last: ''
            });
        });
    }

    function apply(sy) {
        const vh = innerHeight;
        for (const it of items) {
            let x, y;
            if (it.scroll) {
                if (sy > vh * 2) continue;
                x = sy * it.x;
                y = sy * it.sp;
            } else {
                const d = it.cy - (sy + vh / 2);
                if (Math.abs(d) > vh * 1.2 + it.h) continue;
                x = d * it.x;
                y = d * it.sp;
            }
            const v = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
            if (v !== it.last) { it.el.style.translate = v; it.last = v; }
        }
    }

    function tick() {
        const target = window.scrollY;
        current += (target - current) * 0.13;
        if (Math.abs(target - current) < 0.2) current = target;
        apply(current);
        frame = current !== target ? requestAnimationFrame(tick) : 0;
    }

    /* ---------- 4. Teks "scrub": kata menyala mengikuti scroll ---------- */
    const scrubEl = $('#scrub');
    const words = [];
    if (scrubEl) {
        const walker = document.createTreeWalker(scrubEl, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(node => {
            const frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(tok => {
                if (!tok) return;
                if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
                const s = document.createElement('span');
                s.className = 'w';
                s.textContent = tok;
                frag.appendChild(s);
                words.push(s);
            });
            node.parentNode.replaceChild(frag, node);
        });
    }
    let lastLit = -1;
    function updateScrub() {
        if (!scrubEl) return;
        let lit;
        if (reduce) {
            lit = words.length;
        } else {
            const r = scrubEl.getBoundingClientRect();
            const vh = innerHeight;
            lit = Math.round(clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25), 0, 1) * words.length);
        }
        if (lit === lastLit) return;
        lastLit = lit;
        for (let i = 0; i < words.length; i++) words[i].classList.toggle('lit', i < lit);
    }

    /* ---------- 5. Satu handler scroll untuk semuanya ---------- */
    function onScroll() {
        updateChrome();
        updateScrub();
        if (!reduce && !frame) frame = requestAnimationFrame(tick);
    }
    addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer = 0;
    function refresh() {
        if (!reduce) { measure(); current = window.scrollY; apply(current); }
        updateChrome();
        updateScrub();
    }
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refresh, 150); });
    addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    if ('ResizeObserver' in window) {
        let h = document.body.scrollHeight;
        new ResizeObserver(() => {
            const nh = document.body.scrollHeight;
            if (Math.abs(nh - h) > 4) { h = nh; clearTimeout(resizeTimer); resizeTimer = setTimeout(refresh, 200); }
        }).observe(document.body);
    }
    refresh();

    /* ---------- 6. Reveal saat masuk viewport ---------- */
    const revealEls = $$('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(el => io.observe(el));
    }

    /* ---------- 7. Count-up angka ---------- */
    function countUp(el) {
        const to = parseFloat(el.dataset.count);
        const d = parseInt(el.dataset.decimals || '0', 10);
        const suffix = el.dataset.suffix || '';
        if (reduce) { el.textContent = fmt(to, d) + suffix; return; }
        const dur = 1700;
        const t0 = performance.now();
        (function step(t) {
            const p = clamp((t - t0) / dur, 0, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(to * eased, d) + suffix;
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }
    const counters = $$('[data-count]');
    if (!reduce && 'IntersectionObserver' in window) {
        counters.forEach(el => { el.textContent = fmt(0, parseInt(el.dataset.decimals || '0', 10)) + (el.dataset.suffix || ''); });
        const cio = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                cio.unobserve(e.target);
                countUp(e.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(el => cio.observe(el));
    } else {
        counters.forEach(el => countUp(el));
    }

    /* ---------- 8. Chapter: visual sticky berganti sesuai langkah ---------- */
    $$('.chapter').forEach(chapter => {
        const visual = $('[data-visual]', chapter);
        const steps = $$('.step', chapter);
        const overlays = $$('.ov', chapter);
        if (!visual || !steps.length) return;

        let started = false;
        const setStep = step => {
            started = true;
            const layers = (step.dataset.layer || '').split(' ');
            steps.forEach(s => s.classList.toggle('active', s === step));
            visual.dataset.layer = layers.join(' ');
            overlays.forEach(o => o.classList.toggle('on', layers.includes(o.dataset.name)));
        };

        if (!('IntersectionObserver' in window)) { setStep(steps[0]); return; }

        // langkah pertama menyala saat chapter mulai terlihat (supaya animasi ring dsb. tidak terbuang di luar layar)
        const start = new IntersectionObserver(es => {
            if (es.some(e => e.isIntersecting) && !started) setStep(steps[0]);
            if (started) start.disconnect();
        }, { threshold: 0.15 });
        start.observe(chapter);

        const stepObserver = new IntersectionObserver(es => {
            es.forEach(e => { if (e.isIntersecting) setStep(e.target); });
        }, { rootMargin: '-42% 0px -48% 0px' });
        steps.forEach(s => stepObserver.observe(s));
    });

    /* ---------- 9. Interaksi pointer: spotlight, tilt, hero depth ---------- */
    $$('.spot').forEach(el => {
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    if (finePointer && !reduce) {
        $$('[data-tilt]').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
                el.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });

        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--hx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
            hero.style.setProperty('--hy', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
        });
        hero.addEventListener('pointerleave', () => {
            hero.style.setProperty('--hx', 0);
            hero.style.setProperty('--hy', 0);
        });
    }
})();

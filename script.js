/* ==========================================================================
   Portfolio — Nurandra Satya Adhi
   Vanilla JS, no dependencies. Every effect respects prefers-reduced-motion
   and every module is guarded, so the same file serves all pages.
   ========================================================================== */
(() => {
    'use strict';

    const doc = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasIO = 'IntersectionObserver' in window;

    /* ---------- 1. Hero entrance (waits for the portrait so nothing pops in) ---------- */
    const hero = $('#home');
    if (hero) {
        const img = $('.hero__portrait img', hero);
        const ready = () => requestAnimationFrame(() => hero.classList.add('ready'));
        if (img && !img.complete) {
            Promise.race([img.decode().catch(() => {}), new Promise(r => setTimeout(r, 1400))]).then(ready);
        } else {
            ready();
        }
    }

    /* ---------- 2. Page transition curtain ---------- */
    const curtain = $('.curtain');
    function leave(href) {
        if (!curtain) { location.href = href; return; }
        curtain.style.animation = 'none';
        curtain.style.transition = 'none';
        curtain.style.transform = 'translateY(101%)';
        curtain.getBoundingClientRect();
        curtain.style.transition = 'transform .55s cubic-bezier(.22,.8,.2,1)';
        curtain.style.transform = 'translateY(0)';
        setTimeout(() => { location.href = href; }, 580);
    }
    document.addEventListener('click', e => {
        const a = e.target.closest('a[href]');
        if (!a || e.defaultPrevented || reduce || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target || a.hasAttribute('download')) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname) return;
        e.preventDefault();
        leave(url.href);
    });
    // coming back via the browser's back button (bfcache): lift the curtain again
    addEventListener('pageshow', e => {
        if (e.persisted && curtain) {
            curtain.style.transition = 'transform .5s cubic-bezier(.22,.8,.2,1)';
            curtain.style.transform = 'translateY(-101%)';
        }
    });

    /* ---------- 3. Navbar, progress bar, WhatsApp button ---------- */
    const nav = $('#nav');
    const progress = $('#progress');
    const waFloat = $('#waFloat');

    function updateChrome() {
        const y = window.scrollY;
        if (progress) {
            const max = doc.scrollHeight - innerHeight;
            progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
        }
        if (nav) nav.classList.toggle('scrolled', y > 20);
        if (waFloat) waFloat.classList.toggle('show', y > innerHeight * 0.8);
    }

    /* mobile menu */
    const burger = $('#burger');
    const menu = $('#mobileMenu');
    function setMenu(open) {
        if (!burger || !menu) return;
        doc.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menu.setAttribute('aria-hidden', String(!open));
    }
    if (burger && menu) {
        burger.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
        menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
        addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
    }

    /* active link + sliding indicator */
    const navLinks = $$('#navLinks a');
    const bar = $('.nav__bar');
    let activeLink = null;
    function moveBar() {
        if (!bar) return;
        if (!activeLink || !activeLink.offsetWidth) { bar.classList.remove('on'); return; }
        bar.style.setProperty('--x', activeLink.offsetLeft + 'px');
        bar.style.setProperty('--w', activeLink.offsetWidth + 'px');
        bar.classList.add('on');
    }
    if (navLinks.length && hasIO) {
        const byId = new Map(navLinks.map(a => [a.hash.slice(1), a]));
        const navIO = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                activeLink = byId.get(en.target.id) || null;
                navLinks.forEach(l => l.classList.toggle('active', l === activeLink));
                moveBar();
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        byId.forEach((_, id) => { const el = document.getElementById(id); if (el) navIO.observe(el); });
    }

    /* ---------- 4. Parallax engine (inertia / lerp, uses the CSS `translate` property) ---------- */
    // data-speed : vertical factor. Positive = slower than the page, negative = faster.
    // data-mode="scroll" : computed from absolute scroll (hero), otherwise from distance to viewport centre.
    const items = [];
    let current = window.scrollY;
    let frame = 0;
    const parallaxOn = () => !reduce && innerWidth > 760;

    function measure() {
        items.length = 0;
        const els = $$('[data-speed]');
        els.forEach(el => { el.style.translate = ''; });
        if (!parallaxOn()) return;
        const sy = window.scrollY;
        els.forEach(el => {
            const r = el.getBoundingClientRect();
            items.push({
                el,
                cy: r.top + sy + r.height / 2,
                h: r.height,
                sp: parseFloat(el.dataset.speed) || 0,
                scroll: el.dataset.mode === 'scroll',
                last: ''
            });
        });
    }

    function apply(sy) {
        const vh = innerHeight;
        for (const it of items) {
            let y;
            if (it.scroll) {
                if (sy > vh * 1.5) continue;
                y = sy * it.sp;
            } else {
                const d = it.cy - (sy + vh / 2);
                if (Math.abs(d) > vh * 1.2 + it.h) continue;
                y = d * it.sp;
            }
            const v = '0px ' + y.toFixed(1) + 'px';
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

    function onScroll() {
        updateChrome();
        checkClip();
        if (items.length && !frame) frame = requestAnimationFrame(tick);
    }
    addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer = 0;
    function refresh() {
        measure();
        current = window.scrollY;
        apply(current);
        updateChrome();
        moveBar();
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

    /* ---------- 5. Reveal on scroll ---------- */
    $$('.stack__row').forEach(row => $$('.tile', row).forEach((t, i) => t.style.setProperty('--ti', i)));
    const revealEls = $$('.rv');
    // Elements revealed with clip-path are fully clipped before they appear, and a fully
    // clipped element never counts as "intersecting", so they are checked by position instead.
    let pendingClip = revealEls.filter(el => el.classList.contains('rv--clip'));
    const plainReveal = revealEls.filter(el => !el.classList.contains('rv--clip'));

    function checkClip() {
        if (!pendingClip.length) return;
        const limit = innerHeight * 0.9;
        pendingClip = pendingClip.filter(el => {
            const r = el.getBoundingClientRect();
            if (r.top < limit && r.bottom > 0) { el.classList.add('in'); return false; }
            return true;
        });
    }

    if (reduce || !hasIO) {
        revealEls.forEach(el => el.classList.add('in'));
        pendingClip = [];
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        plainReveal.forEach(el => io.observe(el));
    }
    checkClip();
    addEventListener('load', checkClip);
    addEventListener('resize', checkClip);

    /* ---------- 6. Count-up numbers ---------- */
    function countUp(el) {
        const to = parseFloat(el.dataset.count);
        const d = parseInt(el.dataset.decimals || '0', 10);
        const suffix = el.dataset.suffix || '';
        if (reduce) { el.textContent = fmt(to, d) + suffix; return; }
        const dur = 1600;
        const t0 = performance.now();
        (function step(t) {
            const p = clamp((t - t0) / dur, 0, 1);
            el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), d) + suffix;
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }
    const counters = $$('[data-count]');
    if (!reduce && hasIO) {
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
        counters.forEach(countUp);
    }

    /* ---------- 7. Project dialogs ---------- */
    const dialogs = $$('dialog.dlg');
    if (dialogs.length && typeof HTMLDialogElement === 'function') {
        let trigger = null;

        function openDialog(id, from) {
            const d = document.getElementById(id);
            if (!d || d.open) return;
            trigger = from;
            d.showModal();
            doc.classList.add('dlg-open');
            d.scrollTop = 0;
        }

        $$('[data-open]').forEach(t => {
            t.addEventListener('click', e => {
                if (e.target.closest('a')) return;
                openDialog(t.dataset.open, t);
            });
        });

        dialogs.forEach(d => {
            let downOnBackdrop = false;
            d.addEventListener('pointerdown', e => { downOnBackdrop = e.target === d; });
            d.addEventListener('click', e => {
                if (e.target.closest('[data-close]') || (e.target === d && downOnBackdrop)) d.close();
            });
            d.addEventListener('close', () => {
                doc.classList.remove('dlg-open');
                // return focus to a real button, not the decorative stage that was clicked
                const btn = trigger && (trigger.matches('button') ? trigger : trigger.closest('article, .site')?.querySelector('button[data-open]'));
                if (btn) btn.focus({ preventScroll: true });
                trigger = null;
            });
        });
    }

    /* ---------- 8. Pointer depth in the hero (fine pointers only) ---------- */
    if (hero && finePointer && !reduce) {
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--hx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
            hero.style.setProperty('--hy', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
        }, { passive: true });
        hero.addEventListener('pointerleave', () => {
            hero.style.setProperty('--hx', 0);
            hero.style.setProperty('--hy', 0);
        });
    }
})();

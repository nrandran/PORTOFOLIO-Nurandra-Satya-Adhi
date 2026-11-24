/* ==========================================================================
   Portfolio — Nurandra Satya Adhi
   Small vanilla JS: header state, active link, menu, reveal, project dialogs.
   Respects prefers-reduced-motion. Every block is guarded, so it is safe on any page.
   ========================================================================== */
(() => {
    'use strict';

    const doc = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* footer year always follows the current year */
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

    /* header turns solid after a little scrolling */
    const nav = $('#nav');
    if (nav) {
        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
        addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* mobile menu */
    const btn = $('#menuBtn');
    const menu = $('#mobileMenu');
    function setMenu(open) {
        doc.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Close' : 'Menu';
        menu.setAttribute('aria-hidden', String(!open));
    }
    if (btn && menu) {
        btn.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
        menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
        addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
    }

    /* highlight the link of the section being read */
    const links = $$('#navLinks a[href^="#"]');
    if (links.length && 'IntersectionObserver' in window) {
        const byId = new Map(links.map(a => [a.hash.slice(1), a]));
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                links.forEach(l => l.classList.toggle('active', l === byId.get(e.target.id)));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }

    /* gentle reveal on scroll */
    const rv = $$('.rv');
    if (reduce || !('IntersectionObserver' in window)) {
        rv.forEach(el => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
        rv.forEach(el => io.observe(el));
    }

    /* project dialogs */
    const dialogs = $$('dialog.dlg');
    if (dialogs.length && typeof HTMLDialogElement === 'function') {
        let trigger = null;
        const open = (id, from) => {
            const d = document.getElementById(id);
            if (!d || d.open) return;
            trigger = from;
            d.showModal();
            doc.classList.add('dlg-open');
            d.scrollTop = 0;
        };
        $$('[data-open]').forEach(t => t.addEventListener('click', e => {
            e.preventDefault();
            open(t.dataset.open, t);
        }));
        dialogs.forEach(d => {
            let downOnBackdrop = false;
            d.addEventListener('pointerdown', e => { downOnBackdrop = e.target === d; });
            d.addEventListener('click', e => {
                if (e.target.closest('[data-close]') || (e.target === d && downOnBackdrop)) d.close();
            });
            d.addEventListener('close', () => {
                doc.classList.remove('dlg-open');
                if (trigger && trigger.focus) trigger.focus({ preventScroll: true });
                trigger = null;
            });
        });
    }
})();

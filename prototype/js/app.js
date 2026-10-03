(function (F2) {
    const V = F2.views, T = F2.totp;
    const params = new URLSearchParams(location.search);
    const IDLE_MS = 5 * 60 * 1000;
    const S = {
        items: F2.SEED.map((i) => ({ ...i })), selected: 'google', filter: 'Todos', query: '',
        locked: !params.has('open'), modal: null, tab: 'scan', sec: 'sec', pIdx: 0, pQ: '', idle: Date.now(),
        opts: { bio: true, autolock: true, lockSleep: true, mask: true, protect: true, clip: true, sync: false, group: true, startup: false, tray: true, upd: true, theme: 'dark', accent: '#e5484d' },
    };
    const codes = {};
    const $ = (s, r = document) => r.querySelector(s);
    const visible = () => {
        const q = S.query.trim().toLowerCase();
        return S.items.filter((i) => (S.filter === 'Todos' || (S.filter === 'Favoritos' ? i.fav : i.category === S.filter)) && (!q || `${i.issuer} ${i.account}`.toLowerCase().includes(q)));
    };
    const current = () => S.items.find((i) => i.id === S.selected);

    function applyTheme() {
        const t = S.opts.theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : S.opts.theme;
        document.documentElement.dataset.theme = t;
        document.documentElement.style.setProperty('--accent', S.opts.accent);
        document.body.classList.toggle('nomask', !S.opts.mask);
        document.body.classList.toggle('tray', params.get('view') === 'tray');
    }

    function render() {
        applyTheme();
        const items = visible();
        if (!items.find((i) => i.id === S.selected)) S.selected = items[0]?.id ?? null;
        $('#app').innerHTML = params.get('view') === 'tray' ? V.tray(S, [...S.items.filter((i) => i.fav), ...S.items.filter((i) => !i.fav)].slice(0, 6)) : V.main(S, items, current());
        const m = S.modal, layer = $('#layer');
        const pItems = () => S.items.filter((i) => `${i.issuer} ${i.account}`.toLowerCase().includes(S.pQ.toLowerCase()));
        layer.innerHTML = S.locked ? V.lock() : m === 'add' ? F2.modals.add(S.tab) : m === 'settings' ? F2.modals.settings(S, S.sec) : m === 'palette' ? F2.modals.palette(pItems(), S.pIdx, S.pQ) : '';
        paint();
        if (S.locked) $('#pw')?.focus();
        if (m === 'palette') { const p = $('#pq'); p.focus(); p.setSelectionRange(p.value.length, p.value.length); }
    }

    async function refresh(now = Date.now()) {
        if (!crypto.subtle) return;
        await Promise.all(S.items.map(async (it) => {
            const c = Math.floor(now / 1000 / it.period);
            if (codes[it.id]?.counter === c && codes[it.id].key === it.secret) return;
            codes[it.id] = { counter: c, key: it.secret, code: await T.totp(it, now), next: await T.totp(it, now + it.period * 1000) };
        }));
    }

    function paint() {
        const now = Date.now(), fmt = (c) => (S.opts.group ? T.group(c) : c);
        document.querySelectorAll('[data-code]').forEach((el) => { const c = codes[el.dataset.code]; if (c) el.textContent = fmt(c.code); });
        document.querySelectorAll('[data-mini]').forEach((el) => {
            const c = codes[el.dataset.mini]; if (!c) return;
            el.innerHTML = `<span class="mk">••• •••</span><span class="cd">${fmt(c.code)}</span>`;
            el.classList.toggle('low', (S.items.find((i) => i.id === el.dataset.mini)?.period ?? 30) - Math.floor((now / 1000) % 30) <= 5);
        });
        document.querySelectorAll('[data-ring]').forEach((el) => {
            const it = S.items.find((i) => i.id === el.dataset.ring); if (!it) return;
            const left = it.period - Math.floor((now / 1000) % it.period);
            el.querySelector('.fg').setAttribute('stroke-dashoffset', String(V.C * (1 - left / it.period)));
            el.classList.toggle('low', left <= 10 && left > 5); el.classList.toggle('crit', left <= 5);
            const b = el.querySelector('b'); if (b) b.textContent = left;
            const code = $(`.code[data-code="${it.id}"]`); if (code) { code.classList.toggle('low', left <= 10 && left > 5); code.classList.toggle('crit', left <= 5); }
            const nx = $(`[data-next="${it.id}"]`); if (nx) nx.innerHTML = left <= 8 && codes[it.id] ? `Próximo código: <span>${fmt(codes[it.id].next)}</span>` : '';
        });
        const rest = Math.max(0, IDLE_MS - (now - S.idle)), al = $('[data-autolock]');
        if (al) al.textContent = S.opts.autolock ? `${Math.floor(rest / 60000)}:${String(Math.floor(rest / 1000) % 60).padStart(2, '0')}` : 'desligado';
        if (S.opts.autolock && rest === 0 && !S.locked) { S.locked = true; S.modal = null; render(); }
    }

    function toast(msg) {
        $('.toast')?.remove();
        const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `${F2.icon('check')}${V.esc(msg)}`;
        document.body.append(el); setTimeout(() => el.remove(), 2200);
    }

    async function copy(id) {
        const c = codes[id]; if (!c) return;
        try { await navigator.clipboard.writeText(c.code); } catch { /* ambiente sem clipboard */ }
        toast(S.opts.clip ? 'Código copiado · área de transferência limpa em 30s' : 'Código copiado');
    }

    function addItem(data) {
        try { T.base32Decode(data.secret); if (!data.secret) throw new Error('Informe a chave secreta'); } catch (e) { return e.message; }
        const base = `${data.issuer}`.toLowerCase().replace(/\W/g, '') || 'conta';
        const item = { id: `${base}-${Date.now()}`, color: '#6e56cf', category: F2.CATEGORIES[1], fav: false, ...data };
        S.items.push(item); S.selected = item.id; S.modal = null; S.filter = 'Todos'; S.query = '';
        refresh().then(() => { render(); toast(`${item.issuer} adicionado ao cofre`); });
        return '';
    }

    const actions = {
        add: () => { S.modal = 'add'; S.tab = 'scan'; render(); }, settings: () => { S.modal = 'settings'; render(); },
        palette: () => { S.modal = 'palette'; S.pQ = ''; S.pIdx = 0; render(); }, lock: () => { S.locked = true; S.modal = null; render(); },
        unlock: () => { S.locked = false; S.idle = Date.now(); render(); }, close: () => { S.modal = null; render(); },
        'close-bg': (e) => { if (e.target.classList.contains('overlay')) actions.close(); }, import: () => { S.modal = 'add'; S.tab = 'import'; render(); },
        copy: () => copy(S.selected), fav: () => { current().fav = !current().fav; render(); },
        edit: () => toast('Editar: renomear, trocar ícone/cor e categoria'), secret: () => toast('Pede a senha mestre / biometria antes de revelar a chave'),
        remove: () => { if (confirm(`Remover ${current().issuer}? (protótipo: só em memória)`)) { S.items = S.items.filter((i) => i.id !== S.selected); render(); } },
        'scan-screen': () => { toast('QR detectado: Notion · notion@2fac.dev'); addItem({ issuer: 'Notion', account: 'notion@2fac.dev', secret: 'MFRGGZDFMZTWQ2LK', algorithm: 'SHA1', digits: 6, period: 30 }); },
        'add-uri': () => { try { const e = addItem(T.parseUri($('#uri').value)); if (e) toast(e); } catch (e) { toast(e.message); } },
        'add-manual': () => {
            const g = (s) => $(s).value.trim();
            const err = !g('#m-iss') ? 'Informe o emissor' : addItem({ issuer: g('#m-iss'), account: g('#m-acc'), secret: g('#m-sec'), algorithm: g('#m-alg'), digits: Number(g('#m-dig')), period: Number(g('#m-per')), category: g('#m-cat') });
            if (err) $('#m-err').textContent = err;
        },
        open: () => { location.search = '?open'; },
    };

    document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-act],[data-select],[data-filter],[data-tab],[data-sec],[data-switch],[data-theme],[data-accent],[data-pick],[data-copy]');
        if (!t) return;
        const d = t.dataset;
        if (d.act?.startsWith('toast:')) return toast(d.act.slice(6));
        if (d.act) return actions[d.act]?.(e);
        if (d.select) { S.selected = d.select; render(); }
        else if (d.filter) { S.filter = d.filter; render(); }
        else if (d.tab) { S.tab = d.tab; render(); }
        else if (d.sec) { S.sec = d.sec; render(); }
        else if (d.switch) { S.opts[d.switch] = !S.opts[d.switch]; render(); }
        else if (d.theme) { S.opts.theme = d.theme; render(); }
        else if (d.accent) { S.opts.accent = d.accent; render(); }
        else if (d.pick) { copy(d.pick); S.modal = null; render(); }
        else if (d.copy) copy(d.copy);
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'q') { S.query = e.target.value; render(); const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
        if (e.target.id === 'pq') { S.pQ = e.target.value; S.pIdx = 0; render(); }
    });

    document.addEventListener('keydown', (e) => {
        const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
        if (S.locked) { if (e.key === 'Enter') actions.unlock(); return; }
        if (mod && 'fknl,'.includes(k)) {
            e.preventDefault();
            if (k === 'f') $('#q')?.focus(); else if (k === 'k') actions.palette(); else if (k === 'n') actions.add(); else if (k === 'l') actions.lock(); else actions.settings();
        } else if (e.key === 'Escape') { if (S.modal) actions.close(); else if (S.query) { S.query = ''; render(); } }
        else if (S.modal === 'palette') {
            const list = S.items.filter((i) => `${i.issuer} ${i.account}`.toLowerCase().includes(S.pQ.toLowerCase()));
            if (e.key === 'ArrowDown') { S.pIdx = Math.min(list.length - 1, S.pIdx + 1); render(); } else if (e.key === 'ArrowUp') { S.pIdx = Math.max(0, S.pIdx - 1); render(); }
            else if (e.key === 'Enter' && list[S.pIdx]) { copy(list[S.pIdx].id); S.modal = null; render(); }
        } else if (!S.modal && document.activeElement?.tagName !== 'INPUT') {
            const list = visible(), i = list.findIndex((x) => x.id === S.selected);
            if (e.key === 'ArrowDown' && i < list.length - 1) { e.preventDefault(); S.selected = list[i + 1].id; render(); }
            else if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); S.selected = list[i - 1].id; render(); }
            else if (e.key === 'Enter') copy(S.selected);
        }
    });
    ['mousemove', 'keydown', 'click'].forEach((ev) => document.addEventListener(ev, () => { S.idle = Date.now(); }));

    const q = params.get('modal'); if (q) { S.modal = q; S.tab = params.get('tab') || 'scan'; S.sec = params.get('sec') || 'sec'; }
    if (params.get('theme')) S.opts.theme = params.get('theme');
    if (params.get('select')) S.selected = params.get('select');
    if (params.get('filter')) S.filter = params.get('filter');
    refresh().then(() => { render(); });
    render();
    setInterval(async () => { await refresh(); paint(); }, 1000);
    F2.debug = { S, codes };
})(window.F2);

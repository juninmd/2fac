(function (F2) {
    const { icon } = F2;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tile = (it, cls = '') => `<span class="tile ${cls}" style="--tile:${it.color}">${esc(it.issuer[0].toUpperCase())}</span>`;
    const R = 20, C = 2 * Math.PI * R;

    function ring(it, mini = false) {
        return `<div class="ring ${mini ? 'mini-ring' : ''}" data-ring="${it.id}">
            <svg viewBox="0 0 48 48"><circle class="bg" cx="24" cy="24" r="${R}"/>
            <circle class="fg" cx="24" cy="24" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>${mini ? '' : `<b data-secs="${it.id}"></b>`}</div>`;
    }

    function row(it, sel) {
        return `<button class="row ${sel ? 'sel' : ''}" data-select="${it.id}" aria-label="${esc(it.issuer)} ${esc(it.account)}">
            ${tile(it)}<span class="meta"><div class="iss">${it.fav ? '★ ' : ''}${esc(it.issuer)}</div><div class="acc">${esc(it.account)}</div></span>
            <span class="mini" data-mini="${it.id}">••• •••</span></button>`;
    }

    function side(S, items) {
        const chips = ['Todos', 'Favoritos', ...F2.CATEGORIES].map((c) => `<button class="chip ${S.filter === c ? 'on' : ''}" data-filter="${c}">${c}</button>`).join('');
        return `<aside class="side">
            <div class="search">${icon('search')}<input id="q" placeholder="Buscar contas…" value="${esc(S.query)}" autocomplete="off"><kbd>Ctrl F</kbd></div>
            <div class="chips">${chips}</div>
            <div class="list">${items.length ? items.map((i) => row(i, i.id === S.selected)).join('') : '<div class="empty">Nenhuma conta encontrada</div>'}</div>
            <div class="side-foot"><span class="vault"><i class="dot"></i>Auto-bloqueio <b data-autolock>5:00</b></span>
                <button class="btn icon ghost" data-act="palette" title="Paleta de comandos (Ctrl+K)">${icon('cmd')}</button>
                <button class="btn icon ghost" data-act="settings" title="Configurações (Ctrl+,)">${icon('settings')}</button>
                <button class="btn icon ghost" data-act="lock" title="Bloquear (Ctrl+L)">${icon('lock')}</button></div>
            <div style="padding:0 12px 12px"><button class="btn primary" data-act="add" style="width:100%;justify-content:center">${icon('plus')}Adicionar conta <kbd style="margin-left:auto;color:inherit;background:transparent;border-color:currentColor;opacity:.7">Ctrl N</kbd></button></div>
        </aside>`;
    }

    function detail(it) {
        if (!it) return `<main class="detail"><div class="empty">Selecione uma conta</div></main>`;
        return `<main class="detail"><div class="card">${tile(it, 'xl')}
            <div class="iss">${esc(it.issuer)}</div><div class="acc">${esc(it.account)}</div>
            <div class="code-wrap"><div class="code" data-code="${it.id}" data-act="copy" title="Clique para copiar">••• •••</div>${ring(it)}</div>
            <div class="next" data-next="${it.id}"></div>
            <div class="actions">
                <button class="btn primary" data-act="copy">${icon('copy')}Copiar código <kbd style="color:inherit;background:transparent;border-color:currentColor;opacity:.7">Enter</kbd></button>
                <button class="btn icon ${it.fav ? 'on' : ''}" data-act="fav" title="Favoritar">${icon('star')}</button>
                <button class="btn icon" data-act="edit" title="Editar">${icon('edit')}</button>
                <button class="btn icon" data-act="secret" title="Ver chave secreta (pede senha mestre)">${icon('key')}</button>
                <button class="btn icon danger" data-act="remove" title="Remover">${icon('trash')}</button></div>
            <div class="facts"><div>Algoritmo<b>${it.algorithm}</b></div><div>Dígitos<b>${it.digits}</b></div><div>Período<b>${it.period}s</b></div><div>Categoria<b>${esc(it.category)}</b></div></div>
        </div></main>`;
    }

    const titlebar = () => `<header class="titlebar"><div class="brand"><span class="logo">${icon('shield')}</span>2FAC</div>
        <div class="winctl"><button title="Minimizar">${icon('min')}</button><button title="Maximizar">${icon('max')}</button><button class="close" title="Fechar">${icon('x')}</button></div></header>`;

    F2.views = {
        esc, tile, ring,
        main: (S, items, sel) => `<div class="window">${titlebar()}<div class="shell">${side(S, items)}${detail(sel)}</div></div>`,
        tray(S, items) {
            const favs = items.slice(0, 6).map((it) => `<button class="row" data-copy="${it.id}">${tile(it)}<span class="meta"><div class="iss">${esc(it.issuer)}</div>
                <div class="acc">${esc(it.account)}</div></span><span class="mini" data-code="${it.id}" style="color:var(--text)">••• •••</span>${ring(it, true)}</button>`).join('');
            return `<div class="tray-pop"><header><span class="brand"><span class="logo">${icon('shield')}</span>2FAC</span><span class="badge">Clique para copiar</span></header>
                <div class="list">${favs}</div><footer><button class="btn" data-act="open">Abrir 2FAC</button><button class="btn" data-act="lock">${icon('lock')}Bloquear</button></footer></div>`;
        },
        lock: () => `<div class="lock"><div class="box"><div class="big">${icon('lock')}</div><h2>Cofre bloqueado</h2>
            <small>Seus códigos ficam criptografados com AES‑256‑GCM neste computador.</small>
            <input id="pw" type="password" placeholder="Senha mestre" autofocus>
            <button class="btn primary" data-act="unlock">Desbloquear</button>
            <button class="btn" data-act="unlock">${icon('finger')}Usar Windows Hello / Touch ID</button></div></div>`,
        R, C,
    };
})(window.F2);

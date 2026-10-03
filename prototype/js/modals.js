(function (F2) {
    const { icon } = F2;
    const { esc, tile } = F2.views;
    const shell = (title, body, cls = '') => `<div class="overlay" data-act="close-bg"><div class="modal ${cls}" role="dialog" aria-label="${title}">
        <div class="modal-head">${title}<button class="btn icon ghost" data-act="close">${icon('x')}</button></div>${body}</div></div>`;

    const addTabs = [['scan', 'scan', 'Escanear tela'], ['uri', 'link', 'Colar URI'], ['manual', 'key', 'Chave manual'], ['import', 'download', 'Importar']];

    function addBody(tab) {
        const panes = {
            scan: `<div class="drop">${icon('scan')}<div><b>Escaneie o QR code que está na tela</b><div class="hint" style="justify-content:center">A captura é processada localmente em Rust; nada é enviado.</div></div>
                <button class="btn primary" data-act="scan-screen">${icon('scan')}Capturar e detectar QR</button></div>`,
            uri: `<div class="field"><label>URI otpauth://</label><textarea id="uri" placeholder="otpauth://totp/GitHub:junin?secret=JBSWY3DPEHPK3PXP&issuer=GitHub"></textarea></div>
                <button class="btn primary" data-act="add-uri">Adicionar</button><div class="hint">${icon('info')}Dica: links <code>otpauth://</code> abertos no sistema chegam aqui via deep link.</div>`,
            manual: `<div class="field"><label>Emissor</label><input id="m-iss" placeholder="Ex.: GitHub"></div><div class="field"><label>Conta</label><input id="m-acc" placeholder="usuario@email.com"></div>
                <div class="field"><label>Chave secreta (base32)</label><input id="m-sec" placeholder="JBSW Y3DP EHPK 3PXP" style="font-family:var(--mono)"></div>
                <div class="grid2"><div class="field"><label>Algoritmo</label><select id="m-alg"><option>SHA1</option><option>SHA256</option><option>SHA512</option></select></div>
                <div class="field"><label>Dígitos</label><select id="m-dig"><option>6</option><option>7</option><option>8</option></select></div>
                <div class="field"><label>Período</label><select id="m-per"><option>30</option><option>60</option></select></div></div>
                <div class="field"><label>Categoria</label><select id="m-cat">${F2.CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
                <button class="btn primary" data-act="add-manual">Adicionar conta</button><div class="hint" id="m-err" style="color:var(--danger)"></div>`,
            import: `<div class="import-grid">
                <button data-act="toast:Importador Authy (backup JSON/DB) — em breve"><b>${icon('download')}Authy</b><span>Backup exportado do Authy (JSON)</span></button>
                <button data-act="toast:Importar Google Authenticator (otpauth-migration://)"><b>${icon('qr')}Google Authenticator</b><span>QR de migração ou link otpauth-migration</span></button>
                <button data-act="toast:Importar backup .2fac criptografado"><b>${icon('lock')}Backup 2FAC</b><span>Arquivo criptografado com senha</span></button>
                <button data-act="toast:Importar JSON/CSV (Aegis, 2FAS, Bitwarden)"><b>${icon('upload')}Aegis · 2FAS · Bitwarden</b><span>JSON ou CSV exportado</span></button></div>`,
        };
        return `<div class="modal-body"><div class="tabs">${addTabs.map(([k, i, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${icon(i)}${l}</button>`).join('')}</div>${panes[tab]}</div>`;
    }

    const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" data-switch="${key}" role="switch" aria-checked="${on}"></button>`;
    const srow = (t, d, ctl) => `<div class="set-row"><span><b>${t}</b><small>${d}</small></span>${ctl}</div>`;

    function settingsPane(S, sec) {
        const o = S.opts;
        if (sec === 'sec') return `<h3>Segurança</h3>${srow('Senha mestre', 'Deriva a chave do cofre com Argon2id', '<button class="btn" data-act="toast:Alterar senha mestre">Alterar</button>')}
            ${srow('Desbloqueio biométrico', 'Windows Hello, Touch ID ou leitor do Linux (fprintd)', sw('bio', o.bio))}
            ${srow('Bloqueio automático', 'Após 5 minutos sem atividade', sw('autolock', o.autolock))}
            ${srow('Bloquear ao suspender / trocar de usuário', 'Escuta eventos de energia do sistema', sw('lockSleep', o.lockSleep))}
            ${srow('Ocultar códigos na lista', 'Mostra apenas ao passar o mouse ou selecionar', sw('mask', o.mask))}
            ${srow('Proteger contra captura de tela', 'Impede screenshots da janela (content protection)', sw('protect', o.protect))}
            ${srow('Limpar área de transferência', 'Apaga o código copiado após 30 segundos', sw('clip', o.clip))}`;
        if (sec === 'bkp') return `<h3>Backup e sincronização</h3>${srow('Exportar backup criptografado', 'Arquivo .2fac protegido por senha (AES‑256‑GCM)', `<button class="btn" data-act="toast:Exportando backup criptografado…">${icon('upload')}Exportar</button>`)}
            ${srow('Importar', 'Authy, Google Authenticator, Aegis, 2FAS, JSON', `<button class="btn" data-act="import">${icon('download')}Importar</button>`)}
            ${srow('Exportar JSON sem criptografia', 'Não recomendado — contém todas as chaves', '<button class="btn danger" data-act="toast:Pede senha mestre antes de exportar">Exportar</button>')}
            ${srow('Sincronização entre dispositivos <span class="badge soon">Roadmap</span>', 'E2E via pasta (Drive/Dropbox) ou rede local; sem servidor nosso', sw('sync', false))}`;
        if (sec === 'look') return `<h3>Aparência</h3>${srow('Tema', 'Claro, escuro ou seguir o sistema', `<div class="tabs" style="margin:0;width:230px">${['dark', 'light', 'system'].map((t) => `<button class="${o.theme === t ? 'on' : ''}" data-theme="${t}">${{ dark: 'Escuro', light: 'Claro', system: 'Sistema' }[t]}</button>`).join('')}</div>`)}
            ${srow('Cor de destaque', 'Aplicada em botões, anéis e seleção', `<div class="swatches">${['#e5484d', '#3e63dd', '#30a46c', '#f76b15', '#8e4ec6'].map((c) => `<button style="--c:${c}" class="${o.accent === c ? 'on' : ''}" data-accent="${c}" aria-label="${c}"></button>`).join('')}</div>`)}
            ${srow('Agrupar código (123 456)', 'Facilita a leitura em voz alta', sw('group', o.group))}`;
        if (sec === 'sys') return `<h3>Sistema</h3>${srow('Iniciar com o sistema', 'Abre minimizado na bandeja', sw('startup', o.startup))}
            ${srow('Fechar para a bandeja', 'Mantém o app disponível via atalho global', sw('tray', o.tray))}
            ${srow('Atalho global', 'Abre a mini janela da bandeja em qualquer app', '<kbd>Ctrl Shift 2</kbd>')}
            ${srow('Atualizações automáticas', 'Updater do Tauri com assinatura verificada', sw('upd', o.upd))}`;
        return `<h3>Atalhos de teclado</h3>${[['Buscar', 'Ctrl F'], ['Paleta de comandos', 'Ctrl K'], ['Adicionar conta', 'Ctrl N'], ['Bloquear', 'Ctrl L'], ['Configurações', 'Ctrl ,'], ['Copiar código', 'Enter'], ['Navegar', '↑ ↓'], ['Fechar', 'Esc']].map(([a, b]) => `<div class="sc"><span>${a}</span><kbd>${b}</kbd></div>`).join('')}`;
    }

    const SEC = [['sec', 'shield', 'Segurança'], ['bkp', 'cloud', 'Backup e sync'], ['look', 'palette', 'Aparência'], ['sys', 'settings', 'Sistema'], ['keys', 'keyboard', 'Atalhos']];

    F2.modals = {
        add: (tab) => shell('Adicionar conta', addBody(tab)),
        settings: (S, sec) => shell('Configurações', `<div class="settings"><nav>${SEC.map(([k, i, l]) => `<button class="${sec === k ? 'on' : ''}" data-sec="${k}">${icon(i)}${l}</button>`).join('')}</nav><div class="pane">${settingsPane(S, sec)}</div></div>`, 'wide'),
        palette: (items, idx, q) => `<div class="overlay" data-act="close-bg"><div class="palette"><input id="pq" placeholder="Buscar conta e copiar código…" value="${esc(q)}" autocomplete="off">
            <ul>${items.map((it, i) => `<li class="${i === idx ? 'sel' : ''}" data-pick="${it.id}">${tile(it)}<span><b>${esc(it.issuer)}</b> <span style="color:var(--text-3)">${esc(it.account)}</span></span><span class="mono" data-code="${it.id}">••• •••</span></li>`).join('') || '<li>Nada encontrado</li>'}</ul>
            <div class="palette-foot"><span><kbd>↑↓</kbd> navegar</span><span><kbd>Enter</kbd> copiar</span><span><kbd>Esc</kbd> fechar</span></div></div></div>`,
    };
})(window.F2);

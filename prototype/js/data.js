(function (F2) {
    F2.CATEGORIES = ['Trabalho', 'Pessoal', 'Finanças'];
    const mk = (issuer, account, secret, color, category, fav = false) =>
        ({ id: issuer.toLowerCase().replace(/\W/g, ''), issuer, account, secret, color, category, fav, algorithm: 'SHA1', digits: 6, period: 30 });
    F2.SEED = [
        mk('Google', 'junin@gmail.com', 'JBSWY3DPEHPK3PXP', '#4285f4', 'Pessoal', true),
        mk('GitHub', 'juninmd', 'GEZDGNBVGY3TQOJQ', '#24292f', 'Trabalho', true),
        mk('AWS', 'root-prod', 'MFRGGZDFMZTWQ2LK', '#ff9900', 'Trabalho'),
        mk('Binance', 'junin@mail.com', 'NBSWY3DPEB3W64TM', '#f0b90b', 'Finanças'),
        mk('Discord', 'junin#0420', 'ONSWG4TFOQYTEMZU', '#5865f2', 'Pessoal'),
        mk('Microsoft', 'junin@outlook.com', 'KRSXG5CTMVRXEZLU', '#0078d4', 'Trabalho'),
        mk('Dropbox', 'junin@gmail.com', 'PFXXK4TBNVXW4ZLN', '#0061ff', 'Pessoal'),
        mk('Cloudflare', 'ops@2fac.dev', 'MJQXGZJTGIQGS3DF', '#f6821f', 'Trabalho'),
        mk('Nubank', 'cpf final 4421', 'MZXW6YTBOI4DEMZT', '#820ad1', 'Finanças'),
    ];
})(window.F2);

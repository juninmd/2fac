(function (F2) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const ALGOS = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };

    function base32Decode(input) {
        const clean = input.replace(/[\s=-]/g, '').toUpperCase();
        let bits = 0, value = 0;
        const out = [];
        for (const ch of clean) {
            const idx = ALPHABET.indexOf(ch);
            if (idx < 0) throw new Error('Chave base32 inválida');
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
        }
        return new Uint8Array(out);
    }

    /** RFC 6238 via WebCrypto. No app real isto roda em Rust (crate `totp-rs`), nunca no webview. */
    async function totp(item, atMs = Date.now()) {
        const counter = Math.floor(atMs / 1000 / item.period);
        const msg = new ArrayBuffer(8);
        new DataView(msg).setUint32(4, counter);
        const key = await crypto.subtle.importKey('raw', base32Decode(item.secret),
            { name: 'HMAC', hash: ALGOS[item.algorithm] || 'SHA-1' }, false, ['sign']);
        const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
        const o = h[h.length - 1] & 15;
        const bin = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
        return String(bin % 10 ** item.digits).padStart(item.digits, '0');
    }

    function parseUri(uri) {
        const u = new URL(uri.trim());
        if (u.protocol !== 'otpauth:' || u.hostname !== 'totp') throw new Error('Use um URI otpauth://totp/…');
        const label = decodeURIComponent(u.pathname.slice(1));
        const [lIssuer, ...rest] = label.includes(':') ? label.split(':') : ['', label];
        const q = u.searchParams;
        return {
            issuer: q.get('issuer') || lIssuer.trim() || 'Sem emissor',
            account: (rest.join(':') || label).trim(),
            secret: (q.get('secret') || '').replace(/\s/g, ''),
            algorithm: (q.get('algorithm') || 'SHA1').toUpperCase(),
            digits: Number(q.get('digits') || 6),
            period: Number(q.get('period') || 30),
        };
    }

    const group = (code) => code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
    F2.totp = { totp, parseUri, base32Decode, group };
})(window.F2);

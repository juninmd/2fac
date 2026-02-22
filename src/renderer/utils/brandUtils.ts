export const BRAND_COLORS: Record<string, string> = {
    'google': '#db4437',
    'microsoft': '#00a4ef',
    'amazon': '#ff9900',
    'facebook': '#1877f2',
    'github': '#24292e',
    'discord': '#7289da',
    'twitter': '#1da1f2',
    'apple': '#555555',
    'dropbox': '#0061ff',
    'slack': '#4a154b',
    'binance': '#f3ba2f',
    'protonmail': '#6d4aff',
    'paypal': '#003087',
    'stripe': '#6772e5',
    'digitalocean': '#0080ff',
    'heroku': '#430098',
    'linkedin': '#0a66c2',
    'instagram': '#e1306c',
    'twitch': '#9146ff',
    'reddit': '#ff4500',
    'teamviewer': '#0c62ab',
    'evernote': '#2dbe60',
    'coinbase': '#1652f0',
    'blockchain': '#121d33',
    'gitlab': '#fc6d26',
    'bitbucket': '#0052cc',
    'cloudflare': '#f38020',
};

export const normalizeIssuer = (str: string): string => str.toLowerCase().replace(/\s/g, '');

export const getBrandKey = (issuer: string): string | null => {
    const key = normalizeIssuer(issuer);
    if (!key) return null;

    // Check for exact matches in keys first (optional, but good for direct mapping)
    // But since we use 'includes', we need to be careful with order.

    if (key.includes('google')) return 'google';
    if (key.includes('microsoft') || key.includes('outlook') || key.includes('office') || key.includes('live.com') || key.includes('hotmail')) return 'microsoft';
    if (key.includes('amazon') || key.includes('aws')) return 'amazon';
    if (key.includes('facebook') || key.includes('meta')) return 'facebook';
    if (key.includes('github')) return 'github';
    if (key.includes('discord')) return 'discord';
    if (key.includes('twitter') || key === 'x' || key.includes('x.com')) return 'twitter';
    if (key.includes('apple') || key.includes('icloud')) return 'apple';
    if (key.includes('dropbox')) return 'dropbox';
    if (key.includes('slack')) return 'slack';
    if (key.includes('binance')) return 'binance';
    if (key.includes('proton') || key.includes('protonmail')) return 'protonmail';
    if (key.includes('paypal')) return 'paypal';
    if (key.includes('stripe')) return 'stripe';
    if (key.includes('digitalocean') || key.includes('do_')) return 'digitalocean';
    if (key.includes('heroku')) return 'heroku';
    if (key.includes('linkedin')) return 'linkedin';
    if (key.includes('instagram')) return 'instagram';
    if (key.includes('twitch')) return 'twitch';
    if (key.includes('reddit')) return 'reddit';
    if (key.includes('teamviewer')) return 'teamviewer';
    if (key.includes('evernote')) return 'evernote';
    if (key.includes('coinbase')) return 'coinbase';
    if (key.includes('blockchain')) return 'blockchain';
    if (key.includes('gitlab')) return 'gitlab';
    if (key.includes('bitbucket')) return 'bitbucket';
    if (key.includes('cloudflare')) return 'cloudflare';

    // Fallback: Check if the key exactly matches a known brand key
    if (BRAND_COLORS[key]) return key;

    return null;
};

export const getBrandColor = (issuer: string): string | null => {
    const key = getBrandKey(issuer);
    if (key && BRAND_COLORS[key]) {
        return BRAND_COLORS[key];
    }
    return null;
};

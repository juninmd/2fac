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

type BrandMatcher = [string, string[]];

const BRAND_MATCHERS: BrandMatcher[] = [
    ['google', ['google']],
    ['microsoft', ['microsoft', 'outlook', 'office', 'live.com', 'hotmail']],
    ['amazon', ['amazon', 'aws']],
    ['facebook', ['facebook', 'meta']],
    ['github', ['github']],
    ['discord', ['discord']],
    ['twitter', ['twitter', 'x', 'x.com']],
    ['apple', ['apple', 'icloud']],
    ['dropbox', ['dropbox']],
    ['slack', ['slack']],
    ['binance', ['binance']],
    ['protonmail', ['proton', 'protonmail']],
    ['paypal', ['paypal']],
    ['stripe', ['stripe']],
    ['digitalocean', ['digitalocean', 'do_']],
    ['heroku', ['heroku']],
    ['linkedin', ['linkedin']],
    ['instagram', ['instagram']],
    ['twitch', ['twitch']],
    ['reddit', ['reddit']],
    ['teamviewer', ['teamviewer']],
    ['evernote', ['evernote']],
    ['coinbase', ['coinbase']],
    ['blockchain', ['blockchain']],
    ['gitlab', ['gitlab']],
    ['bitbucket', ['bitbucket']],
    ['cloudflare', ['cloudflare']],
];

export const normalizeIssuer = (str: string): string => str.toLowerCase().replace(/\s/g, '');

export const getBrandKey = (issuer: string): string | null => {
    const key = normalizeIssuer(issuer);
    if (!key) return null;

    for (const [brandKey, keywords] of BRAND_MATCHERS) {
        if (keywords.some(kw => kw.length === 1 ? key === kw : key.includes(kw))) {
            return brandKey;
        }
    }

    if (BRAND_COLORS[key]) return key;

    return null;
};

export const getBrandColor = (issuer: string): string | null => {
    const key = getBrandKey(issuer);
    return key ? (BRAND_COLORS[key] ?? null) : null;
};

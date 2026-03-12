import React from 'react';
import { render } from '@testing-library/react';
import IssuerIcon from './IssuerIcon';

describe('IssuerIcon', () => {
    const icons = [
        'Google', 'Microsoft', 'Amazon', 'Facebook', 'GitHub', 'Discord',
        'Twitter', 'Apple', 'Dropbox', 'Slack', 'Binance', 'ProtonMail',
        'PayPal', 'Stripe', 'DigitalOcean', 'Heroku', 'LinkedIn', 'Instagram',
        'Twitch', 'Reddit', 'TeamViewer', 'Evernote', 'Coinbase', 'Blockchain',
        'AWS', 'Outlook', 'Meta', 'X', 'iCloud', 'DO_Space'
    ];

    it.each(icons)('renders icon for %s', (issuer) => {
        const { container } = render(<IssuerIcon issuer={issuer} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders fallback for unknown issuer', () => {
        const { getByText, container } = render(<IssuerIcon issuer="UnknownService" />);
        expect(getByText('U')).toBeInTheDocument();
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('handles empty issuer', () => {
        const { getByText } = render(<IssuerIcon issuer="" />);
        expect(getByText('?')).toBeInTheDocument();
    });
});

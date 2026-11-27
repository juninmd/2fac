import React from 'react';
import { Odometer, ProgressRing } from '@juninmd/sonido';

interface TokenCodeProps {
    token: string;
    masked?: boolean;
    onReveal?: () => void;
    size?: 'sm' | 'lg';
    className?: string;
}

const maskFor = (token: string) => (token.length > 7 ? '••••••••' : '••• •••');

/**
 * TOTP code built from the Sonido Odometer: one rolling column per digit, so a
 * new code rolls into place the way the rest of the design system animates.
 * The formatted code stays available to assistive tech through one aria-label
 * on the wrapper; the per-digit columns are decorative.
 */
const Digits: React.FC<{ code: string }> = ({ code }) => (
    <span className="token-code__value" role="img" aria-label={code}>
        {code.split(' ').map((group, groupIndex) => (
            <span className="token-code__group" key={`g${groupIndex}`} aria-hidden="true">
                {[...group].map((character, index) =>
                    /^[0-9]$/.test(character) ? (
                        <Odometer key={`d${index}`} value={Number(character)} locale="en-US" />
                    ) : (
                        <span className="token-code__char" key={`c${index}`}>
                            {character}
                        </span>
                    ),
                )}
            </span>
        ))}
    </span>
);

export const TokenCode: React.FC<TokenCodeProps> = ({ token, masked = false, onReveal, size = 'sm', className }) => {
    const visible = token || '—';
    const classes = `token-code token-code--${size}${className ? ` ${className}` : ''}`;

    if (masked && onReveal) {
        return (
            <button
                type="button"
                className={`${classes} token-code--mask`}
                aria-label="Mostrar código"
                onClick={(event) => {
                    event.stopPropagation();
                    onReveal();
                }}
            >
                {maskFor(visible)}
            </button>
        );
    }

    return (
        <span className={classes}>
            {masked ? <span className="token-code__value">{maskFor(visible)}</span> : <Digits code={visible} />}
        </span>
    );
};

interface TokenRingProps {
    timeLeft: number;
    period: number;
    size?: number;
    thickness?: number;
    showSeconds?: boolean;
    className?: string;
}

/** ProgressRing around the remaining time; turns to the danger tone in the last 5s. */
export const TokenRing: React.FC<TokenRingProps> = ({
    timeLeft,
    period,
    size = 30,
    thickness = 3,
    showSeconds = false,
    className,
}) => (
    <ProgressRing
        value={period > 0 ? timeLeft / period : 0}
        size={size}
        thickness={thickness}
        label={`${timeLeft}s restantes`}
        className={`token-ring${timeLeft <= 5 ? ' token-ring--low' : ''}${className ? ` ${className}` : ''}`}
    >
        {showSeconds ? <span className="token-ring__seconds">{timeLeft}s</span> : null}
    </ProgressRing>
);

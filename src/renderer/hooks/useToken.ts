import { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { TwoFAItem } from '../types.js';

export const useToken = (item: TwoFAItem) => {
    const [token, setToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [period, setPeriod] = useState<number>(30);

    useEffect(() => {
        setPeriod(item.period || 30);
        generateToken();
        const interval = setInterval(() => {
            generateToken();
        }, 1000);

        return () => clearInterval(interval);
    }, [item]);

    const generateToken = () => {
        try {
            let secret;
            switch (item.encoding) {
                case 'base64':
                    // OTPAuth doesn't have fromBase64, convert manually
                    try {
                        const binary = atob(item.secret);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        secret = new OTPAuth.Secret({ buffer: bytes.buffer });
                    } catch (e) {
                        console.error('Invalid Base64 secret', e);
                        secret = new OTPAuth.Secret();
                    }
                    break;
                case 'hex':
                    secret = OTPAuth.Secret.fromHex(item.secret);
                    break;
                case 'ascii':
                    secret = OTPAuth.Secret.fromLatin1(item.secret);
                    break;
                case 'base32':
                default:
                    secret = OTPAuth.Secret.fromBase32(item.secret);
                    break;
            }

            const totp = new OTPAuth.TOTP({
                issuer: item.issuer,
                label: item.account,
                algorithm: (item.algorithm || 'SHA1').toUpperCase(),
                digits: item.digits || 6,
                period: item.period || 30,
                secret: secret,
            });

            const newToken = totp.generate();

            // Format token with space
            if (newToken.length === 6) {
                setToken(newToken.slice(0, 3) + ' ' + newToken.slice(3));
            } else if (newToken.length === 7) {
                setToken(newToken.slice(0, 3) + ' ' + newToken.slice(3));
            } else if (newToken.length === 8) {
                setToken(newToken.slice(0, 4) + ' ' + newToken.slice(4));
            } else {
                setToken(newToken);
            }

            // Calculate seconds remaining
            const now = Math.floor(Date.now() / 1000);
            const timeStep = item.period || 30;
            const secondsIntoStep = now % timeStep;
            setTimeLeft(timeStep - secondsIntoStep);
        } catch (error) {
            console.error('Failed to generate token:', error);
            setToken('ERROR');
        }
    };

    return { token, timeLeft, period };
};

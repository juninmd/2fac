import { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { TwoFAItem } from '../types';

export const useToken = (item: TwoFAItem) => {
    const [token, setToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [period, setPeriod] = useState<number>(30);

    useEffect(() => {
        setPeriod(item.period ?? 30);
        generateToken();
        const interval = setInterval(generateToken, 1000);

        return () => clearInterval(interval);
    }, [item]);

    const generateToken = () => {
        try {
            const { encoding, secret, issuer, account, algorithm, digits, period: itemPeriod } = item;
            let secretObj;

            switch (encoding) {
                case 'base64':
                    try {
                        const binary = atob(secret!);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        secretObj = new OTPAuth.Secret({ buffer: bytes.buffer });
                    } catch (e) {
                        console.error('Invalid Base64 secret', e);
                        secretObj = new OTPAuth.Secret();
                    }
                    break;
                case 'hex':
                    secretObj = OTPAuth.Secret.fromHex(secret!);
                    break;
                case 'ascii':
                    secretObj = OTPAuth.Secret.fromLatin1(secret!);
                    break;
                case 'base32':
                default:
                    secretObj = OTPAuth.Secret.fromBase32(secret!);
                    break;
            }

            const totp = new OTPAuth.TOTP({
                issuer,
                label: account,
                algorithm: (algorithm || 'SHA1').toUpperCase(),
                digits: digits || 6,
                period: itemPeriod || 30,
                secret: secretObj,
            });

            const newToken = totp.generate();

            if (newToken.length === 6 || newToken.length === 7) {
                setToken(newToken.slice(0, 3) + ' ' + newToken.slice(3));
            } else if (newToken.length === 8) {
                setToken(newToken.slice(0, 4) + ' ' + newToken.slice(4));
            } else {
                setToken(newToken);
            }

            const now = Math.floor(Date.now() / 1000);
            const timeStep = itemPeriod || 30;
            const secondsIntoStep = now % timeStep;
            setTimeLeft(timeStep - secondsIntoStep);
        } catch (error) {
            console.error('Failed to generate token:', error);
            setToken('ERROR');
        }
    };

    return { token, timeLeft, period };
};

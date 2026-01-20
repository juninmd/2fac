import { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { TwoFAItem } from '../types';

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
            const totp = new OTPAuth.TOTP({
                issuer: item.issuer,
                label: item.account,
                algorithm: (item.algorithm || 'SHA1').toUpperCase(),
                digits: item.digits || 6,
                period: item.period || 30,
                secret: OTPAuth.Secret.fromBase32(item.secret),
            });

            const newToken = totp.generate();

            // Format token with space in middle if 6 digits
            if (newToken.length === 6) {
                setToken(newToken.slice(0, 3) + ' ' + newToken.slice(3));
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

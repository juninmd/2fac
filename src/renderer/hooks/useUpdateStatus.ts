import { useCallback, useEffect, useState } from 'react';
import { UpdateStatus } from '../types';

export const useUpdateStatus = () => {
    const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
    const [version, setVersion] = useState('');

    useEffect(() => {
        let active = true;
        void Promise.resolve(window.electron.getUpdateStatus()).then(current => active && current && setStatus(current));
        void Promise.resolve(window.electron.getAppVersion()).then(v => active && v && setVersion(v));
        const unsubscribe = window.electron.onUpdateStatus(setStatus);
        return () => {
            active = false;
            unsubscribe?.();
        };
    }, []);

    const check = useCallback(async () => {
        const next = await window.electron.checkForUpdates();
        if (next) setStatus(next);
    }, []);

    const install = useCallback(() => window.electron.installUpdate(), []);

    return { status, version, check, install };
};

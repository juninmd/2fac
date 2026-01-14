import { test, expect } from '@playwright/test';

test('verify 2fac ui', async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('http://localhost:3000');

    // Wait for the app to load. Since we're mocking electron, we might see errors or a specific state.
    // However, the lock screen should appear.
    await expect(page.locator('.lock-screen')).toBeVisible();

    // Take a screenshot of the lock screen
    await page.screenshot({ path: 'verification/lock_screen.png' });

    // We can try to "unlock" if the logic permits without full electron IPC.
    // Since window.electron is likely undefined in the browser without preload,
    // the app might crash or stay on lock screen.
    // However, we can inject a mock electron object to verify the main app UI.

    await page.evaluate(() => {
        (window as any).electron = {
             hasMasterPassword: async () => true,
             checkMasterPassword: async () => true,
             get2FAItems: async () => [
                 { id: '1', account: 'test@example.com', issuer: 'Google', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA1', digits: 6, period: 30 }
             ],
             add2FAItem: async () => {},
             remove2FAItem: async () => {},
             update2FAItem: async () => {},
        };
    });

    // Reload page to apply mock? No, we need to mock before load or handle the error.
    // Actually, in the browser, `window.electron` will be missing, causing a crash on load if not handled.
    // `App.tsx` calls `window.electron.hasMasterPassword` in `useEffect`.

    // Let's try to reload with the mock script injected at the start
});

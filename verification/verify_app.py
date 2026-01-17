
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # We need to polyfill window.electron since the renderer expects it
        context = await browser.new_context()
        await context.add_init_script("""
            window.electron = {
                getSettings: async () => ({
                    minimizeToTray: false,
                    runOnStartup: false,
                    autoLock: false,
                    autoLockTimeout: 5,
                    blurOnInactive: true
                }),
                get2FAItems: async () => ([
                    {
                        id: '1',
                        account: 'test@example.com',
                        issuer: 'Google',
                        secret: 'JBSWY3DPEHPK3PXP',
                        color: '#d32f2f'
                    }
                ]),
                checkMasterPassword: async () => true,
                hasMasterPassword: async () => true,
            };
        """)

        page = await context.new_page()

        try:
            # Wait for server to start
            await asyncio.sleep(2)

            # Go to app
            await page.goto("http://localhost:3000")

            # Wait for lock screen
            await page.wait_for_selector('.lock-screen')
            print("Lock screen visible")

            # Unlock
            await page.fill('input[type="password"]', '1234')
            await page.click('button.lock-button')

            # Wait for app content
            await page.wait_for_selector('.app-content')
            print("App content visible")

            # 1. Verify Header Buttons Split
            # Check if "+" and "Gear" buttons exist separately

            # Click "+" button
            await page.click('button[title="Adicionar Conta"]')
            await asyncio.sleep(1)
            # Take screenshot of Add Sidebar
            await page.screenshot(path="verification/add_sidebar.png")
            print("Captured add_sidebar.png")

            # Close sidebar (click again)
            await page.click('button[title="Adicionar Conta"]')
            await asyncio.sleep(0.5)

            # Click "Gear" button
            await page.click('button[title="Gerenciamento"]')
            await asyncio.sleep(1)
            # Take screenshot of Settings Sidebar
            await page.screenshot(path="verification/settings_sidebar.png")
            print("Captured settings_sidebar.png")

            # 2. Verify Settings Checkbox for Blur
            # Click "Preferências" inside Settings Sidebar
            await page.click('text=Preferências')
            await asyncio.sleep(1)
            await page.screenshot(path="verification/settings_modal.png")
            print("Captured settings_modal.png")

            # 3. Verify Blur Overlay
            # Close settings
            await page.click('text=Voltar')
            await asyncio.sleep(0.5)
            # Close sidebar
            await page.click('button[title="Gerenciamento"]')

            # Simulate window blur
            await page.evaluate("window.dispatchEvent(new Event('blur'))")
            await asyncio.sleep(1)
            await page.screenshot(path="verification/blur_overlay.png")
            print("Captured blur_overlay.png")

            print("Verification script finished successfully.")

        except Exception as e:
            print(f"Error: {e}")
            # Take screenshot of error state
            await page.screenshot(path="verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

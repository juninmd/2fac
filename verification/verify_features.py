
import os
import time
from playwright.sync_api import sync_playwright

def verify_authy_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use localhost for context
        context = browser.new_context()
        page = context.new_page()

        # Inject mock BEFORE navigating so it's there on load
        # Actually page.evaluate happens on the page, so we need to goto first?
        # But if the app loads and fails because window.electron is missing immediately, that's bad.
        # We can use add_init_script to inject it before page loads.

        page.add_init_script("""
            window.electron = {
                get2FAItems: () => Promise.resolve([
                    {
                        id: '1',
                        account: 'user@example.com',
                        issuer: 'Google',
                        secret: 'JBSWY3DPEHPK3PXP',
                        color: '#f44336'
                    },
                    {
                        id: '2',
                        account: 'dev@github.com',
                        issuer: 'GitHub',
                        secret: 'JBSWY3DPEHPK3PXP',
                        color: '#2d2d2d'
                    }
                ]),
                add2FAItem: (item) => Promise.resolve({...item, id: '3'}),
                remove2FAItem: (id) => Promise.resolve(true),
                update2FAItem: (id, item) => Promise.resolve(item),
                getSettings: () => Promise.resolve({
                    minimizeToTray: false,
                    runOnStartup: false,
                    autoLock: true,
                    autoLockTimeout: 5
                }),
                setSettings: () => Promise.resolve(true),
                scanScreenQR: () => Promise.resolve({ success: false }),
                checkMasterPassword: () => Promise.resolve(true),
                hasMasterPassword: () => Promise.resolve(true)
            };
            console.log("Mock electron injected");
        """)

        print("Navigating...")
        try:
            page.goto("http://localhost:3000")
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        print("Waiting for root element...")
        page.wait_for_selector("#root", timeout=5000)

        # It might show LockScreen first if isLocked is true.
        # LockScreen component: <div className="lock-screen">...
        # App component: <div className="app">...

        print("Checking what is visible...")
        # Check if lock screen is visible
        try:
            if page.locator("input[type='password']").count() > 0 or page.get_by_text("Desbloquear").count() > 0:
                 print("Lock screen detected. Unlocking...")
                 page.fill("input[type=password]", "password")
                 page.click("button:has-text('Desbloquear')")
        except:
             pass

        print("Waiting for app header...")
        try:
            page.wait_for_selector(".app-header", timeout=10000)
            print("Header found.")
        except:
            print("Header not found. Dumping content:")
            print(page.content())
            page.screenshot(path="verification/failed_state.png")
            browser.close()
            return

        # Screenshot Main View
        page.screenshot(path="verification/main_view.png")
        print("Main view captured")

        # Open Sidebar
        print("Clicking settings/sidebar button...")
        page.click(".header-right button:nth-child(2)")

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/sidebar_open.png")
        print("Sidebar view captured")

        # Close sidebar
        page.click(".header-right button:nth-child(2)")
        page.wait_for_timeout(500)

        # Edit Mode
        print("Entering edit mode...")
        # Hover over first item
        page.hover(".grid-item >> nth=0")
        page.click("button[title='Editar'] >> nth=0")

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/edit_mode.png")
        print("Edit mode captured")

        browser.close()

if __name__ == "__main__":
    verify_authy_features()

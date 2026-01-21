from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock window.electron
    page.add_init_script("""
        window.electron = {
            getSettings: async () => ({
                minimizeToTray: false,
                runOnStartup: false,
                autoLock: true,
                autoLockTimeout: 5,
                blurOnInactive: false
            }),
            hasMasterPassword: async () => true,
            checkMasterPassword: async (pwd) => true,
            setMasterPassword: async (pwd) => {},
            get2FAItems: async () => [],
            setSettings: async () => {},
            scanScreenQR: async () => ({ success: false }),
        };
    """)

    try:
        page.goto("http://localhost:3000")

        # Wait for Lock Screen
        page.wait_for_selector(".lock-screen")

        # Unlock
        page.fill("input[type=password]", "1234")
        page.click("button.lock-button")

        # Wait for App Header
        page.wait_for_selector(".app-header")

        # Click Settings Gear
        # The gear button has title="Configurações"
        page.click("button[title='Configurações']")

        # Wait for Settings Modal
        page.wait_for_selector(".settings-container")

        # Check for Tabs
        page.wait_for_selector("text=Dados")

        # Click Dados Tab
        page.click("text=Dados")

        # Wait for content
        page.wait_for_selector("text=Backups e Importação")

        # Screenshot
        page.screenshot(path="verification/verification.png")
        print("Verification screenshot taken.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

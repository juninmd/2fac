from playwright.sync_api import Page, expect, sync_playwright
import time

def test_verify_settings(page: Page):
    # Mock window.electron
    page.add_init_script("""
        window.electron = {
            get2FAItems: () => Promise.resolve([
                { id: '1', account: 'test@example.com', issuer: 'Test', secret: 'JBSWY3DPEHPK3PXP', color: '#e23e3e' }
            ]),
            getSettings: () => Promise.resolve({ autoLock: false, blurOnInactive: false }),
            add2FAItem: () => Promise.resolve({}),
            remove2FAItem: () => Promise.resolve(true),
            update2FAItem: () => Promise.resolve({}),
            set2FAItems: () => Promise.resolve(true),
            scanScreenQR: () => Promise.resolve({ success: false }),
            checkMasterPassword: (pwd) => Promise.resolve(true),
            hasMasterPassword: () => Promise.resolve(true),
            onProtocolUrl: (cb) => { return () => {}; }
        };
    """)

    # Give server time to start
    # In a real scenario, we might retry, but here we assume it's up or we fail
    try:
        page.goto("http://localhost:3000")
    except:
        time.sleep(5)
        page.goto("http://localhost:3000")

    # Unlock
    # Note: LockScreen might appear if hasMasterPassword returns true
    # The mock returns true.
    # LockScreen input placeholder is "Senha Mestre" or just "Senha"?
    # Let's check LockScreen.tsx. But assuming "Senha" works from previous script.
    # Previous script used: page.get_by_placeholder("Senha", exact=True)

    # Wait for LockScreen
    try:
        page.get_by_placeholder("Senha").fill("password")
        page.get_by_role("button", name="Desbloquear").click()
    except:
        print("Lock screen skipped or not found")

    # Wait for items to confirm load
    expect(page.get_by_text("test@example.com")).to_be_visible()

    # Open Settings via Shortcut (Ctrl+,)
    page.keyboard.press("Control+,")

    # Verify Settings Modal appears
    expect(page.get_by_text("Configurações")).to_be_visible()

    # Click "Sobre" tab
    page.get_by_role("button", name="Sobre").click()

    # Verify new text
    expect(page.get_by_text("Uma alternativa segura e offline ao Authy Desktop")).to_be_visible()
    expect(page.get_by_text("Armazenamento 100% Local (Sem Nuvem)")).to_be_visible()

    # Take screenshot
    page.screenshot(path="/home/jules/verification/settings_about.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_verify_settings(page)
            print("Verification successful")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/failed.png")
            raise e
        finally:
            browser.close()

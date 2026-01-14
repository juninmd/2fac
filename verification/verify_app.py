from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock window.electron
    page.add_init_script("""
        window.electron = {
            get2FAItems: () => Promise.resolve([
                {
                    id: '1',
                    account: 'jules@example.com',
                    issuer: 'Google',
                    secret: 'JBSWY3DPEHPK3PXP',
                    algorithm: 'SHA1',
                    digits: 6,
                    period: 30,
                    type: 'totp'
                },
                {
                    id: '2',
                    account: 'dev@github.com',
                    issuer: 'GitHub',
                    secret: 'JBSWY3DPEHPK3PXP',
                    algorithm: 'SHA1',
                    digits: 6,
                    period: 30,
                    type: 'totp'
                }
            ]),
            add2FAItem: () => Promise.resolve({}),
            remove2FAItem: () => Promise.resolve(true),
            update2FAItem: () => Promise.resolve({}),
            scanScreenQR: () => Promise.resolve({ success: false, error: 'Mock scan' }),
            export2FA: () => Promise.resolve({ success: true }),
            import2FA: () => Promise.resolve({ success: true }),
            importAuthy: () => Promise.resolve({ success: true }),
            setMasterPassword: () => Promise.resolve(true),
            checkMasterPassword: () => Promise.resolve(true),
            hasMasterPassword: () => Promise.resolve(false)
        };
    """)

    try:
        page.goto("http://localhost:3000")

        # 1. Setup Password
        page.get_by_placeholder("Senha", exact=True).fill("1234")
        page.get_by_placeholder("Confirmar Senha").fill("1234")
        page.get_by_role("button", name="Criar Senha").click()

        # 2. Wait for items
        expect(page.get_by_text("Google", exact=True)).to_be_visible()
        expect(page.get_by_text("GitHub", exact=True)).to_be_visible()

        # 3. Open Sidebar to check Add Item Form
        # The gear icon has title "Adicionar Conta / Configurações"
        page.get_by_title("Adicionar Conta / Configurações").click()

        # 4. Check Scan Button
        expect(page.get_by_text("Escanear QR da Tela")).to_be_visible()

        # 5. Check Circular Timer exists (class .circular-timer)
        expect(page.locator(".circular-timer")).to_have_count(2)

        # 6. Take screenshot
        page.screenshot(path="verification/verification.png")
        print("Verification successful")

    except Exception as e:
        print(f"Verification failed: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

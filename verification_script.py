from playwright.sync_api import Page, expect, sync_playwright

def test_verify_icons(page: Page):
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    # Mock window.electron
    page.add_init_script("""
        window.electron = {
            get2FAItems: () => Promise.resolve([
                { id: '1', account: 'john@google.com', issuer: 'Google', secret: 'JBSWY3DPEHPK3PXP', color: '#e23e3e' },
                { id: '2', account: 'jane@facebook.com', issuer: 'Facebook', secret: 'JBSWY3DPEHPK3PXP', color: '#4267B2' },
                { id: '3', account: 'bob@unknown.com', issuer: 'UnknownService', secret: 'JBSWY3DPEHPK3PXP', color: '#000000' },
                { id: '4', account: 'me@paypal.com', issuer: 'PayPal', secret: 'JBSWY3DPEHPK3PXP', color: '#003087' }
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

    page.goto("http://localhost:3000")

    # Unlock
    page.get_by_placeholder("Senha", exact=True).fill("password")
    page.get_by_role("button", name="Desbloquear").click()

    # Wait for items
    expect(page.get_by_text("john@google.com")).to_be_visible()

    # Check for SVG icons
    # Google item should have an SVG in .item-icon-container
    google_card = page.locator(".item.grid-item", has_text="Google")
    expect(google_card).to_be_visible()

    # We can check if there is an SVG inside
    expect(google_card.locator(".item-icon-container svg")).to_be_visible()

    # Facebook item
    facebook_card = page.locator(".item.grid-item", has_text="Facebook")
    expect(facebook_card).to_be_visible()
    expect(facebook_card.locator(".item-icon-container svg")).to_be_visible()

    # Unknown item should have 'U' text
    unknown_card = page.locator(".item.grid-item", has_text="UnknownService")
    expect(unknown_card).to_be_visible()
    # It should NOT have an SVG, but text
    expect(unknown_card.locator(".item-icon-container")).to_have_text("U")
    expect(unknown_card.locator(".item-icon-container svg")).not_to_be_visible()

    # PayPal item (New)
    paypal_card = page.locator(".item.grid-item", has_text="PayPal")
    expect(paypal_card).to_be_visible()
    expect(paypal_card.locator(".item-icon-container svg")).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_verify_icons(page)
            print("Verification successful")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_failed.png")
        finally:
            browser.close()

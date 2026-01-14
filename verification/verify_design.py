from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Pre-inject the window.electron mock before the page scripts run
    page.add_init_script("""
        window.electron = {
             hasMasterPassword: async () => true,
             checkMasterPassword: async () => true,
             get2FAItems: async () => [
                 { id: '1', account: 'john.doe@gmail.com', issuer: 'Google', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA1', digits: 6, period: 30 },
                 { id: '2', account: 'jane_dev', issuer: 'GitHub', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA1', digits: 6, period: 30 },
                 { id: '3', account: 'admin@corp.com', issuer: 'Amazon Web Services', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA1', digits: 6, period: 30 }
             ],
             add2FAItem: async () => {},
             remove2FAItem: async () => {},
             update2FAItem: async () => {},
             scanScreenQR: async () => {},
             setMasterPassword: async () => {},
             export2FA: async () => {},
             import2FA: async () => {},
             importAuthy: async () => {},
        };
    """)

    try:
        page.goto("http://localhost:3000")

        # 1. Verify Lock Screen
        page.wait_for_selector(".lock-screen", state="visible")
        page.screenshot(path="verification/1_lock_screen.png")
        print("Captured lock screen")

        # 2. Unlock App
        page.fill("input[type=password]", "password")
        page.click("button[type=submit]")

        # 3. Verify Main App UI
        # Wait for items to appear
        page.wait_for_selector(".item", state="visible")

        # Take a screenshot of the main grid view
        page.screenshot(path="verification/2_main_app_grid.png")
        print("Captured main app grid")

        # 4. Toggle to List View
        # The button to toggle view is the first one in header-right
        # It has title "Ver em Lista" (grid->list) or "Ver em Grade" (list->grid)
        # Or we can click by class .btn-icon
        page.click("button[title='Ver em Lista']")
        page.wait_for_timeout(500) # Wait for transition
        page.screenshot(path="verification/3_main_app_list.png")
        print("Captured main app list")

        # 5. Open Sidebar (Add Item)
        page.click("button[title='Adicionar Conta / Configurações']")
        page.wait_for_selector(".sidebar", state="visible")
        page.screenshot(path="verification/4_sidebar_add_item.png")
        print("Captured sidebar")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

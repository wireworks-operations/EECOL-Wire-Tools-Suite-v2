from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def run_cuj(page):
    # 1. Verify Cutting Records
    print("Verifying Cutting Records...")
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(1000)

    # Navigation cycle
    page.goto("http://localhost:3000/index.html")
    page.wait_for_timeout(500)
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(1000)

    # Check for error modal
    is_error_visible = page.is_visible("#customModal")
    if is_error_visible:
        text = page.inner_text("#modalMessage")
        print(f"Modal text: {text}")
        if "database" in text.lower():
            print("❌ DB Error modal detected on Cutting Records!")

    page.screenshot(path="verification/screenshots/cutting_records_final.png")

    # 2. Verify Inventory Records
    print("Verifying Inventory Records...")
    page.goto("http://localhost:3000/src/pages/inventory-records/inventory-records.html")
    page.wait_for_timeout(1000)

    # Navigation cycle
    page.goto("http://localhost:3000/index.html")
    page.wait_for_timeout(500)
    page.goto("http://localhost:3000/src/pages/inventory-records/inventory-records.html")
    page.wait_for_timeout(1000)

    # Check for error modal
    is_error_visible = page.is_visible("#customModal")
    if is_error_visible:
        text = page.inner_text("#modalMessage")
        print(f"Modal text: {text}")
        if "database" in text.lower():
            print("❌ DB Error modal detected on Inventory Records!")

    page.screenshot(path="verification/screenshots/inventory_records_final.png")
    print("Verification complete.")

if __name__ == "__main__":
    os.makedirs("verification/videos", exist_ok=True)
    os.makedirs("verification/screenshots", exist_ok=True)

    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
            server_process.terminate()

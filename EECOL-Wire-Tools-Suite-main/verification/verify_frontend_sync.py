from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def run_cuj(page):
    # Go to Live Statistics page which uses the sync notification
    page.goto("http://localhost:3000/src/pages/live-statistics/live-statistics.html")

    # Wait for the database to be initialized
    page.wait_for_function("typeof EECOLIndexedDB !== 'undefined'")

    # Capture initial state of localStorage
    initial_sync_val = page.evaluate("localStorage.getItem('eecolDBChange')")
    print(f"Initial sync val: {initial_sync_val}")

    # Trigger a write via the console/global instance
    page.evaluate("""async () => {
        const db = EECOLIndexedDB.getInstance();
        await db.isReady();
        await db.update('settings', { name: 'test-sync-visual', value: Date.now() });
    }""")
    page.wait_for_timeout(500)

    # Capture final state
    final_sync_val = page.evaluate("localStorage.getItem('eecolDBChange')")
    print(f"Final sync val: {final_sync_val}")

    page.screenshot(path="/home/jules/verification/screenshots/sync_verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
            server_process.terminate()

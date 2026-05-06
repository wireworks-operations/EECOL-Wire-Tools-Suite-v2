from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def run_verification():
    # Start the dev server
    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it time to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:3000/index.html")

            # Verification snippet
            verification_result = page.evaluate("""
                async () => {
                    const results = {
                        version: null,
                        timestampIndexExists: false,
                        addWorks: false,
                        updateWorks: false,
                        error: null
                    };

                    try {
                        // 1. Check version and index via standard IDB open
                        const db = await new Promise((resolve, reject) => {
                            const req = indexedDB.open('EECOLTools_v2', 9);
                            req.onsuccess = () => resolve(req.result);
                            req.onerror = () => reject(req.error);
                        });

                        results.version = db.version;

                        const transaction = db.transaction(['inventoryRecords'], 'readonly');
                        const store = transaction.objectStore('inventoryRecords');
                        results.timestampIndexExists = store.indexNames.contains('timestamp');
                        db.close();

                        // 2. Test EECOLIndexedDB class methods
                        const eecolDB = EECOLIndexedDB.getInstance();
                        await eecolDB.isReady();

                        const testId = 'test-v7-' + Date.now();
                        const testData = { id: testId, wireType: 'VERIFY', timestamp: Date.now() };

                        // Test add
                        await eecolDB.add('inventoryRecords', testData);
                        results.addWorks = true;

                        // Test update
                        testData.wireType = 'VERIFY-UPDATED';
                        await eecolDB.update('inventoryRecords', testData);
                        results.updateWorks = true;

                        // Clean up
                        await eecolDB.delete('inventoryRecords', testId);

                    } catch (e) {
                        results.error = e.message;
                    }

                    return results;
                }
            """)

            print(f"Verification Results: {verification_result}")

            # Take a screenshot of the page for visual confirmation that it loaded
            page.screenshot(path="verification/verification_index.png")

            if verification_result['version'] == 9 and verification_result['timestampIndexExists'] and verification_result['addWorks'] and verification_result['updateWorks']:
                print("✅ ALL TESTS PASSED")
            else:
                print("❌ TESTS FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()

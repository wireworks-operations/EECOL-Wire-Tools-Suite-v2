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
                        initialValue: null,
                        afterAddValue: null,
                        afterUpdateValue: null,
                        afterDeleteValue: null,
                        afterClearValue: null,
                        afterBulkPutValue: null,
                        error: null
                    };

                    try {
                        const eecolDB = EECOLIndexedDB.getInstance();
                        await eecolDB.isReady();

                        results.initialValue = localStorage.getItem('eecolDBChange');

                        // Test add (calls update internally)
                        await eecolDB.add('settings', { name: 'sync-test', value: '1' });
                        results.afterAddValue = localStorage.getItem('eecolDBChange');

                        await new Promise(r => setTimeout(r, 50));

                        // Test update
                        await eecolDB.update('settings', { name: 'sync-test', value: '2' });
                        results.afterUpdateValue = localStorage.getItem('eecolDBChange');

                        await new Promise(r => setTimeout(r, 50));

                        // Test delete
                        await eecolDB.delete('settings', 'sync-test');
                        results.afterDeleteValue = localStorage.getItem('eecolDBChange');

                        await new Promise(r => setTimeout(r, 50));

                        // Test bulkPut
                        await eecolDB.bulkPut('settings', [{ name: 'bulk-test', value: '3' }]);
                        results.afterBulkPutValue = localStorage.getItem('eecolDBChange');

                        await new Promise(r => setTimeout(r, 50));

                        // Test clear
                        await eecolDB.clear('settings');
                        results.afterClearValue = localStorage.getItem('eecolDBChange');

                    } catch (e) {
                        results.error = e.message;
                    }

                    return results;
                }
            """)

            print(f"Verification Results: {verification_result}")

            # Check if values changed
            checks = [
                verification_result['afterAddValue'] != verification_result['initialValue'],
                verification_result['afterUpdateValue'] != verification_result['afterAddValue'],
                verification_result['afterDeleteValue'] != verification_result['afterUpdateValue'],
                verification_result['afterBulkPutValue'] != verification_result['afterDeleteValue'],
                verification_result['afterClearValue'] != verification_result['afterBulkPutValue']
            ]

            if all(checks) and verification_result['error'] is None:
                print("✅ TAB SYNC NOTIFICATION VERIFICATION PASSED")
            else:
                print("❌ TAB SYNC NOTIFICATION VERIFICATION FAILED")
                if verification_result['error']:
                    print(f"Error: {verification_result['error']}")
                else:
                    if not checks[0]: print("Add failed to trigger change")
                    if not checks[1]: print("Update failed to trigger change")
                    if not checks[2]: print("Delete failed to trigger change")
                    if not checks[3]: print("BulkPut failed to trigger change")
                    if not checks[4]: print("Clear failed to trigger change")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()

from playwright.sync_api import sync_playwright
import time
import subprocess
import os
import json

def run_verification():
    # Start the dev server
    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it time to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Use cutting-records.html as it also has IndexedDB
            page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html", timeout=5000)

            # Verification snippet for migration safety
            verification_result = page.evaluate("""
                async () => {
                    if (typeof EECOLIndexedDB === 'undefined') {
                        return { success: false, error: 'EECOLIndexedDB not found' };
                    }

                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();

                    // Prepare test data in localStorage
                    localStorage.setItem('cutRecords', JSON.stringify([{
                        id: 'test-cut',
                        wireId: 'WIRE001',
                        cutLength: 10,
                        timestamp: Date.now()
                    }]));
                    localStorage.setItem('inventoryItems', 'INVALID_JSON'); // This will cause a failure in inventory migration

                    const initialKeys = {
                        cutRecords: localStorage.getItem('cutRecords'),
                        inventoryItems: localStorage.getItem('inventoryItems')
                    };

                    // Run migration
                    await dbInstance.migrateFromLocalStorage();

                    const finalKeys = {
                        cutRecords: localStorage.getItem('cutRecords'),
                        inventoryItems: localStorage.getItem('inventoryItems')
                    };

                    return {
                        cutRecordsMigrated: finalKeys.cutRecords === null,
                        inventoryItemsRetained: finalKeys.inventoryItems !== null,
                        initialKeys,
                        finalKeys
                    };
                }
            """)

            print(f"Migration Safety Results: {json.dumps(verification_result, indent=2)}")

            if verification_result.get('cutRecordsMigrated') and verification_result.get('inventoryItemsRetained'):
                print("✅ MIGRATION SAFETY TEST PASSED")
            else:
                print("❌ MIGRATION SAFETY TEST FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()

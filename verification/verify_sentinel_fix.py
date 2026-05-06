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
            # Try both possible index.html locations
            try:
                page.goto("http://localhost:3000/index.html", timeout=5000)
            except:
                page.goto("http://localhost:3000/src/pages/index/index.html", timeout=5000)

            # Verification snippet
            verification_result = page.evaluate("""
                async () => {
                    if (typeof EECOLIndexedDB === 'undefined') {
                        return { success: false, error: 'EECOLIndexedDB not found' };
                    }

                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();
                    const db = dbInstance.db;

                    const results = {
                        storesPresent: [],
                        missingStores: [],
                        crudTest: false,
                        migrationLogicTest: typeof dbInstance.migrateFromLocalStorage === 'function'
                    };

                    const requiredStores = ['cuttingRecords', 'inventoryRecords', 'maintenanceLogs', 'settings', 'multicutPlanner'];
                    requiredStores.forEach(store => {
                        if (db.objectStoreNames.contains(store)) {
                            results.storesPresent.push(store);
                        } else {
                            results.missingStores.push(store);
                        }
                    });

                    // Basic CRUD test
                    try {
                        const testId = 'sentinel-test-' + Date.now();
                        await dbInstance.add('settings', { name: testId, value: 'verified' });
                        const retrieved = await dbInstance.get('settings', testId);
                        if (retrieved && retrieved.value === 'verified') {
                            await dbInstance.delete('settings', testId);
                            results.crudTest = true;
                        }
                    } catch (e) {
                        results.crudError = e.message;
                    }

                    return results;
                }
            """)

            print(f"Verification Results: {json.dumps(verification_result, indent=2)}")

            if len(verification_result['missingStores']) == 0 and verification_result['crudTest']:
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

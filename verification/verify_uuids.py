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
            # We use an existing page that loads IndexedDB
            page.goto("http://localhost:3000/index.html")

            # Verification snippet for new UUID logic
            verification_result = page.evaluate("""
                async () => {
                    const results = {
                        markConverterId: null,
                        stopmarkConverterId: null,
                        reelcapacityId: null,
                        reelsizeId: null,
                        error: null
                    };

                    try {
                        const eecolDB = EECOLIndexedDB.getInstance();
                        await eecolDB.isReady();

                        // Test save methods
                        results.markConverterId = await eecolDB.saveMarkConverter({ test: true });
                        results.stopmarkConverterId = await eecolDB.saveStopMarkConverter({ test: true });
                        results.reelcapacityId = await eecolDB.saveReelCapacityEstimator({ test: true });
                        results.reelsizeId = await eecolDB.saveReelSizeEstimator({ test: true });

                        // Basic cleanup
                        await eecolDB.delete('markConverter', results.markConverterId);
                        await eecolDB.delete('stopmarkConverter', results.stopmarkConverterId);
                        await eecolDB.delete('reelcapacityEstimator', results.reelcapacityId);
                        await eecolDB.delete('reelsizeEstimator', results.reelsizeId);

                    } catch (e) {
                        results.error = e.message;
                    }

                    return results;
                }
            """)

            print(f"New ID Verification Results: {verification_result}")

            def is_uuid(val):
                if not val or not isinstance(val, str): return False
                # Simple UUID v4 check: 8-4-4-4-12 hex chars
                import re
                return bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', val.lower()))

            uuids_valid = all([
                is_uuid(verification_result['markConverterId']),
                is_uuid(verification_result['stopmarkConverterId']),
                is_uuid(verification_result['reelcapacityId']),
                is_uuid(verification_result['reelsizeId'])
            ])

            if uuids_valid:
                print("✅ UUID VERIFICATION PASSED")
            else:
                print("❌ UUID VERIFICATION FAILED (IDs are not valid UUIDs)")
                print(verification_result)
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🧪 Starting IndexedDB Sentinel Fix Verification...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app (assuming it's being served or just load the local file)
  // For verification purposes, we'll use a file URL if no server is running,
  // but it's better to run against the dev server if possible.
  const appPath = 'file://' + path.resolve(__dirname, '../index.html');

  try {
    await page.goto(appPath);

    // Inject and execute verification logic
    const result = await page.evaluate(async () => {
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
        idempotencyTest: 'Skipped (Upgrade context required)',
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
    });

    console.log('Verification Results:', JSON.stringify(result, null, 2));

    if (result.missingStores.length === 0 && result.crudTest) {
      console.log('✅ Verification PASSED');
      process.exit(0);
    } else {
      console.error('❌ Verification FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

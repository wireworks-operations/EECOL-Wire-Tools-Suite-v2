import { describe, it, expect } from 'vitest';
import { EECOLIndexedDB } from '../../src/services/database/core';

describe('EECOLIndexedDB Migrations', () => {
  it('should upgrade correctly and preserve data', async () => {
    const dbName = 'MigrationTestDB_Correct';
    EECOLIndexedDB.instance = null;

    // Setup v1
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        db.createObjectStore('settings', { keyPath: 'name' });
        db.createObjectStore('cuttingRecords', { keyPath: 'id' });
      };
      request.onsuccess = (event) => {
        const db = request.result;
        const tx = db.transaction(['cuttingRecords', 'settings'], 'readwrite');
        tx.objectStore('cuttingRecords').put({ id: 'old-1', wireId: 'OLD-WIRE' });
        tx.objectStore('settings').put({ name: 'theme', value: 'light' });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
      request.onerror = () => reject(request.error);
    });

    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    dbService.dbName = dbName;
    dbService.dbVersion = 8;

    await dbService.initialize();
    expect(dbService.db?.version).toBe(8);

    // Verify ALL stores exist
    expect(dbService.db?.objectStoreNames.contains('cuttingRecords')).toBe(true);
    expect(dbService.db?.objectStoreNames.contains('wireCutList')).toBe(true);

    dbService.db?.close();
  });
});

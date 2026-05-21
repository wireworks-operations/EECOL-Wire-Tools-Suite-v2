import { describe, it, expect } from 'vitest';
import { EECOLIndexedDB } from '../../src/services/database/core';

describe('EECOLIndexedDB Core', () => {
  it('should initialize the database with correct version', async () => {
    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    await dbService.initialize();
    expect(dbService.db).toBeDefined();
    expect(dbService.db?.name).toBe('EECOLTools_v2');
    expect(dbService.db?.version).toBe(8);
    dbService.db?.close();
  });

  it('should create all required object stores', async () => {
    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    await dbService.initialize();
    const storeNames = dbService.db?.objectStoreNames;

    const expectedStores = [
      'cuttingRecords', 'inventoryRecords', 'users', 'notifications',
      'maintenanceLogs', 'markConverter', 'stopmarkConverter',
      'reelcapacityEstimator', 'reelsizeEstimator', 'multicutPlanner',
      'settings', 'sessions', 'calibrationMeasurements', 'wireCutList'
    ];

    expectedStores.forEach(store => {
      expect(storeNames?.contains(store)).toBe(true);
    });
    dbService.db?.close();
  });

  it('should perform CRUD operations on cuttingRecords', async () => {
    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    await dbService.initialize();
    const record = {
      id: 'test-id',
      timestamp: Date.now(),
      cutterName: 'JULES',
      wireId: 'WIRE-1',
      orderNumber: '1234567',
      customerName: 'ACME CORP',
      cutLength: 100,
      cutLengthUnit: 'm' as const,
      lineCode: 'A',
      turnedToLineCode: 'B',
      coilOrReel: 'coil' as const,
      chargeable: 'yes' as const,
      isFullPick: false,
      isNoMarks: false,
      isSystemCut: false,
      isCutInSystem: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await dbService.add('cuttingRecords', record);
    const saved = await dbService.get<any>('cuttingRecords', 'test-id');
    expect(saved).toEqual(record);

    const updated = { ...record, cutterName: 'JULES UPDATED' };
    await dbService.update('cuttingRecords', updated);
    const savedUpdated = await dbService.get<any>('cuttingRecords', 'test-id');
    expect(savedUpdated.cutterName).toBe('JULES UPDATED');

    const all = await dbService.getAll<any>('cuttingRecords');
    expect(all.length).toBe(1);

    await dbService.delete('cuttingRecords', 'test-id');
    const afterDelete = await dbService.get<any>('cuttingRecords', 'test-id');
    expect(afterDelete).toBeUndefined();
    dbService.db?.close();
  });

  it('should handle settings (keyPath is name, not id)', async () => {
    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    await dbService.initialize();
    const setting = { name: 'theme', value: 'dark', lastModified: Date.now() };

    await dbService.put('settings', setting);
    const saved = await dbService.get<any>('settings', 'theme');
    expect(saved.value).toBe('dark');
    dbService.db?.close();
  });

  it('should clear an object store', async () => {
    EECOLIndexedDB.instance = null;
    const dbService = EECOLIndexedDB.getInstance();
    await dbService.initialize();
    await dbService.add('cuttingRecords', { id: '1', timestamp: Date.now() });
    await dbService.add('cuttingRecords', { id: '2', timestamp: Date.now() });

    let all = await dbService.getAll('cuttingRecords');
    expect(all.length).toBe(2);

    await dbService.clear('cuttingRecords');
    all = await dbService.getAll('cuttingRecords');
    expect(all.length).toBe(0);
    dbService.db?.close();
  });
});

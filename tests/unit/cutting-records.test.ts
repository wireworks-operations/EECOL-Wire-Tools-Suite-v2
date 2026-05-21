import { describe, it, expect } from 'vitest';
import { calculateStats, filterRecords } from '../../src/pages/CuttingRecords/utils/logic';
import { CuttingRecord } from '../../src/types/database';

describe('CuttingRecords Logic', () => {
  const mockRecords: CuttingRecord[] = [
    {
      id: '1', timestamp: Date.now(), cutterName: 'JULES', wireId: 'W1', orderNumber: '100',
      customerName: 'C1', cutLength: 50, cutLengthUnit: 'm', lineCode: 'L1', turnedToLineCode: '',
      coilOrReel: 'coil', chargeable: 'yes', isFullPick: false, isNoMarks: false, isSystemCut: false,
      createdAt: Date.now(), updatedAt: Date.now(), isCutInSystem: false
    },
    {
      id: '2', timestamp: Date.now() - 86400000 * 2, cutterName: 'BOB', wireId: 'W2', orderNumber: '200',
      customerName: 'C2', cutLength: 150, cutLengthUnit: 'm', lineCode: 'L2', turnedToLineCode: '',
      coilOrReel: 'reel', chargeable: 'yes', isFullPick: true, isNoMarks: false, isSystemCut: true,
      createdAt: Date.now(), updatedAt: Date.now(), isCutInSystem: false
    }
  ];

  it('should calculate stats correctly', () => {
    const stats = calculateStats(mockRecords);
    expect(stats.totalCutsToday).toBe(1);
    expect(stats.totalLength).toBe(200);
    expect(stats.fullPicksCount).toBe(1);
    expect(stats.systemCutsCount).toBe(1);
    expect(stats.topCutter).toBe('JULES');
  });

  it('should filter records by search term', () => {
    const filtered = filterRecords(mockRecords, 'BOB', 'all', '', '');
    expect(filtered.length).toBe(1);
    expect(filtered[0].cutterName).toBe('BOB');
  });
});

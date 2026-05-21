import { describe, it, expect } from 'vitest';
import { toMeters, calculateCapacity } from '../../src/pages/ReelCapacity/utils/logic';

describe('ReelCapacity Logic', () => {
  it('should correctly convert units to meters', () => {
    expect(toMeters(1, 'in')).toBeCloseTo(0.0254);
    expect(toMeters(100, 'cm')).toBe(1);
    expect(toMeters(1000, 'mm')).toBe(1);
    expect(toMeters(3.280839895, 'ft')).toBeCloseTo(1);
  });

  it('should calculate capacity for a standard reel', () => {
    const df = toMeters(30, 'in');
    const dc = toMeters(15, 'in');
    const w = toMeters(18, 'in');
    const f = toMeters(0.5, 'in');
    const d = toMeters(0.25, 'in');
    const efficiency = 0.85;

    const result = calculateCapacity(df, dc, w, f, d, efficiency);

    expect(result.error).toBeUndefined();
    expect(result.totalLength).toBeGreaterThan(0);
    expect(result.nLayers).toBeGreaterThan(0);
  });

  it('should return error for invalid wire diameter', () => {
    const result = calculateCapacity(1, 0.5, 0.5, 0.1, 0, 0.85);
    expect(result.error).toBe('Wire diameter must be greater than zero.');
  });
});

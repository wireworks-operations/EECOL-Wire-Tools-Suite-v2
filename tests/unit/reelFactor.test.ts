import { describe, it, expect } from 'vitest';
import { calculateCapacity } from '../../src/pages/ReelCapacity/utils/logic';
import { REEL_FACTOR_CONSTANT } from '../../src/utils/engineering';

describe('Reel Factor Invariant', () => {
  it('should use the correct REEL_FACTOR_CONSTANT (0.262)', () => {
    expect(REEL_FACTOR_CONSTANT).toBe(0.262);
  });

  it('should calculate capacity correctly using the reel factor formula', () => {
    // F = (H+B) * H * T * 0.262
    // Let's use some simple values in meters and convert to inches internally as logic does
    // logic.ts:
    // h_in = h / INCHES_TO_METERS
    // dc_in = dc / INCHES_TO_METERS
    // w_in = w / INCHES_TO_METERS
    // reelFactor = (h_in + dc_in) * h_in * w_in * 0.262

    const df = 1.0; // 1 meter flange
    const dc = 0.5; // 0.5 meter barrel
    const w = 0.6;  // 0.6 meter traverse
    const f = 0.05; // 0.05 meter freeboard
    const d = 0.01; // 0.01 meter wire diameter
    const efficiency = 1.0;

    const result = calculateCapacity(df, dc, w, f, d, efficiency);

    // Expected h = ( (1.0 - 2*0.05) - 0.5 ) / 2 = (0.9 - 0.5) / 2 = 0.2 meters
    // h_in = 0.2 / 0.0254 = 7.874...
    // dc_in = 0.5 / 0.0254 = 19.685...
    // w_in = 0.6 / 0.0254 = 23.622...
    // reelFactor = (7.874 + 19.685) * 7.874 * 23.622 * 0.262 = 27.559 * 7.874 * 23.622 * 0.262 ≈ 1342.9

    expect(result.reelFactor).toBeCloseTo(1342.9, 0);
    expect(result.h).toBeCloseTo(7.874, 3);
  });
});

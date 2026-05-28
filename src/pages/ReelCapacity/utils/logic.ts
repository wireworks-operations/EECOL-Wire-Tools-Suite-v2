import { REEL_FACTOR_CONSTANT, METERS_TO_FEET, INCHES_TO_METERS } from '../../../utils/engineering';

export const toMeters = (value: number, unit: string): number => {
  switch (unit) {
    case 'in': return value * INCHES_TO_METERS;
    case 'cm': return value * 0.01;
    case 'mm': return value * 0.001;
    case 'ft': return value / METERS_TO_FEET;
    default: return value;
  }
};

export const fromMeters = (value: number, unit: string): number => {
  switch (unit) {
    case 'in': return value / INCHES_TO_METERS;
    case 'cm': return value * 100;
    case 'mm': return value * 1000;
    case 'ft': return value * METERS_TO_FEET;
    default: return value;
  }
};

/**
 * Enhanced Reel Capacity Calculation based on legacy logic
 */
export const calculateCapacity = (df: number, dc: number, w: number, f: number, d: number, efficiency: number) => {
  if (d <= 0) return { error: 'Wire diameter must be greater than zero.' };

  const usableD = df - (2 * f);
  if (usableD <= dc) return { error: 'Safety margin/freeboard exceeds reel capacity.' };

  const h = (usableD - dc) / 2;

  // Legacy "Reel Factor" Formula: F = (H + D[barrel]) * H * Traverse * 0.262
  // We'll calculate this in inches as per legacy standard
  const h_in = h / INCHES_TO_METERS;
  const dc_in = dc / INCHES_TO_METERS;
  const w_in = w / INCHES_TO_METERS;
  const d_in = d / INCHES_TO_METERS;

  const reelFactor = (h_in + dc_in) * h_in * w_in * REEL_FACTOR_CONSTANT;
  const maxCapacityFt = reelFactor / (d_in * d_in);

  const totalLengthFt = maxCapacityFt * efficiency;
  const totalLength = totalLengthFt / METERS_TO_FEET;

  // Layer breakdown calculation
  const nLayers = Math.floor(h / d);
  const PI = Math.PI;
  const turnsPerLayer = Math.floor(w / d);

  let calculatedTotal = 0;
  let workingLength = 0;
  const layers = [];

  for (let n = 1; n <= nLayers; n++) {
    const layerDiameter = dc + (2 * n - 1) * d;
    const layerLen = turnsPerLayer * PI * layerDiameter * efficiency;
    calculatedTotal += layerLen;
    if (n > 3) workingLength += layerLen;
    layers.push({ n, length: layerLen });
  }

  return {
    totalLength: totalLength, // Using legacy factor for total
    workingLength: (workingLength / calculatedTotal) * totalLength, // Proportional working length
    layers,
    nLayers,
    reelFactor,
    h: h_in
  };
};

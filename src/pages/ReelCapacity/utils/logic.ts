export const METERS_TO_FEET = 3.280839895;
export const INCHES_TO_METERS = 0.0254;

export const toMeters = (value: number, unit: string): number => {
  switch (unit) {
    case 'in': return value * INCHES_TO_METERS;
    case 'cm': return value * 0.01;
    case 'mm': return value * 0.001;
    case 'ft': return value / METERS_TO_FEET;
    default: return value;
  }
};

export const calculateCapacity = (df: number, dc: number, w: number, f: number, d: number, efficiency: number) => {
  const TURN_SPACING_FACTOR = 1.1;
  const PI = Math.PI;
  const usableD = df - (2 * f);

  if (usableD <= dc + d) return { error: 'Reel too small for given parameters.' };

  const nLayers = Math.floor((usableD - dc) / (2 * d));
  const segmentsPerLayer = Math.floor(w / (TURN_SPACING_FACTOR * d));

  let totalLength = 0;
  let workingLength = 0;
  const layers = [];

  for (let n = 1; n <= nLayers; n++) {
    const dn = dc + (2 * n - 1) * d;
    const layerLen = segmentsPerLayer * PI * dn * efficiency;
    totalLength += layerLen;
    if (n > 3) workingLength += layerLen;
    layers.push({ n, length: layerLen });
  }

  return { totalLength, workingLength, layers, nLayers };
};

import React, { useState } from 'react';
import { toMeters, calculateCapacity, METERS_TO_FEET } from './utils/logic';

const REEL_PRESETS = [
  { name: 'EE-24W', flange: 24, core: 12, width: 14 },
  { name: 'EE-30W', flange: 30, core: 15, width: 18 },
  { name: 'EE-36W', flange: 36, core: 18, width: 22 },
  { name: 'EE-42W', flange: 42, core: 21, width: 26 },
  { name: 'EE-48W', flange: 48, core: 24, width: 30 },
  { name: 'EE-54W', flange: 54, core: 27, width: 34 },
  { name: 'EE-60W', flange: 60, core: 30, width: 38 }
];

const ReelCapacity: React.FC = () => {
  const [inputs, setInputs] = useState({
    flange: 0, flangeUnit: 'in', core: 0, coreUnit: 'in', width: 0, widthUnit: 'in',
    wireD: 0, wireDUnit: 'in', freeboard: 2, freeboardUnit: 'in', efficiency: 0.9
  });
  const [result, setResult] = useState<any>(null);

  const applyPreset = (preset: typeof REEL_PRESETS[0]) => {
    setInputs(prev => ({
      ...prev,
      flange: preset.flange,
      core: preset.core,
      width: preset.width,
      flangeUnit: 'in',
      coreUnit: 'in',
      widthUnit: 'in'
    }));
  };

  const calculate = () => {
    const df = toMeters(inputs.flange, inputs.flangeUnit);
    const dc = toMeters(inputs.core, inputs.coreUnit);
    const w = toMeters(inputs.width, inputs.widthUnit);
    const f = toMeters(inputs.freeboard, inputs.freeboardUnit);
    const d = toMeters(inputs.wireD, inputs.wireDUnit);

    const res = calculateCapacity(df, dc, w, f, d, inputs.efficiency);
    setResult(res);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Reel Capacity Estimator</h1>

        <div className="mb-6">
           <label className="text-[10px] font-bold header-gradient uppercase mb-2 block">Standard Reel Presets</label>
           <div className="flex flex-wrap gap-2">
             {REEL_PRESETS.map(p => (
               <button key={p.name} onClick={() => applyPreset(p)} className="px-2 py-1 bg-eecol-light-blue dark:bg-blue-900/40 text-eecol-blue dark:text-blue-300 text-[10px] font-black rounded border border-eecol-blue/20 hover:bg-eecol-blue hover:text-white transition-colors">
                 {p.name}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Flange Diameter (A)</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.flange} onChange={e => setInputs({...inputs, flange: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.flangeUnit} onChange={e => setInputs({...inputs, flangeUnit: e.target.value})} className="input-premium w-20 bg-white dark:bg-slate-700"><option value="in">in</option><option value="m">m</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Core Diameter (B)</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.core} onChange={e => setInputs({...inputs, core: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.coreUnit} onChange={e => setInputs({...inputs, coreUnit: e.target.value})} className="input-premium w-20 bg-white dark:bg-slate-700"><option value="in">in</option><option value="m">m</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Traverse Width (C)</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.width} onChange={e => setInputs({...inputs, width: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.widthUnit} onChange={e => setInputs({...inputs, widthUnit: e.target.value})} className="input-premium w-20 bg-white dark:bg-slate-700"><option value="in">in</option><option value="m">m</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Wire Diameter (D)</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.wireDUnit} onChange={e => setInputs({...inputs, wireDUnit: e.target.value})} className="input-premium w-20 bg-white dark:bg-slate-700"><option value="in">in</option><option value="mm">mm</option></select>
              </div>
           </div>
        </div>

        <button onClick={calculate} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-6 uppercase">Calculate Capacity</button>

        {result && !result.error && (
          <div className="mt-8 space-y-4 animate-entrance">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 text-center">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Total Capacity</p>
                <p className="text-xl font-black text-blue-800 dark:text-white">{result.totalLength.toFixed(0)}m</p>
                <p className="text-[10px] text-gray-500">({(result.totalLength * METERS_TO_FEET).toFixed(0)} ft)</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 text-center">
                <p className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase">Working Capacity</p>
                <p className="text-xl font-black text-green-800 dark:text-white">{result.workingLength.toFixed(0)}m</p>
                <p className="text-[10px] text-gray-500">({(result.workingLength * METERS_TO_FEET).toFixed(0)} ft)</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 text-left">
              <p className="text-[10px] font-bold header-gradient mb-2 uppercase">Layer Breakdown ({result.nLayers} Layers)</p>
              <div className="max-h-32 overflow-y-auto text-[10px] space-y-1">
                {result.layers.map((l: any) => (
                  <div key={l.n} className={l.n <= 3 ? 'text-red-600' : 'text-green-600'}>
                    Layer {l.n} {l.n <= 3 && '[DEAD WRAP]'}: {l.length.toFixed(1)}m
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {result?.error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded text-xs font-bold">{result.error}</div>}
      </div>
    </div>
  );
};

export default ReelCapacity;

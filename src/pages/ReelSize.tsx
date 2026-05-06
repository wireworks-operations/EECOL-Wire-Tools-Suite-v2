import React, { useState } from 'react';
import { toMeters, METERS_TO_FEET } from './ReelCapacity/utils/logic';

const ReelSize: React.FC = () => {
  const [inputs, setInputs] = useState({ wireD: 0, targetLen: 0, unit: 'm', efficiency: 0.9 });
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const d = toMeters(inputs.wireD, 'in');
    const target = inputs.unit === 'm' ? inputs.targetLen : inputs.targetLen / METERS_TO_FEET;

    // Theoretical logic
    const core = Math.max(d * 10, 0.3);
    const layers = 10;
    const flange = core + (d * layers) + (2 * 0.05); // simple heuristic

    setResult({ core, flange, layers });
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Reel Size Estimator</h1>

        <div className="space-y-4 text-left">
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Wire Diameter (in)</label>
              <input type="number" value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: Number(e.target.value)})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Target Length</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.targetLen} onChange={e => setInputs({...inputs, targetLen: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.unit} onChange={e => setInputs({...inputs, unit: e.target.value})} className="input-premium w-20 dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
              </div>
           </div>

           <button onClick={calculate} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-2 uppercase">Find Best Reel</button>

           {result && (
             <div className="mt-6 p-4 bg-eecol-light-blue dark:bg-blue-900/30 rounded-xl border-2 border-eecol-blue text-center">
               <p className="text-[10px] font-bold text-eecol-blue dark:text-blue-300 uppercase">Recommended Dimensions</p>
               <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>Flange: {(result.flange / 0.0254).toFixed(1)} in</div>
                  <div>Core: {(result.core / 0.0254).toFixed(1)} in</div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ReelSize;

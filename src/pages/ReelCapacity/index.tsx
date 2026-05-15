import React, { useState, useEffect } from 'react';
import { toMeters, calculateCapacity, METERS_TO_FEET } from './utils/logic';
import { useDatabase } from '../../hooks/useDatabase';

const ReelCapacity: React.FC = () => {
  const { db } = useDatabase();
  const [inputs, setInputs] = useState({
    target: 300, targetUnit: 'm',
    core: 0, coreUnit: 'in',
    flange: 0, flangeUnit: 'in',
    width: 0, widthUnit: 'in',
    freeboard: 0.5, freeboardUnit: 'in',
    wireD: 0, wireDUnit: 'in',
    efficiency: 0.8,
    safetyStandard: 'ansi_b307_05in'
  });
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const Df = toMeters(inputs.flange, inputs.flangeUnit);
    const Dc = toMeters(inputs.core, inputs.coreUnit);
    const W = toMeters(inputs.width, inputs.widthUnit);
    const F = toMeters(inputs.freeboard, inputs.freeboardUnit);
    const d = toMeters(inputs.wireD, inputs.wireDUnit);

    const res = calculateCapacity(Df, Dc, W, F, d, inputs.efficiency);
    setResult(res);
  };

  const handleStandardChange = (std: string) => {
    let f = inputs.freeboard;
    let unit = inputs.freeboardUnit;
    if (std === 'ansi_b307_05in') { f = 0.5; unit = 'in'; }
    else if (std === 'ansi_a1022_2in') { f = 2.0; unit = 'in'; }
    else if (std === 'full') { f = 0; unit = 'in'; }

    setInputs({...inputs, safetyStandard: std, freeboard: f, freeboardUnit: unit as any});
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Reel Capacity Estimator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Estimate maximum wire capacity based on reel geometry.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-solid border-eecol-blue space-y-4">
            <h3 className="text-lg font-bold text-eecol-blue mb-3 text-center uppercase">Reel Geometry Inputs</h3>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Target Length</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.target} onChange={e => setInputs({...inputs, target: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.targetUnit} onChange={e => setInputs({...inputs, targetUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="m">m</option><option value="ft">ft</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Core/Barrel Diameter (A)</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.core} onChange={e => setInputs({...inputs, core: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.coreUnit} onChange={e => setInputs({...inputs, coreUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Flange Diameter (B)</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.flange} onChange={e => setInputs({...inputs, flange: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.flangeUnit} onChange={e => setInputs({...inputs, flangeUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Traverse Width (C)</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.width} onChange={e => setInputs({...inputs, width: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.widthUnit} onChange={e => setInputs({...inputs, widthUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Safety Standard / Freeboard (D)</label>
                <select value={inputs.safetyStandard} onChange={e => handleStandardChange(e.target.value)} className="input-premium w-full bg-white font-bold text-sm mb-2">
                    <option value="ansi_b307_05in">ANSI B30.7 - 0.5 in</option>
                    <option value="ansi_a1022_2in">ANSI A10.22 - 2.0 in</option>
                    <option value="full">Full Drum (0 in)</option>
                    <option value="custom">Custom</option>
                </select>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.freeboard} onChange={e => setInputs({...inputs, freeboard: parseFloat(e.target.value)})} disabled={inputs.safetyStandard !== 'custom'} className={`input-premium w-full font-bold ${inputs.safetyStandard !== 'custom' && 'bg-gray-100'}`} />
                    <select value={inputs.freeboardUnit} onChange={e => setInputs({...inputs, freeboardUnit: e.target.value as any})} disabled={inputs.safetyStandard !== 'custom'} className={`input-premium w-auto font-bold ${inputs.safetyStandard !== 'custom' && 'bg-gray-100'}`}><option value="in">in</option><option value="cm">cm</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Wire Diameter (E)</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.wireDUnit} onChange={e => setInputs({...inputs, wireDUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="mm">mm</option></select>
                </div>
            </div>

            <div className="shadow-md rounded-xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Winding Efficiency (F)</label>
                <select value={inputs.efficiency} onChange={e => setInputs({...inputs, efficiency: parseFloat(e.target.value)})} className="input-premium w-full bg-white font-bold">
                    <option value="1.0">100%</option>
                    <option value="0.95">95%</option>
                    <option value="0.90">90%</option>
                    <option value="0.85">85%</option>
                    <option value="0.80">80%</option>
                    <option value="0.75">75%</option>
                </select>
            </div>

            <button onClick={calculate} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-sm mt-4">
                Calculate Reel Capacity
            </button>
          </div>

          <div className="space-y-6">
            {result && !result.error ? (
              <div className="bg-white p-4 border-l-8 border-eecol-blue rounded-xl shadow-xl animate-entrance space-y-4">
                <h3 className="text-lg font-bold text-eecol-blue text-center uppercase">Capacity Analysis</h3>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-green-800 uppercase">Usable Working Capacity</p>
                        <p className="text-xs text-green-600 font-medium italic">Dead wraps excluded</p>
                    </div>
                    <p className="text-2xl font-black text-green-700">{result.workingLength.toFixed(0)} m ({(result.workingLength * METERS_TO_FEET).toFixed(0)} ft)</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs font-bold text-blue-800">
                        <span>PHYSICAL TOTAL CAPACITY</span>
                        <span>{result.totalLength.toFixed(0)} m ({(result.totalLength * METERS_TO_FEET).toFixed(0)} ft)</span>
                    </div>
                    <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs font-bold text-amber-800">
                        <span>SAFETY-MARGIN CAPACITY</span>
                        <span>{result.safetyLength.toFixed(0)} m ({(result.safetyLength * METERS_TO_FEET).toFixed(0)} ft)</span>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[10px] text-gray-600 space-y-1">
                    <p className="font-bold text-gray-800">ℹ️ Why Dead Wraps Matter</p>
                    <p className="italic">The first 3 layers are "dead wraps" - physically present but unusable due to winding mechanics. They ensure proper tension and stability for the working layers above.</p>
                </div>

                <div className="space-y-1 mt-4">
                    <h4 className="text-xs font-bold text-eecol-blue uppercase">Layer-by-Layer Breakdown</h4>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {result.layers.map((l: any) => (
                            <p key={l.n} className={`text-[10px] font-bold ${l.isDead ? 'text-red-600' : 'text-green-600'}`}>
                                {l.isDead ? '📍' : '✅'} Layer {l.n}: {l.length.toFixed(0)} m ({(l.length * METERS_TO_FEET).toFixed(0)} ft) {l.isDead && '[DEAD WRAP]'}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={() => window.print()} className="flex-1 bg-eecol-blue text-white font-bold py-3 rounded-xl text-sm btn-tactile">Print Results</button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-12 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center opacity-40">
                <div className="text-5xl mb-4">🔄</div>
                <p className="text-sm font-bold text-blue-800 uppercase tracking-widest">Awaiting Calculation Data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelCapacity;

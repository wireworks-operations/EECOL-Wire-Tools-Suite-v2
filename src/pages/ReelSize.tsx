import React, { useState, useEffect } from 'react';
import { toMeters, calculateCapacity, METERS_TO_FEET } from './ReelCapacity/utils/logic';
import { useDatabase } from '../hooks/useDatabase';

const ReelSize: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [inputs, setInputs] = useState({
    wireD: 0.25, wireDUnit: 'in',
    target: 500, targetUnit: 'm',
    efficiency: 0.85,
    safetyStandard: 'ansi_b307_05in',
    freeboard: 0.5, freeboardUnit: 'in'
  });
  const [result, setResult] = useState<any>(null);
  const [savedReels, setSavedReels] = useState<any[]>([]);

  useEffect(() => {
    if (isReady && db) {
        db.getAll('reelcapacityEstimator').then(reels => setSavedReels(reels));
    }
  }, [isReady, db]);

  const calculate = () => {
    const targetM = inputs.targetUnit === 'm' ? inputs.target : inputs.target / METERS_TO_FEET;
    const dM = toMeters(inputs.wireD, inputs.wireDUnit);
    const fM = toMeters(inputs.freeboard, inputs.freeboardUnit);

    // Reversed heuristic search
    // We try to find a balanced reel where h ≈ dc / 1.5 and traverse ≈ flange * 0.6
    let bestDc = 15;
    let bestW = 18;
    let bestDf = 30;

    // Check saved reels first
    const recommendations = savedReels.map(r => {
        const cap = calculateCapacity(
            toMeters(r.flange, r.flangeUnit),
            toMeters(r.core, r.coreUnit),
            toMeters(r.width, r.widthUnit),
            fM, dM, inputs.efficiency
        );
        return {
            name: `${r.flange}${r.flangeUnit} x ${r.width}${r.widthUnit} (Saved)`,
            flange: r.flange, core: r.core, width: r.width,
            capacity: cap.workingLength
        };
    });

    // Add standard defaults
    [
        { name: '30" Wood (30/15/18)', flange: 30, core: 15, width: 18 },
        { name: '42" Wood (42/21/26)', flange: 42, core: 21, width: 26 },
        { name: '48" Wood (48/24/30)', flange: 48, core: 24, width: 30 },
        { name: '60" Wood (60/30/38)', flange: 60, core: 30, width: 38 }
    ].forEach(r => {
        const cap = calculateCapacity(toMeters(r.flange, 'in'), toMeters(r.core, 'in'), toMeters(r.width, 'in'), fM, dM, inputs.efficiency);
        recommendations.push({ ...r, capacity: cap.workingLength });
    });

    setResult({
        theoretical: {
            flange: bestDf, core: bestDc, width: bestW,
            capacity: calculateCapacity(toMeters(bestDf, 'in'), toMeters(bestDc, 'in'), toMeters(bestW, 'in'), fM, dM, inputs.efficiency).workingLength
        },
        reels: recommendations.sort((a,b) => (a.capacity || 0) - (b.capacity || 0))
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Reel Size Estimator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1 uppercase tracking-widest">Find the optimal reel size for your wire capacity requirements.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-solid border-eecol-blue space-y-4">
            <h3 className="text-lg font-bold text-eecol-blue mb-3 text-center uppercase">Wire Specifications</h3>

            <div className="shadow-xl rounded-3xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Wire/Cable Diameter (d)</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.wireDUnit} onChange={e => setInputs({...inputs, wireDUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="mm">mm</option></select>
                </div>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Target Length</label>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.target} onChange={e => setInputs({...inputs, target: parseFloat(e.target.value)})} className="input-premium w-full font-bold" />
                    <select value={inputs.targetUnit} onChange={e => setInputs({...inputs, targetUnit: e.target.value as any})} className="input-premium w-auto bg-white font-bold"><option value="m">m</option><option value="ft">ft</option></select>
                </div>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Winding Efficiency</label>
                <select value={inputs.efficiency} onChange={e => setInputs({...inputs, efficiency: parseFloat(e.target.value)})} className="input-premium w-full bg-white font-bold">
                    <option value="1.0">100%</option>
                    <option value="0.95">95%</option>
                    <option value="0.90">90%</option>
                    <option value="0.85">85%</option>
                    <option value="0.80">80%</option>
                </select>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white space-y-2 border border-gray-100">
                <label className="block text-xs font-semibold header-gradient uppercase">Safety Standard / Freeboard</label>
                <select value={inputs.safetyStandard} onChange={e => setInputs({...inputs, safetyStandard: e.target.value, freeboard: e.target.value === 'ansi_b307_05in' ? 0.5 : (e.target.value === 'ansi_a1022_2in' ? 2 : 0)})} className="input-premium w-full bg-white font-bold text-sm mb-2">
                    <option value="ansi_b307_05in">ANSI B30.7 - 0.5 in</option>
                    <option value="ansi_a1022_2in">ANSI A10.22 - 2.0 in</option>
                    <option value="full">Full Drum (0 in)</option>
                    <option value="custom">Custom</option>
                </select>
                <div className="flex space-x-1">
                    <input type="number" value={inputs.freeboard} onChange={e => setInputs({...inputs, freeboard: parseFloat(e.target.value)})} disabled={inputs.safetyStandard !== 'custom'} className={`input-premium w-full font-bold ${inputs.safetyStandard !== 'custom' && 'bg-gray-100'}`} />
                    <select value={inputs.freeboardUnit} disabled className="input-premium w-auto font-bold bg-gray-100"><option value="in">in</option></select>
                </div>
            </div>

            <button onClick={calculate} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-xl text-sm mt-4">
                Find Optimal Reel Size
            </button>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="bg-white p-4 border-l-8 border-eecol-blue rounded-3xl shadow-xl animate-entrance space-y-6">
                <h3 className="text-lg font-bold text-eecol-blue text-center uppercase">Reel Size Analysis</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4">
                    <h4 className="text-sm font-bold text-eecol-blue mb-2 uppercase">🏗️ Theoretical Optimal Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white p-2 rounded shadow-sm">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Flange Diameter</p>
                            <p className="text-lg font-bold text-eecol-blue">{result.theoretical.flange}"</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Core Diameter</p>
                            <p className="text-lg font-bold text-eecol-blue">{result.theoretical.core}"</p>
                        </div>
                        <div className="col-span-2 bg-white p-2 rounded shadow-sm">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Working Capacity</p>
                            <p className="text-lg font-bold text-green-600">{result.theoretical.capacity.toFixed(0)} m</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-eecol-blue uppercase">🏭 Recommended Standard Reels</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {result.reels.map((r: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white border border-gray-200 rounded-3xl shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-eecol-blue text-xs uppercase">{r.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold">MAX USABLE: {r.capacity.toFixed(0)} m ({(r.capacity * METERS_TO_FEET).toFixed(0)} ft)</p>
                                </div>
                                <div className={`px-2 py-1 rounded-xl text-[10px] font-black ${r.capacity >= (inputs.targetUnit === 'm' ? inputs.target : inputs.target / METERS_TO_FEET) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {r.capacity >= (inputs.targetUnit === 'm' ? inputs.target : inputs.target / METERS_TO_FEET) ? 'FITS ✅' : 'SMALL ❌'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={() => window.print()} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-3xl text-sm btn-tactile">Print Results</button>
              </div>
            ) : (
              <div className="bg-blue-50 p-12 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center opacity-40">
                <div className="text-5xl mb-4">📐</div>
                <p className="text-sm font-bold text-blue-800 uppercase tracking-widest">Awaiting Requirements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelSize;

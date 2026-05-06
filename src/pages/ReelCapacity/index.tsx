import React, { useState, useEffect } from 'react';
import { toMeters, calculateCapacity, METERS_TO_FEET } from './utils/logic';
import { useDatabase } from '../../hooks/useDatabase';

const INDUSTRY_REELS = [
  { name: '30" Wood (30/15/18)', flange: 30, core: 15, width: 18 },
  { name: '42" Wood (42/21/26)', flange: 42, core: 21, width: 26 },
  { name: '48" Wood (48/24/30)', flange: 48, core: 24, width: 30 },
  { name: '60" Wood (60/30/38)', flange: 60, core: 30, width: 38 }
];

const CABLE_TYPES: Record<string, Record<string, number>> = {
  'TK90': { '14/3': 0.45, '12/3': 0.52, '10/3': 0.61 },
  'SOOW': { '14/3': 0.53, '12/3': 0.60, '10/3': 0.66 },
  'ACWU90': { '6/3': 0.95, '4/3': 1.12, '2/3': 1.34 }
};

const ReelCapacity: React.FC = () => {
  const { db } = useDatabase();
  const [inputs, setInputs] = useState({
    flange: 0, core: 0, width: 0, target: 300,
    wireD: 0, freeboard: 0.5, efficiency: 0.8,
    cableType: '', designation: ''
  });
  const [manualWireD, setManualWireD] = useState(true);
  const [savedSpecs, setSavedSpecs] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (db) {
      db.getAll('settings').then((settings: any[]) => {
        const specs = settings.filter(s => s.name.startsWith('reelSpec_'));
        setSavedSpecs(specs);
      });
    }
  }, [db]);

  const applyPreset = (preset: any) => {
    setInputs(prev => ({ ...prev, flange: preset.flange, core: preset.core, width: preset.width }));
  };

  const calculate = () => {
    const df = toMeters(inputs.flange, 'in');
    const dc = toMeters(inputs.core, 'in');
    const w = toMeters(inputs.width, 'in');
    const f = toMeters(inputs.freeboard, 'in');
    const d = toMeters(inputs.wireD, 'in');

    const res = calculateCapacity(df, dc, w, f, d, inputs.efficiency);
    setResult(res);
  };

  const saveSpec = async () => {
    if (!db) return;
    const name = prompt('Enter a name for this specification:');
    if (name) {
      await db.put('settings', { name: `reelSpec_${name}`, value: { flange: inputs.flange, core: inputs.core, width: inputs.width } });
      alert('Specification saved!');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Reel Capacity Estimator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Estimate maximum wire capacity based on reel geometry.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 space-y-6">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span>🎯</span> Reel Specifications & Standards
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Industry Standard Reels</label>
                <select onChange={e => {
                  const p = INDUSTRY_REELS.find(r => r.name === e.target.value);
                  if (p) applyPreset(p);
                }} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                  <option value="">-- Select Industry Standard --</option>
                  {INDUSTRY_REELS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Core Diameter (D[c])</label>
                  <input type="number" value={inputs.core} onChange={e => setInputs({...inputs, core: Number(e.target.value)})} className="input-premium w-full font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Flange Diameter (D[f])</label>
                  <input type="number" value={inputs.flange} onChange={e => setInputs({...inputs, flange: Number(e.target.value)})} className="input-premium w-full font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Traverse Width (W)</label>
                  <input type="number" value={inputs.width} onChange={e => setInputs({...inputs, width: Number(e.target.value)})} className="input-premium w-full font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Freeboard (Safety Margin)</label>
                  <input type="number" value={inputs.freeboard} onChange={e => setInputs({...inputs, freeboard: Number(e.target.value)})} className="input-premium w-full font-bold" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2">Wire Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Cable Type</label>
                    <select value={inputs.cableType} onChange={e => {
                      const type = e.target.value;
                      setInputs({...inputs, cableType: type, designation: '', wireD: 0});
                      setManualWireD(!type);
                    }} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                      <option value="">Manual Input</option>
                      {Object.keys(CABLE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Designation</label>
                    <select value={inputs.designation} disabled={!inputs.cableType} onChange={e => {
                      const d = e.target.value;
                      setInputs({...inputs, designation: d, wireD: CABLE_TYPES[inputs.cableType][d]});
                    }} className="input-premium w-full font-bold bg-white dark:bg-slate-700 disabled:opacity-50">
                      <option value="">-- Select Designation --</option>
                      {inputs.cableType && Object.keys(CABLE_TYPES[inputs.cableType]).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Wire Diameter (d)</label>
                  <input type="number" disabled={!manualWireD} value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: Number(e.target.value)})} className="input-premium w-full font-bold disabled:bg-slate-50" />
                </div>
              </div>

              <button onClick={calculate} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs">
                Calculate Reel Capacity
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && !result.error ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 animate-entrance">
                <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Capacity Analysis</h2>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-500 text-center">
                    <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase mb-1">Usable Working Capacity</p>
                    <p className="text-3xl font-black text-green-700 dark:text-white">{result.workingLength.toFixed(0)}m</p>
                    <p className="text-xs text-green-600/70 font-bold">({(result.workingLength * METERS_TO_FEET).toFixed(0)} ft)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 text-center">
                      <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Physical Total</p>
                      <p className="text-xl font-black text-blue-800 dark:text-white">{result.totalLength.toFixed(0)}m</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-200 text-center">
                      <p className="text-[8px] font-black text-slate-700 uppercase mb-1">Layers Needed</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{result.nLayers}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-100/30 rounded-2xl border border-blue-200">
                  <h3 className="text-[10px] font-black text-blue-800 uppercase mb-2">ℹ️ Why Dead Wraps Matter</h3>
                  <p className="text-[10px] text-blue-700 leading-relaxed italic">
                    The first 3 layers are "dead wraps" - physically present but unusable due to winding mechanics. They ensure proper tension and stability for the working layers above.
                  </p>
                </div>

                <div className="mt-6 flex gap-2">
                  <button onClick={() => window.print()} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-3 rounded-xl text-[10px] uppercase">
                    Print Results
                  </button>
                  <button onClick={saveSpec} className="flex-1 bg-eecol-blue text-white font-black py-3 rounded-xl text-[10px] uppercase">
                    Save Specs
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-12 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4 opacity-20">🔄</div>
                <p className="text-sm font-bold text-blue-300 uppercase">Awaiting Calculation Data</p>
              </div>
            )}

            {result?.error && (
              <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl text-xs font-bold animate-shake">
                ⚠️ {result.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelCapacity;

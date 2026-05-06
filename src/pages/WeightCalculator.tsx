import React, { useState, useMemo } from 'react';

const WEIGHT_TABLE: Record<string, Record<string, number>> = {
  'ACWU90': { '6/3': 640, '4/3': 880, '2/3': 1200, '1/3': 1450, '1/0-3': 1750, '2/0-3': 2100, '3/0-3': 2500, '4/0-3': 3000, '250-3': 3500 },
  'TECK90 CU': { '14/3': 280, '12/3': 350, '10/3': 450, '8/3': 700, '6/3': 950, '4/3': 1300, '2/3': 1850 },
  'RW90 CU': { '14': 25, '12': 35, '10': 55, '8': 95, '6': 140, '4': 210, '2': 310, '1/0': 480, '4/0': 850, '500': 1850 },
  'SOOW': { '14/3': 175, '12/3': 225, '10/3': 310, '8/3': 550, '6/3': 750 }
};

const WeightCalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    length: 500, lengthUnit: 'm',
    cableType: '', designation: '',
    reelTare: 0, skidTare: 0
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculation = useMemo(() => {
    const unitWeight = WEIGHT_TABLE[inputs.cableType]?.[inputs.designation] || 0;
    const lenFt = inputs.lengthUnit === 'm' ? inputs.length * 3.28084 : inputs.length;
    const wireWeightLbs = (lenFt / 1000) * unitWeight;
    const totalLbs = wireWeightLbs + inputs.reelTare + inputs.skidTare;

    return { wireWeightLbs, totalLbs, unitWeight };
  }, [inputs]);

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Weight Calculator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Estimate the weight of wire based on length and specifications.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Wire Specifications and Length</h2>

          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Known Length</label>
                <div className="flex gap-2">
                  <input type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: Number(e.target.value)})} className="input-premium flex-1 font-bold" />
                  <select value={inputs.lengthUnit} onChange={e => setInputs({...inputs, lengthUnit: e.target.value})} className="input-premium w-24 font-bold bg-white dark:bg-slate-700">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Cable Type</label>
                <select value={inputs.cableType} onChange={e => setInputs({...inputs, cableType: e.target.value, designation: ''})} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                  <option value="">-- Select Cable Type --</option>
                  {Object.keys(WEIGHT_TABLE).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Size / Conductor Count / Material</label>
              <select value={inputs.designation} onChange={e => setInputs({...inputs, designation: e.target.value})} disabled={!inputs.cableType} className="input-premium w-full font-bold bg-white dark:bg-slate-700 disabled:opacity-50">
                <option value="">-- Select Designation --</option>
                {inputs.cableType && Object.keys(WEIGHT_TABLE[inputs.cableType]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Reel Tare Weight (lbs)</label>
                <input type="number" value={inputs.reelTare} onChange={e => setInputs({...inputs, reelTare: Number(e.target.value)})} className="input-premium w-full font-bold" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Skid Tare Weight (lbs)</label>
                <input type="number" value={inputs.skidTare} onChange={e => setInputs({...inputs, skidTare: Number(e.target.value)})} className="input-premium w-full font-bold" placeholder="0" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setInputs({length: 0, lengthUnit: 'm', cableType: '', designation: '', reelTare: 0, skidTare: 0})} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl text-xs uppercase">
                Clear
              </button>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl text-xs uppercase">
                {showAdvanced ? 'Hide Advanced' : 'Advanced Settings'}
              </button>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-2 border-dashed border-slate-200 animate-entrance">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">🔬 Component-Based Modeling (Pending Implementation)</h2>
            <p className="text-[10px] text-slate-400 italic">Advanced engineering calculations for component-specific weights will be available in v1.0.</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 animate-entrance">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4 text-center">Weight Analysis</h2>

          <div className="space-y-4">
            <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-3xl border-2 border-red-500 text-center shadow-inner">
              <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase mb-1">Total Shipment Weight (Wire + Reel + Skid)</p>
              <p className="text-4xl font-black text-red-700 dark:text-white">{calculation.totalLbs.toFixed(1)} lbs</p>
              <p className="text-xs text-red-600/70 font-bold">({(calculation.totalLbs * 0.453592).toFixed(1)} kg)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 text-center">
                <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Estimated Wire Weight Only</p>
                <p className="text-xl font-black text-blue-800 dark:text-white">{calculation.wireWeightLbs.toFixed(1)} lbs</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-200 text-center">
                <p className="text-[8px] font-black text-slate-700 uppercase mb-1">Unit Weight (Approx.)</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{calculation.unitWeight || '--'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={() => window.print()} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-3 rounded-xl text-[10px] uppercase">
              Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalculator;

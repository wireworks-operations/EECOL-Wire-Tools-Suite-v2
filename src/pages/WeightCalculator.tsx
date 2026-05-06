import React, { useState, useMemo } from 'react';

const WeightCalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    length: 500, lengthUnit: 'm',
    cableType: 'TK 600V', designation: '14/3CU',
    reelTare: 0, reelUnit: 'lbs',
    skidTare: 0, skidUnit: 'lbs'
  });

  const weights: Record<string, Record<string, number>> = {
    'TK 600V': { '14/3CU': 300, '12/3CU': 400, '10/3CU': 400, '6/3CU': 880 },
    'ACWU90': { '6AL': 120, '4AL': 190, '250/3AL': 1530 },
    'RW90': { '14CU': 50, '12CU': 80, '10CU': 100, '500CU': 2700 }
  };

  const calculation = useMemo(() => {
    const unitWeight = weights[inputs.cableType]?.[inputs.designation] || 0;
    const lenFt = inputs.lengthUnit === 'm' ? inputs.length * 3.28084 : inputs.length;
    const wireWeightLbs = (lenFt / 1000) * unitWeight;

    const rTareLbs = inputs.reelUnit === 'kg' ? inputs.reelTare / 0.453592 : inputs.reelTare;
    const sTareLbs = inputs.skidUnit === 'kg' ? inputs.skidTare / 0.453592 : inputs.skidTare;

    const totalLbs = wireWeightLbs + rTareLbs + sTareLbs;
    return { wireWeightLbs, totalLbs, unitWeight };
  }, [inputs]);

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Wire Weight Estimator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Cable Type</label>
              <select value={inputs.cableType} onChange={e => setInputs({...inputs, cableType: e.target.value, designation: Object.keys(weights[e.target.value])[0]})} className="input-premium w-full bg-white dark:bg-slate-700">
                {Object.keys(weights).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Designation</label>
              <select value={inputs.designation} onChange={e => setInputs({...inputs, designation: e.target.value})} className="input-premium w-full bg-white dark:bg-slate-700">
                {Object.keys(weights[inputs.cableType] || {}).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Length</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.lengthUnit} onChange={e => setInputs({...inputs, lengthUnit: e.target.value})} className="input-premium w-20 dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Reel Tare</label>
              <div className="flex gap-1">
                <input type="number" value={inputs.reelTare} onChange={e => setInputs({...inputs, reelTare: Number(e.target.value)})} className="input-premium flex-1" />
                <select value={inputs.reelUnit} onChange={e => setInputs({...inputs, reelUnit: e.target.value})} className="input-premium w-20 dark:bg-slate-700"><option value="lbs">lbs</option><option value="kg">kg</option></select>
              </div>
           </div>
        </div>

        <div className="mt-8 space-y-4 animate-entrance">
           <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-500 text-center">
              <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">Total Shipment Weight</p>
              <p className="text-4xl font-black text-red-700 dark:text-white">{calculation.totalLbs.toFixed(1)} lbs</p>
              <p className="text-xs text-gray-500">({(calculation.totalLbs * 0.453592).toFixed(1)} kg)</p>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 text-center">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Wire Weight</p>
                <p className="text-lg font-black text-blue-800 dark:text-white">{calculation.wireWeightLbs.toFixed(1)} lbs</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 text-center">
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Unit Weight</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white">{calculation.unitWeight} lbs/kft</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalculator;

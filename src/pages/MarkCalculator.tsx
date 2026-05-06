import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const MarkCalculator: React.FC = () => {
  const { db } = useDatabase();
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);
  const [unit, setUnit] = useState<'m' | 'ft'>('m');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    setResult(Math.abs(end - start));
  };

  const save = async () => {
    if (!db) return;
    await db.update('markConverter', {
      id: crypto.randomUUID(),
      startMark: start,
      endMark: end,
      unit,
      timestamp: Date.now()
    });
    alert('Saved for import into Cutting Records.');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6">Wire Mark Calculator</h1>

        <div className="space-y-4 text-left">
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Starting Mark</label>
              <input type="number" value={start} onChange={e => setStart(Number(e.target.value))} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Ending Mark</label>
              <input type="number" value={end} onChange={e => setEnd(Number(e.target.value))} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value as any)} className="input-premium w-full bg-white dark:bg-slate-700">
                <option value="m">Meters (m)</option><option value="ft">Feet (ft)</option>
              </select>
           </div>

           <button onClick={calculate} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile">CALCULATE LENGTH</button>

           {result !== null && (
             <div className="mt-6 p-4 bg-eecol-light-blue dark:bg-blue-900/30 rounded-xl border-2 border-eecol-blue text-center animate-entrance">
               <p className="text-[10px] font-bold text-eecol-blue dark:text-blue-300 uppercase">Length Result</p>
               <p className="text-3xl font-black text-eecol-blue dark:text-white">{result.toFixed(2)} {unit}</p>
               <p className="text-xs text-gray-500 mt-1">({unit === 'm' ? (result * 3.28084).toFixed(2) + ' ft' : (result * 0.3048).toFixed(2) + ' m'})</p>
               <button onClick={save} className="mt-4 text-[10px] font-bold text-eecol-blue underline uppercase">Save for Records</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MarkCalculator;

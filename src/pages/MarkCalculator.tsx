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
    await db.put('markConverter', {
      id: crypto.randomUUID(),
      startMark: start,
      endMark: end,
      unit,
      timestamp: Date.now()
    });
    alert('Saved for import into Cutting Records.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Mark Calculator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Calculate the length between wire start and end marks.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Calculate Wire Mark Difference</h2>

          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Start Mark</label>
                <input type="number" value={start} onChange={e => setStart(Number(e.target.value))} className="input-premium w-full text-lg font-bold" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">End Mark</label>
                <input type="number" value={end} onChange={e => setEnd(Number(e.target.value))} className="input-premium w-full text-lg font-bold" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Unit (for Start and End Marks)</label>
              <select value={unit} onChange={e => setUnit(e.target.value as any)} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                <option value="m">Meters (m)</option>
                <option value="ft">Feet (ft)</option>
              </select>
              <p className="text-[9px] text-gray-400 mt-1 italic ml-1">Both Start and End Marks use this unit.</p>
            </div>

            <button onClick={calculate} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs">
              Calculate
            </button>
          </div>
        </div>

        {result !== null && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 animate-entrance">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4 text-center">Wire Mark Analysis</h2>

            <div className="grid grid-cols-3 gap-2 text-center mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100">
                <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">🏁 Start Mark</p>
                <p className="text-xl font-black text-eecol-blue dark:text-white">{start.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-eecol-blue rounded-2xl shadow-lg border-2 border-white/20">
                <p className="text-[8px] font-black text-blue-100 uppercase mb-1">Length Between Marks</p>
                <p className="text-xl font-black text-white">{result.toFixed(2)} {unit}</p>
                <p className="text-[8px] text-blue-200 mt-1">({unit === 'm' ? (result * 3.28084).toFixed(2) + ' ft' : (result * 0.3048).toFixed(2) + ' m'})</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100">
                <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">✅ End Mark</p>
                <p className="text-xl font-black text-eecol-blue dark:text-white">{end.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 mb-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                <span>⚙️</span> Calculation Method
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                Difference Calculation: The absolute difference between the Start Mark and End Mark.
                This represents the total length of wire that passed through the counter between these two points.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-3 rounded-xl text-[10px] uppercase hover:bg-slate-200 transition-colors">
                Print Results
              </button>
              <button onClick={save} className="flex-[2] bg-emerald-600 text-white font-black py-3 rounded-xl text-[10px] uppercase btn-tactile shadow-lg shadow-emerald-600/20">
                Save for Cutting Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkCalculator;

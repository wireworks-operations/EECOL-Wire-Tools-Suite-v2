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

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Mark Calculator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Calculate the length between wire start and end marks.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue/10 space-y-4">
          <h3 className="text-lg font-bold text-eecol-blue mb-4 text-center">Calculate Wire Mark Difference</h3>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Start Mark</label>
              <input type="number" value={start} onChange={e => setStart(Number(e.target.value))} className="input-premium w-full text-sm font-bold" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">End Mark</label>
              <input type="number" value={end} onChange={e => setEnd(Number(e.target.value))} className="input-premium w-full text-sm font-bold" placeholder="0" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Unit (for Start and End Marks)</label>
              <select value={unit} onChange={e => setUnit(e.target.value as any)} className="input-premium w-full font-bold bg-white text-eecol-blue text-sm">
                <option value="m">Meters (m)</option>
                <option value="ft">Feet (ft)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1 italic">Both Start and End Marks use this unit.</p>
            </div>

            <button onClick={calculate} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-3xl btn-tactile shadow-xl text-sm uppercase">
              Calculate
            </button>
          </div>
        </div>

        {result !== null && (
          <div className="bg-white p-4 border-l-8 border-eecol-blue rounded-3xl shadow-xl animate-entrance space-y-4">
            <h3 className="text-lg font-bold text-eecol-blue text-center">Wire Mark Analysis</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full bg-white/60 p-2 rounded-3xl border border-blue-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                    <span className="mr-1">🏁</span> Start Mark
                  </p>
                  <p className="text-base font-bold text-blue-600">{start.toFixed(2)}</p>
                </div>

                <div className="flex-[1.5] py-2">
                  <p className="text-xs font-bold text-gray-600 mb-1">Length Between Marks</p>
                  <p className="text-3xl font-black text-eecol-blue leading-none">{result.toFixed(2)} {unit}</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    ({unit === 'm' ? (result * 3.28084).toFixed(2) + ' ft' : (result * 0.3048).toFixed(2) + ' m'})
                  </p>
                </div>

                <div className="flex-1 w-full bg-white/60 p-2 rounded-3xl border border-blue-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                    <span className="mr-1">✅</span> End Mark
                  </p>
                  <p className="text-base font-bold text-green-600">{end.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-3xl">
              <h4 className="text-xs font-bold text-eecol-blue mb-1 flex items-center">
                <span>⚙️</span> Calculation Method
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed italic">
                <strong>Difference Calculation:</strong> The absolute difference between the Start Mark and End Mark.
                This represents the total length of wire that passed through the counter between these two points.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-eecol-blue text-white font-bold py-3 rounded-3xl text-sm btn-tactile shadow-xl">
                Print Results
              </button>
              <button onClick={save} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-3xl text-sm btn-tactile shadow-xl">
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

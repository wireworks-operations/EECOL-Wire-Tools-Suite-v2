import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const StopMarkCalculator: React.FC = () => {
  const { db } = useDatabase();
  const [startValue, setStartValue] = useState(0);
  const [startUnit, setStartUnit] = useState<'m' | 'ft'>('m');
  const [cutLength, setCutLength] = useState(0);
  const [cutLengthUnit, setCutLengthUnit] = useState<'m' | 'ft'>('m');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [counterDistance] = useState(0);
  const [result, setResult] = useState<{ stopMark: number; visualMark: number } | null>(null);

  const calculate = () => {
    const METERS_TO_FEET = 3.28084;
    const startFt = startUnit === 'm' ? startValue * METERS_TO_FEET : startValue;
    const lengthFt = cutLengthUnit === 'm' ? cutLength * METERS_TO_FEET : cutLength;

    const stopFt = direction === 'up' ? startFt + lengthFt : startFt - lengthFt;
    const counterFt = counterDistance * (startUnit === 'm' ? METERS_TO_FEET : 1);
    const visualFt = direction === 'up' ? stopFt - counterFt : stopFt + counterFt;

    const finalStop = startUnit === 'm' ? stopFt / METERS_TO_FEET : stopFt;
    const finalVisual = startUnit === 'm' ? visualFt / METERS_TO_FEET : visualFt;

    setResult({ stopMark: finalStop, visualMark: finalVisual });
  };

  const save = async () => {
    if (!db || !result) return;
    await db.update('stopmarkConverter', {
      id: crypto.randomUUID(),
      startMark: startValue,
      endMark: result.stopMark,
      unit: startUnit,
      timestamp: Date.now()
    });
    alert('Saved for Cutting Records.');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Stop Mark Calculator</h1>

        <div className="space-y-4 text-left">
           <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Start Mark</label>
                <input type="number" value={startValue} onChange={e => setStartValue(Number(e.target.value))} className="input-premium w-full" />
              </div>
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Unit</label>
                <select value={startUnit} onChange={e => setStartUnit(e.target.value as any)} className="input-premium w-full bg-white dark:bg-slate-700">
                  <option value="m">m</option><option value="ft">ft</option>
                </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Cut Length</label>
                <input type="number" value={cutLength} onChange={e => setCutLength(Number(e.target.value))} className="input-premium w-full" />
              </div>
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Unit</label>
                <select value={cutLengthUnit} onChange={e => setCutLengthUnit(e.target.value as any)} className="input-premium w-full bg-white dark:bg-slate-700">
                  <option value="m">m</option><option value="ft">ft</option>
                </select>
              </div>
           </div>

           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Direction</label>
              <select value={direction} onChange={e => setDirection(e.target.value as any)} className="input-premium w-full bg-white dark:bg-slate-700">
                <option value="up">Counting Up (0 → 100)</option>
                <option value="down">Counting Down (100 → 0)</option>
              </select>
           </div>

           <button onClick={calculate} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile uppercase mt-2">Calculate Stop Point</button>

           {result && (
             <div className="mt-6 space-y-4 animate-entrance">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500 text-center">
                   <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">Stopping Mark</p>
                   <p className="text-3xl font-black text-green-700 dark:text-white">{result.stopMark.toFixed(2)} {startUnit}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-500 text-center">
                   <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase">Visual Mark (at Reel)</p>
                   <p className="text-2xl font-black text-orange-700 dark:text-white">{result.visualMark.toFixed(2)} {startUnit}</p>
                </div>
                <button onClick={save} className="w-full text-[10px] font-bold text-eecol-blue underline uppercase">Save for import</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StopMarkCalculator;

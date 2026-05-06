import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const machines = [
  "Manual Hand Coiler",
  "Green Electric Hand Coiler",
  "Blue Electric Hand Coiler",
  "Telus Machine",
  "Big Blue Machine #1",
  "Big Blue Machine #2"
];

const Calibration: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [measurements, setMeasurements] = useState<Record<string, any[]>>({});
  const [inputs, setInputs] = useState<Record<string, { val: string, unit: string }>>({});

  useEffect(() => {
    if (isReady && db) {
      loadAllMeasurements();
    }
  }, [isReady, db]);

  const loadAllMeasurements = async () => {
    const data: Record<string, any[]> = {};
    for (const m of machines) {
      const ms = await db!.getAll('calibrationMeasurements');
      data[m] = ms.filter((r: any) => r.machineName === m).sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 3);
    }
    setMeasurements(data);
  };

  const handleSave = async (machineName: string) => {
    const input = inputs[machineName];
    if (!input || !input.val) return;

    await db!.update('calibrationMeasurements', {
      id: crypto.randomUUID(),
      machineName,
      measurement: `${input.val} ${input.unit}`,
      timestamp: Date.now()
    });

    setInputs({ ...inputs, [machineName]: { val: '', unit: input.unit } });
    loadAllMeasurements();
    alert('Calibration saved.');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24 text-left">
      <h1 className="text-3xl font-black header-gradient text-center mb-8 uppercase tracking-tight">Machine Calibration</h1>

      <div className="max-w-4xl mx-auto space-y-8">
        {machines.map(m => (
          <div key={m} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10">
            <h2 className="text-xl font-black text-eecol-blue dark:text-blue-400 mb-4 uppercase">{m}</h2>

            <div className="space-y-4 mb-6">
               <h3 className="text-[10px] font-bold text-gray-500 uppercase">Recent Measurements</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {(measurements[m] || []).map((ms, i) => (
                   <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                     <div className="text-lg font-black text-eecol-blue dark:text-white">{ms.measurement}</div>
                     <div className="text-[8px] text-gray-500 uppercase">{new Date(ms.timestamp).toLocaleDateString()}</div>
                   </div>
                 ))}
                 {(!measurements[m] || measurements[m].length === 0) && <div className="col-span-3 text-xs italic text-gray-400 p-4 border border-dashed border-gray-200 rounded-xl text-center">No recent data</div>}
               </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 items-end">
               <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">New Measurement</label>
                  <input
                    type="number"
                    value={inputs[m]?.val || ''}
                    onChange={e => setInputs({...inputs, [m]: { val: e.target.value, unit: inputs[m]?.unit || 'ft' }})}
                    className="input-premium w-full"
                    placeholder="Enter length..."
                  />
               </div>
               <select
                 value={inputs[m]?.unit || 'ft'}
                 onChange={e => setInputs({...inputs, [m]: { val: inputs[m]?.val || '', unit: e.target.value }})}
                 className="input-premium w-full md:w-32 bg-white dark:bg-slate-700"
               >
                 <option value="ft">ft</option><option value="m">m</option>
               </select>
               <button
                 onClick={() => handleSave(m)}
                 className="w-full md:w-auto bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl btn-tactile uppercase"
               >
                 Save
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calibration;

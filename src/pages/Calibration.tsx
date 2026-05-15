import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';

const machines = [
  'Manual Hand Coiler', 'Green Elec Coiler', 'Blue Elec Coiler',
  'Telus Machine', 'Big B1 Machine', 'Big B2 Machine'
];

const Calibration: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [measurements, setMeasurements] = useState<Record<string, any[]>>({});
  const [inputs, setInputs] = useState<Record<string, { tape: string, counter: string }>>({});

  useEffect(() => {
    if (isReady && db) {
      loadAllMeasurements();
    }
  }, [isReady, db]);

  const loadAllMeasurements = async () => {
    const data: Record<string, any[]> = {};
    const allMs = await db!.getAll('calibrationMeasurements');
    for (const m of machines) {
      data[m] = allMs
        .filter((r: any) => r.machineName === m)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 3);
    }
    setMeasurements(data);
  };

  const calculateVariance = (tape: number, counter: number) => {
    if (!tape || !counter) return '0.00%';
    const variance = ((counter - tape) / tape) * 100;
    return `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%`;
  };

  const handleSave = async (machineName: string) => {
    const input = inputs[machineName];
    if (!input || !input.tape || !input.counter) {
        alert('Please enter both tape and counter readings.');
        return;
    }

    const tapeNum = parseFloat(input.tape);
    const counterNum = parseFloat(input.counter);
    const variance = calculateVariance(tapeNum, counterNum);

    await db!.update('calibrationMeasurements', {
      id: crypto.randomUUID(),
      machineName,
      tape: tapeNum,
      counter: counterNum,
      variance,
      measurement: `${counterNum} ft (${variance})`, // Legacy format compatibility
      timestamp: Date.now()
    });

    setInputs({ ...inputs, [machineName]: { tape: '', counter: '' } });
    loadAllMeasurements();
    alert('Calibration point saved successfully.');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-solid border-eecol-blue relative">
        <div className="flex justify-center mb-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-xl eecol-logo-tilt">
            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-3 text-center header-gradient uppercase tracking-tighter">Machine Counter Calibration</h1>
        <p className="mb-5 text-center text-sm font-medium text-eecol-blue uppercase tracking-widest">Calibration Measurement Records for Counting Devices</p>

        <div className="flex justify-center gap-4 mb-6 no-print">
            <Link to="/maintenance" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-3xl shadow-xl btn-tactile text-lg no-underline uppercase text-xs">📋 Main Checklist</Link>
        </div>

        <div className="space-y-6">
            {machines.map(m => (
                <div key={m} className="p-4 bg-gray-50 border-l-8 border-eecol-blue rounded-3xl shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold header-gradient uppercase">{m}</h3>
                        <div className="text-[10px] font-bold text-gray-400">RECENT LOGS: {(measurements[m] || []).length}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Measured Length (Tape)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={inputs[m]?.tape || ''}
                                onChange={e => setInputs({...inputs, [m]: { tape: e.target.value, counter: inputs[m]?.counter || '' }})}
                                className="input-premium w-full font-bold"
                            />
                        </div>
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Counter Reading</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={inputs[m]?.counter || ''}
                                onChange={e => setInputs({...inputs, [m]: { counter: e.target.value, tape: inputs[m]?.tape || '' }})}
                                className="input-premium w-full font-bold"
                            />
                        </div>
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Variance (%)</label>
                            <div className={`text-xl font-black ${parseFloat(calculateVariance(parseFloat(inputs[m]?.tape || '0'), parseFloat(inputs[m]?.counter || '0'))) === 0 ? 'text-eecol-blue' : 'text-amber-600'}`}>
                                {calculateVariance(parseFloat(inputs[m]?.tape || '0'), parseFloat(inputs[m]?.counter || '0'))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {(measurements[m] || []).map((ms, i) => (
                            <div key={i} className="flex justify-between text-[10px] font-bold px-2 py-1 bg-white/50 rounded-lg border border-gray-100">
                                <span className="text-gray-500">{new Date(ms.timestamp).toLocaleDateString()}</span>
                                <span className="text-eecol-blue">Tape: {ms.tape} | Counter: {ms.counter} | Var: {ms.variance}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handleSave(m)}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-3xl shadow btn-tactile uppercase text-xs"
                    >
                        Save Calibration Point
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Calibration;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';

const machines = ['Manual Coiler', 'Green Electric', 'Blue Electric', 'Telus Machine', 'Big Blue #1', 'Big Blue #2'];
const items = ['Frame & Covers', 'Hoses & Cables', 'Electrical', 'Oil Leaks', 'Hydraulics', 'Reel Bars', 'Foot Switch', 'Controls', 'Area Hazards', 'PPE Ready'];

const Maintenance: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [inspector, setInspector] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isReady && db) {
      const today = new Date().toISOString().split('T')[0];
      db.get('maintenanceLogs', today).then((log: any) => {
        if (log) {
          setChecks(log.checks || {});
          setInspector(log.inspectorName || '');
          setCompleted(true);
        }
      });
    }
  }, [isReady, db]);

  const handleToggle = (m: string, i: string) => {
    if (completed) return;
    const key = `${m}-${i}`;
    setChecks({ ...checks, [key]: !checks[key] });
  };

  const save = async () => {
    if (!inspector) { alert('Enter inspector name'); return; }
    const today = new Date().toISOString().split('T')[0];
    await db!.update('maintenanceLogs', { id: today, inspectorName: inspector, checks, completedAt: Date.now() });
    setCompleted(true);
    alert('Daily maintenance completed.');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20 overflow-hidden">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Daily Machine Maintenance</h1>

        <div className="flex justify-center gap-4 mb-8">
           <Link to="/calibration" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase shadow-lg hover:scale-105 transition-transform">
             🔍 Calibration Tracking
           </Link>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
           <div className="flex-1 text-left">
              <label className="text-[10px] font-bold header-gradient uppercase">Inspected By</label>
              <input value={inspector} onChange={e => setInspector(e.target.value.toUpperCase())} className="input-premium w-full" disabled={completed} />
           </div>
           <div className="w-full md:w-48 text-left">
              <label className="text-[10px] font-bold header-gradient uppercase">Date</label>
              <div className="input-premium bg-gray-50 dark:bg-slate-700 font-bold">{new Date().toLocaleDateString()}</div>
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-eecol-light-blue dark:bg-blue-900/30">
                  <th className="p-2 border border-blue-100 dark:border-blue-800">Safety / Maintenance Item</th>
                  {machines.map(m => <th key={m} className="p-2 border border-blue-100 dark:border-blue-800 text-center">{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 border border-blue-50 dark:border-slate-700 font-medium">{item}</td>
                    {machines.map(m => (
                      <td key={`${m}-${item}`} className="p-2 border border-blue-50 dark:border-slate-700 text-center">
                        <input type="checkbox" checked={!!checks[`${m}-${item}`]} onChange={() => handleToggle(m, item)} className="w-4 h-4 text-green-600 rounded" disabled={completed} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {!completed && <button onClick={save} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl btn-tactile mt-8 uppercase">Complete Daily Inspection</button>}
        {completed && <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl text-green-700 dark:text-green-400 font-bold text-center">✅ INSPECTION COMPLETED FOR TODAY</div>}
      </div>
    </div>
  );
};

export default Maintenance;

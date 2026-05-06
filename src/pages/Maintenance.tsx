import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const Maintenance: React.FC = () => {
  const { db } = useDatabase();
  const [inspector, setInspector] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState<Record<string, 'ok' | 'ng' | null>>({
    'Manual Hand Coiler': null,
    'Green Elec Coiler': null,
    'Blue Elec Coiler': null,
    'Telus Machine': null,
    'Big B1 Machine': null,
    'Big B2 Machine': null
  });
  const [comments, setComments] = useState('');

  const handleToggle = (item: string, status: 'ok' | 'ng') => {
    setChecklist(prev => ({ ...prev, [item]: prev[item] === status ? null : status }));
  };

  const handleComplete = async () => {
    if (!inspector) {
      alert('Please enter inspector name.');
      return;
    }
    if (db) {
      await db.put('maintenanceLogs', {
        id: crypto.randomUUID(),
        inspector,
        date,
        checklist,
        comments,
        timestamp: Date.now()
      });
      alert('Maintenance checklist completed and saved.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">Machine Maintenance Checklist</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Daily Equipment Inspection & Maintenance Records</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Inspected By</label>
              <input value={inspector} onChange={e => setInspector(e.target.value.toUpperCase())} className="input-premium w-full font-bold" placeholder="NAME" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-premium w-full font-bold" />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Inspection Points</h2>
            {Object.keys(checklist).map(item => (
              <div key={item} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100">
                <span className="text-xs font-black text-slate-700 dark:text-white uppercase">{item}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(item, 'ok')} className={`w-12 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${checklist[item] === 'ok' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>OK</button>
                  <button onClick={() => handleToggle(item, 'ng')} className={`w-12 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${checklist[item] === 'ng' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>NG</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Comments</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} className="input-premium w-full font-bold h-24" placeholder="Additional observations..." />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => window.print()} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl text-xs uppercase">
              Print Checklist
            </button>
            <button onClick={handleComplete} className="bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs">
              Complete & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

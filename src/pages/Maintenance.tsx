import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    const allChecked = Object.values(checklist).every(v => v !== null);
    if (!allChecked && !confirm('Some items are not checked. Save anyway?')) {
        return;
    }

    if (db) {
      await db.put('maintenanceLogs', {
        id: crypto.randomUUID(),
        inspector: inspector.toUpperCase(),
        date,
        checklist,
        comments,
        timestamp: Date.now()
      });
      alert('Maintenance checklist completed and saved to database.');
      // Optional: Reset form
      setInspector('');
      setComments('');
      setChecklist({
        'Manual Hand Coiler': null,
        'Green Elec Coiler': null,
        'Blue Elec Coiler': null,
        'Telus Machine': null,
        'Big B1 Machine': null,
        'Big B2 Machine': null
      });
    }
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

        <h1 className="text-3xl font-black mb-3 text-center header-gradient uppercase tracking-tighter">Machine Maintenance Checklist</h1>
        <p className="mb-5 text-center text-sm font-medium text-eecol-blue uppercase tracking-widest">Daily Equipment Inspection & Maintenance Records</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Inspected By</label>
                <input value={inspector} onChange={e => setInspector(e.target.value.toUpperCase())} className="input-premium w-full font-bold uppercase" placeholder="YOUR NAME" />
            </div>
            <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-premium w-full font-bold" />
            </div>
        </div>

        <div className="flex justify-center gap-4 mb-6 no-print flex-wrap">
            <Link to="/calibration" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-3xl shadow-xl btn-tactile text-xs uppercase no-underline">📏 Calibration Logs</Link>
            <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-3xl shadow-xl btn-tactile text-xs uppercase">🖨️ Print Checklist</button>
            <button onClick={handleComplete} className="px-6 py-3 bg-green-600 text-white font-bold rounded-3xl shadow-xl btn-tactile text-xs uppercase">✅ Save & Complete</button>
        </div>

        <div className="space-y-3 mb-6">
            <h3 className="text-[10px] font-black text-eecol-blue uppercase tracking-widest mb-2 ml-1">Inspection Points</h3>
            <div className="grid grid-cols-1 gap-2">
                {Object.keys(checklist).map(item => (
                    <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                        <span className="text-sm font-bold text-gray-700 uppercase">{item}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleToggle(item, 'ok')}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all btn-tactile ${checklist[item] === 'ok' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                            >
                                OK
                            </button>
                            <button
                                onClick={() => handleToggle(item, 'ng')}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all btn-tactile ${checklist[item] === 'ng' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                            >
                                NG
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100 mb-6">
            <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Additional Comments & Observations</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} className="input-premium w-full font-bold text-xs h-24 resize-none" placeholder="ENTER NOTES..." />
        </div>

        <div className="mt-auto pt-4 border-t border-blue-100 no-print">
            <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Machine Maintenance Protocol v2.0</p>
                <p className="text-[10px] font-black header-gradient uppercase">EECOL Wire Tools 2025</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

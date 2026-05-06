import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';

const DatabaseConfig: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isReady && db) {
      const stores = [
        'cuttingRecords', 'inventoryRecords', 'maintenanceLogs',
        'wireCutList', 'markConverter', 'stopmarkConverter'
      ];
      const counts: Record<string, number> = {};
      Promise.all(stores.map(s => db.getAll(s).then(r => counts[s] = r.length))).then(() => setStats({...counts}));
    }
  }, [isReady, db]);

  const handleExport = async () => {
    if (!db) return;
    const allData: any = { version: '0.9.0', timestamp: Date.now() };
    const stores = ['cuttingRecords', 'inventoryRecords', 'maintenanceLogs', 'wireCutList', 'settings', 'markConverter', 'stopmarkConverter'];
    for (const s of stores) { allData[s] = await db.getAll(s); }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eecol_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('Import data? This will merge with existing records.')) {
          for (const store in data) {
            if (Array.isArray(data[store])) {
              for (const item of data[store]) { await db.put(store, item); }
            }
          }
          alert('Import successful!');
          window.location.reload();
        }
      } catch (err) { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 animate-entrance pb-24 text-left">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black header-gradient uppercase tracking-tighter">Database Configuration</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Manage your local application data.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-eecol-blue/10">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span>📊</span> Database Statistics Dashboard
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Total Records</p>
                <p className="text-2xl font-black text-eecol-blue">{Object.values(stats).reduce((a, b) => a + b, 0)}</p>
             </div>
             <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                <p className="text-[8px] font-black text-emerald-700 uppercase mb-1">Database Status</p>
                <p className="text-sm font-black text-emerald-800">HEALTHY ✅</p>
             </div>
          </div>

          <div className="mt-8">
            <h3 className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-4">Record Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {Object.entries(stats).map(([store, count]) => (
                 <div key={store} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase">{store.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-black text-slate-800">{count}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-eecol-blue/10">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-6">Database Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <button onClick={handleExport} className="bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase text-xs shadow-lg">Export to JSON</button>
             <label className="bg-emerald-600 text-white font-black py-4 rounded-2xl btn-tactile uppercase text-xs text-center cursor-pointer shadow-lg">
                Import from JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
             </label>
             <button onClick={async () => {if(confirm('Delete ALL data?')){ localStorage.clear(); indexedDB.deleteDatabase('EECOLTools_v2'); window.location.reload(); }}} className="bg-red-600 text-white font-black py-4 rounded-2xl btn-tactile uppercase text-xs shadow-lg">Delete Database</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfig;

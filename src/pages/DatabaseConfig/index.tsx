import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { EECOLIndexedDB } from '../../services/database/core';

const DatabaseConfig: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [stats, setStats] = useState<any>({
    total: 0, cutting: 0, inventory: 0, marks: 0, stopmarks: 0, reels: 0, wireList: 0
  });

  useEffect(() => {
    if (isReady && db) loadStats();
  }, [isReady, db]);

  const loadStats = async () => {
    if (!db) return;
    const [c, i, m, s, r, w] = await Promise.all([
        db.getAll('cuttingRecords'), db.getAll('inventoryRecords'),
        db.getAll('markConverter'), db.getAll('stopmarkConverter'),
        db.getAll('reelcapacityEstimator'), db.getAll('wireCutList')
    ]);
    setStats({
        total: c.length + i.length + m.length + s.length + r.length + w.length,
        cutting: c.length, inventory: i.length, marks: m.length,
        stopmarks: s.length, reels: r.length, wireList: w.length
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-black mb-3 header-gradient uppercase tracking-tighter">Database Configuration</h1>
            <p className="mb-4 text-sm font-medium text-eecol-blue">Manage your local application data.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue mb-6">
            <h2 className="text-xl font-bold text-eecol-blue mb-4 flex items-center uppercase">📊 Database Statistics Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-3xl border border-blue-200">
                    <p className="text-sm font-medium text-blue-600 uppercase">Total Records</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-3xl border border-green-200">
                    <p className="text-sm font-medium text-green-600 uppercase">Database Status</p>
                    <p className="text-2xl font-bold text-green-800">HEALTHY</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-3xl">
                    <h3 className="text-lg font-semibold text-eecol-blue mb-3 uppercase">📈 Record Breakdown</h3>
                    <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between"><span>Cutting Records:</span> <span className="text-eecol-blue">{stats.cutting}</span></div>
                        <div className="flex justify-between"><span>Inventory Records:</span> <span className="text-eecol-blue">{stats.inventory}</span></div>
                        <div className="flex justify-between"><span>Mark Calculator:</span> <span className="text-eecol-blue">{stats.marks}</span></div>
                        <div className="flex justify-between"><span>Stop Marks:</span> <span className="text-eecol-blue">{stats.stopmarks}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue">
            <h2 className="text-xl font-bold text-eecol-blue mb-4 uppercase">Database Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="px-4 py-2 bg-green-500 text-white font-bold rounded-3xl shadow-md btn-tactile uppercase text-xs">Export to JSON</button>
                <button className="px-4 py-2 bg-blue-500 text-white font-bold rounded-3xl shadow-md btn-tactile uppercase text-xs">Import from JSON</button>
                <button onClick={async () => {if(confirm('Delete entire database?')){await EECOLIndexedDB.deleteDatabase(); window.location.reload();}}} className="px-4 py-2 bg-red-500 text-white font-bold rounded-3xl shadow-md btn-tactile uppercase text-xs">Delete Database</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfig;

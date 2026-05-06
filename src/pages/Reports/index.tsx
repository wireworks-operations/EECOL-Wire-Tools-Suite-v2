import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { CuttingRecord } from '../../types/database';
import ReportChart from './components/ReportChart';

const Reports: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [records, setRecords] = useState<CuttingRecord[]>([]);

  useEffect(() => {
    if (isReady && db) {
      db.getAll<CuttingRecord>('cuttingRecords').then(setRecords);
    }
  }, [isReady, db]);

  const trendsData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const counts = last7Days.map(date => records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === date).length);

    return {
      labels: last7Days.map(d => d.split('-').slice(1).join('/')),
      datasets: [{ label: 'Cuts per Day', data: counts, borderColor: '#0058B3', backgroundColor: 'rgba(0,88,179,0.1)', fill: true }]
    };
  }, [records]);

  const cutterData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => { counts[r.cutterName] = (counts[r.cutterName] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map(s => s[0]),
      datasets: [{ label: 'Cuts by Operator', data: sorted.map(s => s[1]), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
    };
  }, [records]);

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24">
      <h1 className="text-3xl font-black header-gradient text-center mb-8 uppercase">Operational Intelligence</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-eecol-blue/10">
          <ReportChart type="line" data={trendsData} title="Activity Trends (Last 7 Days)" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-eecol-blue/10">
          <ReportChart type="doughnut" data={cutterData} title="Top Operators" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Volume', value: records.reduce((s, r) => s + r.cutLength, 0).toFixed(0) + 'm' },
           { label: 'Total Cuts', value: records.length },
           { label: 'Avg Length', value: (records.length ? records.reduce((s, r) => s + r.cutLength, 0) / records.length : 0).toFixed(1) + 'm' },
           { label: 'Full Picks', value: records.filter(r => r.isFullPick).length }
         ].map(s => (
           <div key={s.label} className="bg-eecol-light-blue dark:bg-blue-900/20 p-4 rounded-xl text-center border border-eecol-blue/20">
              <p className="text-[10px] font-bold text-eecol-blue dark:text-blue-300 uppercase">{s.label}</p>
              <p className="text-xl font-black text-eecol-blue dark:text-white">{s.value}</p>
           </div>
         ))}
      </div>
    </div>
  );
};

export default Reports;

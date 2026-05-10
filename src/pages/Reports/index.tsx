import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useDatabase } from '../../hooks/useDatabase';
import { CuttingRecord } from '../../types/database';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Reports: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [records, setRecords] = useState<CuttingRecord[]>([]);
  const [chartType, setChartType] = useState('line');
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    if (isReady && db) {
        db.getAll<CuttingRecord>('cuttingRecords').then(r => setRecords(r));
    }
  }, [isReady, db]);

  const stats = useMemo(() => {
    const total = records.length;
    const fullPicks = records.filter(r => r.isFullPick).length;
    const systemCuts = records.filter(r => r.isSystemCut).length;
    const noMarkCuts = records.filter(r => r.isNoMarks).length;

    // Total length
    let totalM = 0;
    records.forEach(r => {
        const len = r.cutLength || 0;
        totalM += (r.cutLengthUnit === 'ft' ? len * 0.3048 : len);
    });

    // Top Cutter
    const cutters: Record<string, number> = {};
    records.forEach(r => { if(r.cutterName) cutters[r.cutterName] = (cutters[r.cutterName] || 0) + 1; });
    const topCutter = Object.entries(cutters).sort((a,b) => b[1] - a[1])[0] || ['-', 0];

    // Top Customer
    const customers: Record<string, number> = {};
    records.forEach(r => { if(r.customerName) customers[r.customerName] = (customers[r.customerName] || 0) + 1; });
    const topCustomer = Object.entries(customers).sort((a,b) => b[1] - a[1])[0] || ['-', 0];

    return {
        total,
        fullPicks,
        systemCuts,
        noMarkCuts,
        totalM,
        topCutter,
        topCustomer,
        fullPicksPct: total ? Math.round((fullPicks/total)*100) : 0,
        systemCutsPct: total ? Math.round((systemCuts/total)*100) : 0,
        noMarkCutsPct: total ? Math.round((noMarkCuts/total)*100) : 0,
        avgLen: total ? (totalM / total).toFixed(1) : '0'
    };
  }, [records]);

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-black mb-3 header-gradient uppercase tracking-tighter">EECOL Cutting Reports</h1>
            <p className="mb-5 text-sm font-medium text-eecol-blue uppercase tracking-widest">Advanced analytics and reporting dashboard for cutting records with charts and insights.</p>
        </div>

        <div className="flex justify-center mb-4">
            <button onClick={() => isReady && db && db.getAll<CuttingRecord>('cuttingRecords').then(r => setRecords(r))} className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 btn-tactile flex items-center gap-2 text-xs font-bold uppercase shadow-lg">🔄 Refresh Data</button>
        </div>

        <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Cuts', value: stats.total, color: 'blue', sub: `+0 this period` },
                    { label: 'Top Cutter', value: stats.topCutter[0], color: 'green', sub: `${stats.topCutter[1]} cuts` },
                    { label: 'Top Customer', value: stats.topCustomer[0], color: 'yellow', sub: `${stats.topCustomer[1]} cuts` },
                    { label: 'Full Picks', value: stats.fullPicks, color: 'orange', sub: `${stats.fullPicksPct}% of total` }
                ].map(m => (
                    <div key={m.label} className={`bg-white p-4 rounded-3xl shadow-xl text-center border-l-4 border-${m.color}-500 animate-entrance`}>
                        <div className={`text-xl font-black text-${m.color}-600 uppercase truncate`}>{m.value}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">{m.label}</div>
                        <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{m.sub}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                    { label: 'System Cuts', value: stats.systemCuts, color: 'cyan', sub: `${stats.systemCutsPct}% of total` },
                    { label: 'No Mark Cuts', value: stats.noMarkCuts, color: 'emerald', sub: `${stats.noMarkCutsPct}% of total` },
                    { label: 'Total Length', value: `${stats.totalM.toFixed(0)}m`, color: 'purple', sub: `${stats.avgLen}m avg` }
                ].map(m => (
                    <div key={m.label} className={`bg-white p-4 rounded-3xl shadow-xl text-center border-l-4 border-${m.color}-500 animate-entrance`}>
                        <div className={`text-xl font-black text-${m.color}-600 uppercase`}>{m.value}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">{m.label}</div>
                        <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{m.sub}</div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Chart Type:</label>
                    <select value={chartType} onChange={e => setChartType(e.target.value)} className="p-2 rounded-xl input-premium text-[10px] font-bold bg-white uppercase">
                        <option value="line">📈 Line Chart</option>
                        <option value="bar">📊 Bar Chart</option>
                        <option value="pie">🥧 Pie Chart</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Period:</label>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="p-2 rounded-xl input-premium text-[10px] font-bold bg-white uppercase">
                        <option value="weekly">Weekly View</option>
                        <option value="monthly">Monthly View</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-center header-gradient uppercase">📈 Cut Trends</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl italic text-gray-400 font-bold uppercase text-[10px]">Trends visualization loading...</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-center header-gradient uppercase">👷 Cutter Performance</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl italic text-gray-400 font-bold uppercase text-[10px]">Performance data loading...</div>
            </div>
        </div>

        <div className="flex justify-center space-x-4 flex-wrap gap-4 mt-6">
            <button className="px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 text-xs font-bold btn-tactile uppercase shadow-lg">📄 Export Full CSV</button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-xs font-bold btn-tactile uppercase shadow-lg">📊 Export Charts</button>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 text-xs font-bold btn-tactile uppercase shadow-lg">📋 Generate PDF Report</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;

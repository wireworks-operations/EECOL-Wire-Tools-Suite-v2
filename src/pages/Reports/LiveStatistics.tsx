import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const LiveStatistics: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isReady && db) {
      loadStats();
    }
  }, [isReady, db]);

  const loadStats = async () => {
    if (!db) return;
    const inventory = await db.getAll('inventoryRecords');
    const cuts = await db.getAll('cuttingRecords');

    const approved = inventory.filter((r: any) => r.approved).length;
    const approvalRate = inventory.length ? Math.round((approved / inventory.length) * 100) : 0;

    const totalValue = inventory.reduce((acc: number, curr: any) => acc + (Number(curr.totalValue) || 0), 0);

    setData({
        totalItems: inventory.length,
        totalCuts: cuts.length,
        approvalRate: `${approvalRate}%`,
        totalValue: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        topCustomer: '-',
        topProduct: '-'
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-black mb-3 header-gradient uppercase tracking-tighter">📊 Live Statistics Dashboard</h1>
            <p className="mb-5 text-sm font-medium text-eecol-blue uppercase tracking-widest">Real-time analytics combining inventory records and cutting activities.</p>
        </div>

        <div className="p-3 bg-yellow-50/70 border-l-4 border-yellow-500 rounded-3xl shadow-md">
          <p className="text-xs font-bold text-yellow-800 uppercase">IndexedDB Mode - Enhanced Data Persistence</p>
          <p className="text-[10px] text-blue-600 mt-1 font-bold italic uppercase tracking-wider">🔄 Auto-refreshing live dashboard - Charts update automatically with new data.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
                { label: 'Total Items', value: data?.totalItems || 0, color: 'blue', change: '+0 activities today' },
                { label: 'Approval Rate', value: data?.approvalRate || '0%', color: 'green', change: '+0% vs last week' },
                { label: 'Total Value', value: data?.totalValue || '$0.00', color: 'purple', change: '$0.00 avg' },
                { label: 'Top Customer', value: data?.topCustomer || '-', color: 'orange', change: '-' },
                { label: 'Total Cuts', value: data?.totalCuts || 0, color: 'indigo', change: '+0 this week' },
                { label: 'Top Product', value: data?.topProduct || '-', color: 'yellow', change: '0 added today' }
            ].map(m => (
                <div key={m.label} className={`bg-white p-4 rounded-3xl shadow-xl text-center border-l-4 border-${m.color}-500 animate-entrance`}>
                    <div className={`text-xl font-black text-${m.color}-600 uppercase`}>{m.value}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">{m.label}</div>
                    <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{m.change}</div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-center header-gradient uppercase">✅ Approval Status Distribution</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl italic text-gray-400 font-bold uppercase text-[10px]">Real-time chart data loading...</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-center header-gradient uppercase">📦 Top Product Usage</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl italic text-gray-400 font-bold uppercase text-[10px]">Real-time chart data loading...</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStatistics;

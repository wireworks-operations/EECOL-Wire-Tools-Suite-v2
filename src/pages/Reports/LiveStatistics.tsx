import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { CuttingRecord, InventoryRecord } from '../../types/database';
import ReportChart from './components/ReportChart';

const LiveStatistics: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    if (isReady && db) {
      const loadData = async () => {
        const [cr, ir] = await Promise.all([
          db.getAll<CuttingRecord>('cuttingRecords'),
          db.getAll<InventoryRecord>('inventoryRecords')
        ]);
        setCuttingRecords(cr);
        setInventoryRecords(ir);
        setUpdateTime(new Date().toLocaleTimeString());
      };
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isReady, db]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const today = new Date().toDateString();

    const stats = {
      totalItems: cuttingRecords.length + inventoryRecords.length,
      inventoryValue: inventoryRecords.reduce((s, r) => s + (r.totalValue || 0), 0),
      cutsThisWeek: cuttingRecords.filter(r => r.timestamp > weekAgo).length,
      approvedCount: inventoryRecords.filter(r => r.approved === true).length,
      deniedCount: inventoryRecords.filter(r => r.approved === false).length,
      pendingCount: inventoryRecords.filter(r => r.approved === null).length,
      totalProcessed: inventoryRecords.filter(r => r.approved !== null).length,
      topCustomer: '-',
      topWire: '-',
      activityTimeline: [0,0,0,0,0,0,0]
    };

    const customerCounts: Record<string, number> = {};
    const wireCounts: Record<string, number> = {};

    cuttingRecords.forEach(r => {
      if (r.customerName) customerCounts[r.customerName] = (customerCounts[r.customerName] || 0) + 1;
      if (r.wireId) wireCounts[r.wireId] = (wireCounts[r.wireId] || 0) + 1;

      const dayDiff = Math.floor((now - r.timestamp) / (1000 * 60 * 60 * 24));
      if (dayDiff < 7) stats.activityTimeline[6 - dayDiff]++;
    });

    const sortedCustomers = Object.entries(customerCounts).sort((a,b) => b[1] - a[1]);
    if (sortedCustomers[0]) stats.topCustomer = sortedCustomers[0][0];

    const sortedWires = Object.entries(wireCounts).sort((a,b) => b[1] - a[1]);
    if (sortedWires[0]) stats.topWire = sortedWires[0][0];

    return stats;
  }, [cuttingRecords, inventoryRecords]);

  const timelineData = {
    labels: [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Cuts per Day',
      data: metrics.activityTimeline,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const approvalData = {
    labels: ['Approved', 'Denied', 'Pending'],
    datasets: [{
      data: [metrics.approvedCount, metrics.deniedCount, metrics.pendingCount],
      backgroundColor: ['#22c55e', '#ef4444', '#94a3b8']
    }]
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-black header-gradient text-center uppercase tracking-tight">Live Statistics Dashboard</h1>
        <p className="text-center text-xs font-bold text-blue-600 uppercase">Updated: {updateTime}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Activities', value: metrics.totalItems, color: 'blue' },
            { label: 'Inventory Value', value: `$${metrics.inventoryValue.toFixed(0)}`, color: 'purple' },
            { label: 'Cuts This Week', value: metrics.cutsThisWeek, color: 'indigo' },
            { label: 'Approval Rate', value: `${metrics.totalProcessed ? Math.round((metrics.approvedCount/metrics.totalProcessed)*100) : 0}%`, color: 'green' },
            { label: 'Top Customer', value: metrics.topCustomer, color: 'orange' },
            { label: 'Top Wire', value: metrics.topWire, color: 'yellow' }
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border-l-4 border-eecol-blue text-center">
              <div className="text-xl font-black text-gray-800 dark:text-white truncate">{s.value}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10">
            <ReportChart type="line" data={timelineData} title="Activity Timeline (Last 7 Days)" />
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10">
            <ReportChart type="doughnut" data={approvalData} title="Approval Distribution" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStatistics;

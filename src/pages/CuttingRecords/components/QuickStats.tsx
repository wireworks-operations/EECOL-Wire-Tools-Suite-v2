import React from 'react';

interface StatsProps {
  stats: {
    totalCutsToday: number;
    totalLength: number;
    fullPicksCount: number;
    systemCutsCount: number;
    topCutter: string;
    topCustomer: string;
  };
  isOpen: boolean;
  onToggle: () => void;
}

const QuickStats: React.FC<StatsProps> = ({ stats, isOpen, onToggle }) => (
  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-blue-900 rounded-lg shadow-md mb-4">
    <button onClick={onToggle} className="w-full text-left font-semibold text-blue-800 dark:text-blue-300 flex justify-between items-center text-sm">
      📊 Quick Statistics
      <span>{isOpen ? '▼' : '►'}</span>
    </button>
    {isOpen && (
      <div className="mt-2 text-xs grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-700 dark:text-gray-300">
        <div>Total Cuts Today: <span className="font-bold">{stats.totalCutsToday}</span></div>
        <div>Total Length Cut: <span className="font-bold">{stats.totalLength.toFixed(2)}m</span></div>
        <div>Full Picks: <span className="font-bold">{stats.fullPicksCount}</span></div>
        <div>Top Cutter: <span className="font-bold">{stats.topCutter}</span></div>
        <div>Top Customer: <span className="font-bold">{stats.topCustomer}</span></div>
        <div>System Cuts: <span className="font-bold">{stats.systemCutsCount}</span></div>
      </div>
    )}
  </div>
);

export default QuickStats;

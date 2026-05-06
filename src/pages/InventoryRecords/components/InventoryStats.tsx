import React from 'react';

interface InventoryStatsProps {
  stats: {
    totalItems: number;
    totalLength: number;
    damagedItems: number;
    tailendReasons: number;
    avgLength: number;
  };
  isOpen: boolean;
  onToggle: () => void;
}

const InventoryStats: React.FC<InventoryStatsProps> = ({ stats, isOpen, onToggle }) => (
  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-blue-900 rounded-lg shadow-md mb-4">
    <button onClick={onToggle} className="w-full text-left font-semibold text-blue-800 dark:text-blue-300 flex justify-between items-center text-sm">
      📊 Inventory Statistics
      <span>{isOpen ? '▼' : '►'}</span>
    </button>
    {isOpen && (
      <div className="mt-2 text-xs grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-700 dark:text-gray-300">
        <div>Total Items: <span className="font-bold">{stats.totalItems}</span></div>
        <div>Total Length: <span className="font-bold">{stats.totalLength.toFixed(2)}m</span></div>
        <div>Avg Length: <span className="font-bold">{stats.avgLength.toFixed(2)}m</span></div>
        <div>Damaged: <span className="font-bold">{stats.damagedItems}</span></div>
        <div>Tailends: <span className="font-bold">{stats.tailendReasons}</span></div>
      </div>
    )}
  </div>
);

export default InventoryStats;

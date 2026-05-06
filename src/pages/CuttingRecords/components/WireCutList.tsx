import React from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { WireCutListItem } from '../../../types/database';

interface WireCutListProps {
  items: WireCutListItem[];
  isOpen: boolean;
  onToggle: () => void;
  onAutoFill: (item: WireCutListItem) => void;
  onRefresh: () => void;
}

const WireCutList: React.FC<WireCutListProps> = ({ items, isOpen, onToggle, onAutoFill, onRefresh }) => {
  const [filter, setFilter] = React.useState('active');
  const [search, setSearch] = React.useState('');

  const filteredItems = items.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (search && !JSON.stringify(i).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg shadow-md mb-6">
      <button onClick={onToggle} className="w-full text-left font-semibold text-yellow-800 dark:text-yellow-300 flex justify-between items-center text-sm">
        <span>🗂️ Wire Cut List</span>
        <span>{isOpen ? '▼' : '►'}</span>
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
            <button onClick={onRefresh} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-bold btn-tactile">🔄 Refresh</button>
            <div className="flex gap-2">
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="p-1 border border-yellow-300 rounded text-xs w-24 bg-white dark:bg-slate-700" />
              <select value={filter} onChange={e => setFilter(e.target.value)} className="p-1 border border-yellow-300 rounded text-xs bg-white dark:bg-slate-700">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="removed">Removed</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 pt-2 max-h-64 overflow-y-auto pr-1">
            {filteredItems.map(item => (
              <div key={item.id} className="p-2 bg-white dark:bg-slate-800 rounded border border-black/10 shadow-sm text-[10px]" style={{ backgroundColor: item.color || undefined }}>
                 <div className="flex justify-between font-bold border-b border-black/5 pb-1 mb-1">
                    <span>{item.orderNumber} / {item.lineNumber}</span>
                    {item.urgency !== 'normal' && <span className={`px-1 rounded uppercase ${item.urgency === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>{item.urgency}</span>}
                 </div>
                 <div className="font-bold">{item.wireType} - {item.lengthZ}Z</div>
                 <div className="text-gray-600 dark:text-gray-400 italic mb-2">{item.description}</div>
                 <div className="flex justify-end gap-1">
                    <button onClick={() => onAutoFill(item)} className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">📥 AutoFill</button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WireCutList;

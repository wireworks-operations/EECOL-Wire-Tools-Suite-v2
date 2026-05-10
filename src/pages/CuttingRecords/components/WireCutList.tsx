import React from 'react';
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
    if (search) {
        const term = search.toLowerCase();
        return (i.orderNumber?.toLowerCase().includes(term) ||
                i.customerName?.toLowerCase().includes(term) ||
                i.wireType?.toLowerCase().includes(term) ||
                i.description?.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-900 rounded-3xl shadow-xl mb-6">
      <button onClick={onToggle} className="w-full text-left font-semibold text-yellow-800 dark:text-yellow-300 flex justify-between items-center text-sm">
        <span>🗂️ Wire Cut List</span>
        <span>{isOpen ? '▼' : '►'}</span>
      </button>
      {isOpen && (
        <div className="mt-2 text-xs space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
            <button onClick={onRefresh} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-bold btn-tactile">🔄 Refresh</button>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <label className="font-medium">Search:</label>
                    <input type="text" placeholder="Search list..." value={search} onChange={e => setSearch(e.target.value)} className="p-1 border border-yellow-300 rounded bg-white dark:bg-slate-700 text-xs w-24 sm:w-32" />
                </div>
                <div className="flex items-center gap-1">
                    <label className="font-medium">Filter:</label>
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="p-1 border border-yellow-300 rounded bg-white dark:bg-slate-700 text-xs">
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="removed">Removed</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 min-h-[50px] max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
                <p className="text-center text-gray-500 italic">No pending items in the list.</p>
            ) : (
                filteredItems.map(item => (
                    <div key={item.id} className="wire-list-card p-2 rounded border border-black/10 transition-all duration-200" style={{ backgroundColor: item.color || undefined }}>
                        <div className="flex justify-between items-start border-b border-black/10 pb-1 mb-1 font-bold text-[10px] uppercase">
                            <div>ORDER / LINE CUSTOMER</div>
                            <div>ORDER COMMENTS</div>
                            <div>SHIPPER COMMENTS</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/3">
                                <div className="font-bold text-sm flex items-center gap-2">
                                    {item.orderNumber || 'N/A'} / {item.lineNumber || '1'}
                                    {item.urgency !== 'normal' && (
                                        <span className={`px-1 rounded text-[8px] uppercase ${item.urgency === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                                            {item.urgency}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] font-bold">
                                    {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()} @ {item.customerName || 'N/A'}
                                </div>
                                <div className="mt-2 bg-black/5 border border-black/10 p-1 rounded italic font-black text-xs">
                                    <div>{item.lengthZ || '0'} Z &nbsp;&nbsp; {item.wireType || 'N/A'}</div>
                                    <span className="text-[9px] font-normal">{item.description || ''}</span>
                                </div>
                            </div>
                            <div className="w-1/3 border-l border-black/10 pl-2 text-[10px] whitespace-pre-wrap">{item.orderComments || ''}</div>
                            <div className="w-1/3 border-l border-black/10 pl-2 text-[10px] whitespace-pre-wrap">{item.shipperComments || ''}</div>
                        </div>
                        {item.status === 'active' && (
                            <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-black/5">
                                <button onClick={() => onAutoFill(item)} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold hover:bg-blue-700 transition">📥 AutoFill Cut</button>
                            </div>
                        )}
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WireCutList;

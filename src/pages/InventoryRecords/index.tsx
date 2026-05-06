import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { InventoryRecord } from '../../types/database';
import { calculateInventoryStats, filterInventoryItems } from './utils/logic';
import InventoryItem from './components/InventoryItem';
import InventoryStats from './components/InventoryStats';

const InventoryRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [statsOpen, setStatsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [filterDamaged, setFilterDamaged] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastJsonExport, setLastJsonExport] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<InventoryRecord>>({
    personName: '', productCode: '', lineCode: '', currentLength: 0, actualLength: 0,
    currentLengthUnit: 'm', actualLengthUnit: 'm', reason: '', inventoryDate: new Date().toISOString().split('T')[0],
    inventoryComments: '', coilCode: '', averageCost: 0, costUnit: '$', totalValue: 0,
    adjust: false, approved: null, inaNumber: '', inaDate: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && db) {
      loadItems();
      db.getAll('settings').then((settings: any[]) => {
        const lastExport = settings.find(s => s.name === 'lastJsonExport');
        if (lastExport) setLastJsonExport(lastExport.value);
      });
    }
  }, [isReady, db]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await db!.getAll<InventoryRecord>('inventoryRecords');
      setItems(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = useMemo(() => filterInventoryItems(items, searchTerm, filterField, filterDamaged, dateFrom, dateTo), [items, searchTerm, filterField, filterDamaged, dateFrom, dateTo]);
  const stats = useMemo(() => calculateInventoryStats(items), [items]);

  const validate = () => {
    if (!formData.personName) return "Employee Name is required.";
    if (!formData.productCode) return "Product Code is required.";
    if (!formData.lineCode) return "Line # is required.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);

    const item: InventoryRecord = {
      ...formData as InventoryRecord,
      id: editingId || crypto.randomUUID(),
      timestamp: editingId ? items.find(i => i.id === editingId)!.timestamp : Date.now(),
      updatedAt: Date.now(),
      wireType: 'INVENTORY'
    };
    await db!.put('inventoryRecords', item);
    setEditingId(null);
    loadItems();
    setFormData(prev => ({ ...prev, productCode: '', currentLength: 0, actualLength: 0, reason: '', inventoryComments: '', coilCode: '', inaNumber: '' }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-2">
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-24 px-1">
        <div className="flex justify-center mb-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-lg eecol-logo-tilt">
            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-center header-gradient mb-1">EECOL Wire Inventory</h1>
        <p className="mb-5 text-center text-[10px] font-medium header-gradient opacity-80 uppercase tracking-wider">Track and Manage Wire Inventory Pieces</p>

        <div className="p-2 bg-yellow-50/70 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg shadow-md mb-4 text-left">
          <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-500 uppercase">IndexedDB Mode - Enhanced Data Persistence</p>
          <p className="text-[10px] font-mono text-gray-700 dark:text-gray-400 break-all">User ID: <span className="font-bold">LocalUser</span></p>
        </div>

        <div className="p-2 bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg shadow-md mb-4 text-left">
          <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Last Export</p>
          <p className="text-[10px] text-gray-700 dark:text-gray-400">JSON Export: <span className="font-bold">{lastJsonExport ? new Date(lastJsonExport).toLocaleDateString() : 'Never exported'}</span></p>
        </div>

        <InventoryStats stats={stats} isOpen={statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-eecol-blue/20 mb-6 space-y-4 text-left">
           <h3 className="text-lg font-bold text-center header-gradient">Record Inventory Adjustment</h3>

           <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                 <label className="text-[10px] font-bold header-gradient uppercase">Employee Name</label>
                 <input value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value.toUpperCase()})} className="input-premium w-full" placeholder="NAME" />
              </div>
              <div>
                 <label className="text-[10px] font-bold header-gradient uppercase">Product Code</label>
                 <input value={formData.productCode} onChange={e => setFormData({...formData, productCode: e.target.value.toUpperCase()})} className="input-premium w-full" placeholder="P-CODE" />
              </div>
              <div>
                 <label className="text-[10px] font-bold header-gradient uppercase">Line #</label>
                 <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} className="input-premium w-full" placeholder="L-CODE" />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-bold header-gradient uppercase">Reason</label>
                 <input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="input-premium w-full" placeholder="DISCREPANCY, DAMAGE, ETC" />
              </div>
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Current Length</label>
                <input type="number" value={formData.currentLength || ''} onChange={e => setFormData({...formData, currentLength: Number(e.target.value)})} className="input-premium w-full" />
              </div>
              <div>
                <label className="text-[10px] font-bold header-gradient uppercase">Actual Length</label>
                <input type="number" value={formData.actualLength || ''} onChange={e => setFormData({...formData, actualLength: Number(e.target.value)})} className="input-premium w-full" />
              </div>
           </div>

           <button onClick={handleSave} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl text-xs btn-tactile uppercase">{editingId ? 'Update Inventory' : 'Add To Inventory'}</button>

           {error && <div className="p-2 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg text-xs font-bold animate-pulse">{error}</div>}
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 mb-6 space-y-3">
           <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search product, name..." className="input-premium flex-1" />
              <select value={filterField} onChange={e => setFilterField(e.target.value)} className="input-premium w-24 bg-white dark:bg-slate-700">
                 <option value="all">All</option><option value="productCode">Product</option><option value="personName">Name</option>
              </select>
           </div>
           <div className="flex items-center gap-4 px-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Filter:</label>
              {['all', 'damaged', 'tailends'].map(f => (
                <label key={f} className="flex items-center gap-1 text-[10px] cursor-pointer">
                   <input type="radio" name="filterDamaged" value={f} checked={filterDamaged === f} onChange={e => setFilterDamaged(e.target.value)} className="w-3 h-3 text-blue-600" />
                   <span className="capitalize">{f}</span>
                </label>
              ))}
           </div>
        </div>

        <div className="space-y-3">
           <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-center text-[10px] font-bold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
             Total Records: {items.length} | Showing: {filtered.length}
           </div>
           {filtered.map(item => <InventoryItem key={item.id} item={item} onEdit={id => {setEditingId(id); setFormData(items.find(i => i.id === id)!)}} onDelete={async id => {if(confirm('Delete this item?')){await db!.delete('inventoryRecords', id); loadItems();}}} />)}
        </div>
      </div>
    </div>
  );
};

export default InventoryRecords;

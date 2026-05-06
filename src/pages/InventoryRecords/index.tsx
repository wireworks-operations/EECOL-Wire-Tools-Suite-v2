import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { InventoryRecord } from '../../types/database';
import InventoryItem from './components/InventoryItem';
import InventoryStats from './components/InventoryStats';
import { calculateInventoryStats } from './utils/logic';

const InventoryRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDataControls, setShowDataControls] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'damaged' | 'tailend'>('all');

  const [formData, setFormData] = useState<Partial<InventoryRecord>>({
    productCode: '', coilCode: '', currentLength: 0, actualLength: 0,
    lengthUnit: 'm', costPerMeter: 0, lineCode: '', comments: '', reason: '', note: ''
  });

  useEffect(() => {
    if (isReady && db) loadItems();
  }, [isReady, db]);

  const loadItems = async () => {
    setLoading(true);
    const data = await db!.getAll<InventoryRecord>('inventoryRecords');
    setItems(data.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!formData.productCode || !formData.coilCode) {
      alert('Product Code and Coil Code are required.');
      return;
    }
    const item: InventoryRecord = {
      ...formData as InventoryRecord,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: formData.productCode // Mapping for legacy name field
    };
    await db!.put('inventoryRecords', item);
    setItems([item, ...items]);
    setFormData({ productCode: '', coilCode: '', currentLength: 0, actualLength: 0, lengthUnit: 'm', costPerMeter: 0, lineCode: '', comments: '', reason: '', note: '' });
  };

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coilCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' ||
        (filterType === 'damaged' && item.reason?.toLowerCase().includes('damaged')) ||
        (filterType === 'tailend' && item.reason?.toLowerCase().includes('tail'));

      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, filterType]);

  const stats = useMemo(() => calculateInventoryStats(items), [items]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-2 pb-24">
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-1 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Inventory Records</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1 uppercase">Track and manage wire inventory pieces efficiently.</p>
        </div>

        <div className="p-3 bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-2xl shadow-md text-left">
          <p className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider">IndexedDB Mode - Enhanced Data Persistence</p>
          <p className="text-[10px] font-mono text-gray-700 dark:text-gray-400 mt-1">User ID: <span className="font-bold">LocalUser</span></p>
          <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-2 font-medium italic">💡 JSON Backup & Import: Use buttons below to save/load complete backups.</p>
        </div>

        <InventoryStats stats={stats} isOpen={statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-eecol-blue/10 space-y-4 text-left">
           <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search records..." className="input-premium flex-1 font-bold" />
              <button onClick={() => {setSearchTerm(''); setFilterType('all');}} className="bg-blue-600 text-white text-[10px] font-black px-4 rounded-xl btn-tactile uppercase">Clear</button>
           </div>
           <div className="flex gap-4 justify-center">
              {['all', 'damaged', 'tailend'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="filterType" checked={filterType === t} onChange={() => setFilterType(t as any)} className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase text-gray-500">{t}</span>
                </label>
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 space-y-4 text-left">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Add Inventory Item</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Product Code</label>
              <input value={formData.productCode} onChange={e => setFormData({...formData, productCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="ACWU90-6-3" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Coil Code</label>
              <input value={formData.coilCode} onChange={e => setFormData({...formData, coilCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="C12345" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Current Length</label>
              <div className="flex gap-2">
                <input type="number" value={formData.currentLength} onChange={e => setFormData({...formData, currentLength: Number(e.target.value)})} className="input-premium flex-1 font-bold" />
                <select value={formData.lengthUnit} onChange={e => setFormData({...formData, lengthUnit: e.target.value as any})} className="input-premium w-20 font-bold bg-white dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Actual Length</label>
              <input type="number" value={formData.actualLength} onChange={e => setFormData({...formData, actualLength: Number(e.target.value)})} className="input-premium w-full font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Reason / Condition</label>
              <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                <option value="">Select a reason...</option>
                <option value="Standard">Standard</option>
                <option value="Damaged">Damaged</option>
                <option value="Tail End">Tail End</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Line #</label>
              <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="Line Code" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Comments</label>
            <textarea value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="input-premium w-full font-bold h-20" placeholder="Additional details..." />
          </div>

          <button onClick={handleAddItem} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs mt-2">
            Add to Inventory
          </button>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 mb-2 cursor-pointer ml-1">
            <input type="checkbox" checked={showDataControls} onChange={e => setShowDataControls(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-[10px] font-black uppercase text-gray-500">Show Data Management Controls</span>
          </label>

          {showDataControls && (
            <div className="grid grid-cols-2 gap-2 animate-entrance">
              <button className="bg-emerald-600 text-white text-[10px] font-black py-3 rounded-xl btn-tactile uppercase shadow-lg shadow-emerald-600/20">Export CSV</button>
              <button onClick={async () => {if(confirm('Clear all?')){setItems([]); await db!.clear('inventoryRecords');}}} className="bg-red-600 text-white text-[10px] font-black py-3 rounded-xl btn-tactile uppercase shadow-lg shadow-red-600/20">Clear All</button>
            </div>
          )}
        </div>

        <div className="space-y-3">
           <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl text-center text-[10px] font-black text-blue-800 dark:text-blue-300 border border-blue-200 uppercase tracking-widest">
             Total Items: {items.length} | Showing: {filtered.length}
           </div>
           {filtered.map(item => <InventoryItem key={item.id} item={item} onEdit={() => {}} onDelete={async id => {setItems(items.filter(i => i.id !== id)); await db!.delete('inventoryRecords', id)}} />)}
        </div>
      </div>
    </div>
  );
};

export default InventoryRecords;

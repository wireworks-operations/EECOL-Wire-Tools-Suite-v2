import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { InventoryRecord } from '../../types/database';
import InventoryItem from './components/InventoryItem';
import InventoryStats from './components/InventoryStats';
import { calculateInventoryStats } from './utils/logic';
import { exportToCSV } from '../CuttingRecords/utils/export';

const InventoryRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDataControls, setShowDataControls] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'damaged' | 'tailends'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const initialForm: Partial<InventoryRecord> = {
    inventoryDate: '', personName: '', reason: '', note: '', productCode: '', coilCode: '',
    currentLength: 0, currentLengthUnit: 'm', actualLength: 0, actualLengthUnit: 'm',
    averageCost: 0, costUnit: '$', totalValue: 0, lineCode: '',
    adjust: false, approved: false, notApproved: false,
    inventoryComments: '', inaNumber: '', inaDate: ''
  };

  const [formData, setFormData] = useState<Partial<InventoryRecord>>(initialForm);

  useEffect(() => {
    if (isReady && db) loadItems();
  }, [isReady, db]);

  const loadItems = async () => {
    if (!db) return;
    setLoading(true);
    const data = await db.getAll<InventoryRecord>('inventoryRecords');
    setItems(data.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!db) return;

    const item: InventoryRecord = {
      ...(editingId ? items.find(i => i.id === editingId) : {}),
      ...formData as InventoryRecord,
      id: editingId || crypto.randomUUID(),
      timestamp: editingId ? (items.find(i => i.id === editingId)?.timestamp || Date.now()) : Date.now(),
      createdAt: editingId ? (items.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
      productCode: formData.productCode?.toUpperCase() || '',
      coilCode: formData.coilCode?.toUpperCase() || '',
      personName: formData.personName?.toUpperCase() || '',
      lineCode: formData.lineCode?.toUpperCase() || '',
      name: formData.productCode // Mapping for legacy
    };

    await db.put('inventoryRecords', item);

    if (editingId) {
      setItems(items.map(i => i.id === editingId ? item : i));
      setEditingId(null);
      alert('Inventory item updated successfully!');
    } else {
      setItems([item, ...items]);
      alert('Inventory item added successfully!');
    }

    setFormData(initialForm);
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
        setFormData({ ...item });
        setEditingId(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventoryComments?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' ||
        (filterType === 'damaged' && item.note?.toLowerCase().includes('damaged')) ||
        (filterType === 'tailends' && item.note?.toLowerCase().includes('tail'));

      const itemDate = item.timestamp;
      const from = dateFrom ? new Date(dateFrom).getTime() : null;
      const to = dateTo ? new Date(dateTo).getTime() + 86399999 : null;
      if (from && itemDate < from) return false;
      if (to && itemDate > to) return false;

      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, filterType, dateFrom, dateTo]);

  const stats = useMemo(() => calculateInventoryStats(items), [items]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-2">
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-1 pb-24">
        <div className="flex justify-center mb-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg eecol-logo-tilt">
            <circle cx="12" cy="12" r="11.35" fill="white" stroke="#0058B3" strokeWidth="2" />
            <rect x="4" y="4" width="4" height="16" rx="1" fill="#0058B3" />
            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="#0058B3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,12 C 12,11 16,13 20,12" stroke="#0058B3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="#0058B3" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-3 text-center header-gradient uppercase tracking-tighter">EECOL Wire Inventory Records & Tracking</h1>
        <p className="mb-5 text-center text-sm font-medium text-eecol-blue uppercase tracking-widest">Track wire inventory pieces with type, condition, and measurements.</p>

        <div className="p-3 bg-yellow-50/70 border-l-4 border-yellow-500 rounded-3xl shadow-md mb-4 text-left">
          <p className="text-xs font-bold text-yellow-800 uppercase">IndexedDB Mode - Enhanced Data Persistence</p>
          <p className="text-[10px] font-mono text-gray-700 uppercase">User ID: <span className="font-bold">LocalUser</span></p>
          <p className="text-[10px] text-gray-600 mt-1 italic">Data is saved to local browser storage.</p>
          <p className="text-[10px] text-blue-600 mt-1 font-bold">💡 JSON Backup & Import: Use buttons below to manage complete backups.</p>
        </div>

        <InventoryStats stats={stats} isOpen={statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />

        <div className="mb-4 p-4 bg-white rounded-3xl shadow-xl space-y-3 border border-gray-100">
            <div className="flex flex-wrap gap-2">
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search records..." className="input-premium flex-1 font-bold text-sm uppercase" />
                <select className="input-premium w-32 font-bold bg-white text-xs uppercase">
                    <option value="all">All Fields</option>
                    <option value="productCode">Product Code</option>
                    <option value="personName">Person Name</option>
                </select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Show:</label>
                    <label className="flex items-center text-[10px] font-bold text-gray-600 cursor-pointer uppercase">
                        <input type="radio" checked={filterType === 'all'} onChange={() => setFilterType('all')} className="mr-1" /> All
                    </label>
                    <label className="flex items-center text-[10px] font-bold text-gray-600 cursor-pointer uppercase">
                        <input type="radio" checked={filterType === 'damaged'} onChange={() => setFilterType('damaged')} className="mr-1" /> Damaged
                    </label>
                    <label className="flex items-center text-[10px] font-bold text-gray-600 cursor-pointer uppercase">
                        <input type="radio" checked={filterType === 'tailends'} onChange={() => setFilterType('tailends')} className="mr-1" /> Tailends
                    </label>
                </div>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-premium flex-1 font-bold text-xs" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-premium flex-1 font-bold text-xs" />
                <button onClick={() => {setSearchTerm(''); setFilterType('all'); setDateFrom(''); setDateTo('');}} className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl btn-tactile uppercase shadow-lg">Clear Filters</button>
            </div>
        </div>

        <h3 className="text-lg font-bold mb-3 text-center header-gradient uppercase">{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>

        <div className="space-y-4">
            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Inventory Date</label>
                        <input type="date" value={formData.inventoryDate} onChange={e => setFormData({...formData, inventoryDate: e.target.value})} className="input-premium w-full font-bold" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Inspected By</label>
                        <input value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase" placeholder="ENTER NAME" />
                    </div>
                </div>
            </div>

            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Reason</label>
                        <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="input-premium w-full font-bold text-xs uppercase bg-white">
                            <option value="">Select...</option>
                            <option value="discrepancy">Discrepancy</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Note</label>
                        <select value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="input-premium w-full font-bold text-xs uppercase bg-white">
                            <option value="">Select...</option>
                            <option value="tail end">Tail End</option>
                            <option value="damaged">Damaged</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Product Code</label>
                        <input value={formData.productCode} onChange={e => setFormData({...formData, productCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase text-xs" placeholder="PRODUCT CODE" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Coil Code</label>
                        <input value={formData.coilCode} onChange={e => setFormData({...formData, coilCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase text-xs" placeholder="A,B,Z..." maxLength={1} />
                    </div>
                </div>
            </div>

            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Current Length</label>
                        <div className="flex space-x-1">
                            <input type="number" value={formData.currentLength || ''} onChange={e => setFormData({...formData, currentLength: parseFloat(e.target.value)})} className="input-premium w-full font-bold text-xs" placeholder="0" />
                            <select value={formData.currentLengthUnit} onChange={e => setFormData({...formData, currentLengthUnit: e.target.value as any})} className="input-premium w-auto bg-white text-[10px] font-bold uppercase"><option value="m">m</option><option value="ft">ft</option></select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Actual Length</label>
                        <div className="flex space-x-1">
                            <input type="number" value={formData.actualLength || ''} onChange={e => setFormData({...formData, actualLength: parseFloat(e.target.value)})} className="input-premium w-full font-bold text-xs" placeholder="0" />
                            <select value={formData.actualLengthUnit} onChange={e => setFormData({...formData, actualLengthUnit: e.target.value as any})} className="input-premium w-auto bg-white text-[10px] font-bold uppercase"><option value="m">m</option><option value="ft">ft</option></select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Avg Cost</label>
                        <div className="flex space-x-1">
                            <input type="number" value={formData.averageCost || ''} onChange={e => setFormData({...formData, averageCost: parseFloat(e.target.value)})} className="input-premium w-full font-bold text-xs" placeholder="0.00" />
                            <select value={formData.costUnit} onChange={e => setFormData({...formData, costUnit: e.target.value as any})} className="input-premium w-auto bg-white text-[10px] font-bold uppercase"><option value="$">$/m</option><option value="$/ft">$/ft</option></select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Total Value</label>
                        <input type="number" value={formData.totalValue || ''} onChange={e => setFormData({...formData, totalValue: parseFloat(e.target.value)})} className="input-premium w-full font-bold text-xs" placeholder="0.00" />
                    </div>
                </div>
            </div>

            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Line #</label>
                        <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase text-xs" placeholder="003 OR A" maxLength={3} />
                    </div>
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                        {[
                          { key: 'adjust', label: 'ADJUST' },
                          { key: 'approved', label: 'APPROVED' },
                          { key: 'notApproved', label: 'NOT OK' }
                        ].map(f => (
                            <label key={f.key} className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={!!(formData as any)[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-[10px] font-bold header-gradient uppercase">{f.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100">
                <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Inventory Comments</label>
                <textarea value={formData.inventoryComments} onChange={e => setFormData({...formData, inventoryComments: e.target.value})} className="input-premium w-full font-bold text-xs h-16 resize-none" placeholder="ADDITIONAL COMMENTS" />
            </div>

            <div className="shadow-md rounded-3xl p-4 bg-white border border-gray-100 grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">INA #</label>
                    <input value={formData.inaNumber} onChange={e => setFormData({...formData, inaNumber: e.target.value})} className="input-premium w-full font-bold text-xs uppercase" placeholder="INA-123" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">INA Date</label>
                    <input type="date" value={formData.inaDate} onChange={e => setFormData({...formData, inaDate: e.target.value})} className="input-premium w-full font-bold text-xs" />
                </div>
            </div>

            <div className="pt-2">
                <div className="flex gap-2">
                    <button onClick={() => {setEditingId(null); setFormData(initialForm);}} className={`flex-1 bg-gray-500 text-white font-bold p-3 rounded-2xl shadow-lg btn-tactile uppercase text-xs ${!editingId && 'opacity-50 cursor-not-allowed'}`}>Cancel</button>
                    <button onClick={handleAddItem} className="flex-1 bg-blue-600 text-white font-bold p-3 rounded-2xl shadow-lg btn-tactile uppercase text-xs">{editingId ? 'Update Record' : 'Add to Inventory'}</button>
                </div>
            </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="p-3 bg-blue-50/70 border-l-4 border-blue-500 rounded-2xl shadow-md">
            <label className="flex items-center gap-2 cursor-pointer ml-1">
                <input type="checkbox" checked={showDataControls} onChange={e => setShowDataControls(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-[10px] font-bold header-gradient uppercase">Show Data Management Controls</span>
            </label>
          </div>

          {showDataControls && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 animate-entrance p-2">
              <button onClick={() => exportToCSV(items)} className="bg-blue-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">Export All CSV</button>
              <button onClick={async () => {if(confirm('Clear ALL inventory records?')){setItems([]); await db!.clear('inventoryRecords');}}} className="bg-red-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">Clear All Records</button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-l-8 border-eecol-blue rounded-3xl shadow-2xl space-y-3 mt-6">
           <div className="mb-2 p-3 bg-blue-100 rounded-2xl text-center border border-blue-200">
             <p className="text-[10px] font-bold header-gradient uppercase">
               Total Logs: {items.length} | Filtered: {filtered.length}
             </p>
           </div>
           <div className="space-y-3 max-h-[32rem] overflow-y-auto p-2 bg-gray-100 rounded-2xl custom-scrollbar">
             {filtered.length === 0 ? (
               <p className="text-center text-gray-500 italic text-xs p-8 uppercase font-bold">No inventory records found.</p>
             ) : (
               filtered.map(item => <InventoryItem key={item.id} item={item} onEdit={handleEdit} onDelete={async id => {if(confirm('Delete this record?')){setItems(items.filter(i => i.id !== id)); await db!.delete('inventoryRecords', id)}}} />)
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryRecords;

import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useHistory } from './hooks/useHistory';
import { CuttingRecord, WireCutListItem } from '../../types/database';
import QuickStats from './components/QuickStats';
import WireCutList from './components/WireCutList';
import HistoryItem from './components/HistoryItem';
import SingleCutForm from './components/SingleCutForm';
import ImportCalculatorModal from './components/ImportCalculatorModal';
import ImportReelModal from './components/ImportReelModal';
import { calculateStats, filterRecords } from './utils/logic';
import { exportToCSV } from './utils/export';

const CuttingRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const { state: records, setState: setRecords, undo, redo, canUndo, canRedo, undoCount } = useHistory<CuttingRecord[]>([]);
  const [wireList, setWireList] = useState<WireCutListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [statsOpen, setStatsOpen] = useState(false);
  const [wireListOpen, setWireListOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [lastJsonExport, setLastJsonExport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importCalcOpen, setImportCalcOpen] = useState(false);
  const [importReelOpen, setImportReelOpen] = useState(false);
  const [showDataControls, setShowDataControls] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CuttingRecord>>({
    orderNumber: '', customerName: '', wireId: '', cutLength: 0, cutLengthUnit: 'm',
    lineCode: '', turnedToLineCode: '', cutterName: localStorage.getItem('cutterName') || '',
    coilOrReel: 'coil', chargeable: 'no', isFullPick: false, isNoMarks: false, isSystemCut: false,
    startingMark: null, startingMarkUnit: 'm', endingMark: null, isCutInSystem: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && db) {
      loadAllData();
      db.getAll('settings').then((settings: any[]) => {
        const lastExport = settings.find(s => s.name === 'lastJsonExport');
        if (lastExport) setLastJsonExport(lastExport.value);
      });
    }
  }, [isReady, db]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [r, wl] = await Promise.all([db!.getAll<CuttingRecord>('cuttingRecords'), db!.getAll<WireCutListItem>('wireCutList')]);
      setRecords(r.sort((a, b) => b.timestamp - a.timestamp));
      setWireList(wl.sort((a, b) => (a.position || 0) - (b.position || 0)));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const stats = useMemo(() => calculateStats(records), [records]);
  const filtered = useMemo(() => filterRecords(records, searchTerm, filterField, dateFrom, dateTo), [records, searchTerm, filterField, dateFrom, dateTo]);

  const validate = () => {
    if (!formData.cutterName) return "Cutter Name is required.";
    if (!formData.wireId && !batchMode) return "Wire Type/ID is required.";
    if ((formData.cutLength || 0) <= 0 && !batchMode) return "Valid Cut Length is required.";
    if (!formData.isSystemCut && !formData.orderNumber) return "Order Number is required for non-system cuts.";
    return null;
  };

  const handleRecordCut = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);

    const record: CuttingRecord = {
      ...formData as CuttingRecord,
      id: editingId || crypto.randomUUID(),
      timestamp: editingId ? records.find(r => r.id === editingId)!.timestamp : Date.now(),
      createdAt: editingId ? records.find(r => r.id === editingId)!.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    const newRecords = editingId ? records.map(r => r.id === editingId ? record : r) : [record, ...records];
    setRecords(newRecords);
    await db!.put('cuttingRecords', record);
    setEditingId(null);
    setFormData(prev => ({ ...prev, wireId: '', cutLength: 0, startingMark: null, endingMark: null }));
    if (formData.cutterName) localStorage.setItem('cutterName', formData.cutterName);
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

        <h1 className="text-3xl font-black text-center header-gradient mb-1">EECOL Wire Cut History</h1>
        <p className="mb-5 text-center text-[10px] font-medium header-gradient opacity-80 uppercase tracking-wider">Log completed wire cuts for shared tracking</p>

        <div className="p-3 bg-yellow-50/70 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-2xl shadow-md mb-4 text-left">
          <p className="text-[10px] font-black text-yellow-800 dark:text-yellow-500 uppercase">IndexedDB Mode - Enhanced Data Persistence</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] font-mono text-gray-700 dark:text-gray-400">User ID: <span className="font-bold">LocalUser</span></p>
            <p className="text-[10px] font-bold text-blue-600">Last JSON: {lastJsonExport ? new Date(lastJsonExport).toLocaleDateString() : 'Never'}</p>
          </div>
          <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-2 font-medium italic">💡 JSON Backup & Import: Use buttons below to save/load complete backups.</p>
        </div>

        <QuickStats stats={stats} isOpen={statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />
        <WireCutList items={wireList} isOpen={wireListOpen} onToggle={() => setWireListOpen(!wireListOpen)} onRefresh={loadAllData} onAutoFill={item => setFormData(prev => ({...prev, orderNumber: item.orderNumber, customerName: item.customerName, wireId: item.wireType, cutLength: Number(item.lengthZ)}))} />

        <div className="space-y-4 mb-6 text-left">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-black header-gradient uppercase">Record Wire Cut</h3>
              <div className="flex gap-2">
                 <button onClick={undo} disabled={!canUndo} className="bg-slate-100 p-2 rounded-lg text-xs disabled:opacity-30">↶</button>
                 <button onClick={redo} disabled={!canRedo} className="bg-slate-100 p-2 rounded-lg text-xs disabled:opacity-30">↷</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-eecol-blue/10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase ml-1 mb-1">Order Number / IBT Number</label>
                  <div className="flex gap-2">
                    <input value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value.toUpperCase()})} className="input-premium flex-1 font-bold" maxLength={7} placeholder="1234567" />
                    <label className="flex items-center gap-2 bg-slate-50 px-3 rounded-xl border border-slate-200 cursor-pointer">
                      <input type="checkbox" checked={batchMode} onChange={e => setBatchMode(e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Batch</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase ml-1 mb-1">Customer / Branch</label>
                  <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="EECOL BRANCH" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase ml-1 mb-1">Order Comments</label>
                <input value={formData.orderComments} onChange={e => setFormData({...formData, orderComments: e.target.value})} className="input-premium w-full font-bold" placeholder="e.g. Over Shipment" />
              </div>

              {!batchMode && (
                <div className="animate-entrance">
                  <label className="block text-[10px] font-black text-gray-500 uppercase ml-1 mb-1">Wire Type / ID</label>
                  <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="ACWU90 6/3 AL" />
                </div>
              )}

              {!batchMode && <SingleCutForm formData={formData} setFormData={setFormData} onImportCalculator={() => setImportCalcOpen(true)} onImportReel={() => setImportReelOpen(true)} />}

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase ml-1 mb-1">Cutter Name</label>
                <input value={formData.cutterName} onChange={e => setFormData({...formData, cutterName: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="EMPLOYEE NAME" />
              </div>

              <button onClick={handleRecordCut} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs mt-2">
                {editingId ? 'Update Record' : 'Record Cut'}
              </button>
           </div>

           {error && <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl text-xs font-bold animate-shake">{error}</div>}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-eecol-blue/10 mb-6 space-y-4">
           <div className="flex gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search records..." className="input-premium flex-1 font-bold" />
              <select value={filterField} onChange={e => setFilterField(e.target.value)} className="input-premium w-28 font-bold bg-white dark:bg-slate-700">
                 <option value="all">All Fields</option>
                 <option value="wireId">Wire ID</option>
                 <option value="orderNumber">Order #</option>
              </select>
           </div>
           <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-premium flex-1 font-bold" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-premium flex-1 font-bold" />
              <button onClick={() => {setSearchTerm(''); setDateFrom(''); setDateTo('');}} className="bg-blue-600 text-white text-[10px] font-black px-4 rounded-xl btn-tactile uppercase">Clear</button>
           </div>
        </div>

        <div className="mb-6 space-y-2">
          <label className="flex items-center gap-2 mb-2 cursor-pointer ml-1">
            <input type="checkbox" checked={showDataControls} onChange={e => setShowDataControls(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-[10px] font-black uppercase text-gray-500">Show Data Management Controls</span>
          </label>

          {showDataControls && (
            <div className="grid grid-cols-2 gap-2 animate-entrance">
              <button onClick={() => exportToCSV(records)} className="bg-emerald-600 text-white text-[10px] font-black py-3 rounded-xl btn-tactile uppercase shadow-lg shadow-emerald-600/20">Export CSV</button>
              <button onClick={async () => {if(confirm('Clear all records? This cannot be undone.')){setRecords([]); await db!.clear('cuttingRecords');}}} className="bg-red-600 text-white text-[10px] font-black py-3 rounded-xl btn-tactile uppercase shadow-lg shadow-red-600/20">Clear All</button>
            </div>
          )}
        </div>

        <div className="space-y-3">
           <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl text-center text-[10px] font-black text-blue-800 dark:text-blue-300 border border-blue-200 uppercase tracking-widest">
             Total Records: {records.length} | Showing: {filtered.length}
           </div>
           {filtered.length === 0 ? (
             <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-xs font-bold text-slate-300 uppercase">No cut records found</p>
             </div>
           ) : (
             filtered.map(r => <HistoryItem key={r.id} record={r} onEdit={id => {setEditingId(id); setFormData(records.find(rec => rec.id === id)!)}} onDelete={async id => {setRecords(records.filter(rec => rec.id !== id)); await db!.delete('cuttingRecords', id)}} onToggleSystem={async id => {const upd = records.find(rec => rec.id === id)!; upd.isCutInSystem = true; upd.cutInSystemTimestamp = Date.now(); await db!.put('cuttingRecords', upd); setRecords([...records])}} />)
           )}
        </div>
      </div>

      <ImportCalculatorModal
        isOpen={importCalcOpen}
        onClose={() => setImportCalcOpen(false)}
        onImport={({ startMark, endMark, unit }) => {
          setFormData(prev => ({
            ...prev,
            startingMark: startMark,
            endingMark: endMark,
            startingMarkUnit: unit as any
          }));
        }}
      />

      <ImportReelModal
        isOpen={importReelOpen}
        onClose={() => setImportReelOpen(false)}
        onImport={(reelSize) => {
          setFormData(prev => ({
            ...prev,
            coilOrReel: 'reel',
            reelSize
          }));
        }}
      />
    </div>
  );
};

export default CuttingRecords;

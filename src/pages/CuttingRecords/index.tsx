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
  const { state: records, setState: setRecords, undo, redo, canUndo, canRedo } = useHistory<CuttingRecord[]>([]);
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
  const initialForm: Partial<CuttingRecord> = {
    orderNumber: '', customerName: '', wireId: '', cutLength: 0, cutLengthUnit: 'm',
    lineCode: '', turnedToLineCode: '', cutterName: localStorage.getItem('cutterName') || '',
    coilOrReel: 'coil', chargeable: 'no', isFullPick: false, isNoMarks: false, isSystemCut: false,
    startingMark: null, startingMarkUnit: 'm', endingMark: null, isCutInSystem: false,
    orderComments: '', reelSize: null
  };
  const [formData, setFormData] = useState<Partial<CuttingRecord>>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && db) {
      loadAllData();
      db.get('settings', 'lastJsonExport').then((lastExport: any) => {
        if (lastExport) setLastJsonExport(lastExport.value);
      });
    }
  }, [isReady, db]);

  const loadAllData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const [r, wl] = await Promise.all([db.getAll<CuttingRecord>('cuttingRecords'), db.getAll<WireCutListItem>('wireCutList')]);
      setRecords(r.sort((a, b) => b.timestamp - a.timestamp));
      setWireList(wl.sort((a, b) => (a.position || 0) - (b.position || 0)));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const stats = useMemo(() => calculateStats(records), [records]);
  const filtered = useMemo(() => filterRecords(records, searchTerm, filterField, dateFrom, dateTo), [records, searchTerm, filterField, dateFrom, dateTo]);

  const validate = () => {
    if (formData.isSystemCut) {
        if (!formData.cutterName) return "Cutter Name is required.";
        if (!formData.wireId && !batchMode) return "Wire Type/ID is required.";
        if ((formData.cutLength || 0) <= 0 && !batchMode) return "Valid Cut Length is required.";
    } else {
        if (!formData.orderNumber) return "Order Number is required.";
        if (!formData.customerName) return "Customer Name is required.";
        if (!formData.cutterName) return "Cutter Name is required.";
        if (!formData.wireId && !batchMode) return "Wire Type/ID is required.";
        if ((formData.cutLength || 0) <= 0 && !batchMode) return "Valid Cut Length is required.";
    }
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
      orderNumber: formData.orderNumber?.toUpperCase() || '',
      customerName: formData.customerName?.toUpperCase() || '',
      wireId: formData.wireId?.toUpperCase() || '',
      cutterName: formData.cutterName?.toUpperCase() || '',
    };

    await db!.put('cuttingRecords', record);

    if (editingId) {
        setRecords(records.map(r => r.id === editingId ? record : r));
        setEditingId(null);
    } else {
        setRecords([record, ...records]);
    }

    setFormData({ ...initialForm, cutterName: record.cutterName });
    if (record.cutterName) localStorage.setItem('cutterName', record.cutterName);
    alert('Cut record saved successfully!');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-2">
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-24 px-1 text-left" id="recordsPage">
        <div className="flex justify-center mb-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-lg eecol-logo-tilt">
            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-center header-gradient mb-1 uppercase tracking-tighter">EECOL Wire Cut Record History</h1>
        <p className="mb-5 text-center text-sm font-medium text-eecol-blue uppercase tracking-widest">Log completed wire cuts for easy, shared inventory tracking and export/import.</p>

        <div className="p-3 bg-yellow-50/70 border-l-4 border-yellow-500 rounded-3xl shadow-md mb-4 text-left">
          <p className="text-xs font-bold text-yellow-800 uppercase">IndexedDB Mode - Enhanced Data Persistence</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] font-mono text-gray-700 uppercase">User ID: <span className="font-bold">LocalUser</span></p>
          </div>
          <p className="text-[10px] text-gray-600 mt-1 italic">Data is saved to local browser storage.</p>
          <p className="text-[10px] text-blue-600 mt-1 font-bold">💡 JSON Backup & Import: Use buttons below to manage complete backups.</p>
        </div>

        {lastJsonExport && (
            <div className="p-2 bg-blue-50/70 border-l-4 border-blue-500 rounded-2xl shadow-md mb-4">
                <p className="text-[10px] font-bold text-blue-800 uppercase">Last Export</p>
                <p className="text-[10px] text-gray-700">JSON Export: <span className="font-bold">{new Date(lastJsonExport).toLocaleString()}</span></p>
            </div>
        )}

        <QuickStats stats={stats} isOpen={statsOpen} onToggle={() => setStatsOpen(!statsOpen)} />
        <WireCutList items={wireList} isOpen={wireListOpen} onToggle={() => setWireListOpen(!wireListOpen)} onRefresh={loadAllData} onAutoFill={item => {
            setBatchMode(false);
            setFormData(prev => ({...prev, orderNumber: item.orderNumber, customerName: item.customerName, wireId: item.wireType, cutLength: Number(item.lengthZ)}));
            alert(`Autofilled cut details for Order #${item.orderNumber}`);
            document.getElementById('recordsPage')?.scrollIntoView({ behavior: 'smooth' });
        }} />

        <div className="space-y-4 mb-6">
           <h3 className="text-lg font-bold text-center header-gradient uppercase mt-6 mb-2">{editingId ? 'Edit Wire Cut' : 'Record Wire Cut'}</h3>

           <div className="bg-white p-4 rounded-3xl shadow-xl space-y-4 border border-gray-100">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                  <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Order Number / IBT Number</label>
                  <input value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 7).toUpperCase()})} className="input-premium w-full font-bold uppercase" maxLength={7} placeholder="1234567" disabled={formData.isSystemCut} />
                  <label className="inline-flex items-center mt-2 cursor-pointer">
                    <input type="checkbox" checked={batchMode} onChange={e => setBatchMode(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                    <span className="ml-2 text-[10px] font-bold header-gradient uppercase">Batch Entry Mode (Multiple Cuts)</span>
                  </label>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                  <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Customer / Branch</label>
                  <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase" placeholder="EECOL BRANCH" disabled={formData.isSystemCut} />
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                  <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Order Comments</label>
                  <input value={formData.orderComments} onChange={e => setFormData({...formData, orderComments: e.target.value})} className="input-premium w-full font-bold uppercase text-[10px]" placeholder="E.G. OVER SHIPMENT" />
                </div>

                {!batchMode && (
                  <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100 animate-entrance">
                    <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Wire Type / ID</label>
                    <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase" placeholder="ACWU90 6/3 AL" />
                  </div>
                )}

                {!batchMode && <SingleCutForm formData={formData} setFormData={setFormData} onImportCalculator={() => setImportCalcOpen(true)} onImportReel={() => setImportReelOpen(true)} />}

                <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                  <label className="block text-[10px] font-bold mb-1 header-gradient uppercase">Cutter Name</label>
                  <input value={formData.cutterName} onChange={e => setFormData({...formData, cutterName: e.target.value.toUpperCase()})} className="input-premium w-full font-bold uppercase" placeholder="EMPLOYEE NAME" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={undo} disabled={!canUndo} className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg disabled:opacity-30 btn-tactile text-xs uppercase">↶ Undo</button>
                <button onClick={handleRecordCut} className="flex-[2] bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl shadow-lg btn-tactile uppercase text-xs">
                    {editingId ? 'Update Cut Record' : 'Record Cut'}
                </button>
                <button onClick={redo} disabled={!canRedo} className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg disabled:opacity-30 btn-tactile text-xs uppercase">Redo ↷</button>
              </div>
           </div>

           {error && <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl text-[10px] font-bold animate-shake uppercase">{error}</div>}
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100 mb-6 space-y-4">
           <div className="flex flex-wrap gap-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search records..." className="input-premium flex-1 font-bold text-xs uppercase" />
              <select value={filterField} onChange={e => setFilterField(e.target.value)} className="input-premium w-32 font-bold bg-white text-[10px] uppercase">
                 <option value="all">All Fields</option>
                 <option value="wireId">Wire ID</option>
                 <option value="orderNumber">Order #</option>
                 <option value="cutterName">Cutter</option>
                 <option value="customerName">Customer</option>
              </select>
           </div>
           <div className="flex flex-wrap gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-premium flex-1 font-bold text-xs" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-premium flex-1 font-bold text-xs" />
              <button onClick={() => {setSearchTerm(''); setDateFrom(''); setDateTo('');}} className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl btn-tactile uppercase shadow-lg">Clear Filters</button>
           </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="p-3 bg-blue-50/70 border-l-4 border-blue-500 rounded-2xl shadow-md">
            <label className="flex items-center gap-2 cursor-pointer ml-1">
                <input type="checkbox" checked={showDataControls} onChange={e => setShowDataControls(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-[10px] font-bold header-gradient uppercase">Show Data Management Controls</span>
            </label>
          </div>

          {showDataControls && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 animate-entrance p-2">
              <button onClick={() => exportToCSV(records)} className="bg-blue-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">Export CSV</button>
              <button onClick={async () => {
                  const backup = { records, wireCutList: wireList, timestamp: Date.now(), version: '2.0.0' };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `eecol_cuts_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  await db!.put('settings', { name: 'lastJsonExport', value: Date.now() });
                  setLastJsonExport(Date.now().toString());
              }} className="bg-emerald-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">JSON Backup</button>
              <button onClick={() => window.print()} className="bg-purple-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">Print List</button>
              <button onClick={async () => {if(confirm('Clear ALL cut records? This cannot be undone.')){setRecords([]); await db!.clear('cuttingRecords');}}} className="bg-red-600 text-white text-[10px] font-bold py-3 rounded-xl btn-tactile shadow-lg uppercase">Clear All</button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-l-8 border-eecol-blue rounded-3xl shadow-2xl space-y-3">
           <div className="mb-2 p-3 bg-blue-100 rounded-2xl text-center border border-blue-200">
             <p className="text-[10px] font-bold header-gradient uppercase">
               Total Records: {records.length} | Showing: {filtered.length}
             </p>
           </div>
           <div className="space-y-3 max-h-[32rem] overflow-y-auto p-2 bg-gray-100 rounded-2xl custom-scrollbar">
             {filtered.length === 0 ? (
               <p className="text-center text-gray-500 italic text-[10px] uppercase font-bold p-8">No cut records found.</p>
             ) : (
               filtered.map(r => <HistoryItem key={r.id} record={r} onEdit={id => {setEditingId(id); setFormData(records.find(rec => rec.id === id)!); window.scrollTo({top: 0, behavior: 'smooth'});}} onDelete={async id => {if(confirm('Delete record?')){setRecords(records.filter(rec => rec.id !== id)); await db!.delete('cuttingRecords', id)}}} onToggleSystem={async id => {const upd = records.find(rec => rec.id === id)!; upd.isCutInSystem = true; upd.cutInSystemTimestamp = Date.now(); await db!.put('cuttingRecords', upd); setRecords([...records])}} />)
             )}
           </div>
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
          alert('Marks imported from calculator.');
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
          alert(`Reel size EE-${reelSize}W imported.`);
        }}
      />
    </div>
  );
};

export default CuttingRecords;

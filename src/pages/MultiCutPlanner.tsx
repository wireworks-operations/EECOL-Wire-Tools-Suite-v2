import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

interface CutPlan {
  id: string;
  wireId: string;
  totalReelLength: number;
  cuts: { id: string; length: number; orderNumber: string }[];
  timestamp: number;
}

const MultiCutPlanner: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [wireId, setWireId] = useState('');
  const [totalLength, setTotalLength] = useState(0);
  const [cuts, setCuts] = useState<{ id: string; length: number; orderNumber: string }[]>([]);
  const [newCutLength, setNewCutLength] = useState(0);
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [plans, setPlans] = useState<CutPlan[]>([]);

  useEffect(() => {
    if (isReady && db) {
      db.getAll<CutPlan>('multicutPlanner').then(setPlans);
    }
  }, [isReady, db]);

  const addCut = () => {
    if (newCutLength <= 0) return;
    setCuts([...cuts, { id: crypto.randomUUID(), length: newCutLength, orderNumber: newOrderNumber }]);
    setNewCutLength(0);
    setNewOrderNumber('');
  };

  const removeCut = (id: string) => setCuts(cuts.filter(c => c.id !== id));

  const totalCutLength = cuts.reduce((s, c) => s + c.length, 0);
  const remaining = totalLength - totalCutLength;

  const savePlan = async () => {
    if (!db || !wireId || cuts.length === 0) return;
    const plan: CutPlan = { id: crypto.randomUUID(), wireId, totalReelLength: totalLength, cuts, timestamp: Date.now() };
    await db.put('multicutPlanner', plan);
    setPlans([plan, ...plans]);
    setWireId('');
    setTotalLength(0);
    setCuts([]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black header-gradient text-center uppercase tracking-tight">Multi-Cut Planner</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10 space-y-4">
            <h2 className="text-lg font-bold header-gradient uppercase">Reel Definition</h2>
            <div>
              <label className="text-[10px] font-bold header-gradient uppercase block">Wire ID</label>
              <input value={wireId} onChange={e => setWireId(e.target.value.toUpperCase())} className="input-premium w-full" placeholder="e.g. ACWU90 4/3" />
            </div>
            <div>
              <label className="text-[10px] font-bold header-gradient uppercase block">Total Reel Length (m)</label>
              <input type="number" value={totalLength || ''} onChange={e => setTotalLength(parseFloat(e.target.value))} className="input-premium w-full" />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
               <h3 className="text-sm font-bold header-gradient uppercase mb-2">Add New Cut</h3>
               <div className="flex gap-2">
                 <input value={newOrderNumber} onChange={e => setNewOrderNumber(e.target.value.toUpperCase())} className="input-premium flex-1" placeholder="Order #" />
                 <input type="number" value={newCutLength || ''} onChange={e => setNewCutLength(parseFloat(e.target.value))} className="input-premium w-24" placeholder="Len" />
                 <button onClick={addCut} className="bg-eecol-blue text-white p-2 rounded-xl">＋</button>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10 flex flex-col">
            <h2 className="text-lg font-bold header-gradient uppercase mb-4">Plan Summary</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[200px]">
              {cuts.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-xs font-bold text-eecol-blue dark:text-blue-300">Order: {c.orderNumber || 'N/A'} - {c.length}m</div>
                  <button onClick={() => removeCut(c.id)} className="text-red-500 font-bold px-2">×</button>
                </div>
              ))}
              {cuts.length === 0 && <p className="text-center text-gray-400 text-xs italic mt-8">No cuts added to plan yet.</p>}
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-slate-700 pt-4">
               <div className="flex justify-between text-xs font-bold uppercase">
                 <span>Total Planned:</span>
                 <span>{totalCutLength.toFixed(1)}m</span>
               </div>
               <div className={`flex justify-between text-xs font-bold uppercase ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                 <span>Remaining on Reel:</span>
                 <span>{remaining.toFixed(1)}m</span>
               </div>
               <button onClick={savePlan} disabled={cuts.length === 0 || !wireId} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl uppercase btn-tactile disabled:opacity-50 mt-2">Save Plan</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <h2 className="text-xl font-black header-gradient uppercase text-center">Saved Cut Plans</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {plans.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-700">
                 <div className="text-xs font-black header-gradient mb-1 uppercase">{p.wireId}</div>
                 <div className="text-[10px] text-gray-500 mb-3">{new Date(p.timestamp).toLocaleString()}</div>
                 <div className="space-y-1">
                    {p.cuts.map(c => <div key={c.id} className="text-[10px] text-gray-700 dark:text-gray-300">• {c.length}m (Order: {c.orderNumber || 'N/A'})</div>)}
                 </div>
                 <div className="mt-3 pt-2 border-t border-gray-50 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-eecol-blue uppercase">Total: {p.cuts.reduce((s,c) => s+c.length,0)}m / {p.totalReelLength}m</div>
                    <button onClick={async () => {await db!.delete('multicutPlanner', p.id); setPlans(plans.filter(pl => pl.id !== p.id))}} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Delete</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCutPlanner;

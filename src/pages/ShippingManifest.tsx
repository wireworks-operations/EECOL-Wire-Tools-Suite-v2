import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const ShippingManifest: React.FC = () => {
  const { db } = useDatabase();
  const [inputs, setInputs] = useState({
    orderNumber: '', date: new Date().toISOString().split('T')[0],
    wireId: '', amount: 0, amountUnit: 'm', weight: 0, weightUnit: 'lbs',
    coreD: '', flangeD: '', traverseW: '',
    customDetails: ''
  });
  const [savedSpecs, setSavedSpecs] = useState<any[]>([]);

  useEffect(() => {
    if (db) {
      db.getAll('settings').then((settings: any[]) => {
        const specs = settings.filter(s => s.name.startsWith('reelSpec_'));
        setSavedSpecs(specs);
      });
    }
  }, [db]);

  const autoPull = async () => {
    if (!db) return;
    const records = await db.getAll<any>('cuttingRecords');
    if (records.length > 0) {
      const last = records.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
      setInputs(prev => ({
        ...prev,
        orderNumber: last.orderNumber,
        wireId: last.wireId,
        amount: last.cutLength,
        amountUnit: last.cutLengthUnit
      }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Shipping Manifest Generator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Create professional reel labels for shipping with integrated hazardous materials documentation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 space-y-6 text-left">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span>📏</span> Reel Dimensions
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Load Saved Specifications</label>
                <select onChange={e => {
                  const spec = savedSpecs.find(s => s.name === e.target.value);
                  if (spec) setInputs({...inputs, coreD: spec.value.core, flangeD: spec.value.flange, traverseW: spec.value.width});
                }} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                  <option value="">-- Select Saved Specification --</option>
                  {savedSpecs.map(s => <option key={s.name} value={s.name}>{s.name.replace('reelSpec_', '')}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Core (in)</label>
                  <input type="number" value={inputs.coreD} onChange={e => setInputs({...inputs, coreD: e.target.value})} className="input-premium w-full font-bold text-center" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Flange (in)</label>
                  <input type="number" value={inputs.flangeD} onChange={e => setInputs({...inputs, flangeD: e.target.value})} className="input-premium w-full font-bold text-center" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Traverse (in)</label>
                  <input type="number" value={inputs.traverseW} onChange={e => setInputs({...inputs, traverseW: e.target.value})} className="input-premium w-full font-bold text-center" />
                </div>
              </div>
            </div>

            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 pt-4">
              <span>👤</span> Shipping Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Order # / IBT #</label>
                  <input value={inputs.orderNumber} onChange={e => setInputs({...inputs, orderNumber: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Date</label>
                  <input type="date" value={inputs.date} onChange={e => setInputs({...inputs, date: e.target.value})} className="input-premium w-full font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Wire ID</label>
                <input value={inputs.wireId} onChange={e => setInputs({...inputs, wireId: e.target.value.toUpperCase()})} className="input-premium w-full font-bold" placeholder="ACWU90 2/3 AL" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Amount</label>
                  <div className="flex gap-2">
                    <input type="number" value={inputs.amount} onChange={e => setInputs({...inputs, amount: Number(e.target.value)})} className="input-premium flex-1 font-bold" />
                    <select value={inputs.amountUnit} onChange={e => setInputs({...inputs, amountUnit: e.target.value})} className="input-premium w-20 font-bold bg-white dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Weight</label>
                  <div className="flex gap-2">
                    <input type="number" value={inputs.weight} onChange={e => setInputs({...inputs, weight: Number(e.target.value)})} className="input-premium flex-1 font-bold" />
                    <select value={inputs.weightUnit} onChange={e => setInputs({...inputs, weightUnit: e.target.value})} className="input-premium w-24 font-bold bg-white dark:bg-slate-700"><option value="lbs">lbs</option><option value="kg">kg</option></select>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 pt-4">
              <span>📝</span> Additional Details
            </h2>
            <textarea value={inputs.customDetails} onChange={e => setInputs({...inputs, customDetails: e.target.value})} className="input-premium w-full font-bold h-24" placeholder="Add custom notes..." />

            <div className="flex gap-2 pt-2">
              <button onClick={autoPull} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-inner">
                Auto-pull Last Order
              </button>
              <button onClick={handlePrint} className="flex-1 bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-[10px]">
                🖨️ Print Reel Label
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
             <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-eecol-blue aspect-[1/1.4] flex flex-col">
                <div className="border-b-4 border-eecol-blue pb-4 mb-6 flex justify-between items-center">
                   <div className="text-3xl font-black text-eecol-blue">EECOL WIRE</div>
                   <div className="text-right">
                      <div className="text-[10px] font-black text-gray-400 uppercase">Shipping Label</div>
                      <div className="text-lg font-black">{inputs.orderNumber || 'ORDER #'}</div>
                   </div>
                </div>

                <div className="flex-1 space-y-8">
                   <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase">Wire Identification</div>
                      <div className="text-2xl font-black border-b-2 border-slate-100 pb-2">{inputs.wireId || 'WIRE ID'}</div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <div className="text-[10px] font-black text-gray-400 uppercase">Length</div>
                         <div className="text-3xl font-black">{inputs.amount} {inputs.amountUnit}</div>
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-gray-400 uppercase">Total Weight</div>
                         <div className="text-3xl font-black">{inputs.weight} {inputs.weightUnit}</div>
                      </div>
                   </div>

                   <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase">Reel Dimensions</div>
                      <div className="text-sm font-bold flex gap-4">
                         <span>Core: {inputs.coreD || '--'}"</span>
                         <span>Flange: {inputs.flangeD || '--'}"</span>
                         <span>Width: {inputs.traverseW || '--'}"</span>
                      </div>
                   </div>

                   <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase">Additional Comments</div>
                      <div className="text-xs font-medium bg-slate-50 p-4 rounded-xl min-h-[100px]">{inputs.customDetails}</div>
                   </div>
                </div>

                <div className="mt-auto pt-4 border-t-2 border-slate-100 flex justify-between items-center text-[10px] font-bold text-gray-400">
                   <div>DATE: {inputs.date}</div>
                   <div className="uppercase">EECOL Wire Tools Suite v0.9.0</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingManifest;
